import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { retrieve, buildContext, extractKeywords } from "@/lib/rag";
import { generateAnswer } from "@/lib/llm";
import type { SourceMeta } from "@/lib/rag";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ detail: "Missing token" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  let userId: string | null = null;
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
    }
    userId = data.user.id;
  } catch {
    return NextResponse.json({ detail: "Auth failed" }, { status: 401 });
  }

  // Enforce Tiered Limits
  if (userId) {
    const { data: profileData, error: profileError } = await getSupabaseAdmin()
      .from("profiles")
      .select("tier_id, user_tiers(daily_limit, monthly_limit)")
      .eq("id", userId)
      .single();

    if (!profileError && profileData) {
      const tierInfo = profileData.user_tiers as unknown as { daily_limit: number; monthly_limit: number };
      const { daily_limit, monthly_limit } = tierInfo;

      // 1. Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: dailyCount } = await getSupabaseAdmin()
        .from("user_analytics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", today.toISOString());

      if (dailyCount !== null && dailyCount >= daily_limit) {
        return NextResponse.json(
          { detail: `Daily limit of ${daily_limit} queries reached for your ${profileData.tier_id} account. Upgrade for higher intelligence bandwidth.` },
          { status: 429 }
        );
      }

      // 2. Check monthly limit
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);
      const { count: monthlyCount } = await getSupabaseAdmin()
        .from("user_analytics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", firstOfMonth.toISOString());

      if (monthlyCount !== null && monthlyCount >= monthly_limit) {
        return NextResponse.json(
          { detail: `Monthly limit of ${monthly_limit} queries reached for your ${profileData.tier_id} account. Upgrade for higher intelligence bandwidth.` },
          { status: 429 }
        );
      }
    }
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

  // Run retrieval and keyword extraction in parallel
  const [retrievalResult, keywords] = await Promise.all([
    retrieve(question),
    extractKeywords(question)
  ]);

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

  // Filter sources to only those actually cited in the answer
  const answerLower = result.answer.toLowerCase();
  const citedSources = result.sources.filter((s: SourceMeta) => {
    const ref = s.ref?.toLowerCase() ?? "";
    const docId = s.doc_id?.toLowerCase() ?? "";
    const title = s.title?.toLowerCase() ?? "";
    return (
      (ref && answerLower.includes(ref)) ||
      (docId && answerLower.includes(docId)) ||
      (title.length > 10 && answerLower.includes(title.substring(0, 20)))
    );
  });

  // Fallback: if nothing was explicitly cited, return top 3 retrieved sources
  const finalSources = citedSources.length > 0
    ? citedSources
    : result.sources.slice(0, 3);

  // Log analytics (asynchronously, but we await to ensure it's recorded in serverless)
  if (userId) {
    try {
      await getSupabaseAdmin()
        .from("user_analytics")
        .insert({
          user_id: userId,
          original_query: question,
          rewritten_query: retrievalResult.rewrittenQuery,
          keywords: keywords,
        });
    } catch (e) {
      console.error("Failed to log analytics:", e);
    }
  }

  return NextResponse.json({
    answer: result.answer,
    sources: finalSources,
    model_used: result.modelUsed,
    elapsed_ms: Date.now() - t0,
    rewritten_query: retrievalResult.rewrittenQuery,
  });
}
