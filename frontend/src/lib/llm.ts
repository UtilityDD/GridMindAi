import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { SourceMeta } from "./rag";

const GEMINI_MODEL = "gemini-1.5-flash";
const SAMBANOVA_MODEL = "Llama-3.1-70B-Instruct";
const SAMBANOVA_BASE_URL = "https://api.sambanova.ai/v1";

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

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let _genaiClients: GoogleGenerativeAI[] = [];
let _groqClient: Groq | null = null;
let _currentKeyIndex = 0;

function getGenAIClients(): GoogleGenerativeAI[] {
  if (_genaiClients.length === 0) {
    const keys = (process.env.GEMINI_KEY_POOL || process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
    _genaiClients = keys.map(key => new GoogleGenerativeAI(key));
  }
  return _genaiClients;
}

function getNextGenAI(): GoogleGenerativeAI | null {
  const clients = getGenAIClients();
  if (clients.length === 0) return null;
  const client = clients[_currentKeyIndex];
  _currentKeyIndex = (_currentKeyIndex + 1) % clients.length;
  return client;
}

function getGroq(): Groq {
  if (!_groqClient) {
    _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return _groqClient;
}

async function callGemini(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number,
  retryCount = 0
): Promise<string> {
  const genai = getNextGenAI();
  if (!genai) throw new Error("No Gemini API keys configured");

  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  try {
    const model = genai.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT
    });

    const response = await model.generateContent(userPrompt);
    return response.response.text();
  } catch (e: any) {
    const poolSize = getGenAIClients().length;
    const maxRetries = Math.max(poolSize, 3);

    // If rate limited OR 404 (some regions/keys might not see flash), try next key
    if ((e?.message?.includes("429") || e?.message?.includes("OUT_OF_QUOTA") || e?.message?.includes("404")) && retryCount < maxRetries) {
      console.warn(`Gemini Key ${_currentKeyIndex} (Pool) failed or rate limited. Rotating...`);
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
  verbosity: number
): Promise<string> {
  const groq = getGroq();
  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

async function callSambaNova(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number
): Promise<string> {
  const apiKey = process.env.SAMBANOVA_API_KEY;
  if (!apiKey) throw new Error("SAMBANOVA_API_KEY not configured");

  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  const response = await fetch(`${SAMBANOVA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: SAMBANOVA_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`SambaNova error: ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenRouter(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number,
  model: string
): Promise<string> {
  const apiKey = (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("OpenRouter/OpenAI API key not configured");

  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  // If using an OpenAI key with OpenRouter, it might fail unless specified. 
  // However, OpenRouter usually expects its own keys.
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gridmind.ai",
      "X-Title": "GridMind AI",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter error: ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenAI(
  question: string,
  context: string,
  sources: SourceMeta[],
  verbosity: number
): Promise<string> {
  const apiKey = (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI error: ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

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
      // Fall through to default behavior on failure
    }
  }

  // 2. Tier-Based Routing & Multi-Provider Fallback
  const isPremium = tier !== "free" && tier !== "basic";

  // Strategy: 
  // Premium -> Gemini Pool (Best reasoning)
  // Basic -> Randomized strategy (SambaNova, OpenRouter-Kimi, Groq, Gemini)

  let sequence: string[] = [];
  if (isPremium) {
    // Paid tiers: Gemini first, others as fallback
    sequence = ["gemini", "sambanova", "groq", "openai", "openrouter"];
    console.log(`[Tier: ${tier}] Paid Strategy: Priority Gemini + Fallbacks`);
  } else {
    // Basic/Free: Randomized strategy EXCLUDING Gemini to save quota for paid users
    const providers = ["sambanova", "groq", "openai", "openrouter"];
    // Fisher-Yates shuffle
    for (let i = providers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [providers[i], providers[j]] = [providers[j], providers[i]];
    }
    sequence = providers;
    console.log(`[Tier: ${tier}] Basic Strategy (No Gemini): [${sequence.join(", ")}]`);
  }

  for (const provider of sequence) {
    try {
      if (provider === "gemini") {
        console.log(`[Tier: ${tier}] Routing to Gemini Pool...`);
        const answer = await callGemini(question, context, sources, verbosity);
        return { answer, sources, modelUsed: `${GEMINI_MODEL} (Pool)` };
      }

      if (provider === "sambanova") {
        if (process.env.SAMBANOVA_API_KEY) {
          console.log(`[Tier: ${tier}] Routing to SambaNova (Llama 70B)...`);
          const answer = await callSambaNova(question, context, sources, verbosity);
          return { answer, sources, modelUsed: `SambaNova/${SAMBANOVA_MODEL}` };
        }
      }

      if (provider === "groq") {
        if (process.env.GROQ_API_KEY) {
          console.log(`[Tier: ${tier}] Routing to Groq (Llama 70B)...`);
          const groqModel = "llama-3.3-70b-versatile";
          const answer = await callGroq(question, context, sources, groqModel, verbosity);
          return { answer, sources, modelUsed: `Groq/${groqModel}` };
        }
      }

      if (provider === "openrouter") {
        const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
        if (apiKey && apiKey.startsWith("sk-or-")) {
          const orModel = OPENROUTER_MODELS[Math.floor(Math.random() * OPENROUTER_MODELS.length)];
          console.log(`[Tier: ${tier}] Routing to OpenRouter (${orModel})...`);
          const answer = await callOpenRouter(question, context, sources, verbosity, orModel);
          return { answer, sources, modelUsed: `OR/${orModel.split("/").pop()}` };
        }
      }

      if (provider === "openai") {
        const apiKey = (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "").trim();
        if (apiKey && (apiKey.startsWith("sk-") && !apiKey.startsWith("sk-or-"))) {
          console.log(`[Tier: ${tier}] Routing to OpenAI (GPT-4o-mini)...`);
          const answer = await callOpenAI(question, context, sources, verbosity);
          return { answer, sources, modelUsed: "OpenAI/GPT-4o-mini" };
        }
      }
    } catch (e: any) {
      console.error(`[Tier: ${tier}] Provider ${provider} failed:`, e?.message || e);
    }
  }

  console.error(`[Tier: ${tier}] Critical Failure: All providers exhausted for query: "${question.substring(0, 50)}..."`);

  return {
    answer: "I'm sorry, I'm currently experiencing high demand and all regulatory nodes are cooling down. Please try again in 60 seconds.",
    sources,
    modelUsed: "none",
  };
}
