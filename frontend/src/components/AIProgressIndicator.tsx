"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

interface Phase {
  id: string;
  label: string;
  icon: string;
  durationMs: number;
}

const PHASES: Phase[] = [
  { id: "understanding", label: "Understanding request", icon: "1", durationMs: 1800 },
  { id: "finding", label: "Finding sources", icon: "2", durationMs: 3200 },
  { id: "reading", label: "Reading context", icon: "3", durationMs: 3800 },
  { id: "drafting", label: "Drafting response", icon: "4", durationMs: 6200 },
  { id: "finishing", label: "Finishing up", icon: "5", durationMs: 1800 },
];

const TOTAL_DURATION = PHASES.reduce((sum, p) => sum + p.durationMs, 0);

export default function AIProgressIndicator() {
  const [elapsed, setElapsed] = useState(0);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100;
        // Calculate which phase we're in based on cumulative time
        let cumulative = 0;
        for (let i = 0; i < PHASES.length; i++) {
          cumulative += PHASES[i].durationMs;
          if (next < cumulative) {
            setCurrentPhaseIdx(i);
            break;
          }
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min((elapsed / TOTAL_DURATION) * 100, 100);

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const elapsedSeconds = (elapsed / 1000).toFixed(1);
  const remainingMs = Math.max(0, TOTAL_DURATION - elapsed);
  const remainingSeconds = (remainingMs / 1000).toFixed(1);

  return (
    <div className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-2 rounded-2xl bg-blue-500/10 blur-md"
            />
            <div className="relative w-12 h-12 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <motion.div
                key={currentPhaseIdx}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
              </motion.div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900">
                  Generating response
                </h3>
                <motion.p
                  key={currentPhaseIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs sm:text-sm text-slate-500 mt-0.5"
                >
                  {PHASES[currentPhaseIdx].label}
                </motion.p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-[11px] font-medium text-slate-500">Elapsed</div>
                <div className="text-sm font-semibold text-slate-900">{elapsedSeconds}s</div>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
              />
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {PHASES.map((phase, idx) => {
                const isCompleted = idx < currentPhaseIdx;
                const isCurrent = idx === currentPhaseIdx;

                return (
                  <div key={phase.id} className="flex flex-col items-center gap-2 min-w-0">
                    <div
                      className={`w-full h-1.5 rounded-full transition-colors ${
                        isCompleted
                          ? "bg-emerald-500"
                          : isCurrent
                            ? "bg-blue-500"
                            : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-semibold transition-all ${
                        isCompleted
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : isCurrent
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : phase.icon}
                    </div>
                    <span
                      className={`text-[10px] leading-tight text-center truncate w-full ${
                        isCompleted
                          ? "text-emerald-700"
                          : isCurrent
                            ? "text-blue-700"
                            : "text-slate-500"
                      }`}
                    >
                      {phase.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span>Working through the response</span>
              <span className="font-medium text-slate-700">~{remainingSeconds}s left</span>
              <span className="font-semibold text-blue-600">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {elapsed > 7000 && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-5 text-[11px] text-slate-500 leading-relaxed"
            >
              This is taking a little longer because the response is being assembled from multiple document sources.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
