import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const PRICE_MAP_INR: Record<string, { price: number; name: string }> = {
    basic: { price: 10000, name: "Basic+" },     // ₹100.00
    advance: { price: 20000, name: "Advance" },  // ₹200.00
    pro: { price: 30000, name: "Grid Pro" },     // ₹300.00
};

export async function POST(req: NextRequest) {
    try {
        const { tierId } = await req.json();

        if (!tierId) {
            return NextResponse.json({ error: "Missing required tier selection" }, { status: 400 });
        }

        const plan = PRICE_MAP_INR[tierId];
        if (!plan) {
            return NextResponse.json({ error: "Invalid strategy tier selected" }, { status: 400 });
        }

        const razorpay = getRazorpay();
        if (!razorpay) {
            return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
        }

        // Create Razorpay Order
        const options = {
            amount: plan.price,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                tierId,
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
        console.error("Razorpay Verification Error:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
