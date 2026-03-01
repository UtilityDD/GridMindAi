import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tierId, userId } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tierId || !userId) {
            return NextResponse.json({ error: "Missing required verification data" }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json({ error: "Razorpay secret key is not configured" }, { status: 500 });
        }

        // Verify Razorpay signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (!isSignatureValid) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // Signature is valid, update the user tier in Supabase
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from("profiles")
            .update({ tier_id: tierId })
            .eq("id", userId);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully upgraded user ${userId} to ${tierId} strategy.`
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Error";
        console.error("Razorpay Verification Error:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
