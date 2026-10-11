"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Zap,
  Shield,
  ArrowRight,
  FileText,
  Check,
  Search,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Building2,
  Gauge,
  Briefcase,
  HelpCircle,
  FolderOpen,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  buttonLabel?: string;
  isLoggedIn?: boolean;
}

// ── REAL FIELD OPERATIONAL CASES (AUTHENTIC UTILITY SCOPE) ──
const OPERATIONAL_CASES = [
  {
    category: "Vigilance & Section 135",
    title: "Unauthorized Extraction & Direct Theft Procedure",
    q: "What is the mandatory procedure for immediate disconnection and provisional assessment during a Section 135 inspection?",
    determination:
      "Under Section 135(1A) of the Electricity Act 2003 read with WBSEDCL Commercial Procedures, the authorised officer may disconnect supply immediately upon detection of unauthorized extraction. The assessment of units must follow the commercial assessment formula based on connected load and diversity factor, and provisional order must be served within 48 hours. Compounding of offence is admissible only as per Section 152 schedule.",
    citation: "Electricity Act 2003 §135(1A) & WBSEDCL Commercial SOP",
    docket: "WBSEDCL/CED/Cir-12/2019 · Clause 4.3",
    verifiedDate: "Operative Gazette Standard",
  },
  {
    category: "Distribution O&M",
    title: "Overhead Line Clearance Violations (11kV & 33kV)",
    q: "A consumer constructed a building near an existing 11kV line. What are the minimum legal vertical and horizontal clearance rules?",
    determination:
      "As per Regulation 61 of CEA (Measures Relating to Safety and Electric Supply) Regulations 2010, the minimum vertical clearance above the highest part of the building for lines up to 11kV is 3.7 meters (12 ft), and horizontal clearance is 1.2 meters (4 ft). For 33kV lines, minimum vertical clearance is 4.6 meters (15 ft) and horizontal clearance is 2.0 meters (6.5 ft). Infringement requires statutory notice under Section 68 followed by disconnection if unsafe.",
    citation: "CEA Safety & Electric Supply Regulations 2010",
    docket: "CEA Reg. 60 & 61 · Notification No. 12/2010",
    verifiedDate: "Central Statutory Regulation",
  },
  {
    category: "Regulatory Standards",
    title: "Distribution Transformer (DTR) Failure Restoration Time",
    q: "What is the maximum permitted timeframe to restore supply upon failure of a distribution transformer in urban vs rural areas?",
    determination:
      "Under the WBERC (Standard of Performance of Licensees) Regulations, restoration of supply on failure or burning of a distribution transformer must be completed within 24 hours in municipal urban areas and within 48 hours in rural panchayat areas from the time of complaint registration. Failure to meet this timeline entitles the consumer to statutory compensation under Schedule II.",
    citation: "WBERC Standard of Performance Regulations",
    docket: "Schedule II, Clause 5.3 · Case No. SM-14/11-12",
    verifiedDate: "WBERC Statutory Order",
  },
  {
    category: "Tariff & Billing",
    title: "Delayed Payment Surcharge (DPS) & Contract Demand Penalty",
    q: "How is DPS computed for commercial consumers and what is the penalty multiplier when actual demand exceeds contract demand?",
    determination:
      "Per the operative WBERC Tariff Order, Delayed Payment Surcharge (DPS) is levied at 1.25% per month on simple interest basis for the period of default. If recorded Maximum Demand exceeds the Contract Demand by more than 15%, the excess demand is billed at 200% of the normal demand charge rate for the billing cycle.",
    citation: "WBERC Tariff Order & Commercial Schedule",
    docket: "Para 4.6 & Schedule of Commercial Conditions",
    verifiedDate: "Operative Tariff Schedule",
  },
  {
    category: "Service Rules & HR",
    title: "16-Year Higher Scale & ROPA Pay Band Fixation",
    q: "What is the pay fixation formula when an employee completes 16 years of continuous service in the same post without regular promotion?",
    determination:
      "Under WBSEDCL ROPA 2020 pay revision directives, an employee completing 16 years of eligible service is granted placement into the next higher Pay Level in the Pay Matrix with one notional increment of 3% added to the existing basic pay, provided ACR ratings for the preceding 5 years meet the prescribed benchmark.",
    citation: "WBSEDCL ROPA 2020 Order & Service Rules",
    docket: "Office Order No. P/ROPA/2020/01 · Para 8",
    verifiedDate: "Service Circular Record",
  },
];

