import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { SourceMeta } from "./rag";

// --- Models ---
const GEMINI_MODEL = "gemini-1.5-flash";
const SAMBANOVA_MODEL = "Meta-Llama-3.3-70B-Instruct";
const GITHUB_MODEL = "gpt-4o-mini"; // Default for GitHub models free tier
const SAMBANOVA_BASE_URL = "https://api.sambanova.ai/v1";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const GITHUB_BASE_URL = "https://models.inference.ai.azure.com"; // GitHub Models endpoint

const GROQ_MODELS = new Set([
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
]);

const OPENROUTER_MODELS = [
  "moonshotai/kimi-k2-instruct",
  "qwen/qwen-2.5-72b-instruct",
  "openai/gpt-4o-mini",
];

// --- Pool Manager ---
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
  SambaNova: new KeyPool("SAMBANOVA_KEY_POOL", "SAMBANOVA_API_KEY"),
  GitHub: new KeyPool("GITHUB_KEY_POOL", "GITHUB_MODELS_KEY"),
  OpenRouter: new KeyPool("OPENROUTER_KEY_POOL", "OPENROUTER_API_KEY"),
};

// --- API Implementation Functions ---

async function callGemini(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number,
  retryCount = 0
): Promise<string> {
  const apiKey = Pools.Gemini.getNext();
  if (!apiKey) throw new Error("No Gemini API keys configured");

  const genai = new GoogleGenerativeAI(apiKey);
  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  try {
    const model = genai.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT
    });

    const response = await model.generateContent(userPrompt);
    return response.response.text();
  } catch (e: any) {
    const msg = e?.message?.toLowerCase() || "";
    const isRetryable = msg.includes("429") || msg.includes("quota") || msg.includes("404") || msg.includes("expired") || msg.includes("400");

    if (isRetryable && retryCount < Pools.Gemini.size) {
      console.warn(`Gemini Key failed/limited. Rotating... (${retryCount + 1}/${Pools.Gemini.size})`);
      return callGemini(question, context, sources, verbosity, retryCount + 1);
    }
    throw e;
  }
}

async function callGroq(
  question: string,
  context: string,
  sources: SourceMeta[],
  model: string,
  verbosity: number,
  retryCount = 0
): Promise<string> {
  const apiKey = Pools.Groq.getNext();
  if (!apiKey) throw new Error("No Groq API keys configured");

  const groq = new Groq({ apiKey });
  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (e: any) {
    const msg = e?.message?.toLowerCase() || "";
    if ((msg.includes("429") || msg.includes("rate_limit")) && retryCount < Pools.Groq.size) {
      console.warn(`Groq Key rate limited. Rotating...`);
      return callGroq(question, context, sources, model, verbosity, retryCount + 1);
    }
    throw e;
  }
}

