import { getSupabaseAdmin } from "./supabase-server";

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: Date;
}

/**
 * Reusable Rate Limiter using Supabase as the state store.
 * Suitable for Burst Protection and Brute-Force prevention.
 */
export async function limitRequest(
    identifier: string,
    route: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    // 1. Try to fetch existing window
    const { data, error } = await supabase
        .from("rate_limits")
        .select("hits, window_start")
        .eq("identifier", identifier)
        .eq("route", route)
        .single();

    if (error && error.code !== "PGRST116") {
        // Unexpected error (excluding 'not found')
        console.error("Rate limit check error:", error);
        return { success: true, remaining: limit, reset: now };
    }

    // 2. Logic for Window Management
    if (!data || new Date(data.window_start) < windowStart) {
        // New window or window expired -> Reset/Create
        const { error: upsertError } = await supabase
            .from("rate_limits")
            .upsert({
                identifier,
                route,
                hits: 1,
                window_start: now.toISOString(),
            }, { onConflict: "identifier, route" });

        if (upsertError) console.error("Rate limit upsert error:", upsertError);
        return { success: true, remaining: limit - 1, reset: new Date(now.getTime() + windowSeconds * 1000) };
    }

    // 3. Existing window still valid -> Check hits
    if (data.hits >= limit) {
        return {
            success: false,
            remaining: 0,
            reset: new Date(new Date(data.window_start).getTime() + windowSeconds * 1000),
        };
    }

    // 4. Increment hits
    const { error: incError } = await supabase
        .from("rate_limits")
        .update({ hits: data.hits + 1 })
        .eq("identifier", identifier)
        .eq("route", route);

    if (incError) console.error("Rate limit inc error:", incError);
    return {
        success: true,
        remaining: limit - (data.hits + 1),
        reset: new Date(new Date(data.window_start).getTime() + windowSeconds * 1000),
    };
}

/**
 * Specialized Burst Protection for the Analytics table.
 * Zero-overhead check for rapid-fire queries.
 */
export async function checkBurstFromAnalytics(
    userId: string,
    limit: number = 3,
    windowSeconds: number = 30
): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const burstWindow = new Date(Date.now() - windowSeconds * 1000);

    const { count, error } = await supabase
        .from("user_analytics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", burstWindow.toISOString());

    if (error) {
        console.error("Burst check error:", error);
        return true; // Pass on error to avoid blocking legit users
    }

    return (count ?? 0) < limit;
}
