"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Loader2,
  FileText,
  Sparkles,
  BrainCircuit,
  ChevronDown,
  Wand2,
  Copy,
  Check,
  Share2,
  Cpu,
  Settings,
  Menu,
  ArrowUp,
  Zap,
  X,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import LoginPage from "@/components/LoginPage";
import Sidebar from "@/components/Sidebar";
import { getSupabase } from "@/lib/supabase";
import PricingModal from "@/components/PricingModal";

interface Source {
  doc_id: string;
  ref: string;
  date: string;
  title: string;
  source_url: string;
}

interface QueryResult {
  answer: string;
  sources: Source[];
  model_used: string;
  elapsed_ms: number;
  rewritten_query: string | null;
}

interface UsageData {
  dailyCount: number;
  dailyLimit: number;
  monthlyCount: number;
  monthlyLimit: number;
  tierName: string;
}

const EXAMPLE_QUERIES = [
  "What are the grid connectivity standards for renewable integration?",
  "Tell me about power theft prevention and monitoring guidelines",
  "What is the standard procedure for grid stability management?",
  "What are the procurement policies for public utility projects?",
  "Explain the career progression protocols in the energy sector",
  "What are the regulatory requirements for high-tension claims?",
];

const MOBILE_EXAMPLE_QUERIES = [
  "Renewable grid standards?",
  "Power theft guidelines?",
  "Grid stability procedures?",
  "Public utility procurement?",
  "High-tension claim regs?",
];

const FEATURED_QUESTIONS = [
  {
    id: "solar",
    text: "What are the latest Rooftop Solar regulations for prosumers in WB?",
    mobileText: "Latest WB Rooftop Solar regs?",
    icon: Sparkles
  },
  {
    id: "industrial",
    text: "Explain the eligibility criteria for high-tension industrial connections.",
    mobileText: "Industrial connection criteria?",
    icon: Zap
  },
  {
    id: "stability",
    text: "What are the standard protocols for grid stability during peak load?",
    mobileText: "Peak load grid protocols?",
    icon: BrainCircuit
  }
];



const LOADING_STEPS = [
  "Initializing Neural Mapping...",
  "Scanning Tier 1 Grid Regulations...",
  "Analyzing Operational Frameworks...",
  "Synthesizing Strategic Response...",
  "Verifying Institutional Alignment...",
];

