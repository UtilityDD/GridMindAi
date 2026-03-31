"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldAlert, AlertTriangle, Scale, EyeOff, BookOpen, Upload, ChevronDown } from "lucide-react";

export default function DisclaimerModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hasSeenDisclaimer = localStorage.getItem("gridmind_disclaimer_accepted");
        if (!hasSeenDisclaimer) {
            setIsOpen(true);
        }
    }, []);

    const handleAccept = () => {
        if (!hasReadToBottom) return;
        if (dontShowAgain) {
            localStorage.setItem("gridmind_disclaimer_accepted", "true");
        }
        setIsOpen(false);
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Add a 10px buffer for precision in high-DPI screens
            if (scrollTop + clientHeight >= scrollHeight - 25) {
                setHasReadToBottom(true);
            }
        }
    };

    // Check if content is already at bottom or doesn't need scrolling
    useEffect(() => {
        const checkScroll = () => {
            if (scrollRef.current) {
                const { scrollHeight, clientHeight } = scrollRef.current;
                if (scrollHeight <= clientHeight + 5) {
                    setHasReadToBottom(true);
                }
            }
        };

        if (isOpen) {
            // Check immediately and after a small delay to allow for rendering
            checkScroll();
            const timer = setTimeout(checkScroll, 300);
            window.addEventListener('resize', checkScroll);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-sm">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 leading-none">Important Legal Notice</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">Mandatory Compliance Review</p>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div 
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="flex-1 min-h-0 overflow-y-auto px-8 py-8 space-y-6 scroll-smooth"
                        >
                            {/* Alert 1: AI Nature */}
                            <div className="flex gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">AI Hallucination Warning</h4>
                                    <p className="text-xs text-amber-800/80 leading-relaxed">
                                        This is an AI-powered intelligence tool. Neural models may generate plausible but incorrect, outdated, or hallucinated information. Always cross-verify critical data.
                                    </p>
                                </div>
                            </div>

                            {/* Alert 2: No Affiliation */}
                            <div className="flex gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                <EyeOff className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Non-Affiliation Declaration</h4>
                                    <p className="text-xs text-blue-800/80 leading-relaxed">
                                        GridMind is an independent research platform. We are <strong>NOT affiliated</strong>, authorized, or endorsed by WBSEDCL, WBERC, or any Government department of West Bengal.
                                    </p>
                                </div>
                            </div>

                            {/* Alert 3: Source of Truth */}
                            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <BookOpen className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Source of Truth Hierarchy</h4>
                                    <p className="text-xs text-slate-700/80 leading-relaxed">
                                        In any conflict between GridMind's output and an official Gazette or notification, the <strong>Official Printed Document</strong> shall take absolute precedence for all legal purposes.
                                    </p>
                                </div>
                            </div>

                            {/* Alert 4: Community Data */}
                            <div className="flex gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <Upload className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Community-Led Intelligence</h4>
                                    <p className="text-xs text-emerald-800/80 leading-relaxed">
                                        Certain reference materials are contributed by the user community. GridMind <strong>assumes no responsibility</strong> for the provenance or copyright of such "User Uploaded" documents. Use at your own risk.
                                    </p>
                                </div>
                            </div>

                            {/* Comprehensive Terms Paragraph */}
                            <div className="pt-2 space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-widest">
                                    <Scale className="w-4 h-4" />
                                    Limitation of Liability
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed italic">
                                    By proceeding, you acknowledge that GridMind is a research-only platform. The developers and operators shall not be liable for any financial loss, legal penalties, or operational failures resulting from reliance on the AI-generated responses provided herein. Technical standards (IS Codes/CERC/WBERC) are provided for convenience only.
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-4">
                            <AnimatePresence mode="wait">
                                {!hasReadToBottom ? (
                                    <motion.div
                                        key="scroll-hint"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100"
                                    >
                                        <ChevronDown className="w-4 h-4 animate-bounce" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Scroll to read the full notice</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="bottom-actions"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full space-y-4"
                                    >
                                        <label className="flex items-center gap-3 cursor-pointer group justify-center">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={dontShowAgain}
                                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                                />
                                                <div className="w-5 h-5 border-2 border-slate-300 rounded-lg group-hover:border-blue-500 transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center shadow-sm">
                                                    {dontShowAgain && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors uppercase tracking-[0.2em]">
                                                I have read the legal guards
                                            </span>
                                        </label>

                                        <button
                                            onClick={handleAccept}
                                            className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-bold transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] border border-white/10 uppercase tracking-widest"
                                        >
                                            Agree & Enter System
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