async function callGenericCompletions(
  pool: KeyPool,
  baseUrl: string,
  model: string,
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number,
  providerName: string,
  retryCount = 0
): Promise<string> {
  const apiKey = pool.getNext();
  if (!apiKey) throw new Error(`No ${providerName} API keys configured`);

  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || response.statusText;

      // If rate limited or unauthorized (expired key), try next key in pool
      if ((response.status === 429 || response.status === 401 || response.status === 403) && retryCount < pool.size * 2) {
        console.warn(`${providerName} Key Issue (${response.status}). Rotating...`);
        return callGenericCompletions(pool, baseUrl, model, question, context, sources, verbosity, providerName, retryCount + 1);
      }
      throw new Error(`${providerName} error: ${msg}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (e: any) {
    if (retryCount < pool.size && (e.message.includes("429") || e.message.includes("fetch"))) {
      return callGenericCompletions(pool, baseUrl, model, question, context, sources, verbosity, providerName, retryCount + 1);
    }
    throw e;
  }
}

// Wrapper specialized functions
const callSambaNova = (q: string, c: string, s: SourceMeta[], v: number) =>
  callGenericCompletions(Pools.SambaNova, SAMBANOVA_BASE_URL, SAMBANOVA_MODEL, q, c, s, v, "SambaNova");

const callGitHubModels = (q: string, c: string, s: SourceMeta[], v: number) =>
  callGenericCompletions(Pools.GitHub, GITHUB_BASE_URL, GITHUB_MODEL, q, c, s, v, "GitHub");

const callOpenRouter = (q: string, c: string, s: SourceMeta[], v: number, model: string) =>
  callGenericCompletions(Pools.OpenRouter, OPENROUTER_BASE_URL, model, q, c, s, v, "OpenRouter");

const callOpenAI = (q: string, c: string, s: SourceMeta[], v: number) => {
  // OpenAI often shares key with GitHub for users, but if they have a real sk-... key, use it.
  const pool = Pools.GitHub.size > 0 ? Pools.GitHub : Pools.OpenRouter;
  return callGenericCompletions(pool, "https://api.openai.com/v1", "gpt-4o-mini", q, c, s, v, "OpenAI");
};

// --- Main Interface ---

export interface GenerateResult {
  answer: string;
  sources: SourceMeta[];
  modelUsed: string;
}

export async function generateAnswer(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number = 3,
  model?: string | null,
  tier: string = "free"
): Promise<GenerateResult> {
  // 1. Explicit Model Selection
  if (model && (GROQ_MODELS.has(model) || model === GEMINI_MODEL)) {
    try {
      if (model === GEMINI_MODEL) {
        const answer = await callGemini(question, context, sources, verbosity);
        return { answer, sources, modelUsed: GEMINI_MODEL };
      }
      const answer = await callGroq(question, context, sources, model, verbosity);
      return { answer, sources, modelUsed: model };
    } catch (e: any) {
      console.error(`Explicit model ${model} failed:`, e?.message);
    }
  }

  const isPremium = tier !== "free" && tier !== "basic";

  // 2. Optimized Provider Hierarchy (Mega-Pool)
  let sequence: string[] = [];
  if (isPremium) {
    // Paid tiers: Gemini (Pool) -> OpenAI -> GitHub -> Groq
    sequence = ["gemini", "openai", "github", "groq", "sambanova", "openrouter"];
    console.log(`[Tier: ${tier}] Mega-Pool Paid Strategy Enabled`);
  } else {
    // Basic/Free: Weights between Groq and SambaNova -> GitHub -> OpenRouter
    // We shuffle Groq/SambaNova to distribute load
    const primaries = ["groq", "sambanova"].sort(() => Math.random() - 0.5);
    sequence = [...primaries, "github", "openrouter"];
    console.log(`[Tier: ${tier}] Mega-Pool Free Strategy Enabled (Primaries: ${primaries.join(", ")})`);
  }

  for (const provider of sequence) {
    try {
      if (provider === "gemini") {
        if (Pools.Gemini.size > 0) {
          const answer = await callGemini(question, context, sources, verbosity);
          return { answer, sources, modelUsed: `Gemini/Flash (Pool)` };
        }
      }

      if (provider === "groq") {
        if (Pools.Groq.size > 0) {
          const groqModel = "llama-3.3-70b-versatile";
          const answer = await callGroq(question, context, sources, groqModel, verbosity);
          return { answer, sources, modelUsed: `Groq/Llama-70B (Pool)` };
        }
      }

      if (provider === "sambanova") {
        if (Pools.SambaNova.size > 0) {
          const answer = await callSambaNova(question, context, sources, verbosity);
          return { answer, sources, modelUsed: `SambaNova/Llama-70B (Pool)` };
        }
      }

      if (provider === "github") {
        if (Pools.GitHub.size > 0) {
          const answer = await callGitHubModels(question, context, sources, verbosity);
          return { answer, sources, modelUsed: `GitHub/GPT-4o (Pool)` };
        }
      }

      if (provider === "openai") {
        // Fallback for real OpenAI keys if they exist in GITHUB or OPENROUTER pools
        // or just use GitHub pools as OpenAI proxy for free-feeling experiences
        const answer = await callOpenAI(question, context, sources, verbosity);
        return { answer, sources, modelUsed: `OpenAI/Mini (Pool)` };
      }

      if (provider === "openrouter") {
        if (Pools.OpenRouter.size > 0) {
          const orModel = OPENROUTER_MODELS[Math.floor(Math.random() * OPENROUTER_MODELS.length)];
          const answer = await callOpenRouter(question, context, sources, verbosity, orModel);
          const shortName = orModel.split("/").pop() || orModel;
          return { answer, sources, modelUsed: `OR/${shortName} (Pool)` };
        }
      }
    } catch (e: any) {
      console.error(`[Tier: ${tier}] Provider ${provider} failed: ${e?.message || e}`);
    }
  }

  console.error(`[Tier: ${tier}] MEGA-POOL EXHAUSTED for: "${question.substring(0, 50)}..."`);

  return {
    answer: "I'm sorry, I'm currently experiencing extreme demand across all neural nodes. Please try again in a few moments.",
    sources,
    modelUsed: "none",
  };
}
