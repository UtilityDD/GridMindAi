import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from "./supabase-server";
import { REWRITE_QUERY_TEMPLATE, KEYWORD_EXTRACTION_TEMPLATE } from "./prompts";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const LLM_MODEL = "gemini-3.8-flash";
const TOP_K_CHUNKS = 30; // Increased from 15 to 30 for high-breath reranking
const TOP_K_SUMMARIES = 8;
const TOP_K_TITLES = 5;
const MAX_CONTEXT_CHUNKS_PER_DOC = 3; 
const RERANK_TOP_N = 10; // Increased from 7 to 10 for Gold-standard selection
const MIN_RELEVANCE_SCORE = 7; // Chunks scoring below this are filtered out

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

// 100% Free Providers Pool
const Pools = {
  Gemini: new KeyPool("GEMINI_KEY_POOL", "GEMINI_API_KEY"),
  Groq: new KeyPool("GROQ_KEY_POOL", "GROQ_API_KEY"),
};

async function withGeminiRetry<T>(fn: (client: GoogleGenAI) => Promise<T>, retryCount = 0): Promise<T> {
  const key = Pools.Gemini.getNext();
  if (!key) throw new Error("No Gemini API keys configured for RAG");

  const client = new GoogleGenAI({ apiKey: key });
  try {
    return await fn(client);
  } catch (e: any) {
    const msg = e?.message?.toLowerCase() || "";
    const isRetryable =
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("quota") ||
      msg.includes("expired") ||
      msg.includes("400") ||
      msg.includes("403") ||
      msg.includes("permission_denied") ||
      msg.includes("leaked") ||
      msg.includes("not valid");

    if (isRetryable && retryCount < Pools.Gemini.size * 2) {
      console.warn(`RAG Gemini Key retry (${msg.substring(0, 30)}...). Rotating... (${retryCount + 1})`);
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
 * Fast Multi-Key Free Pool for RAG tasks (Rewrite/Keywords/Rerank)
 * Uses the 9-key Groq Free Pool with instant fallback to Gemini 3.8 Flash.
 */
async function callPoolForRAG(prompt: string, retryCount = 0): Promise<string> {
  // Try Groq Free Pool first (blazing fast ~200ms)
  if (Pools.Groq.size > 0 && retryCount < Pools.Groq.size * 2) {
    const apiKey = Pools.Groq.getNext();
    if (apiKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 300,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
      } catch (err) {
        console.warn(`Groq RAG key retry (${retryCount + 1}):`, err);
      }
      return callPoolForRAG(prompt, retryCount + 1);
    }
  }

  // Fallback: Gemini Free Pool
  try {
    return await withGeminiRetry(async (genai) => {
      const response = await genai.models.generateContent({
        model: LLM_MODEL,
        contents: prompt,
        config: { temperature: 0.1 },
      });
      return response.text || "";
    });
  } catch (geminiErr) {
    console.error("All RAG pools failed for prompt:", geminiErr);
    return "";
  }
}

export async function rewriteQuery(question: string, tier: string = "free"): Promise<string> {
  const prompt = REWRITE_QUERY_TEMPLATE.replace("{question}", question);
  try {
    const rewritten = await callPoolForRAG(prompt);
    return rewritten?.trim() || question;
  } catch (e) {
    console.warn("Query rewrite failed, using original:", e);
    return question;
  }
}

export async function extractKeywords(question: string, tier: string = "free"): Promise<string[]> {
  const prompt = KEYWORD_EXTRACTION_TEMPLATE.replace("{question}", question);

  try {
    const text = await callPoolForRAG(prompt);
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
 * RAG v2: Neural Reranking & Evidence Grading
 * Uses a small LLM call (Llama-3.1 8B) to grade each chunk from 0-10 based on relevance.
 */
export async function rerankChunks(question: string, chunks: ChunkRow[]): Promise<GradedChunk[]> {
  if (chunks.length === 0) return [];
  
  // Initial coarse filter: keep top 20 by similarity before neural rerank for cost/latency
  const candidates = chunks.slice(0, 20);
  
  const candidateList = candidates.map((c, i) => 
    `[[ID ${i}]]: TITLE: ${c.title} | CONTENT: ${c.content.substring(0, 300)}...`
  ).join("\n\n");

  const prompt = `User Question: "${question}"

Candidate Regulatory Chunks:
${candidateList}

Instructions:
Evaluate and GRADE each chunk on a scale of 0-10 based on how directly it answers the question.
0 = Irrelevant noise.
10 = Perfect regulatory answer.

Output format:
ID | SCORE | REASONING
Example:
0 | 9 | Highlights the specific DOP for Superintending Engineers.
4 | 2 | Mentions 'meter' but is about billing software, not safety.

OUTPUT ONLY THE LIST. NO PREAMBLE.`;

  try {
    const text = await callPoolForRAG(prompt);
    const lines = text.split("\n").filter(l => l.includes("|"));
    
    const graded: GradedChunk[] = [];
    lines.forEach(line => {
      const [idStr, scoreStr, bridge] = line.split("|").map(s => s.trim());
      const idx = parseInt(idStr.replace(/[^0-9]/g, ""));
      const score = parseInt(scoreStr);
      
      if (!isNaN(idx) && !isNaN(score) && candidates[idx]) {
        graded.push({
          ...candidates[idx],
          score,
          bridge: bridge || "Relevant context extracted."
        });
      }
    });

    // Sort by score (desc)
    return graded.sort((a,b) => b.score - a.score);
  } catch (e) {
    console.error("Neural Reranking failed:", e);
    // Fallback: assign medium score to initial matches
    return candidates.slice(0, RERANK_TOP_N).map(c => ({
      ...c,
      score: 5,
      bridge: "Fallback: Standard vector match."
    }));
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

interface GradedChunk extends ChunkRow {
  score: number;
  bridge: string;
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
  chunkResults: GradedChunk[];
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
  const gradedChunks = await rerankChunks(question, uniqueChunks);

  // Hard Filter: Keep only high-relevance chunks (Score >= 7)
  const filteredChunks = gradedChunks.filter(c => c.score >= MIN_RELEVANCE_SCORE);

  // --- DEBUG LOGGING: RETRIEVED CHUNKS ---
  console.log(`\n--- [DEBUG] NEURAL GRADED CHUNKS (${filteredChunks.length}) ---`);
  filteredChunks.forEach((c, i) => {
    console.log(`[Chunk ${i+1}] Score: ${c.score}/10 | Ref: ${c.ref} | Sim: ${c.similarity?.toFixed(4)}`);
    console.log(`Bridge: ${c.bridge}`);
    console.log('---');
  });

  const seen = new Set<string>();
  const docIds: string[] = [];
  for (const row of filteredChunks) {
    if (row.doc_id && !seen.has(row.doc_id)) {
      seen.add(row.doc_id);
      docIds.push(row.doc_id);
    }
  }

  return { 
    docIds, 
    chunkResults: filteredChunks, 
    summaryResults: [], // Summaries are informative but secondary now
    titleResults: [], 
    rewrittenQuery,
  };
}

export interface SourceMeta {
  doc_id: string;
  ref: string;
  date: string;
  title: string;
  source_url: string;
}

function stripUrls(text: string): string {
  if (!text) return "";
  
  // 1. Aggressively remove anything that looks like a URL starting with http, https, or www
  // Matches URLs inside parentheses, brackets, or directly attached to text.
  // Handles encoded parentheses %28 ( and %29 ) commonly found in GitHub blobs.
  let cleaned = text
    .replace(/\(?(https?:\/\/[^\s\)]+)\)?/gi, "")
    .replace(/\(?(www\.[^\s\)]+)\)?/gi, "")
    .replace(/https?:\/\/[^\s]+|www\.[^\s]+/gi, "");

  // 2. Remove specific encoded URL noise (%28 and %29 usually surround URLs in markdown)
  cleaned = cleaned.replace(/%28/g, "").replace(/%29/g, "");

  // 3. Strip common file extensions that might be left over in the filename/id
  cleaned = cleaned.replace(/\.(pdf|md|docx?|txt|csv|xlsx?)(\b|$)/gi, "");

  // 4. Final cleanup: Remove dangling parentheses or brackets that were surrounding the URL
  cleaned = cleaned.replace(/[\(\)\[\]]/g, " ").replace(/\s+/g, " ").trim();

  return cleaned;
}

export function buildContext(result: RetrievalResult): {
  context: string;
  sources: SourceMeta[];
} {
  const summaryByDoc = new Map<string, string>();
  for (const row of result.summaryResults) {
    summaryByDoc.set(row.doc_id, row.summary_text);
  }

  const chunksByDoc = new Map<string, { text: string; chunk_index: number; bridge: string }[]>();
  for (const row of result.chunkResults) {
    if (!chunksByDoc.has(row.doc_id)) chunksByDoc.set(row.doc_id, []);
    const arr = chunksByDoc.get(row.doc_id)!;
    if (arr.length < MAX_CONTEXT_CHUNKS_PER_DOC) {
      arr.push({ text: row.content, chunk_index: row.chunk_index, bridge: row.bridge });
    }
  }

  const contextParts: string[] = [];
  const sources: SourceMeta[] = [];

  for (const did of result.docIds) {
    const meta = findMeta(did, result);
    if (!meta) continue;

    const header = `--- Document: ${stripUrls(meta.ref)} | Date: ${meta.date} | Title: ${stripUrls(meta.title)} ---`;
    const parts = [header];

    const summary = summaryByDoc.get(did);
    if (summary) parts.push(`[Summary] ${stripUrls(summary)}`);

    const chunks = chunksByDoc.get(did) ?? [];
    chunks.sort((a, b) => a.chunk_index - b.chunk_index);
    for (const c of chunks) {
      parts.push(`[Relevance Insight]: ${c.bridge}`);
      parts.push(stripUrls(c.text));
    }

    contextParts.push(parts.join("\n"));
    sources.push({
      doc_id: did,
      ref: stripUrls(meta.ref),
      date: meta.date,
      title: stripUrls(meta.title),
      source_url: meta.source_url, // For frontend VIEW button ONLY. LLM prompt excludes the full prompt.sources array.
    });
  }

  const finalContext = contextParts.join("\n\n");
  const MAX_CONTEXT_CHARS = 24000;
  
  return { 
    context: finalContext.length > MAX_CONTEXT_CHARS 
      ? finalContext.substring(0, MAX_CONTEXT_CHARS) + "\n\n...[CONTENT TRUNCATED FOR MEGA-POOL API TOKEN LIMITS]..." 
      : finalContext, 
    sources 
  };
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
