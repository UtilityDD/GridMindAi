"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Zap,
  ArrowRight,
  FileText,
  Search,
  Shield,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  buttonLabel?: string;
  isLoggedIn?: boolean;
}

const ROTATING_TOPICS = [
  {
    topic: "WBSEDCL Operative Circulars",
    query: "What is the procedure for Section 135 unauthorized extraction?",
    answer: "Immediate disconnection under Section 135(1A) of the Electricity Act 2003, with provisional assessment served within 48 hours as per WBSEDCL commercial procedure.",
    ref: "WBSEDCL Cir. No. 28/2021 · Clause 4.3",
  },
  {
    topic: "WBERC Tariff & Billing Orders",
    query: "What is the Delayed Payment Surcharge (DPS) rate under operative tariff order?",
    answer: "Delayed Payment Surcharge is levied at 1.25% per month on simple interest basis for the duration of default under WBERC Tariff Schedule.",
    ref: "WBERC Tariff Order · Para 4.6",
  },
  {
    topic: "CEA Safety & Ground Clearance",
    query: "Minimum vertical ground clearance for 11kV overhead lines over buildings?",
    answer: "Minimum 3.7 meters (12 ft) vertical clearance above highest point of building under Regulation 61 of CEA Safety Regulations 2010.",
    ref: "CEA Safety Regulations 2010 · Reg. 61",
  },
  {
    topic: "DTR Overload & Restoration Norms",
    query: "What is the mandatory supply restoration time on distribution transformer failure?",
    answer: "Supply must be restored within 24 hours in urban areas and 48 hours in rural areas under WBERC Standard of Performance Regulations.",
    ref: "WBERC SOP Reg. 5.3 · Schedule II",
  },
  {
    topic: "ROPA 2020 Pay Matrix & Service Rules",
    query: "What is the pay fixation entitlement after 16 years of continuous service?",
    answer: "Placement in the next higher Pay Level in the Pay Matrix with one notional increment of 3% added under WBSEDCL ROPA 2020 rules.",
    ref: "Office Order P/ROPA/2020/01 · Para 8",
  },
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

  const current = ROTATING_TOPICS[index];

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
              <span>Browse 4,200+ Circulars</span>
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

        {/* Dynamic Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight max-w-4xl">
          Verified statutory answers for
          <span className="block mt-2 sm:mt-3 text-blue-600 min-h-[1.3em]">
            <AnimatePresence mode="wait">
              <motion.span
                key={current.topic}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="inline-block"
              >
                {current.topic}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        {/* Clean, concise subtitle */}
        <p className="text-base sm:text-lg text-slate-500 mt-5 max-w-xl leading-relaxed font-normal">
          Instant clause-level determinations across 4,200+ indexed WBSEDCL circulars, WBERC tariff orders, and CEA safety regulations.
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

        {/* ── Clean Live Query Preview Card (Single, Uncluttered) ── */}
        <div className="w-full mt-14 text-left">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Example Query</span>
              </div>
              <span className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                {current.ref}
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-900 mb-2">
              "{current.query}"
            </p>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {current.answer}
            </div>

            {/* Micro indicators */}
            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Original circular citation verified
              </span>
              <div className="flex items-center gap-1.5">
                {ROTATING_TOPICS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === i ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                    }`}
                    aria-label={`Select sample ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 Essential Value Points (No Dense Lists or Tables) ── */}
        <div className="grid sm:grid-cols-3 gap-6 w-full mt-14 text-left border-t border-slate-100 pt-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">4,200+ Documents</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every operative circular from WBSEDCL, WBERC, and CEA indexed down to the clause.
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