function ScanningPulse() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-10"
    >
      <div className="relative w-32 h-32">
        {/* Pulsing rings */}
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 border-2 border-indigo-500/40 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
          className="absolute inset-0 border-2 border-blue-400/30 rounded-full"
        />

        {/* Core brain icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-full border border-slate-700 shadow-sm">
          <BrainCircuit className="w-12 h-12 text-indigo-400" />
        </div>

        {/* Scanning line */}
        <motion.div
          animate={{ top: ["5%", "95%", "5%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent z-10 opacity-70 blur-sm"
        />
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-bold text-indigo-300 tracking-[0.3em] uppercase leading-relaxed max-w-xs"
          >
            {LOADING_STEPS[step]}
          </motion.p>
        </AnimatePresence>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-500/60"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user, session, loading: authLoading, signOut } = useAuth();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [verbosity, setVerbosity] = useState(3);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [userTier, setUserTier] = useState<string>("free");
  const [history, setHistory] = useState<
    { question: string; result: QueryResult }[]
  >([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const refreshUsage = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/user/usage", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
        setUserTier(data.tierId || "free");
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!user || !session) return;
    refreshUsage();
  }, [user, session, refreshUsage]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as Window & { Razorpay?: unknown }).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  const handleSelectPlan = async (tierId: string, promoCode?: string) => {
    if (!user) {
      setError("Please sign in to upgrade your strategy bandwidth.");
      return;
    }

    // Free tier stays instant
    if (tierId === "free") {
      const { error } = await getSupabase()
        .from("profiles")
        .update({ tier_id: tierId })
        .eq("id", user.id);

      if (error) setError(`Failed to switch to free: ${error.message}`);
      else setUserTier(tierId);
      setIsPricingOpen(false);
      return;
    }

    // Paid tiers go through Razorpay
    try {
      setLoading(true);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Check your internet connection.");
      }

      // Step 1: Create Order
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, promoCode }),
      });

      const orderData = await res.json();
      if (orderData.error) throw new Error(orderData.error);

      // Step 2: Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GridMind AI",
        description: `Upgrade to ${tierId} strategy`,
        order_id: orderData.id,
        handler: async (response: RazorpayResponse) => {
          try {
            // Step 3: Verify Payment
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                tierId,
                userId: user.id
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setUserTier(tierId);
              setIsPricingOpen(false);
            } else {
              setError(verifyData.error || "Payment verification failed.");
            }
          } catch (err: unknown) {
            setError(`Verification service unavailable: ${err instanceof Error ? err.message : "Internal Error"}`);
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      // @ts-expect-error - Razorpay is loaded dynamically via script tag
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (e: unknown) {
      setError(`Payment initialization failed: ${e instanceof Error ? e.message : "Internal Error"}`);
    } finally {
      setLoading(false);
    }
  };


  // Dynamic Placeholder Effect
  const [placeholder, setPlaceholder] = useState("");
  const [queryIndex, setQueryIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const queries = isMobile ? MOBILE_EXAMPLE_QUERIES : EXAMPLE_QUERIES;
    const currentQuery = queries[queryIndex] || queries[0];
    const typingSpeed = isDeleting ? 40 : 80;
    const pauseDuration = 2000;

    const handleTyping = () => {
      if (!isDeleting && charIndex < currentQuery.length) {
        setPlaceholder(currentQuery.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(currentQuery.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      } else if (!isDeleting && charIndex === currentQuery.length) {
        setTimeout(() => setIsDeleting(true), pauseDuration);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setQueryIndex((prev) => (prev + 1) % queries.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, queryIndex, isMobile]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("gridmind_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse saved history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("gridmind_history", JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">Initializing Core...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return <LoginPage />;
  }

  const handleSubmit = async (q?: string) => {
    const question = (q || query).trim();
    if (!question || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question, verbosity, model: selectedModel }),
      });

      if (res.status === 401) {
        setError("Inactivity Timeout. Re-authentication required.");
        await signOut();
        return;
      }

      if (!res.ok) {
        let detail = `Strategic node error: ${res.status}`;
        try {
          const errData = await res.json();
          detail = errData.detail || detail;
        } catch { }
        throw new Error(detail);
      }

      const data: QueryResult = await res.json();
      setResult(data);
      refreshUsage(); // Update usage counts after success
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.question !== question);
        return [{ question, result: data }, ...filtered].slice(0, 50); // Keep max 50 items
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Operational failure encountered.";
      setError(msg);

      const isLimitError = (m: string) => {
        const lower = m.toLowerCase();
        return lower.includes("limit") ||
          lower.includes("reached") ||
          lower.includes("lockout") ||
          lower.includes("cooling") ||
          lower.includes("bandwidth");
      };

      // If result was null (initial state), and we got a limit error, 
      // stay in empty state but show the graceful alert
      if (!result && isLimitError(msg)) {
        // We keep result as null, which keeps us in empty state
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userEmail={user?.email || ""}
        onSignOut={signOut}
        history={history}
        onHistoryClick={handleSubmit}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userTier={userTier}
        onUpgradeClick={() => setIsPricingOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        usage={usage}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentTier={userTier}
        onSelectPlan={handleSelectPlan}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col min-w-0 relative bg-slate-950 overflow-y-auto scroll-smooth"
      >
        {/* Ambient background effects (Simplified) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px]" />
        </div>

        {/* Top Header / Bar */}
        <header
          className="relative z-50 bg-slate-900 border-b border-slate-800 sticky top-0 px-6 py-3 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {(sidebarCollapsed || typeof window === 'undefined') && (
                <button
                  onClick={() => {
                    if (window.innerWidth >= 768) {
                      setSidebarCollapsed(false);
                    } else {
                      setSidebarOpen(true);
                    }
                  }}
                  className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  aria-label="Show sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-none absolute left-1/2 -translate-x-1/2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xs font-bold text-white tracking-widest uppercase hidden sm:block">
              GridMind <span className="text-indigo-400">Tactical</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {userTier !== 'pro' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPricingOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Sparkles className="w-3 h-3" />
                Get Pro
              </motion.button>
            )}
            <SettingsMenu
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              verbosity={verbosity}
              setVerbosity={setVerbosity}
            />
          </div>
        </header>

        {/* ── EMPTY STATE: Centered Input ── */}
        <AnimatePresence>
          {!result && !loading && (
            <motion.div
              key="centered-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex-1 flex flex-col items-center justify-center px-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center mb-10"
              >
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-3">
                  What can I help with?
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Power sector regulations, operational frameworks, and institutional knowledge — instantly.
                </p>
              </motion.div>


              {/* Graceful Limit Alert */}
              <AnimatePresence>
                {(() => {
                  if (!error) return null;
                  const lowerErr = error.toLowerCase();
                  const isLimit = lowerErr.includes("limit") ||
                    lowerErr.includes("reached") ||
                    lowerErr.includes("lockout") ||
                    lowerErr.includes("cooling") ||
                    lowerErr.includes("bandwidth");

                  if (!isLimit) return null;

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-2xl mb-8 p-6 glass-panel border-indigo-500/30 bg-indigo-500/5 shadow-xl shadow-indigo-500/5 flex flex-col sm:flex-row items-center gap-6 rounded-3xl"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 overflow-hidden">
                        <LottieCDNWrapper src="/unlock.lottie" className="w-full h-full transform scale-125" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1.5 flex items-center justify-center sm:justify-start gap-2">
                          Limit reached!
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Quota reached. Upgrade for expanded strategic insights and zero cooling periods.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsPricingOpen(true)}
                        className="shrink-0 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                      >
                        Upgrade
                      </button>
                      <button
                        onClick={() => setError("")}
                        className="absolute top-4 right-4 text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              <div className="w-full max-w-2xl">
                <div className="relative group mb-8">
                  <div className="relative flex items-end gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 focus-within:border-indigo-500/50 transition-all duration-200">
                    <textarea
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder || "Ask GridMind Tactical..."}
                      rows={1}
                      className="flex-1 bg-transparent text-[15px] text-white placeholder:text-slate-600 outline-none resize-none leading-relaxed pb-1.5"
                      style={{ minHeight: "24px", maxHeight: "200px" }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "24px";
                        target.style.height = target.scrollHeight + "px";
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSubmit()}
                      disabled={loading || !query.trim()}
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Featured Questions Grid */}
                <div className="flex flex-wrap justify-center gap-3">
                  {FEATURED_QUESTIONS.map((q, idx) => {
                    const Icon = q.icon;
                    return (
                      <motion.button
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        onClick={() => {
                          const text = isMobile ? (q.mobileText || q.text) : q.text;
                          setQuery(text);
                          handleSubmit(text);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all text-left max-w-[280px] group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                          <Icon className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-300 leading-tight group-hover:text-white transition-colors">
                          {isMobile ? (q.mobileText || q.text) : q.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTIVE STATE: Loading + Results + Bottom Input ── */}
        <AnimatePresence>
          {(loading || result) && (
            <motion.div
              key="active-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col"
            >
              {/* Scrollable Results Area */}
              <div className="flex-1 w-full max-w-4xl mx-auto px-8 pt-6">
                {/* Loading Animation */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-32"
                    >
                      <ScanningPulse />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Section */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-sm flex items-start gap-3"
                    >
                      <Sparkles className="w-5 h-5 shrink-0 rotate-180" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Strategic Results View */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8 pb-48"
                    >
                      {/* User Query Bubble */}
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-5 py-3 rounded-2xl rounded-br-md bg-indigo-600/20 border border-indigo-500/20 text-sm text-indigo-200">
                          {history.length > 0 ? history[history.length - 1].question : query}
                        </div>
                      </div>

                      {/* AI Response */}
                      <div ref={resultsRef} className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40">
                        {/* Result Header */}
                        <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">GridMind</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {(result.elapsed_ms / 1000).toFixed(1)}s
                          </span>
                        </div>

                        {/* Answer Content Area with Typing Animation */}
                        <div className="px-8 py-8">
                          <div className="markdown-content text-[15px] text-slate-200 leading-[1.7] font-normal">
                            <TypingMarkdown text={result.answer} speed={8} />
                          </div>
                        </div>

                        {/* Share bar node */}
                        <ShareBar result={result} query={query} />

                        {/* Structured Sources Section */}
                        {result.sources.length > 0 && (
                          <SourcesSection sources={result.sources} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Input Bar */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 20, stiffness: 200 }}
                className="sticky bottom-0 left-0 right-0 z-40 px-8 pb-8 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent pt-10"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-transparent rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-xl" />
                    <div className="relative flex items-end gap-3 glass-panel border-white/10 rounded-[1.8rem] px-5 py-4 group-focus-within:border-indigo-500/40 group-focus-within:bg-slate-900/90 transition-all duration-300">
                      <textarea
                        ref={!result && !loading ? undefined : inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a follow-up..."
                        rows={1}
                        className="flex-1 bg-transparent text-[15px] text-white placeholder:text-slate-600 outline-none resize-none leading-relaxed pb-1.5"
                        style={{ minHeight: "24px", maxHeight: "200px" }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "24px";
                          target.style.height = target.scrollHeight + "px";
                        }}
                      />
                      <AnimatePresence mode="wait">
                        <motion.button
                          key={loading ? "loading" : "idle"}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={() => handleSubmit()}
                          disabled={loading || !query.trim()}
                          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-[0.9] disabled:cursor-not-allowed ${loading
                            ? "bg-indigo-600/20 text-indigo-400"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                            }`}
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowUp className="w-5 h-5" />
                          )}
                        </motion.button>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
          }
        </AnimatePresence >

        <p className="pb-3 text-center text-[10px] text-slate-600 font-medium select-none">
          GridMind AI can make mistakes. Verify strategic information.
        </p>
      </div >

    </div >
  );
}

function LottieCDNWrapper({ src, className }: { src: string; className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Add the lottie player script if not present
    if (!document.getElementById("dotlottie-player-script")) {
      const script = document.createElement("script");
      script.id = "dotlottie-player-script";
      script.src = "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
      script.type = "module";
      document.head.appendChild(script);
    }
  }, []);

  if (!mounted) return null;

  // Use a type-neutral tag to bypass JSX type checking for custom elements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PlayerTag = 'dotlottie-player' as any;

  return (
    <div className={className}>
      <PlayerTag
        src={src}
        background="transparent"
        speed="1"
        style={{ width: "100%", height: "100%" }}
        direction="1"
        playMode="normal"
        loop
        autoplay
      />
    </div>
  );
}


function TypingMarkdown({ text, speed = 8 }: { text: string; speed?: number }) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedLength(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (displayedLength >= text.length) {
      setIsComplete(true);
      return;
    }
    const timer = setTimeout(() => {
      setDisplayedLength((prev) => Math.min(prev + speed, text.length));
    }, 16); // ~60fps
    return () => clearTimeout(timer);
  }, [displayedLength, text, speed]);

  if (isComplete) {
    return <ReactMarkdown>{text}</ReactMarkdown>;
  }

  return (
    <div>
      <ReactMarkdown>{text.slice(0, displayedLength)}</ReactMarkdown>
      <span className="inline-block w-0.5 h-5 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
    </div>
  );
}

function ShareBar({ result, query }: { result: QueryResult; query: string }) {
  const [copied, setCopied] = useState(false);

  const buildShareText = () => {
    let text = `Tactical Query: ${query}\n\nStrategic Synthesis:\n${result.answer}`;
    if (result.sources.length > 0) {
      text += "\n\nPolicy References:";
      for (const s of result.sources) {
        text += `\n- [${s.ref}] ${s.title} (${s.date})`;
      }
    }
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "GridMind AI Strategy", text });
      } catch { }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="px-8 py-4 border-t border-white/5 flex items-center gap-3 bg-white/[0.01]">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 border border-transparent transition-all duration-200"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 uppercase tracking-widest">Synthesis Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest">Copy Intelligence</span>
          </>
        )}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent transition-all duration-200"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="uppercase tracking-widest">Distribute</span>
      </button>
    </div>
  );
}

const MODEL_OPTIONS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google DeepMind" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Meta/Groq" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Meta/Groq" },
  { value: "moonshotai/kimi-k2-instruct", label: "Kimi K2 Instruct", provider: "Moonshot" },
  { value: "qwen/qwen3-32b", label: "Qwen3 32B", provider: "Ali/Groq" },
];

function ModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = MODEL_OPTIONS.find((m) => m.value === value) || MODEL_OPTIONS[0];

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:border-slate-500 transition-all duration-200 shadow-sm"
      >
        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{current.label}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-y-auto max-h-80 z-50 p-1.5"
          >
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  onChange(m.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${m.value === value ? "bg-indigo-600/10" : "hover:bg-slate-800"
                  }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-xs font-bold leading-none ${m.value === value ? "text-indigo-400" : "text-slate-300"}`}
                  >
                    {m.label}
                  </span>
                  <span className="text-[9px] text-slate-600 uppercase font-black tracking-tighter">{m.provider}</span>
                </div>
                {m.value === value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

function VerbositySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex-1 shadow-sm">
      <div className="flex items-center gap-2.5 shrink-0">
        <Cpu className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] w-20">
          Synthesist Level: <span className="text-slate-300">{VERBOSITY_LABELS[value - 1]}</span>
        </span>
      </div>
      <div className="relative flex-1 flex items-center h-6 group">
        <div className="absolute inset-x-0 h-1 rounded-full bg-slate-800" />
        <div
          className="absolute left-0 h-1 rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${((value - 1) / 4) * 100}%` }}
        />
        <div className="absolute inset-x-0 flex justify-between px-0.5">
          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => onChange(step)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 border-2 ${step <= value
                ? "bg-indigo-500 border-indigo-400 shadow-sm shadow-indigo-500/20"
                : "bg-slate-800 border-slate-700 hover:border-slate-500"
                }`}
            />
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

const VERBOSITY_LABELS = ["Tactical", "Concise", "Strategic", "Comprehensive", "Deep Context"];

function SourcesSection({ sources }: { sources: Source[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sources : sources.slice(0, 5);

  return (
    <div className="border-t border-slate-800 px-8 py-5 space-y-1 bg-slate-900/50">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-3 h-3 text-indigo-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Sources · {sources.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {visible.map((source, i) => (
          <div
            key={source.doc_id}
            className="flex items-center gap-3 group"
          >
            {/* PDF icon – clickable link */}
            {source.source_url ? (
              <a
                href={source.source_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open document"
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                <FileText className="w-3 h-3 text-indigo-400" />
              </a>
            ) : (
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-slate-800 border border-slate-700">
                <FileText className="w-3 h-3 text-slate-600" />
              </span>
            )}

            {/* Label */}
            <span className="text-[10px] font-black text-indigo-500/70 uppercase tracking-tight shrink-0">
              [{source.ref || `SRC-${i + 1}`}]
            </span>
            <span className="text-[11px] text-slate-400 truncate leading-tight">
              {source.title}
            </span>
            {source.date && (
              <span className="text-[9px] text-slate-600 shrink-0 font-medium">{source.date}</span>
            )}
          </div>
        ))}
      </div>

      {sources.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[10px] font-bold text-indigo-400/60 hover:text-indigo-400 uppercase tracking-widest transition-colors"
        >
          {expanded ? "Show less ↑" : `+${sources.length - 5} more ↓`}
        </button>
      )}
    </div>
  );
}

function SettingsMenu({
  selectedModel,
  setSelectedModel,
  verbosity,
  setVerbosity,
}: {
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  verbosity: number;
  setVerbosity: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Intelligence Config"
        className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${open
          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          : "bg-slate-900/50 border-white/5 text-slate-400 hover:border-indigo-500/30 hover:text-indigo-400"
          }`}
      >
        <Settings className={`w-3.5 h-3.5 ${open ? "animate-[spin_4s_linear_infinite]" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute top-full right-0 mt-3 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-visible"
            >
              <div className="p-5 space-y-6 bg-slate-900">
                <div>
                  <div className="flex items-center gap-2 mb-3 px-1 text-slate-500">
                    <Cpu className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Model Architecture</span>
                  </div>
                  <ModelSelector value={selectedModel} onChange={setSelectedModel} />
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3 px-1 text-slate-500">
                    <Wand2 className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Synthesis Verbosity</span>
                  </div>
                  <VerbositySlider value={verbosity} onChange={setVerbosity} />
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
