import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { count, error } = await getSupabaseAdmin()
            .from("user_analytics")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Supabase query error:", error);
            return NextResponse.json({ count: 0 });
        }

        return NextResponse.json({ count: count || 0 });
    } catch (err) {
        console.error("Failed to fetch query stats:", err);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}
