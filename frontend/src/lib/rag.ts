import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from "./supabase-server";
import { REWRITE_QUERY_TEMPLATE, KEYWORD_EXTRACTION_TEMPLATE } from "./prompts";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const LLM_MODEL = "gemini-1.5-flash";
const TOP_K_CHUNKS = 15; // Increased from 12 for v2
const TOP_K_SUMMARIES = 8;
const TOP_K_TITLES = 5;
const MAX_CONTEXT_CHUNKS_PER_DOC = 3; 
const RERANK_TOP_N = 7; // Final chunks to pass to LLM after reranking

// --- Pool Manager (Consistent with llm.ts) ---
class KeyPool {
  private keys: string[];
  private currentIndex: number = 0;

  constructor(envKey: string, fallbackEnvKey?: string) {
    const raw = process.env[envKey] || (fallbackEnvKey ? process.env[fallbackEnvKey] : "");
    this.keys = (raw || "").split(",").map(k => k.trim()).filter(Boolean);
  }

  getNext(): string | null {
    if (this.keys.length === 0) return null;
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  get size(): number {
    return this.keys.length;
  }
}

const Pools = {
  Gemini: new KeyPool("GEMINI_KEY_POOL", "GEMINI_API_KEY"),
  Groq: new KeyPool("GROQ_KEY_POOL", "GROQ_API_KEY"),
  GitHub: new KeyPool("GITHUB_KEY_POOL", "GITHUB_MODELS_KEY"),
  SambaNova: new KeyPool("SAMBANOVA_KEY_POOL", "SAMBANOVA_API_KEY"),
  OpenRouter: new KeyPool("OPENROUTER_KEY_POOL", "OPENROUTER_API_KEY"),
};

async function withGeminiRetry<T>(fn: (client: GoogleGenAI) => Promise<T>, retryCount = 0): Promise<T> {
  const key = Pools.Gemini.getNext();
  if (!key) throw new Error("No Gemini API keys configured for RAG");

  const client = new GoogleGenAI({ apiKey: key });
  try {
    return await fn(client);
  } catch (e: any) {
    const msg = e?.message?.toLowerCase() || "";
    const isRetryable = msg.includes("429") || msg.includes("quota") || msg.includes("expired") || msg.includes("400");

    if (isRetryable && retryCount < Pools.Gemini.size) {
      console.warn(`RAG Gemini Key failed. Rotating... (${retryCount + 1}/${Pools.Gemini.size})`);
      return withGeminiRetry(fn, retryCount + 1);
    }
    throw e;
  }
}

export async function embedSingle(text: string): Promise<number[]> {
  return withGeminiRetry(async (genai) => {
    const result = await genai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    return result.embeddings![0].values!;
  });
}

/**
 * Advanced Multi-Pool fallback for RAG tasks (Rewrite/Keywords) 
 * Cycles through Groq, GitHub, and SambaNova for Free users.
 */
async function callPoolForRAG(prompt: string, retryCount = 0): Promise<string> {
  // Determine which pool to use based on retry count
  // Strategy: Try Groq -> GitHub -> SambaNova if they exist
  const providers = [];
  if (Pools.Groq.size > 0) providers.push({ name: "Groq", pool: Pools.Groq, url: "https://api.groq.com/openai/v1", model: "llama-3.1-8b-instant" });
  if (Pools.GitHub.size > 0) providers.push({ name: "GitHub", pool: Pools.GitHub, url: "https://models.inference.ai.azure.com", model: "gpt-4o-mini" });
  if (Pools.SambaNova.size > 0) providers.push({ name: "SambaNova", pool: Pools.SambaNova, url: "https://api.sambanova.ai/v1", model: "Meta-Llama-3.1-8B-Instruct" });

  if (providers.length === 0) {
    // Last ditch: check legacy OPENAI_API_KEY
    const legacyKey = process.env.OPENAI_API_KEY;
    if (legacyKey) return callLegacyOpenAI(prompt, legacyKey);
    throw new Error("No free providers configured for RAG fallback");
  }

  const provider = providers[retryCount % providers.length];
  const apiKey = provider.pool.getNext();

  try {
    const response = await fetch(`${provider.url}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      }),
    });

    if (!response.ok) throw new Error(`${provider.name} failed`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    if (retryCount < 3) {
      console.warn(`RAG provider ${provider.name} failed. Rotating to next provider...`);
      return callPoolForRAG(prompt, retryCount + 1);
    }
    throw e;
  }
}

async function callLegacyOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 300 }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function rewriteQuery(question: string, tier: string = "free"): Promise<string> {
  const prompt = REWRITE_QUERY_TEMPLATE.replace("{question}", question);
  const isFree = tier === "free" || tier === "basic";

  try {
    if (isFree) {
      const rewritten = await callPoolForRAG(prompt);
      return rewritten?.trim() || question;
    }

    return await withGeminiRetry(async (genai) => {
      const response = await genai.models.generateContent({
        model: LLM_MODEL,
        contents: prompt,
      });
      return response.text?.trim() || question;
    });
  } catch (e) {
    console.warn("Query rewrite failed, using original:", e);
    return question;
  }
}

export async function extractKeywords(question: string, tier: string = "free"): Promise<string[]> {
  const prompt = KEYWORD_EXTRACTION_TEMPLATE.replace("{question}", question);
  const isFree = tier === "free" || tier === "basic";

  try {
    let text = "";
    if (isFree) {
      text = await callPoolForRAG(prompt);
    } else {
      text = await withGeminiRetry(async (genai) => {
        const response = await genai.models.generateContent({
          model: LLM_MODEL,
          contents: prompt,
        });
        return response.text?.trim() || "";
      });
    }

    if (!text || text === "General Inquiry") return [];

    return text.split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
  } catch (e) {
    console.error("Keyword extraction failed:", e);
    return [];
  }
}

/**
 * RAG v2: Multi-Query Expansion
 * Generates 3 variations of the question to cast a wider net.
 */
export async function generateMultiQueries(question: string, tier: string = "free"): Promise<string[]> {
  const prompt = `You are a search expert for WBSEDCL regulatory documents.
Given the user question: "${question}", generate 2-3 alternative search queries that use different terminology (e.g. expanding SE to Superintending Engineer) to ensure we find all relevant policy documents.
Output ONLY the queries as a newline-separated list. No preamble.`;

  try {
    const text = await callPoolForRAG(prompt);
    const queries = text.split("\n").map(q => q.trim()).filter(q => q.length > 0);
    return [question, ...queries.slice(0, 2)];
  } catch (e) {
    return [question];
  }
}

/**
 * RAG v2: Neural Reranking
 * Uses a small LLM call to pick the best chunks from a larger pool.
 */
export async function rerankChunks(question: string, chunks: ChunkRow[]): Promise<ChunkRow[]> {
  if (chunks.length <= RERANK_TOP_N) return chunks;

  const candidateList = chunks.map((c, i) => `[ID ${i}]: ${c.title} - ${c.content.substring(0, 200)}...`).join("\n\n");
  const prompt = `User Question: "${question}"

Candidate Chunks:
${candidateList}

Instructions:
Identify the TOP ${RERANK_TOP_N} most relevant chunks that DIRECTLY help answer the user question.
Return ONLY the IDs as a comma-separated list (e.g., 0, 4, 12). No preamble.`;

  try {
    const text = await callPoolForRAG(prompt);
    const ids = text.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    const sorted = ids.map(id => chunks[id]).filter(Boolean);
    return sorted.length > 0 ? sorted : chunks.slice(0, RERANK_TOP_N);
  } catch (e) {
    return chunks.slice(0, RERANK_TOP_N);
  }
}

interface ChunkRow {
  id: string;
  doc_id: string;
  ref: string;
  date: string;
  title: string;
  source_url: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

interface SummaryRow {
  id: string;
  doc_id: string;
  ref: string;
  date: string;
  title: string;
  source_url: string;
  summary_text: string;
  similarity: number;
}

interface TitleRow {
  id: string;
  doc_id: string;
  ref: string;
  date: string;
  title: string;
  source_url: string;
  similarity: number;
}

export interface RetrievalResult {
  docIds: string[];
  chunkResults: ChunkRow[];
  summaryResults: SummaryRow[];
  titleResults: TitleRow[];
  rewrittenQuery: string | null;
}

export async function retrieve(
  question: string,
  rewrite: boolean = true,
  tier: string = "free"
): Promise<RetrievalResult> {
  const rewrites = await generateMultiQueries(question, tier);
  const rewrittenQuery = rewrites.join(" | ");

  const supabaseAdmin = getSupabaseAdmin();
  
  // High-level strategy: Parallel search for all queries
  const allChunkResults: ChunkRow[] = [];
  
  await Promise.all(rewrites.map(async (query) => {
    const embed = await embedSingle(query);
    const [c, s, t] = await Promise.all([
      supabaseAdmin.rpc("match_chunks", { query_embedding: embed, match_count: 10 }),
      supabaseAdmin.rpc("match_summaries", { query_embedding: embed, match_count: 5 }),
      supabaseAdmin.rpc("match_titles", { query_embedding: embed, match_count: 5 })
    ]);
    if (c.data) allChunkResults.push(...c.data);
  }));

  // Deduplicate and Rerank
  const uniqueChunks = Array.from(new Map(allChunkResults.map(c => [c.id, c])).values());
  const rerankedChunks = await rerankChunks(question, uniqueChunks);

  const seen = new Set<string>();
  const docIds: string[] = [];
  for (const row of rerankedChunks) {
    if (row.doc_id && !seen.has(row.doc_id)) {
      seen.add(row.doc_id);
      docIds.push(row.doc_id);
    }
  }

  return { 
    docIds, 
    chunkResults: rerankedChunks, 
    summaryResults: [], // Summaries are informative but secondary now
    titleResults: [], 
    rewrittenQuery,
    faqAnswer: undefined 
  };
}

export interface SourceMeta {
  doc_id: string;
  ref: string;
  date: string;
  title: string;
  source_url: string;
}

export function buildContext(result: RetrievalResult): {
  context: string;
  sources: SourceMeta[];
} {
  const summaryByDoc = new Map<string, string>();
  for (const row of result.summaryResults) {
    summaryByDoc.set(row.doc_id, row.summary_text);
  }

  const chunksByDoc = new Map<string, { text: string; chunk_index: number }[]>();
  for (const row of result.chunkResults) {
    if (!chunksByDoc.has(row.doc_id)) chunksByDoc.set(row.doc_id, []);
    const arr = chunksByDoc.get(row.doc_id)!;
    if (arr.length < MAX_CONTEXT_CHUNKS_PER_DOC) {
      arr.push({ text: row.content, chunk_index: row.chunk_index });
    }
  }

  const contextParts: string[] = [];
  const sources: SourceMeta[] = [];

  for (const did of result.docIds) {
    const meta = findMeta(did, result);
    if (!meta) continue;

    const header = `--- Document: ${meta.ref} | Date: ${meta.date} | Title: ${meta.title} ---`;
    const parts = [header];

    const summary = summaryByDoc.get(did);
    if (summary) parts.push(`[Summary] ${summary}`);

    const chunks = chunksByDoc.get(did) ?? [];
    chunks.sort((a, b) => a.chunk_index - b.chunk_index);
    for (const c of chunks) parts.push(c.text);

    contextParts.push(parts.join("\n"));
    sources.push({
      doc_id: did,
      ref: meta.ref,
      date: meta.date,
      title: meta.title,
      source_url: meta.source_url,
    });
  }

  return { context: contextParts.join("\n\n"), sources };
}

function findMeta(
  docId: string,
  result: RetrievalResult
): { ref: string; date: string; title: string; source_url: string } | null {
  for (const list of [
    result.chunkResults,
    result.summaryResults,
    result.titleResults,
  ]) {
    for (const row of list) {
      if (row.doc_id === docId) {
        return {
          ref: row.ref,
          date: row.date,
          title: row.title,
          source_url: row.source_url,
        };
      }
    }
  }
  return null;
}
