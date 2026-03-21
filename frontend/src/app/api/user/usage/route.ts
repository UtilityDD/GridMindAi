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
            .select("tier_id, custom_daily_limit, custom_monthly_limit, created_at, user_tiers(id, daily_limit, monthly_limit)")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            console.log("Profile not found, using defaults");
        }

        interface TierInfo {
            id: string;
            daily_limit: number;
            monthly_limit: number;
        }

        // Fallback to free tier if profile or user_tiers is missing
        const tierInfo = (profile?.user_tiers as unknown as TierInfo) || {
            id: "free",
            daily_limit: 10,
            monthly_limit: 150
        };

        const tierName = tierInfo.id || "free";
        const tierId = profile?.tier_id || "free";

        const dailyLimit = profile?.custom_daily_limit ?? tierInfo.daily_limit ?? 10;
        // Monthly cap removed for simplicity as per user request (returning high value for UI)
        const monthlyLimit = 999999;

        // Expiry Logic: Only for 'free' tier
        let daysUntilExpiry: number | null = null;
        let isTrialExpired = false;

        if (tierId === "free" || tierName === "free") {
            const registrationDate = profile?.created_at ? new Date(profile.created_at) : new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const expiryDate = new Date(registrationDate);
            expiryDate.setDate(expiryDate.getDate() + 30);
            const diffTime = expiryDate.getTime() - new Date().getTime();
            daysUntilExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            isTrialExpired = registrationDate < thirtyDaysAgo;
        }

        // Tier Display Name Mapping
        const TIER_NAME_MAP: Record<string, string> = {
            'free': 'Basic',
            'basic': 'Basic+',
            'advance': 'Advance',
            'pro': 'Pro'
        };
        // Use name from DB tierInfo if present, otherwise fallback to local map
        const displayName = (tierInfo as any).name || TIER_NAME_MAP[tierId] || TIER_NAME_MAP[tierName] || tierName;

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

        const hasCustomLimit = profile?.custom_daily_limit !== null || profile?.custom_monthly_limit !== null;

        return NextResponse.json({
            dailyCount: dailyCount || 0,
            dailyLimit,
            monthlyCount: monthlyCount || 0,
            monthlyLimit,
            tierName: displayName,
            tierId,
            hasCustomLimit,
            registeredAt: profile?.created_at || new Date().toISOString(),
            isTrialExpired,
            daysUntilExpiry
        });
    } catch {
        return NextResponse.json({ detail: "Internal server error during usage check" }, { status: 500 });
    }
}
