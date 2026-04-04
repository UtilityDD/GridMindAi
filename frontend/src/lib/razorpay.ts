import Razorpay from "razorpay";

export const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        // During 'next build', don't throw, just warn to allow static collection
        if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
             console.warn("Razorpay API keys (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing. This is OK during build but will fail in production.");
             return null;
        }
        return null;
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};
