// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: count, error } = await supabase.rpc("increment_visitor_count");

    if (error) {
      // Fallback if function doesn't exist yet but table might
      const { data, error: tableError } = await supabase
        .from("site_stats")
        .select("visitor_count")
        .eq("id", "main")
        .single();

      if (tableError) throw tableError;
      return NextResponse.json({ count: (data as any)?.visitor_count || 0 });
    }

    return NextResponse.json({ count });
  } catch (e: unknown) {
    console.error("Visitor count logic failed:", e);
    const msg = e instanceof Error ? e.message : "Strategy node failure";
    return NextResponse.json({ count: 0, detail: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_stats")
      .select("visitor_count")
      .eq("id", "main")
      .single();

    if (error) throw error;
    return NextResponse.json({ count: (data as any)?.visitor_count || 0 });
  } catch (e: unknown) {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
