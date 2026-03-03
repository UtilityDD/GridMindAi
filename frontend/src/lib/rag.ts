import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from "./supabase-server";
import { REWRITE_QUERY_TEMPLATE, KEYWORD_EXTRACTION_TEMPLATE } from "./prompts";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const LLM_MODEL = "gemini-2.5-flash";
const TOP_K_CHUNKS = 3;
const TOP_K_SUMMARIES = 3;
const TOP_K_TITLES = 3;
const MAX_CONTEXT_CHUNKS_PER_DOC = 2;

let _genaiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!_genaiClient) {
    _genaiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _genaiClient;
}

export async function embedSingle(text: string): Promise<number[]> {
  const genai = getGenAI();
  const result = await genai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  });
  return result.embeddings![0].values!;
}

export async function rewriteQuery(question: string): Promise<string> {
  const genai = getGenAI();
  const prompt = REWRITE_QUERY_TEMPLATE.replace("{question}", question);

  try {
    const response = await genai.models.generateContent({
      model: LLM_MODEL,
      contents: prompt,
    });
    const rewritten = response.text;
    return rewritten?.trim() || question;
  } catch {
    return question;
  }
}

export async function extractKeywords(question: string): Promise<string[]> {
  const genai = getGenAI();
  const prompt = KEYWORD_EXTRACTION_TEMPLATE.replace("{question}", question);

  try {
    const response = await genai.models.generateContent({
      model: LLM_MODEL,
      contents: prompt,
    });
    const text = response.text?.trim() || "";
    if (!text || text === "General Inquiry") return [];

    return text.split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
  } catch (e) {
    console.error("Keyword extraction failed:", e);
    return [];
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
  rewrite: boolean = true
): Promise<RetrievalResult> {
  let rewrittenQuery: string | null = null;
  let searchQuery = question;

  if (rewrite) {
    rewrittenQuery = await rewriteQuery(question);
    searchQuery = rewrittenQuery;
  }

  const queryEmbedding = await embedSingle(searchQuery);

  const supabaseAdmin = getSupabaseAdmin();
  const [chunksRes, summariesRes, titlesRes] = await Promise.all([
    supabaseAdmin.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      match_count: TOP_K_CHUNKS,
    }),
    supabaseAdmin.rpc("match_summaries", {
      query_embedding: queryEmbedding,
      match_count: TOP_K_SUMMARIES,
    }),
    supabaseAdmin.rpc("match_titles", {
      query_embedding: queryEmbedding,
      match_count: TOP_K_TITLES,
    }),
  ]);

  const chunkResults: ChunkRow[] = chunksRes.data ?? [];
  const summaryResults: SummaryRow[] = summariesRes.data ?? [];
  const titleResults: TitleRow[] = titlesRes.data ?? [];

  const seen = new Set<string>();
  const docIds: string[] = [];

  for (const list of [chunkResults, summaryResults, titleResults]) {
    for (const row of list) {
      const did = row.doc_id;
      if (did && !seen.has(did)) {
        seen.add(did);
        docIds.push(did);
      }
    }
  }

  return { docIds, chunkResults, summaryResults, titleResults, rewrittenQuery };
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
