import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { retrieve, buildContext } from "@/lib/rag";
import { generateAnswer } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ detail: "Missing token" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ detail: "Auth failed" }, { status: 401 });
  }

  const body = await req.json();
  const question: string = body.question ?? "";
  const verbosity: number = Math.max(1, Math.min(5, body.verbosity ?? 3));
  const model: string | null = body.model ?? null;

  if (!question.trim()) {
    return NextResponse.json(
      { detail: "Question is required" },
      { status: 400 }
    );
  }

  const t0 = Date.now();

  const retrievalResult = await retrieve(question);

  if (retrievalResult.docIds.length === 0) {
    return NextResponse.json({
      answer: "No relevant documents found for your query.",
      sources: [],
      model_used: "none",
      elapsed_ms: Date.now() - t0,
      rewritten_query: retrievalResult.rewrittenQuery,
    });
  }

  const { context, sources } = buildContext(retrievalResult);
  const result = await generateAnswer(
    question,
    context,
    sources,
    verbosity,
    model
  );

  return NextResponse.json({
    answer: result.answer,
    sources: result.sources,
    model_used: result.modelUsed,
    elapsed_ms: Date.now() - t0,
    rewritten_query: retrievalResult.rewrittenQuery,
  });
}
