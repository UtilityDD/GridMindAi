import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { retrieve, buildContext, extractKeywords } from "@/lib/rag";
import { generateAnswer } from "@/lib/llm";
import { checkBurstFromAnalytics } from "@/lib/rate-limiter";
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

  // 1. Fetch Profile & Tier Info
  let userTier: string = "free";
  if (userId) {
    const { data: profileData, error: profileError } = await getSupabaseAdmin()
      .from("profiles")
      .select("tier_id, is_enabled, custom_daily_limit, custom_monthly_limit, created_at, user_tiers(daily_limit, monthly_limit)")
      .eq("id", userId)
      .single();

    if (!profileError && profileData) {
      userTier = profileData.tier_id;

      // 0. Check if account is enabled
      if (profileData.is_enabled === false) {
        return NextResponse.json(
          { detail: "Your account has been restricted. Please contact support for assistance." },
          { status: 403 }
        );
      }

      // 1b. Check Trial Expiry (30 days) - ONLY for Free Users
      if (userTier === "free" && profileData.created_at) {
        const registrationDate = new Date(profileData.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (registrationDate < thirtyDaysAgo) {
          return NextResponse.json(
            { detail: "Your 30-day Basic trial has expired. Please upgrade your Strategic Intelligence plan to continue access." },
            { status: 403 }
          );
        }
      }

      // 2. Burst Protection (Rapid Fire Prevention) - ONLY for Free Users
      if (userTier === "free") {
        const isUnderBurstLimit = await checkBurstFromAnalytics(userId, 3, 30);
        if (!isUnderBurstLimit) {
          return NextResponse.json(
            { detail: "Strategic node cooling down. High-frequency queries detected. Please wait 30 seconds." },
            { status: 429 }
          );
        }
      }

      interface TierInfo {
        name: string;
        daily_limit: number;
        monthly_limit: number;
      }

      // Fallback to free tier if profile or user_tiers is missing
      const tierInfo = (profileData.user_tiers as unknown as TierInfo) || {
        name: "free",
        daily_limit: 10,
        monthly_limit: 150
      };

      let dailyLimit = profileData.custom_daily_limit ?? tierInfo.daily_limit ?? 10;
      if (userTier === "free") dailyLimit = Math.min(dailyLimit, 10); // Strict limit for free
      // Monthly cap removed for simplicity as per user request (returning high value for UI)
      const monthlyLimit = 999999;

      // 3. Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: dailyCount } = await getSupabaseAdmin()
        .from("user_analytics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", today.toISOString());

      if (dailyCount !== null && dailyCount >= dailyLimit) {
        return NextResponse.json(
          { detail: `Daily limit of ${dailyLimit} queries reached. Upgrade your Strategic Intelligence bandwidth for more access.` },
          { status: 429 }
        );
      }

      // 4. Monthly limit check REMOVED for simplicity as per user request
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
    retrieve(question, true, userTier),
    extractKeywords(question, userTier)
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
    model,
    userTier
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