// ── SAMPLE REPOSITORY DOCKETS FOR VAULT TEASER ──
const SAMPLE_DOCKETS = [
  {
    id: "CIR-28-2021",
    authority: "WBSEDCL Commercial",
    num: "Cir. No. 28/2021",
    title: "Standardized Procedures for Inspection & Assessment in Electricity Theft Cases",
    date: "14-Jul-2021",
    tag: "Vigilance",
  },
  {
    id: "WBERC-SOP-56",
    authority: "WBERC Gazette",
    num: "Notification No. 56/WBERC",
    title: "Standard of Performance of Distribution Licensees and Consumer Compensation Rules",
    date: "22-Mar-2020",
    tag: "Regulatory",
  },
  {
    id: "CEA-SAFE-2010",
    authority: "CEA Technical",
    num: "CEA Notification 12/2010",
    title: "Central Electricity Authority (Measures Relating to Safety and Electric Supply)",
    date: "20-Sep-2010",
    tag: "Safety",
  },
  {
    id: "CMD-DOP-2023",
    authority: "WBSEDCL Establishment",
    num: "Office Order CMD/42/2023",
    title: "Delegation of Financial Powers (DOP) for Substation O&M and Emergency Works",
    date: "11-Jan-2023",
    tag: "Establishment",
  },
  {
    id: "TAR-2024-25",
    authority: "WBERC Tariff",
    num: "Tariff Order Case TP-98/22-23",
    title: "Multi-Year Tariff Schedule, Low Power Factor Surcharge and TOD Rates",
    date: "04-Jul-2024",
    tag: "Commercial",
  },
];

