import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
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

    if (!userId) {
        return NextResponse.json({ detail: "User not identified" }, { status: 401 });
    }

    try {
        // Fetch profile and tier limits
        const { data: profile, error: profileError } = await getSupabaseAdmin()
            .from("profiles")
            .select("tier_id, custom_daily_limit, custom_monthly_limit, user_tiers(name, daily_limit, monthly_limit)")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            console.log("Profile not found, using defaults");
        }

        interface TierInfo {
            name: string;
            daily_limit: number;
            monthly_limit: number;
        }

        // Fallback to free tier if profile or user_tiers is missing
        const tierInfo = (profile?.user_tiers as unknown as TierInfo) || {
            name: "free",
            daily_limit: 20,
            monthly_limit: 150
        };

        const dailyLimit = profile?.custom_daily_limit ?? tierInfo.daily_limit ?? 20;
        const monthlyLimit = profile?.custom_monthly_limit ?? tierInfo.monthly_limit ?? 150;
        const tierName = tierInfo.name || "free";
        const tierId = profile?.tier_id || "free";

        // Calculate daily usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: dailyCount } = await getSupabaseAdmin()
            .from("user_analytics")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", today.toISOString());

        // Calculate monthly usage
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        const { count: monthlyCount } = await getSupabaseAdmin()
            .from("user_analytics")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", firstOfMonth.toISOString());

        return NextResponse.json({
            dailyCount: dailyCount || 0,
            dailyLimit,
            monthlyCount: monthlyCount || 0,
            monthlyLimit,
            tierName,
            tierId
        });
    } catch {
        return NextResponse.json({ detail: "Internal server error during usage check" }, { status: 500 });
    }
}
