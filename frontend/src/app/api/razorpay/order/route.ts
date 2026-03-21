import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const PRICE_MAP_INR: Record<string, { price: number; name: string }> = {
    basic: { price: 10000, name: "Basic+" },     // ₹100.00
    advance: { price: 20000, name: "Advance" },  // ₹200.00
    pro: { price: 30000, name: "Grid Pro" },     // ₹300.00
};

export async function POST(req: NextRequest) {
    try {
        const { tierId, promoCode } = await req.json();

        // 1. Auth check
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        if (!tierId) {
            return NextResponse.json({ error: "Missing required tier selection" }, { status: 400 });
        }

        const plan = PRICE_MAP_INR[tierId];
        if (!plan) {
            return NextResponse.json({ error: "Invalid strategy tier selected" }, { status: 400 });
        }

        let finalPrice = plan.price;
        let discountApplied = 0;

        // 2. Validate Promo Code if provided
        if (promoCode) {
            const { data: promo, error: promoError } = await getSupabaseAdmin()
                .from("promo_codes")
                .select("*")
                .eq("code", promoCode.toUpperCase())
                .eq("is_active", true)
                .single();

            if (!promoError && promo) {
                // Check expiry
                const isNotExpired = !promo.valid_until || new Date(promo.valid_until) > new Date();
                // Check usage
                const hasUses = promo.max_uses === null || promo.current_uses < promo.max_uses;

                if (isNotExpired && hasUses) {
                    discountApplied = promo.discount_percent;
                    const discountAmt = Math.floor((plan.price * discountApplied) / 100);
                    finalPrice = Math.max(0, plan.price - discountAmt);
                }
            }
        }

        // 3. Handle 100% Discount (Price = 0)
        if (finalPrice === 0) {
            const { error: updateError } = await getSupabaseAdmin()
                .from("profiles")
                .update({ tier_id: tierId })
                .eq("id", user.id);

            if (updateError) {
                console.error("[ERROR] Profile update failed:", updateError);
                throw updateError;
            }

            // Increment promo usage safely
            if (promoCode && discountApplied > 0) {
                try {
                    await getSupabaseAdmin().rpc('increment_promo_usage', { p_code: promoCode.toUpperCase() });
                } catch (rpcErr) {
                    console.warn("[WARN] RPC fails but upgrade continues:", rpcErr);
                }
            }

            return NextResponse.json({
                free: true,
                message: "Trial/Promotion strategy activated successfully."
            });
        }

        // 4. Create Razorpay Order for remaining amount
        const razorpay = getRazorpay();
        if (!razorpay) {
            return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
        }

        const options = {
            amount: finalPrice,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                tierId,
                userId: user.id
            }
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Error";
        console.error("Razorpay Order Error:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
