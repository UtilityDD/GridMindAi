"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, FileText, Cpu, X } from "lucide-react";

interface AIProgressIndicatorProps {
  onStop?: () => void;
}

const STEPS = [
  {
    icon: Search,
    title: "Searching regulatory archives",
    subtitle: "Querying 4,200+ WBSEDCL & WBERC documents...",
  },
  {
    icon: FileText,
    title: "Analyzing regulatory clauses",
    subtitle: "Matching procedure codes, circulars & tariff orders...",
  },
  {
    icon: Cpu,
    title: "Synthesizing response",
    subtitle: "Formulating regulatory answer with citations...",
  },
];

export default function AIProgressIndicator({ onStop }: AIProgressIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Advance steps gracefully over time
    if (elapsed < 1400) {
      setCurrentStep(0);
    } else if (elapsed < 3200) {
      setCurrentStep(1);
    } else {
      setCurrentStep(2);
    }
  }, [elapsed]);

  const CurrentIcon = STEPS[currentStep].icon;
  const elapsedSeconds = (elapsed / 1000).toFixed(1);

  return (
    <div className="w-full max-w-lg my-1">
      <div className="relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow transition-shadow overflow-hidden">
        {/* Subtle Ambient Backlight */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon & Dynamic Step Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center shrink-0 shadow-xs">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-blue-600"
              >
                <CurrentIcon className="w-4 h-4" />
              </motion.div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 tracking-tight">
                  {STEPS[currentStep].title}
                </span>
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce" />
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] text-slate-500 truncate mt-0.5"
                >
                  {STEPS[currentStep].subtitle}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Elapsed Timer & Optional Stop Button */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60">
              {elapsedSeconds}s
            </span>
            {onStop && (
              <button
                onClick={onStop}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                title="Stop search"
                aria-label="Stop search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sleek Shimmer Line */}
        <div className="relative mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: "easeInOut",
            }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80"
          />
        </div>
      </div>
    </div>
  );
}
