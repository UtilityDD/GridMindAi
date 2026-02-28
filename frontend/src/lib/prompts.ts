export const SYSTEM_PROMPT = `You are an internal assistant for WBSEDCL (West Bengal State Electricity Distribution Company Limited). Your job is to answer questions about WBSEDCL circulars, office orders, and policies.

Rules:
1. Answer ONLY using the provided context. Do NOT use external knowledge.
2. Cite the specific Order/Circular number and date for every claim.
3. If multiple documents are relevant, mention all of them.
4. At the end of your answer, list ALL source documents you referenced in a 'Sources' section with their ref, date, and title.
5. If the context does not contain enough information to answer, say so clearly and list which documents were consulted.
6. Be concise, accurate, and professional.`;

export const USER_QUERY_TEMPLATE = `Context from WBSEDCL circulars:
============================================================
{context}
============================================================

Available source documents:
{source_list}

Question: {question}

{verbosity_instruction}
Answer the question using only the context above. Cite document references and dates.`;

export const REWRITE_QUERY_TEMPLATE = `You are a search query optimizer for a WBSEDCL (West Bengal State Electricity Distribution Company Limited) circulars database.

Given a user's natural language question, rewrite it into an optimized search query that will perform better in a semantic similarity search against government office orders and circulars.

Rules:
1. Expand abbreviations (e.g. "LTC" → "Leave Travel Concession LTC", "CPS" → "Career Progression Scheme CPS").
2. Include relevant synonyms and related terms.
3. Keep it concise — a single paragraph, not a full sentence.
4. Preserve the original intent completely.
5. If the question mentions dates or order numbers, keep them.
6. Output ONLY the rewritten query, nothing else.

User question: {question}

Optimized search query:`;

export const KEYWORD_EXTRACTION_TEMPLATE = `You are a strategic analyst specializing in the power sector and utility management.

Given a user's question, extract 3-5 high-level keywords or short phrases (2-3 words max each) that represent the core 'Area of Interest' or 'Policy Domain' the user is inquiring about.

Rules:
1. Focus on the underlying policy, regulation, or operational theme (e.g., "Renewable Energy", "Employee Benefits", "Grid Stability", "Revenue Protection").
2. Do not include generic stop words.
3. Output ONLY the keywords as a comma-separated list.
4. If no clear theme is found, output "General Inquiry".

User question: {question}

Keywords:`;

export const VERBOSITY_MAP: Record<number, string> = {
  1: "Be extremely brief. Reply in 1-2 sentences maximum. No bullet points, no elaboration.",
  2: "Be concise. Reply in 2-4 sentences. Mention only the most important points.",
  3: "Give a moderately detailed answer. Use a few bullet points or a short paragraph. Cover the key points without excessive detail.",
  4: "Give a detailed and thorough answer. Use bullet points, numbered lists, or multiple paragraphs as needed. Explain nuances and cover all relevant aspects.",
  5: "Give the most comprehensive and exhaustive answer possible. Cover every relevant detail, clause, and nuance from the source documents. Use structured sections, bullet points, and full explanations. Leave nothing out.",
};

export function getVerbosityInstruction(level: number): string {
  const clamped = Math.max(1, Math.min(5, level));
  return VERBOSITY_MAP[clamped] ?? VERBOSITY_MAP[3];
}

interface Source {
  ref: string;
  date: string;
  title: string;
}

export function buildUserPrompt(
  question: string,
  context: string,
  sources: Source[],
  verbosity: number = 3
): string {
  const sourceList = sources
    .map((s) => `  - ${s.ref} (${s.date}): ${s.title}`)
    .join("\n");

  return USER_QUERY_TEMPLATE.replace("{context}", context)
    .replace("{source_list}", sourceList)
    .replace("{question}", question)
    .replace("{verbosity_instruction}", getVerbosityInstruction(verbosity));
}
