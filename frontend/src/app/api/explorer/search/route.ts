import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const category = searchParams.get("category") || "all";

  if (!query && category === "all") {
    return NextResponse.json({ results: [] });
  }

  const supabase = getSupabaseAdmin();

  try {
    let results;

    if (query) {
      // Use Search v2 (Triple-Weighted + Deduplicated) - Fallback to v1 if SQL migration not yet run
      const { data, error } = await supabase.rpc("match_chunks_kts_v2", {
        query_text: query,
        match_count: limit,
      });

      if (error) {
        console.warn("Search v2 failed or not deployed, falling back to v1:", error.message);
        const { data: v1Data, error: v1Error } = await supabase.rpc("match_chunks_kts", {
          query_text: query,
          match_count: limit,
        });
        if (v1Error) throw v1Error;
        results = v1Data;
      } else {
        results = data;
      }
    } else {
      // If no query but category is selected, just browse
      const { data, error } = await supabase
        .table("chunks")
        .select("*")
        .limit(limit);
      
      if (error) throw error;
      results = data;
    }

    // Apply client-side filtering if needed or expand the RPC above
    let filteredResults = results;
    if (category !== "all") {
      filteredResults = results.filter((r: any) => {
        const title = (r.title || "").toLowerCase();
        if (category === "regulations") return title.includes("regulation");
        if (category === "ts") return title.includes("technical") || title.includes("ts");
        if (category === "acts") return title.includes("act");
        return true;
      });
    }

    // Final Sanitization Pass for Privacy - ensure no URLs leak in snippets
    const stripUrls = (text: string) => {
      if (!text) return "";
      return text
        .replace(/\(?(https?:\/\/[^\s\)]+)\)?/gi, "")
        .replace(/\.(pdf|md|docx?|txt)(\b|$)/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const sanitizedResults = filteredResults.map((r: any) => ({
      ...r,
      title: stripUrls(r.title),
      content: stripUrls(r.content),
    }));

    return NextResponse.json({ results: sanitizedResults });
  } catch (error: any) {
    console.error("Explorer Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
