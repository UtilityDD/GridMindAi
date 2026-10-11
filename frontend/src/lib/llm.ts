import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { SourceMeta } from "./rag";

// --- Free Model Constants ---
export const GROQ_PRIMARY_MODEL = "openai/gpt-oss-120b";
export const GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";
export const GROQ_QWEN_MODEL = "qwen/qwen3.8-27b";
export const GEMINI_MODEL = "gemini-3.8-flash";

const SUPPORTED_GROQ_MODELS = new Set([
  GROQ_PRIMARY_MODEL,
  GROQ_FALLBACK_MODEL,
  GROQ_QWEN_MODEL,
]);

// --- Key Pool Manager ---
class KeyPool {
  private keys: string[];
  private currentIndex: number = 0;

  constructor(envKey: string, fallbackEnvKey?: string) {
    const raw = process.env[envKey] || (fallbackEnvKey ? process.env[fallbackEnvKey] : "");
    this.keys = (raw || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
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
  Groq: new KeyPool("GROQ_KEY_POOL", "GROQ_API_KEY"),
  Gemini: new KeyPool("GEMINI_KEY_POOL", "GEMINI_API_KEY"),
};

// --- Groq Free Call with Automatic Key Rotation & Model Fallback ---
async function callGroqFree(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number,
  model: string = GROQ_PRIMARY_MODEL,
  retryCount = 0
): Promise<{ text: string; modelUsed: string }> {
  if (Pools.Groq.size === 0) {
    throw new Error("No Groq free API keys available");
  }

  const apiKey = Pools.Groq.getNext();
  if (!apiKey) throw new Error("Could not acquire Groq key");

  const groq = new Groq({ apiKey });
  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content ?? "";
    if (!content.trim()) throw new Error("Empty response from Groq");
    return { text: content, modelUsed: `Groq/${model}` };
  } catch (e: any) {
    const msg = e?.message?.toLowerCase() || "";
    console.warn(`Groq (${model}) error on key: ${msg.substring(0, 80)}`);

    // Rotate keys on rate limit or transient errors
    if ((msg.includes("429") || msg.includes("rate_limit") || msg.includes("timeout")) && retryCount < Pools.Groq.size * 2) {
      return callGroqFree(question, context, sources, verbosity, model, retryCount + 1);
    }

    // Model fallback if model is unavailable or overloaded
    if (model === GROQ_PRIMARY_MODEL) {
      console.log(`Falling back from ${GROQ_PRIMARY_MODEL} to ${GROQ_FALLBACK_MODEL}`);
      return callGroqFree(question, context, sources, verbosity, GROQ_FALLBACK_MODEL, 0);
    }
    if (model === GROQ_FALLBACK_MODEL) {
      console.log(`Falling back from ${GROQ_FALLBACK_MODEL} to ${GROQ_QWEN_MODEL}`);
      return callGroqFree(question, context, sources, verbosity, GROQ_QWEN_MODEL, 0);
    }

    throw e;
  }
}

// --- Gemini Free Call with Automatic Key Rotation ---
async function callGeminiFree(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number,
  retryCount = 0
): Promise<{ text: string; modelUsed: string }> {
  if (Pools.Gemini.size === 0) {
    throw new Error("No Gemini free API keys configured");
  }

  const apiKey = Pools.Gemini.getNext();
  if (!apiKey) throw new Error("Could not acquire Gemini key");

  const client = new GoogleGenAI({ apiKey });
  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    const text = response.text || "";
    if (!text.trim()) throw new Error("Empty response from Gemini");
    return { text, modelUsed: `Gemini/${GEMINI_MODEL}` };
  } catch (e: any) {
    const msg = e?.message?.toLowerCase() || "";
    console.warn(`Gemini (${GEMINI_MODEL}) error on key: ${msg.substring(0, 80)}`);

    if (
      (msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("quota") ||
        msg.includes("403") ||
        msg.includes("permission_denied") ||
        msg.includes("key not valid")) &&
      retryCount < Pools.Gemini.size * 2
    ) {
      return callGeminiFree(question, context, sources, verbosity, retryCount + 1);
    }

    throw e;
  }
}

export interface GenerateResult {
  answer: string;
  sources: SourceMeta[];
  modelUsed: string;
}

/**
 * Main Answer Generation Entry Point
 * Uses 100% Free Providers (Groq Multi-Key Pool -> Gemini Multi-Key Pool)
 * All paid / expired endpoints have been completely disabled.
 */
export async function generateAnswer(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number = 3,
  model?: string | null,
  tier: string = "free"
): Promise<GenerateResult> {
  // 1. Explicit Model Selection (if user requested specific model)
  if (model) {
    if (SUPPORTED_GROQ_MODELS.has(model)) {
      try {
        const res = await callGroqFree(question, context, sources, verbosity, model);
        return {
          answer: appendLegalFootnote(res.text),
          sources,
          modelUsed: res.modelUsed,
        };
      } catch (err: any) {
        console.warn(`Explicit model request ${model} failed, falling back to free pool:`, err?.message);
      }
    } else if (model === GEMINI_MODEL || model.includes("gemini")) {
      try {
        const res = await callGeminiFree(question, context, sources, verbosity);
        return {
          answer: appendLegalFootnote(res.text),
          sources,
          modelUsed: res.modelUsed,
        };
      } catch (err: any) {
        console.warn(`Explicit model request ${model} failed, falling back:`, err?.message);
      }
    }
  }

  // 2. High-Performance Free Cascade
  // Attempt 1: Groq Free Pool (Blazing Fast ~500 tok/sec, 120B parameter model)
  try {
    const res = await callGroqFree(question, context, sources, verbosity, GROQ_PRIMARY_MODEL);
    return {
      answer: appendLegalFootnote(res.text),
      sources,
      modelUsed: res.modelUsed,
    };
  } catch (groqErr: any) {
    console.error("Groq free pool failed, cascading to Gemini Free Pool:", groqErr?.message);
  }

  // Attempt 2: Google Gemini Free Pool (gemini-3.8-flash)
  try {
    const res = await callGeminiFree(question, context, sources, verbosity);
    return {
      answer: appendLegalFootnote(res.text),
      sources,
      modelUsed: res.modelUsed,
    };
  } catch (geminiErr: any) {
    console.error("Gemini free pool failed:", geminiErr?.message);
  }

  // Attempt 3: Groq Fast Fallback (qwen3.8-27b)
  try {
    const res = await callGroqFree(question, context, sources, verbosity, GROQ_QWEN_MODEL);
    return {
      answer: appendLegalFootnote(res.text),
      sources,
      modelUsed: res.modelUsed,
    };
  } catch (finalErr: any) {
    console.error("All free providers exhausted:", finalErr?.message);
  }

  return {
    answer: "I apologize, but our regulatory intelligence nodes are currently experiencing heavy traffic. Please re-submit your inquiry in a few seconds.",
    sources,
    modelUsed: "Error/RateLimited",
  };
}

/**
 * Appends the mandatory legal disclaimer/footnote to the response.
 */
export function appendLegalFootnote(answer: string): string {
  const disclaimer = `\n\n---\n*Disclaimer: This response is synthesized by AI using available WBSEDCL/WBERC documents. It does NOT constitute legal advice or an official interpretation. For legal purposes, please refer to the Original Gazette or the official authority website. Read our **[Privacy Policy](/privacy)** and **[Terms of Use](/terms)**.*`;
  return `${answer}${disclaimer}`;
}
