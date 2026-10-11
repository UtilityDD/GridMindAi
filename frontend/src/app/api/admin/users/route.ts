import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isUserAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing authorization token", status: 401 };
  }

  const token = authHeader.slice(7);
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      return { error: "Invalid session", status: 401 };
    }

    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("tier_id")
      .eq("id", data.user.id)
      .single();

    if (!isUserAdmin(data.user.email, profile?.tier_id)) {
      return { error: "Access denied. Administrator privileges required.", status: 403 };
    }

    return { user: data.user, admin: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication error";
    return { error: msg, status: 401 };
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await verifyAdmin(req);
  if ("error" in authCheck) {
    return NextResponse.json({ detail: authCheck.error }, { status: authCheck.status });
  }

  try {
    // 1. Fetch all auth users
    const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError) {
      return NextResponse.json({ detail: authError.message }, { status: 500 });
    }

    // 2. Fetch all profiles with tier information
    const { data: profiles, error: profileError } = await getSupabaseAdmin()
      .from("profiles")
      .select("id, tier_id, is_enabled, custom_daily_limit, custom_monthly_limit, created_at, user_tiers(id, name, daily_limit)");

    if (profileError) {
      return NextResponse.json({ detail: profileError.message }, { status: 500 });
    }

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p) => {
      profileMap.set(p.id, p);
    });

    // 3. Fetch today's query counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: analyticsToday } = await getSupabaseAdmin()
      .from("user_analytics")
      .select("user_id")
      .gte("created_at", today.toISOString());

    const usageCountMap: Record<string, number> = {};
    (analyticsToday || []).forEach((item: { user_id: string }) => {
      if (item.user_id) {
        usageCountMap[item.user_id] = (usageCountMap[item.user_id] || 0) + 1;
      }
    });

    // 4. Construct user list
    const users = authData.users.map((u) => {
      const p = profileMap.get(u.id);
      const tierInfo = p?.user_tiers;
      const tierId = p?.tier_id || "free";
      const tierName =
        tierInfo?.name ||
        (tierId === "admin"
          ? "Administrator"
          : tierId === "pro"
          ? "Pro"
          : tierId === "advance"
          ? "Advance"
          : tierId === "basic"
          ? "Basic+"
          : "Basic");

      return {
        id: u.id,
        email: u.email || "No email",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        tier_id: tierId,
        tier_name: tierName,
        is_enabled: p?.is_enabled ?? true,
        custom_daily_limit: p?.custom_daily_limit ?? null,
        today_queries: usageCountMap[u.id] || 0,
        is_admin: isUserAdmin(u.email, tierId),
      };
    });

    return NextResponse.json({
      users,
      totalCount: users.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve user list";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await verifyAdmin(req);
  if ("error" in authCheck) {
    return NextResponse.json({ detail: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await req.json();
    const { targetUserId, tierId, isEnabled, customDailyLimit } = body;

    if (!targetUserId) {
      return NextResponse.json({ detail: "targetUserId is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (tierId !== undefined) {
      updates.tier_id = tierId;
    }

    if (isEnabled !== undefined) {
      updates.is_enabled = Boolean(isEnabled);
    }

    if (customDailyLimit !== undefined) {
      if (customDailyLimit === null || customDailyLimit === "" || customDailyLimit === "none") {
        updates.custom_daily_limit = null;
      } else {
        const num = Number(customDailyLimit);
        if (isNaN(num) || num < 0) {
          return NextResponse.json({ detail: "customDailyLimit must be a non-negative number" }, { status: 400 });
        }
        updates.custom_daily_limit = num;
      }
    }

    // Ensure tier exists in user_tiers if setting to admin
    if (tierId === "admin") {
      await getSupabaseAdmin()
        .from("user_tiers")
        .upsert(
          { id: "admin", name: "Administrator", daily_limit: 999999, monthly_limit: 999999 },
          { onConflict: "id" }
        );
      if (updates.custom_daily_limit === undefined) {
        updates.custom_daily_limit = 999999;
      }
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from("profiles")
      .upsert(
        {
          id: targetUserId,
          ...updates,
        },
        { onConflict: "id" }
      );

    if (updateError) {
      return NextResponse.json({ detail: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User profile updated successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update user profile";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
