import Razorpay from "razorpay";

export const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Razorpay API keys (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing.");
        }
        return null;
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};
