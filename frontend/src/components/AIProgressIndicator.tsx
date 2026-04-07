"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap } from "lucide-react";

interface Phase {
  id: string;
  label: string;
  icon: string;
  durationMs: number;
}

const PHASES: Phase[] = [
  { id: "embedding", label: "Embedding query", icon: "🔍", durationMs: 2000 },
  { id: "retrieval", label: "Searching documents", icon: "📚", durationMs: 3500 },
  { id: "analysis", label: "Analyzing context", icon: "🧠", durationMs: 4000 },
  { id: "generation", label: "Synthesizing response", icon: "✨", durationMs: 8000 },
  { id: "formatting", label: "Formatting answer", icon: "📝", durationMs: 2000 },
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

  // Calculate progress percentage
  const progressPercent = Math.min((elapsed / TOTAL_DURATION) * 100, 100);

  // Calculate phase-specific progress
  let cumulativeBefore = 0;
  let phaseProgress = 0;
  for (let i = 0; i <= currentPhaseIdx; i++) {
    if (i < currentPhaseIdx) {
      cumulativeBefore += PHASES[i].durationMs;
    } else {
      const phaseElapsed = Math.max(0, elapsed - cumulativeBefore);
      phaseProgress = (phaseElapsed / PHASES[i].durationMs) * 100;
    }
  }

  // Format time
  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const elapsedSeconds = (elapsed / 1000).toFixed(1);
  const remainingMs = Math.max(0, TOTAL_DURATION - elapsed);
  const remainingSeconds = (remainingMs / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      {/* Icon + Main Status */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-3 bg-gradient-to-r from-blue-400/30 to-indigo-400/20 rounded-3xl blur-xl"
          />
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 flex items-center justify-center shadow-lg shadow-blue-200/30">
            <motion.span
              key={currentPhaseIdx}
              initial={{ scale: 0, rotateZ: -180 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-3xl"
            >
              {PHASES[currentPhaseIdx].icon}
            </motion.span>
          </div>
        </div>

        <motion.div
          key={currentPhaseIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center"
        >
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {PHASES[currentPhaseIdx].label}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Strategic Node Calibration
          </p>
        </motion.div>
      </div>

      {/* Phase Pipeline */}
      <div className="w-full max-w-md space-y-2.5">
        {PHASES.map((phase, idx) => {
          const isCompleted = idx < currentPhaseIdx;
          const isCurrent = idx === currentPhaseIdx;
          const isPending = idx > currentPhaseIdx;

          const phaseStart = PHASES.slice(0, idx).reduce((sum, p) => sum + p.durationMs, 0);
          const phaseEnd = phaseStart + phase.durationMs;
          const phaseCurrent =
            isCurrent
              ? Math.min(
                  ((elapsed - phaseStart) / phase.durationMs) * 100,
                  100
                )
              : isCompleted
                ? 100
                : 0;

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-3 rounded-xl border transition-all ${
                isCompleted
                  ? "bg-emerald-50 border-emerald-200"
                  : isCurrent
                    ? "bg-blue-50 border-blue-300 shadow-lg shadow-blue-200/20"
                    : "bg-slate-50 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {/* Status Icon */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  {isCurrent && (
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ rotate: { duration: 1.5, repeat: Infinity, ease: "linear" }, scale: { duration: 1.2, repeat: Infinity } }}
                      className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Zap className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  {isPending && (
                    <div className="w-5 h-5 rounded-full bg-slate-300 flex-shrink-0" />
                  )}

                  {/* Label */}
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider truncate ${
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

                {/* Time */}
                <span className="text-[10px] font-mono font-bold text-slate-600 flex-shrink-0">
                  {isCompleted
                    ? formatTime(phase.durationMs)
                    : isCurrent
                      ? formatTime(Math.max(0, remainingMs))
                      : "—"}
                </span>
              </div>

              {/* Progress Bar for Current Phase */}
              {isCurrent && (
                <div className="mt-2 h-1.5 bg-blue-200/50 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${phaseCurrent}%` }}
                    transition={{ duration: 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/50"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Overall Progress + Timer */}
      <div className="w-full max-w-md space-y-2">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.15 }}
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          />
        </div>

        {/* Time Info */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-600 font-bold">
            {elapsedSeconds}s elapsed
          </span>
          <span className="text-slate-500 font-medium">
            ~{remainingSeconds}s left
          </span>
          <span className="text-blue-600 font-bold">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Help Text - Show after 5 seconds */}
      <AnimatePresence>
        {elapsed > 5000 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-sm p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-lg shadow-amber-100/30 flex flex-col items-center gap-2 text-center"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                Need Faster Results?
              </span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
              Search keywords in <span className="font-bold">GridMind Explorer</span> for instant document retrieval.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
