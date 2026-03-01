"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Rocket, Zap, ShieldCheck } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    price: string;
    limit: string;
    description: string;
    features: string[];
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}

const PLANS: Plan[] = [
    {
        id: "free",
        name: "Field Agent",
        price: "$0",
        limit: "5 queries / day",
        description: "Ideal for occasional lookups and tactical inquiries.",
        features: ["Manual search", "Basic context retrieval", "Limited history"],
        color: "from-slate-500 to-slate-700",
        icon: Rocket,
    },
    {
        id: "basic",
        name: "Strategic Lead",
        price: "$29",
        limit: "50 queries / day",
        description: "Enhanced bandwidth for consistent policy analysis.",
        features: ["Priority retrieval", "Query optimization", "Extended history", "Email support"],
        color: "from-blue-500 to-indigo-600",
        icon: Zap,
    },
    {
        id: "pro",
        name: "Grid Master",
        price: "$99",
        limit: "200 queries / day",
        description: "Maximum intelligence for enterprise-scale operations.",
        features: ["Neural mapping", "Unlimited history", "Advanced analytics", "24/7 Priority support"],
        color: "from-indigo-500 to-purple-600",
        icon: ShieldCheck,
    },
];

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTier: string;
    onSelectPlan: (tierId: string) => Promise<void>;
}

export default function PricingModal({ isOpen, onClose, currentTier, onSelectPlan }: PricingModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#060d1f]/80 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-5xl bg-slate-900/50 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-12"
                    >
                        <div className="text-center mb-12">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-4"
                            >
                                <Sparkles className="w-3 h-3" />
                                Intelligence Bandwidth
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Choose Your Strategy</h2>
                            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
                                Scale your analytical capabilities with tiers designed for every level of grid management.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {PLANS.map((plan, idx) => {
                                const isCurrent = currentTier === plan.id;
                                const Icon = plan.icon;

                                return (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + idx * 0.1 }}
                                        className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-300 ${isCurrent
                                            ? "bg-white/5 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                                            : "bg-slate-900/40 border-white/5 hover:border-white/10"
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
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-2xl font-bold text-white">{plan.price}</span>
                                            <span className="text-xs text-slate-500">/month</span>
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
                                            onClick={() => !isCurrent && onSelectPlan(plan.id)}
                                            disabled={isCurrent}
                                            className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${isCurrent
                                                ? "bg-slate-800 text-slate-500 cursor-default"
                                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                                                }`}
                                        >
                                            {isCurrent ? "Active Plan" : plan.id === 'free' ? "Downgrade" : "Activate Strategy"}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-8 w-full text-center text-[10px] text-slate-600 hover:text-slate-400 font-bold tracking-widest uppercase transition-colors"
                        >
                            Close Strategic Overview
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
