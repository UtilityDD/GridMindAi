import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { SourceMeta } from "./rag";

const GEMINI_MODEL = "gemini-2.5-flash";

const GROQ_MODELS = new Set([
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "moonshotai/kimi-k2-instruct",
  "moonshotai/kimi-k2-instruct-0905",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3-32b",
]);

let _genaiClient: GoogleGenAI | null = null;
let _groqClient: Groq | null = null;

function getGenAI(): GoogleGenAI {
  if (!_genaiClient) {
    _genaiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _genaiClient;
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
  verbosity: number
): Promise<string> {
  const genai = getGenAI();
  const userPrompt = buildUserPrompt(question, context, sources, verbosity);

  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: { systemInstruction: SYSTEM_PROMPT },
  });
  return response.text ?? "";
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
  model?: string | null
): Promise<GenerateResult> {
  if (model && GROQ_MODELS.has(model)) {
    if (!process.env.GROQ_API_KEY) {
      return {
        answer: "Groq API key is not configured.",
        sources,
        modelUsed: "none",
      };
    }
    try {
      const answer = await callGroq(question, context, sources, model, verbosity);
      return { answer, sources, modelUsed: model };
    } catch (e) {
      console.error(`Groq model ${model} failed:`, e);
      return {
        answer: `Model ${model} failed to generate an answer. Please try another model.`,
        sources,
        modelUsed: "none",
      };
    }
  }

  try {
    const answer = await callGemini(question, context, sources, verbosity);
    return { answer, sources, modelUsed: GEMINI_MODEL };
  } catch (e) {
    console.error("Gemini failed:", e);
    return {
      answer:
        "Sorry, I was unable to generate an answer at this time. Please try again later.",
      sources,
      modelUsed: "none",
    };
  }
}
