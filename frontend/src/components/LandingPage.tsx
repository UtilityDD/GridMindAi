"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  ArrowRight,
  Search,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  buttonLabel?: string;
  isLoggedIn?: boolean;
}

const ROTATING_TOPICS = [
  "WBSEDCL Operative Circulars",
  "WBERC Tariff & Billing Orders",
  "CEA Safety & Clearance Standards",
  "DTR Restoration & Supply Norms",
  "Section 135 Inspection & Theft SOPs",
  "ROPA 2020 Pay Matrix Rules",
];

export default function LandingPage({
  onGetStarted,
  buttonLabel = "Open Console",
  isLoggedIn = false,
}: LandingPageProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_TOPICS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const currentTopic = ROTATING_TOPICS[index];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white flex flex-col justify-between">
      {/* ── Minimalist Top Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              GridMind <span className="text-blue-600">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/explorer"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Browse 4,200+ Documents</span>
            </Link>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              {isLoggedIn ? "Open Console" : "Sign In"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Hero Section (Spacious, Uncluttered, Dynamic Captions) ── */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center flex flex-col items-center justify-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/60 text-slate-600 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse" />
          <span>West Bengal Power Distribution & Regulatory Intelligence</span>
        </div>

        {/* Dynamic Main Headline: Strictly completed in 2 lines (Line 1: Fixed, Line 2: Changing) */}
        <h1 className="text-[20px] min-[400px]:text-[22px] min-[480px]:text-2xl sm:text-4xl md:text-[44px] lg:text-[52px] xl:text-[56px] font-extrabold tracking-tight text-slate-950 leading-tight max-w-5xl mx-auto">
          <span className="block whitespace-nowrap">
            Verified statutory answers for
          </span>
          <span className="flex items-center justify-center mt-2 sm:mt-3.5 text-blue-600 h-[1.3em] overflow-hidden whitespace-nowrap">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentTopic}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="inline-block whitespace-nowrap"
              >
                {currentTopic}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        {/* Clean, concise subtitle */}
        <p className="text-base sm:text-lg text-slate-500 mt-5 max-w-xl leading-relaxed font-normal">
          Instant clause-level determinations across 4,200+ indexed documents, tariff orders, and CEA safety regulations.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={onGetStarted}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <span>{buttonLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            href="/explorer"
            className="px-5 py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200/80 transition-colors"
          >
            Explore Directory
          </Link>
        </div>

        {/* ── 3 Essential Value Points ── */}
        <div className="grid sm:grid-cols-3 gap-6 w-full mt-16 sm:mt-20 text-left border-t border-slate-100 pt-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">4,200+ Documents</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every operative document from WBSEDCL, WBERC, and CEA indexed down to the clause.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">Zero Hallucinations</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Strict multi-source statutory retrieval ensures answers quote real circular provisions.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Side-by-Side PDF</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Click any citation to view the original signed circular in the integrated viewer.
            </p>
          </div>
        </div>
      </main>

      {/* ── Minimalist Clean Footer ── */}
      <footer className="border-t border-slate-100 py-6 px-6 text-xs text-slate-400 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">GridMind AI</span>
            <span>— Power Distribution Regulatory Intelligence</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/explorer" className="hover:text-slate-700 transition-colors">
              Circular Directory
            </Link>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-700 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
