import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ detail: "Missing token" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let userEmail: string | null = null;
    try {
        const { data, error } = await getSupabaseAdmin().auth.getUser(token);
        if (error || !data.user) {
            return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
        }
        userEmail = data.user.email ?? null;
    } catch {
        return NextResponse.json({ detail: "Auth failed" }, { status: 401 });
    }

    const body = await req.json();
    const code: string = body.code?.trim().toUpperCase() ?? "";

    if (!code) {
        return NextResponse.json({ detail: "Code is required" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

    if (error || !data) {
        return NextResponse.json({ detail: "Invalid or inactive promo code." }, { status: 404 });
    }

    // Check expiration
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
        return NextResponse.json({ detail: "This promo code has expired." }, { status: 400 });
    }

    // Check usage limits
    if (data.max_uses && data.current_uses >= data.max_uses) {
        return NextResponse.json({ detail: "This promo code has reached its maximum usage limit." }, { status: 400 });
    }

    // Check email restriction
    if (data.restricted_to_email && data.restricted_to_email.toLowerCase() !== userEmail?.toLowerCase()) {
        return NextResponse.json({ detail: "This promo code is not valid for your account." }, { status: 403 });
    }

    return NextResponse.json({
        valid: true,
        discount_percent: data.discount_percent,
        code: data.code
    });
}