const PLANS = [
  {
    id: "free",
    name: "Free Trial",
    price: "₹0",
    period: "30-Day Evaluation",
    limit: "10 queries / day",
    highlight: false,
    badge: "Evaluation",
    features: [
      "10 statutory queries daily",
      "Full search of 4,200+ indexed circulars",
      "Exact clause citations & PDF page references",
      "WBSEDCL, WBERC & CEA standards",
      "Side-by-side original PDF verification",
    ],
  },
  {
    id: "basic",
    name: "Basic+",
    price: "₹100",
    period: "Perpetual Access",
    limit: "10 queries / day",
    highlight: false,
    badge: "No Expiry",
    features: [
      "10 queries daily with no time expiration",
      "Full regulatory & tariff database access",
      "Complete document vault search access",
      "Priority query indexing",
      "Standard processing speed",
    ],
  },
  {
    id: "advance",
    name: "Advance",
    price: "₹200",
    period: "Perpetual Access",
    limit: "50 queries / day",
    highlight: true,
    badge: "Most Popular for Engineers",
    features: [
      "50 queries daily bandwidth",
      "Comprehensive multi-source statutory synthesis",
      "Cross-subsidy & tariff formula calculations",
      "Instant PDF viewer side-by-side verification",
      "High-priority server compute priority",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹300",
    period: "Perpetual Access",
    limit: "150 queries / day",
    highlight: false,
    badge: "Legal & Divisional Teams",
    features: [
      "150 queries daily bandwidth",
      "Highest-depth statutory intelligence",
      "Full export & citation sharing capabilities",
      "Direct document vault contribution",
      "Dedicated server compute allocation",
    ],
  },
];

export default function LandingPage({
  onGetStarted,
  buttonLabel = "Launch Intelligence Console",
  isLoggedIn = false,
}: LandingPageProps) {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);

  const activeCase = OPERATIONAL_CASES[activeCaseIndex];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0d0d0d] font-sans selection:bg-[#0d0d0d] selection:text-white">
      {/* ── Top Masthead / Institutional Bar ── */}
      <div className="bg-[#0f172a] text-slate-300 text-[11px] font-medium py-1.5 px-4 text-center border-b border-slate-800 tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline">
            POWER DISTRIBUTION & REGULATORY REPOSITORY // WEST BENGAL & CEA JURISDICTION
          </span>
          <span className="sm:hidden font-mono text-[10px]">GRIDMIND // UTILITY REPOSITORY</span>
          <div className="flex items-center gap-4 text-[10px] uppercase font-mono tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              4,200+ Operative Circulars Live
            </span>
            <span className="text-slate-500">|</span>
            <Link href="/explorer" className="hover:text-white underline underline-offset-2">
              Browse Vault →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0d0d0d] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                GridMind <span className="text-blue-600 font-extrabold">AI</span>
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] text-slate-400 font-mono border-l border-slate-200 pl-2">
                Power Utility Intelligence
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#operational-cases" className="hover:text-slate-950 transition-colors">
              Field Case Studies
            </a>
            <a href="#why-gridmind" className="hover:text-slate-950 transition-colors">
              Why Generic AI Fails
            </a>
            <a href="#regulatory-corpus" className="hover:text-slate-950 transition-colors">
              Corpus Coverage
            </a>
            <a href="#pricing" className="hover:text-slate-950 transition-colors">
              Pricing & Tiers
            </a>
            <Link href="/explorer" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <span>Circular Directory</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/explorer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search Vault</span>
            </Link>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-lg bg-[#0d0d0d] hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95"
            >
              {isLoggedIn ? "Open Console" : "Sign In / Register"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Editorial, High-Trust, Power Sector Identity) ── */}
      <section className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Authentic Utility Value */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono w-fit">
              <span>STATUTORY COMPLIANCE // DISTRIBUTION & COMMERCIAL O&M</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
              Exact statutory clauses for power utility decisions. Verified by official circulars.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Distribution engineers, commercial managers, and billing officers waste hours hunting through unsearchable circulars, court rulings, and tariff orders. GridMind AI indexes over <strong className="text-slate-900 font-semibold">4,200+ operative WBSEDCL circulars, WBERC orders, and CEA safety regulations</strong>—returning exact clause numbers, prescribed timeframes, and direct PDF citations in seconds.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onGetStarted}
                className="px-6 py-3.5 rounded-xl bg-[#0d0d0d] hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2.5 transition-all shadow-md active:scale-95"
              >
                <span>{buttonLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/explorer"
                className="px-5 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <FolderOpen className="w-4 h-4 text-slate-500" />
                <span>Browse Circular Index</span>
              </Link>
            </div>

            {/* Credibility Stats */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-mono">4,200+</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Indexed Circulars & SOPs</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-mono">100%</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Verifiable Gazette Citations</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-mono">0.0%</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Hallucination Guardrails</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Case Study Terminal */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-300/90 shadow-xl overflow-hidden">
              {/* Terminal Window Header */}
              <div className="px-4 py-3 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono text-slate-300">FIELD OPERATIONAL DOCKET</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  VERIFIED CITATION
                </span>
              </div>

              {/* Case Selector Tabs */}
              <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-1 overflow-x-auto scrollbar-none">
                {OPERATIONAL_CASES.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCaseIndex(idx)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      activeCaseIndex === idx
                        ? "bg-white text-slate-950 shadow-sm font-semibold border border-slate-300"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {item.category}
                  </button>
                ))}
              </div>

              {/* Case Body */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-mono uppercase tracking-wider text-blue-700 font-bold">
                      {activeCase.category}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">{activeCase.verifiedDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-950 leading-snug">
                    {activeCase.title}
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Field Operational Question
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    "{activeCase.q}"
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    Statutory Determination & Clause Wording
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-normal">
                    {activeCase.determination}
                  </p>
                </div>

                {/* Citation Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{activeCase.citation}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    {activeCase.docket}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Why Generic AI Fails in Power Distribution ── */}
      <section id="why-gridmind" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>CRITICAL REGULATORY RISK</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Why general AI models are dangerous for power utilities
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Public LLMs (ChatGPT, Gemini, Copilot) are trained on generic web crawls. In power engineering and commercial billing, they hallucinate repealed acts, mix up central vs state regulations, and invent fake clause numbers that create severe legal and financial liabilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Generic AI Box */}
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-4">
                <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs">✕</span>
                <span>Generic AI (ChatGPT, Copilot, Gemini)</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Hallucinates statutory clauses:</strong> Generates plausible-sounding but fictitious section numbers and assessment equations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Quotes repealed or incorrect rules:</strong> Frequently cites the repealed Electricity Act 1910 or central guidelines that do not apply in West Bengal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>Blind to internal utility circulars:</strong> Has zero indexing of internal WBSEDCL office orders, delegation of power (DOP), or ROPA pay directives.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span><strong>No source PDF audit trail:</strong> Cannot show the signed scanned circular or gazette notification to verify in court or CGRF hearings.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-rose-200/60 text-[11px] text-rose-800 font-medium">
              Result: Legal liability, assessment invalidation, and audit objections.
            </div>
          </div>

          {/* GridMind AI Box */}
          <div className="p-6 rounded-2xl border-2 border-slate-900 bg-white shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-950 font-bold text-sm mb-4">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">✓</span>
                <span>GridMind AI Regulatory Architecture</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>100% Grounded in official documents:</strong> Answers are synthesized exclusively from indexed signed circulars, gazettes, and tariff orders.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>West Bengal jurisdiction strictness:</strong> Operates strictly under Electricity Act 2003, WBERC regulations, and WBSEDCL operative circulars.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>Complete internal circular vault:</strong> Indexes procedural circulars, commercial manuals, DOP thresholds, and ROPA 2020 matrices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>Side-by-side original PDF verification:</strong> Every citation links directly to the scanned operative PDF page in an integrated split-screen viewer.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-900 font-semibold flex items-center justify-between">
              <span>Result: Statutory certainty, defensible assessments, and faster decisions.</span>
              <span className="text-blue-600 font-mono">100% Audit Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Full Regulatory Corpus Breakdown ── */}
      <section id="regulatory-corpus" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono mb-3">
            <span>REPOSITORY TAXONOMY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Comprehensive Regulatory Scope
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Organized across the four core pillars of Indian electrical distribution operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">Distribution O&M & CEA Standards</h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• Overhead clearance rules (Reg. 61)</li>
              <li>• DTR failure & replacement SOP</li>
              <li>• Feeder loading & tail-end voltage</li>
              <li>• Earthing resistance field standards</li>
              <li>• Substation safety & pre-charging checks</li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">Vigilance & Section 135 Theft</h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• Section 135 extraction procedure</li>
              <li>• Section 126 provisional assessments</li>
              <li>• Compounding charges under §152</li>
              <li>• Direct disconnection protocols</li>
              <li>• Evidence & inspection reporting SOP</li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Gauge className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">WBERC Tariff & Billing Orders</h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• Multi-Year Tariff schedules 2022-25</li>
              <li>• Delayed Payment Surcharge (DPS)</li>
              <li>• Low Power Factor Surcharge rates</li>
              <li>• Connected load & contract demand</li>
              <li>• Security deposit calculation formula</li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">Establishment, DOP & ROPA</h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• Delegation of Financial Power (DOP)</li>
              <li>• ROPA 2020 Pay Matrix fixation</li>
              <li>• 16-Year & Higher Scale eligibility</li>
              <li>• Promotion benchmark & ACR criteria</li>
              <li>• Medical reimbursement & leave rules</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Section: Document Repository Docket Preview ── */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono mb-2">
              <span>LIVE REPOSITORY INDEX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Sample Circular Vault Dockets
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Direct access to scanned official circulars and gazette notifications.
            </p>
          </div>
          <Link
            href="/explorer"
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Explore All 4,200+ Documents in Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {SAMPLE_DOCKETS.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:px-6 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-900">{doc.num}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {doc.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-xl mt-0.5 font-medium">
                      {doc.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
                  <span>{doc.date}</span>
                  <Link
                    href={`/explorer?q=${encodeURIComponent(doc.num)}`}
                    className="px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold font-sans transition-colors"
                  >
                    View Docket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section: Pricing & Tiers ── */}
      <section id="pricing" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono mb-3">
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Simple, Perpetual Access Plans
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Start with our 30-day free evaluation. Upgrade seamlessly via UPI or cards with zero recurring lock-ins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
                plan.highlight
                  ? "border-2 border-slate-900 bg-slate-950 text-white shadow-xl relative"
                  : "border border-slate-200 bg-white text-slate-900 shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-base font-bold ${plan.highlight ? "text-white" : "text-slate-950"}`}>
                    {plan.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      plan.highlight ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-extrabold tracking-tight font-mono">{plan.price}</span>
                  <span
                    className={`text-xs ml-1.5 font-medium ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}
                  >
                    / {plan.period}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-lg mb-6 text-xs font-semibold ${
                    plan.highlight
                      ? "bg-white/10 text-slate-200"
                      : "bg-slate-50 text-slate-700 border border-slate-200/60"
                  }`}
                >
                  {plan.limit}
                </div>

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          plan.highlight ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                      <span className={plan.highlight ? "text-slate-300" : "text-slate-600"}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onGetStarted}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  plan.highlight
                    ? "bg-white text-slate-950 hover:bg-slate-100 shadow-md"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Call to Action ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#0f172a] text-white text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Stop guessing statutory rules. Start deciding with certainty.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Join engineers, divisional officers, and commercial practitioners across West Bengal electrical distribution networks.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl"
          >
            Launch Free Evaluation Console
          </button>
        </div>
      </section>

      {/* ── High-Trust Footer ── */}
      <footer className="py-12 px-4 sm:px-6 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#0d0d0d] text-white flex items-center justify-center font-bold text-xs">
              <BrainCircuit className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">GridMind AI</span>
            <span>— Indian Power Sector Regulatory Repository</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/explorer" className="hover:text-slate-900 transition-colors">
              Directory Explorer
            </Link>
            <a
              href="mailto:gridmind.info@gmail.com"
              className="hover:text-slate-900 transition-colors"
            >
              Contact Support
            </a>
          </div>

          <div>
            <span>© 2026 GridMind AI. All official gazettes and circulars remain copyright of their respective issuing authorities.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
