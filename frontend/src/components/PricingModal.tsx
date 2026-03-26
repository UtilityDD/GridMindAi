"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Tag, Loader2, AlertCircle, Zap, ShieldAlert, Scale, Cpu, Activity } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { PLANS } from "@/lib/plans";

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
                        className="absolute inset-0 bg-black/30"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-7xl bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10 max-h-[95vh] overflow-y-auto"
                    >
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-[10px] font-bold tracking-widest uppercase mb-4"
                            >
                                <Sparkles className="w-3 h-3" />
                                RESOURCE ALLOCATION
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                {promoData ? (
                                    <span className="flex items-center justify-center gap-3">
                                        Support Applied!
                                        <span className="text-emerald-400 animate-pulse text-2xl md:text-3xl">-{promoData.discount}%</span>
                                    </span>
                                ) : "API Cost Compensation"}
                            </h2>
                            <p className="text-slate-700 max-w-2xl mx-auto text-sm leading-relaxed px-4">
                                {promoData
                                    ? `Strategic support activated! Your contribution for ${promoData.code} is now live.`
                                    : "GridMind is a research platform. Contributions directly compensate the high computational costs of running LLM queries. No profit is made from these contributions."}
                            </p>
                        </div>

                        {promoData?.discount === 100 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-3 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center gap-3 shadow-sm"
                            >
                                <Zap className="w-4 h-4 text-emerald-600 animate-pulse" />
                                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest leading-none">
                                    Promotional Full Access Activated — Claim any plan for FREE
                                </span>
                            </motion.div>
                        )}

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
                                            ? "bg-blue-50 border-blue-400 shadow-lg shadow-blue-200/50"
                                            : promoData?.discount === 100
                                                ? "bg-emerald-50/50 border-emerald-300 shadow-xl shadow-emerald-500/10"
                                                : "bg-slate-50 border-slate-300 hover:border-slate-400"
                                            }`}
                                    >
                                        {isCurrent && (
                                            <div className="absolute top-4 right-4 px-2 py-0.5 rounded-md bg-blue-600 text-[8px] font-bold text-white uppercase">
                                                Current
                                            </div>
                                        )}

                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/10`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                                        <div className="flex flex-col mb-4">
                                            <div className="flex items-baseline gap-1">
                                                 <span className={`text-2xl font-bold text-slate-900 ${promoData && plan.price > 0 ? "line-through opacity-30 text-lg" : ""}`}>
                                                     ₹{plan.price}
                                                 </span>
                                                 {promoData && plan.price > 0 && (
                                                     <span className={`text-2xl font-bold ${promoData.discount === 100 ? "text-emerald-500" : "text-emerald-400"} drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]`}>
                                                         {promoData.discount === 100 ? "FREE" : `₹${finalPrice}`}
                                                     </span>
                                                 )}
                                                 <span className="text-xs text-slate-700">/month</span>
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

                                        <p className="text-xs text-slate-700 mb-6 leading-relaxed flex-1">
                                            {plan.description}
                                        </p>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                                                <Zap className="w-3 h-3" />
                                                {plan.limit}
                                            </div>
                                            {plan.duration && (
                                                <div className="text-[10px] font-semibold text-slate-600 italic">
                                                    {plan.duration}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleSelect(plan.id)}
                                            disabled={isCurrent || (!!selectedPlanId)}
                                             className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isCurrent
                                                ? "bg-slate-200 text-slate-600 cursor-default"
                                                : promoData?.discount === 100 
                                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                                                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                }`}
                                        >
                                            {selectedPlanId === plan.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                            {isCurrent ? "Active Allocation" :
                                                plan.id === 'free' ? "Access Free" :
                                                    (selectedPlanId === plan.id ? "Processing..." :
                                                        (promoData?.discount === 100 ? "Claim Support Access" : "Contribute & Support"))}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Promo Code Section */}
                        <div className="max-w-md mx-auto pt-6 border-t border-slate-300">
                            {!showPromoInput && !promoData ? (
                                <button
                                    onClick={() => setShowPromoInput(true)}
                                    className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs transition-colors py-2"
                                >
                                    <Tag className="w-3.5 h-3.5" />
                                    Have a Promo code?
                                </button>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">PROMO CODE</span>
                                        </div>
                                        {(promoData || showPromoInput) && (
                                            <button
                                                onClick={() => {
                                                    setPromoCode("");
                                                    setPromoData(null);
                                                    setShowPromoInput(false);
                                                }}
                                                className="text-[9px] font-bold text-slate-600 hover:text-blue-600 uppercase tracking-tighter"
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
                                            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                                            autoFocus
                                        />
                                        {!promoData ? (
                                            <button
                                                onClick={handleValidatePromo}
                                                disabled={!promoCode || isValidating}
                                                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-blue-600/50"
                                            >
                                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                            </button>
                                        ) : (
                                            <div className="px-6 py-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-bold flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5" />
                                                Applied
                                            </div>
                                        )}
                                    </div>
                                    {promoError && (
                                        <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                                            <AlertCircle className="w-3 h-3" />
                                            {promoError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Structured Legal Disclosure Box - Full Width */}
                        <div className="mt-12 p-8 rounded-[2.5rem] bg-amber-50/50 border border-amber-200/60 shadow-sm transition-all hover:bg-amber-50/80">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 shadow-sm">
                                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                                </div>
                                <h5 className="text-[11px] font-bold text-amber-900 uppercase tracking-[0.2em] leading-none">
                                    NON-COMMERCIAL DISCLOSURE
                                </h5>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <Scale className="w-3.5 h-3.5 text-amber-700" />
                                        <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-widest">NO SERVICE SALE</span>
                                    </div>
                                    <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                                        GridMind <strong>does not sell</strong> AI services for profit. The platform is a research library.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <Cpu className="w-3.5 h-3.5 text-amber-700" />
                                        <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-widest">COST RECOVERY</span>
                                    </div>
                                    <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                                        Payments are a 1-to-1 compensation for the <strong>high computational token costs</strong> of neural inference.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <Activity className="w-3.5 h-3.5 text-amber-700" />
                                        <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-widest">COMMUNITY IMPACT</span>
                                    </div>
                                    <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                                        Your support enables the <strong>continued indexing</strong> of WBERC/WBSEDCL intelligence.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-12 w-full text-center text-[10px] text-slate-600 hover:text-slate-900 font-bold tracking-widest uppercase transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
