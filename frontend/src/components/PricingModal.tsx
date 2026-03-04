"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Rocket, Zap, ShieldCheck, Tag, Loader2, AlertCircle, BrainCircuit } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface Plan {
    id: string;
    name: string;
    price: number;
    limit: string;
    description: string;
    features: string[];
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}

const PLANS: Plan[] = [
    {
        id: "free",
        name: "Basic",
        price: 0,
        limit: "20 queries / day",
        description: "Standard regulatory lookup for general users.",
        features: ["Standard search", "Basic history", "Web access"],
        color: "from-slate-500 to-slate-700",
        icon: Rocket,
    },
    {
        id: "basic",
        name: "Basic+",
        price: 200,
        limit: "100 queries / day",
        description: "Enhanced bandwidth for active policy research.",
        features: ["High-speed search", "Priority support", "Extended history"],
        color: "from-blue-500 to-indigo-600",
        icon: Zap,
    },
    {
        id: "advance",
        name: "Advance",
        price: 300,
        limit: "300 queries / day",
        description: "Professional grade strategic intelligence.",
        features: ["Full database access", "Extended context", "Priority support"],
        color: "from-purple-500 to-indigo-600",
        icon: BrainCircuit,
    },
    {
        id: "pro",
        name: "Pro",
        price: 500,
        limit: "500 queries / day",
        description: "Maximum bandwidth for enterprise-level operations.",
        features: ["Enterprise support", "Unlimited history", "Advanced analytics"],
        color: "from-indigo-500 to-amber-600",
        icon: ShieldCheck,
    },
];

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTier: string;
    onSelectPlan: (tierId: string, promoCode?: string) => Promise<void>;
}

export default function PricingModal({ isOpen, onClose, currentTier, onSelectPlan }: PricingModalProps) {
    const { session } = useAuth();
    const [promoCode, setPromoCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [promoData, setPromoData] = useState<{ discount: number; code: string } | null>(null);
    const [promoError, setPromoError] = useState("");
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [showPromoInput, setShowPromoInput] = useState(false);

    const handleSelect = async (planId: string) => {
        if (planId === currentTier || selectedPlanId) return;

        setSelectedPlanId(planId);
        try {
            await onSelectPlan(planId, promoData?.code);
            // Once the Razorpay window opens or process finishes, we can let the user click again if needed
            // (though usually modal closes on success)
            setSelectedPlanId(null);
        } catch {
            setSelectedPlanId(null);
        }
    };
    const handleValidatePromo = async () => {
        if (!promoCode.trim()) return;
        setIsValidating(true);
        setPromoError("");
        setPromoData(null);

        try {
            const accessToken = session?.access_token || "";

            const res = await fetch("/api/promo/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ code: promoCode })
            });

            const data = await res.json();
            if (res.ok) {
                setPromoData({ discount: data.discount_percent, code: data.code });
            } else {
                setPromoError(data.detail || "Invalid promo code.");
            }
        } catch {
            setPromoError("Failed to validate promo code. Technical network failure.");
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/90"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-7xl bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10 max-h-[95vh] overflow-y-auto"
                    >
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-4"
                            >
                                <Sparkles className="w-3 h-3" />
                                PLAN LIMITS
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                {promoData ? (
                                    <span className="flex items-center justify-center gap-3">
                                        Promo Applied!
                                        <span className="text-emerald-400 animate-pulse text-2xl md:text-3xl">-{promoData.discount}%</span>
                                    </span>
                                ) : "Choose Your Plan"}
                            </h2>
                            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
                                {promoData
                                    ? `Strategic discount activated! Your exclusive pricing for ${promoData.code} is now live.`
                                    : "Pick the plan that best fits your search and analysis needs."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                            {PLANS.map((plan, idx) => {
                                const isCurrent = currentTier === plan.id;
                                const Icon = plan.icon;
                                const discount = promoData ? (plan.price * promoData.discount / 100) : 0;
                                const finalPrice = Math.max(0, plan.price - discount);

                                return (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + idx * 0.1 }}
                                        className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-300 ${isCurrent
                                            ? "bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-500/5"
                                            : "bg-slate-800 border-slate-700 hover:border-slate-600"
                                            }`}
                                    >
                                        {isCurrent && (
                                            <div className="absolute top-4 right-4 px-2 py-0.5 rounded-md bg-indigo-500 text-[8px] font-bold text-white uppercase">
                                                Current
                                            </div>
                                        )}

                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/10`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                                        <div className="flex flex-col mb-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-2xl font-bold text-white ${promoData && plan.price > 0 ? "line-through opacity-30 text-lg" : ""}`}>
                                                    ₹{plan.price}
                                                </span>
                                                {promoData && plan.price > 0 && (
                                                    <span className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                                                        ₹{finalPrice}
                                                    </span>
                                                )}
                                                <span className="text-xs text-slate-500">/month</span>
                                            </div>
                                            {promoData && plan.price > 0 && (
                                                <div className="mt-1 flex flex-col gap-0.5">
                                                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight flex items-center gap-1">
                                                        <Tag className="w-2.5 h-2.5" />
                                                        {promoData.discount}% Discount Added
                                                    </div>
                                                    <div className="text-[9px] font-medium text-slate-500 italic">
                                                        You save ₹{plan.price - finalPrice}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-400 mb-6 leading-relaxed flex-1">
                                            {plan.description}
                                        </p>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                                                <Zap className="w-3 h-3" />
                                                {plan.limit}
                                            </div>
                                            {plan.features.map((feature, fIdx) => (
                                                <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-300">
                                                    <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleSelect(plan.id)}
                                            disabled={isCurrent || (!!selectedPlanId)}
                                            className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isCurrent
                                                ? "bg-slate-800 text-slate-500 cursor-default"
                                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                }`}
                                        >
                                            {selectedPlanId === plan.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                            {isCurrent ? "Current Plan" :
                                                plan.id === 'free' ? "Select Free" :
                                                    (selectedPlanId === plan.id ? "Processing..." :
                                                        (promoData?.discount === 100 ? "Claim Free Access" : "Upgrade Now"))}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Promo Code Section */}
                        <div className="max-w-md mx-auto pt-6 border-t border-white/5">
                            {!showPromoInput && !promoData ? (
                                <button
                                    onClick={() => setShowPromoInput(true)}
                                    className="w-full flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs transition-colors py-2"
                                >
                                    <Tag className="w-3.5 h-3.5" />
                                    Have a Promo code?
                                </button>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">PROMO CODE</span>
                                        </div>
                                        {(promoData || showPromoInput) && (
                                            <button
                                                onClick={() => {
                                                    setPromoCode("");
                                                    setPromoData(null);
                                                    setShowPromoInput(false);
                                                }}
                                                className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-tighter"
                                            >
                                                {promoData ? "Remove Code" : "Cancel"}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="ENTER PROMO CODE"
                                            disabled={!!promoData || isValidating}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none transition-all disabled:opacity-50"
                                            autoFocus
                                        />
                                        {!promoData ? (
                                            <button
                                                onClick={handleValidatePromo}
                                                disabled={!promoCode || isValidating}
                                                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-500/30"
                                            >
                                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                            </button>
                                        ) : (
                                            <div className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5" />
                                                Applied
                                            </div>
                                        )}
                                    </div>
                                    {promoError && (
                                        <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-red-400 uppercase tracking-tighter">
                                            <AlertCircle className="w-3 h-3" />
                                            {promoError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-12 w-full text-center text-[10px] text-slate-600 hover:text-slate-400 font-bold tracking-widest uppercase transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
