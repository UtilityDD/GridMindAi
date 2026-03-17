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
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center mb-6">
                                <ShieldAlert className="w-8 h-8 text-blue-600" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Important Disclaimer</h2>

                            <p className="text-slate-700 text-sm leading-relaxed mb-8">
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
                                        <div className="w-5 h-5 border-2 border-slate-400 rounded-md group-hover:border-blue-500/70 transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center">
                                            {dontShowAgain && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-700 transition-colors uppercase tracking-widest">
                                        Don't show me again
                                    </span>
                                </label>

                                <button
                                    onClick={handleAccept}
                                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] border border-blue-600/50"
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
