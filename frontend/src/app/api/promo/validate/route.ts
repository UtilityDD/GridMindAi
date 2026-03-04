import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ detail: "Promo code is required" }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Auth check - Optional but recommended to prevent anonymous abuse
        const authHeader = req.headers.get("Authorization");
        let userEmail: string | null = null;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            const { data: { user } } = await supabase.auth.getUser(token);
            userEmail = user?.email?.toLowerCase() || null;
        }

        const { data: promo, error } = await supabase
            .from("promo_codes")
            .select("*")
            .eq("code", code.toUpperCase())
            .single();

        if (error || !promo) {
            return NextResponse.json({ detail: "Invalid promo code" }, { status: 404 });
        }

        // Check if active
        if (!promo.is_active) {
            return NextResponse.json({ detail: "This promo code is no longer active" }, { status: 400 });
        }

        // Check expiry
        if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
            return NextResponse.json({ detail: "This promo code has expired" }, { status: 400 });
        }

        // Check usage limits
        if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
            return NextResponse.json({ detail: "This promo code has reached its maximum usage limit" }, { status: 400 });
        }

        // Check email restriction (supports comma-separated list)
        if (promo.restricted_to_email) {
            const allowedEmails = promo.restricted_to_email.toLowerCase().split(",").map((e: string) => e.trim());
            if (!userEmail) {
                return NextResponse.json({ detail: "Authentication required to use this promo code." }, { status: 401 });
            }
            if (!allowedEmails.includes(userEmail)) {
                return NextResponse.json({
                    detail: "This promo code is not valid for your account"
                }, { status: 403 });
            }
        }

        return NextResponse.json({
            code: promo.code,
            discount_percent: promo.discount_percent
        });

    } catch (error) {
        console.error("Promo validation error:", error);
        return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
    }
}
