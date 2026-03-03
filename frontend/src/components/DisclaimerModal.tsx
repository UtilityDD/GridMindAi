"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, ShieldAlert, ExternalLink } from "lucide-react";

export default function DisclaimerModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const hasSeenDisclaimer = localStorage.getItem("gridmind_disclaimer_accepted");
        if (!hasSeenDisclaimer) {
            setIsOpen(true);
        }
    }, []);

    const handleAccept = () => {
        if (dontShowAgain) {
            localStorage.setItem("gridmind_disclaimer_accepted", "true");
        }
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                                <ShieldAlert className="w-8 h-8 text-indigo-400" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-4">Important Disclaimer</h2>

                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                GridMind AI is an advanced research tool built using publicly available regulatory materials,
                                technical standards, and official documentation openly sourced from the official websites of
                                various government organizations, enterprises, and institutions.
                                <br /><br />
                                While we strive for absolute accuracy, always refer to the original official documents for
                                legal or critical operational decisions.
                            </p>

                            <div className="w-full space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group justify-center">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={dontShowAgain}
                                            onChange={(e) => setDontShowAgain(e.target.checked)}
                                        />
                                        <div className="w-5 h-5 border-2 border-slate-700 rounded-md group-hover:border-indigo-500/50 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center">
                                            {dontShowAgain && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest">
                                        Don't show me again
                                    </span>
                                </label>

                                <button
                                    onClick={handleAccept}
                                    className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] border border-indigo-500/30"
                                >
                                    I Understand & Accept
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
