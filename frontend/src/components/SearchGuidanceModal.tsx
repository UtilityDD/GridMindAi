"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Lightbulb, Zap, Check } from "lucide-react";

interface SearchGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export default function SearchGuidanceModal({ isOpen, onClose, onProceed }: SearchGuidanceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Header / Brand */}
            <div className="bg-blue-600 px-8 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest leading-none">Pro Tip</h3>
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest mt-1 opacity-80">Search Intelligence</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="px-8 pt-8 pb-10">
              <div className="space-y-6">
                {/* Rule 1: Technical Codes */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Use Technical Codes</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Instead of "meter rules", try <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">IS 15707</span> or <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">CEA 2006</span> for 100% precision.
                    </p>
                  </div>
                </div>

                {/* Rule 2: Specific Years */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Mention Specific Years</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Add a year like <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">2013</span> or <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">2024</span> to filter out older regulations instantly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-10 flex flex-col gap-3">
                <button
                  onClick={onProceed}
                  className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group"
                >
                  Got it, let's search!
                  <Check className="w-4 h-4 group-hover:scale-125 transition-transform" />
                </button>
                <button
                  onClick={onClose}
                  className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
                >
                  Skip this time
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
