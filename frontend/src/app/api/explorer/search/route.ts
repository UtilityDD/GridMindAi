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
      // Use Full Text Search (FTS) via RPC for best ranking/performance
      const { data, error } = await supabase.rpc("match_chunks_kts", {
        query_text: query,
        match_count: limit,
      });

      if (error) throw error;
      results = data;
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
    if (category !== "all") {
      results = results.filter((r: any) => {
        const title = (r.title || "").toLowerCase();
        if (category === "regulations") return title.includes("regulation");
        if (category === "ts") return title.includes("technical") || title.includes("ts");
        if (category === "acts") return title.includes("act");
        return true;
      });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Explorer Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
