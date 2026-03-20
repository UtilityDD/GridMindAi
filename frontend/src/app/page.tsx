"use client";

import { useState, useRef, useEffect, useCallback, useMemo, MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  FileText,
  Sparkles,
  BrainCircuit,
  Wand2,
  Copy,
  Check,
  Share2,
  Cpu,
  Menu,
  Lock,
  ArrowUp,
  Zap,
  Clock,
  X,
  AlertCircle,
  MessageSquare,
  Download,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import LoginPage from "@/components/LoginPage";
import Sidebar from "@/components/Sidebar";
import { getSupabase } from "@/lib/supabase";
import PricingModal from "@/components/PricingModal";
import DisclaimerModal from "@/components/DisclaimerModal";
import LiveStats from "@/components/LiveStats";
import LandingPage from "@/components/LandingPage";

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
  tierId: string;
  hasCustomLimit?: boolean;
  isTrialExpired?: boolean;
  daysUntilExpiry?: number;
}

const ALL_INTERESTING_QUERIES = [
  "IS 1180 (Part 1): Distribution transformer losses?",
  "IS 2026: Power transformer testing requirements?",
  "WBERC Billing Code: KVAh vs kWh billing?",
  "Late Payment Surcharge calculations (2024)?",
  "Smart Meter reading frequency protocols?",
  "Accuracy class for CT/PT in 33kV meters?",
  "WBERC SOP: Timeline for new 3-phase connection?",
  "ERC regulations on Rooftop Solar (Gross vs Net)?",
  "Section 135: Evidence required for tapping?",
  "Provisional assessment procedure for Section 126?",
  "Network Design: Voltage Drop limits for 11kV?",
  "11kV Feasibility: Fault level calculation norms?",
  "IS 732: Wiring and safety earthing standards?",
  "Security Deposit: 2 months vs 3 months rules?",
  "Procedure for meter bypass theft detection?",
  "HT connection: Transformation loss calculations?",
  "Network basic: Capacitor bank sizing rules?",
  "IS 3043: Code of practice for earthing?",
  "ERC norms for 'Standard Performance' penalties?",
  "Sag-tension limits for Dog conductor (33kV)?",
];

const MOBILE_EXAMPLE_QUERIES = [
  "IS 1180 Loss Norms?",
  "Smart Meter Reading?",
  "Act Section 135?",
  "11kV Design Limits?",
  "ERC Solar Rules?",
  "SOP Connection Time?",
];

const CLARIFICATION_MAP: Record<string, { title: string, options: string[] }> = {
  "tariff": {
    title: "Which Tariff Category?",
    options: ["Domestic", "Commercial", "Industrial", "Agricultural", "Public Water Works", "Street Light"]
  },
  "connection": {
    title: "Query regarding what type of Connection?",
    options: ["New Connection", "Load Enhancement", "Change of Name", "Category Conversion", "Disconnection", "Quotation/Load"]
  },
  "theft": {
    title: "Which type of Theft/Unauthorized use?",
    options: ["Section 135 (Direct)", "Section 126 (Unauthorized)", "Meter Tampering", "Hooking"]
  },
  "dop": {
    title: "Delegation of Power for?",
    options: ["Technical Sanction", "Administrative Approval", "Store Requisition", "Financial Powers"]
  },
  "meter": {
    title: "Meter related issue?",
    options: ["Defective Meter", "Burnt Meter", "Meter Testing", "Reading Dispute", "Smart Meter"]
  },
  "safety": {
    title: "Safety protocol for?",
    options: ["PPE Requirements", "Earthing Standards", "Shutdown Procedure", "Accident Reporting"]
  }
};

// Anti-scraping patterns — detect broad listing/browsing/bulk-requesting queries
const ANTI_SCRAPING_PATTERNS = [
  // "list/show/give/provide" + "all" + document type
  /\b(list|show|give|provide|send|share|download)\b.*\b(all|every|complete|full)\b.*\b(circular|order|regulation|document|notification|guideline)/i,
  /\b(all|every|complete|full)\b.*\b(circular|order|regulation|document|notification|guideline)/i,
  // "list of / index of / catalog"
  /\b(list of|index of|catalog|catalogue|directory)\b.*\b(circular|order|regulation|document)/i,
  /\bhow many (circular|order|regulation|document)/i,
  /\b(circular|order|regulation)\s*(list|index|number)/i,
  // BROAD: "provide/give/show/send + the/me + circulars/orders/regulations" (plural = browsing intent)
  /\b(provide|give|show|send|share|get)\b.*\b(the|me|us)?\s*(circulars|orders|regulations|documents|notifications|guidelines)\b/i,
  // "circulars/orders for/about/regarding/related/on <topic>" (requesting documents, not answers)
  /\b(circulars|office orders|orders|regulations)\s+(for|about|regarding|related|on|of)\b/i,
  // "related/relevant/applicable circulars/orders"
  /\b(related|relevant|applicable|available|existing|issued)\s+(circulars|orders|regulations|documents)\b/i,
];




function ThinkingIndicator() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center py-20 gap-4"
    >
      <div className="relative">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shadow-sm">
          <BrainCircuit className="w-6 h-6 text-blue-600" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-1 bg-blue-400/20 rounded-2xl blur-md -z-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Thinking
        </span>
        <div className="w-[1px] h-3 bg-slate-200" />
        <span className="text-xs font-mono font-bold text-blue-600/70">
          {seconds}s
        </span>
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
  const [userTier, setUserTier] = useState<string>("free");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [activeSource, setActiveSource] = useState<{ url: string; title: string } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [clarificationData, setClarificationData] = useState<{ keyword: string, title: string, options: string[], originalQuery: string } | null>(null);
  const [showLogin, setShowLogin] = useState(false);






  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [history, setHistory] = useState<
    { question: string; result: QueryResult }[]
  >([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);



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

  // Split-view panel width (percentage for main content)
  const [splitRatio, setSplitRatio] = useState(55);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleDragMove = (e: globalThis.MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setSplitRatio(Math.max(30, Math.min(70, pct)));
    };
    const handleDragEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);


  // Auto-load dashboard when user is authenticated
  useEffect(() => {
    if (user && session) {
      setShowDashboard(true);
    }
  }, [user, session]);

  // Auto-open pricing modal if trial expired
  useEffect(() => {
    if (usage?.isTrialExpired && userTier === "free") {
      setIsPricingOpen(true);
    }
  }, [usage?.isTrialExpired, userTier]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    const queries = isMobile ? MOBILE_EXAMPLE_QUERIES : ALL_INTERESTING_QUERIES;
    const currentQuery = queries[queryIndex] || queries[0];
    const typingSpeed = isDeleting ? 40 : 80;
    const pauseDuration = 3500; // Increased to give users time to read and click "Ask this"

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

  // Auto-focus input when result is cleared
  useEffect(() => {
    if (!result && !loading && showDashboard) {
      inputRef.current?.focus();
    }
  }, [result, loading, showDashboard]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600">Initializing Core...</p>
        </div>
      </div>
    );
  }

  if (!user || !session || !showDashboard) {
    if (showLogin && (!user || !session)) {
      return (
        <div className="relative">
          <LoginPage onBack={() => setShowLogin(false)} />
        </div>
      );
    }
    return (
      <LandingPage
        isLoggedIn={!!user && !!session}
        buttonLabel={user && session ? "Enter Mission Control" : "Get Started Now"}
        onGetStarted={() => {
          if (user && session) setShowDashboard(true);
          else setShowLogin(true);
        }}
      />
    );
  }

  const handleSubmit = async (q?: string, cachedResult?: QueryResult) => {
    const question = (q || query).trim();
    if (!question || loading) return;

    // Intermediate Clarification Step (Non-AI)
    if (!q) { // Only check if user is typing a new query, not clicking a history item
      const lowerQ = question.toLowerCase();
      for (const [key, data] of Object.entries(CLARIFICATION_MAP)) {
        // If the query IS just the keyword, or starts with it, or contains it as a whole word
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(lowerQ) && !lowerQ.includes(' ')) { // Only trigger if it's broad (single word)
          setClarificationData({ keyword: key, title: data.title, options: data.options, originalQuery: question });
          return;
        }
      }
    }

    // Anti-Scraping Guard (blocks broad listing/downloading queries before API call)
    if (!q) {
      const isScrapingAttempt = ANTI_SCRAPING_PATTERNS.some(pattern => pattern.test(question));
      if (isScrapingAttempt) {
        setError("This platform is designed for answering specific regulatory and operational questions. Please describe the particular issue, topic, or scenario you need guidance on \u2014 e.g., \"What is the procedure for Section 135 theft cases?\" rather than listing all documents.");
        setActiveQuestion(question);
        return;
      }
    }

    // If we have a cached result, restore it instantly and skip the fetch
    if (cachedResult) {
      setResult(cachedResult);
      setQuery(question);
      setActiveQuestion(question);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setActiveQuestion(question);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question, verbosity }),
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

  const handleNewInquiry = () => {
    setResult(null);
    setQuery("");
    setError("");
    setLoading(false);
    setActiveSource(null);
    // Explicitly focus the input after state clear
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <DisclaimerModal />
      <Sidebar
        userEmail={user?.email || ""}
        onSignOut={signOut}
        history={history}
        onHistoryClick={(q, res) => handleSubmit(q, res)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userTier={userTier}
        onUpgradeClick={() => setIsPricingOpen(true)}
        onNewInquiry={handleNewInquiry}
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

      {/* Main content + PDF split container */}
      <div ref={containerRef} className="flex-1 flex min-w-0 relative">
        {/* Left: AI Response Area */}
        <div
          ref={scrollContainerRef}
          className="flex flex-col min-w-0 relative bg-white overflow-y-auto scroll-smooth"
          style={{ width: activeSource ? `${splitRatio}%` : '100%', transition: activeSource ? 'none' : 'width 0.3s ease' }}
        >
        {/* Ambient background effects (Simplified) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/[0.02] rounded-full blur-[120px]" />
        </div>

        {/* Top Header / Bar */}
        <header
          className="relative z-50 bg-white border-b border-slate-200 sticky top-0 px-6 py-3 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
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
            <div className="hidden md:block ml-2 border-l border-white/5 pl-4 py-1">
              <LiveStats />
            </div>
          </div>
        </header>

        {/* ── MOBILE LIVE STATS BAR ── */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex justify-center sticky top-[61px] z-40 shadow-sm">
          <LiveStats />
        </div>

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
                <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-3">
                  What can I help with?
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 max-w-md mx-auto uppercase tracking-widest font-medium opacity-80">
                  Power Sector Intelligence — Instantly
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
                  
                  const isExpired = lowerErr.includes("expired") || lowerErr.includes("trial");

                  if (!isLimit && !isExpired) return null;

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`w-full max-w-2xl mb-8 p-6 glass-panel border-blue-300/30 shadow-xl shadow-blue-100/20 flex flex-col sm:flex-row items-center gap-6 rounded-3xl ${isExpired ? "bg-amber-50" : "bg-blue-50"}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-blue-300/50 overflow-hidden ${isExpired ? "bg-amber-100" : "bg-blue-100"}`}>
                        <LottieCDNWrapper src={isExpired ? "/lock.lottie" : "/unlock.lottie"} className="w-full h-full transform scale-125" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1.5 flex items-center justify-center sm:justify-start gap-2">
                          {isExpired ? "Trial Expired" : "Limit reached!"}
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isExpired ? "bg-amber-500" : "bg-blue-500"}`} />
                        </h3>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {error}
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
                <div className="relative group mb-6">
                  <div className="relative flex flex-col gap-0 bg-white border border-slate-300 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="relative w-full">
                      <textarea
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        className="w-full bg-transparent text-[14px] text-slate-900 outline-none resize-none leading-relaxed p-4 z-10 relative"
                        style={{ minHeight: "80px", maxHeight: "240px" }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "80px";
                          target.style.height = target.scrollHeight + "px";
                        }}
                      />
                      {/* Simulated Placeholder overlay */}
                      {!query && (
                        <div className="absolute inset-0 p-4 pointer-events-none flex flex-wrap items-start gap-2 z-20">
                          <span className="text-[14px] text-slate-500 leading-relaxed font-normal">
                            {placeholder || "Ask GridMind Tactical..."}
                          </span>
                          <AnimatePresence>
                            {!isDeleting && charIndex > 0 && charIndex === (isMobile ? MOBILE_EXAMPLE_QUERIES : ALL_INTERESTING_QUERIES)[queryIndex]?.length && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="pointer-events-auto inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all shadow-sm translate-y-[2px]"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const q = (isMobile ? MOBILE_EXAMPLE_QUERIES : ALL_INTERESTING_QUERIES)[queryIndex];
                                  if (q) {
                                    setQuery(q);
                                    inputRef.current?.focus();
                                    setTimeout(() => handleSubmit(q), 50);
                                  }
                                }}
                              >
                                Ask this <Sparkles className="w-3 h-3" />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      
                      {/* Top Right "Try Demo" Action */}
                      {!query && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute top-3 right-3 z-30"
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const q = ALL_INTERESTING_QUERIES[Math.floor(Math.random() * ALL_INTERESTING_QUERIES.length)];
                              setQuery(q);
                              inputRef.current?.focus();
                              setTimeout(() => handleSubmit(q), 50);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 backdrop-blur-sm border border-indigo-100/50 text-indigo-700/80 rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-indigo-700 hover:shadow-sm hover:border-indigo-200 hover:from-indigo-50 hover:to-blue-50 transition-all active:scale-95 group overflow-hidden relative"
                          >
                            <Wand2 className="w-3 h-3 text-indigo-500/80 group-hover:animate-pulse" />
                            <span>Try Demo</span>
                          </button>
                        </motion.div>
                      )}

                      {/* Local Clarification Overlay */}
                      <AnimatePresence>
                        {clarificationData && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center gap-4 rounded-xl border border-blue-200 shadow-xl"
                          >
                            <div className="flex flex-col gap-1">
                              <h4 className="text-[12px] font-black text-blue-900 uppercase tracking-widest">{clarificationData.title}</h4>
                              <p className="text-[10px] text-slate-500 font-medium italic">Please refine your question to save time and get a better answer.</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                              {clarificationData.options.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => {
                                    const refined = `${opt} ${clarificationData.originalQuery}`;
                                    setQuery(refined);
                                    setClarificationData(null);
                                    // Trigger submission with refined query
                                    setTimeout(() => handleSubmit(refined), 50);
                                  }}
                                  className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 shadow-sm"
                                >
                                  {opt}
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  // Skip clarification and go straight to AI
                                  const q = clarificationData.originalQuery;
                                  setClarificationData(null);
                                  setTimeout(() => handleSubmit(q), 50);
                                }}
                                className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition-all active:scale-95"
                              >
                                Skip & Ask Anyway
                              </button>
                            </div>
                            <button 
                              onClick={() => setClarificationData(null)}
                              className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-[10px]">
                      <span className="text-[11px] text-slate-500 font-medium"></span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSubmit()}
                        disabled={loading || !query.trim()}
                        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Response Length Slider moved here */}
                  <div className="mt-3 px-4">
                    <VerbositySlider
                      value={verbosity}
                      onChange={setVerbosity}
                      userTier={userTier}
                      onUpgradeClick={() => setIsPricingOpen(true)}
                    />
                  </div>
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
                      <ThinkingIndicator />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Common Error Display (Simple) */}
                <AnimatePresence>
                  {error && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-2xl bg-white border border-red-300 shadow-2xl flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                          <X className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-red-700 uppercase tracking-widest leading-tight">Query Failed</p>
                          <p className="text-xs text-slate-700 truncate">{error}</p>
                        </div>
                        <button
                          onClick={() => setError("")}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    </div>
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
                        <div className="max-w-[80%] px-5 py-3 rounded-2xl rounded-br-md bg-blue-100 border border-blue-300 text-sm text-blue-900">
                          {activeQuestion}
                        </div>
                      </div>

                      {/* AI Response */}
                      <div ref={resultsRef} className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/20">
                        {/* Result Header */}
                        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                              <BrainCircuit className="w-6 h-6 text-blue-600" />
                            </div>
                            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
                              GridMind <span className="text-blue-600">AI</span>
                            </h1>
                          </div>

                          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300">
                            <div className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition-colors group cursor-default">
                              <Cpu className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase tracking-[0.1em] max-w-0 group-hover:max-w-[200px] opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
                                {result.model_used}
                              </span>
                            </div>
                            <div className="w-[1px] h-2.5 bg-slate-300" />
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{(result.elapsed_ms / 1000).toFixed(1)}s</span>
                            </div>
                          </div>
                        </div>

                        {/* Answer Content Area with Typing Animation */}
                        <div className="px-8 py-8">
                          <div className="markdown-content text-[15px] text-slate-800 leading-[1.7] font-normal">
                            <TypingMarkdown 
                              text={result.answer} 
                              speed={2} 
                              sources={result.sources} 
                              onSourceClick={(url, title) => setActiveSource({ url, title })}
                            />
                          </div>
                        </div>

                        {/* Share bar node */}
                        <ShareBar result={result} query={query} />

                        {/* Structured Sources Section - Removed as per UI unification request */}
                        {/* {result.sources.length > 0 && (
                          <SourcesSection sources={result.sources} />
                        )} */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Removed Bottom Input Bar for cleaner look */}
            </motion.div>
          )
          }
        </AnimatePresence >

        <p className="pb-3 text-center text-[10px] text-slate-600 font-medium select-none">
          GridMind AI can make mistakes. Verify strategic information.
        </p>
        </div>

        {/* Right: Draggable Divider + PDF Panel */}
        {activeSource && (
          <>
            {/* Drag Handle */}
            <div
              onMouseDown={handleDragStart}
              className="w-[6px] bg-slate-200 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors relative group z-10"
              title="Drag to resize"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-slate-400 group-hover:bg-blue-500 transition-colors" />
            </div>

            {/* PDF Viewer Panel */}
            <div
              className="flex flex-col bg-white border-l border-slate-200 min-w-0 overflow-hidden"
              style={{ width: `${100 - splitRatio}%` }}
            >
              <InlinePdfViewer
                source={activeSource}
                onClose={() => setActiveSource(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
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


/**
 * Inline PDF Viewer — sits as a flex sibling of the main content
 */
function InlinePdfViewer({ 
  source, 
  onClose 
}: { 
  source: { url: string; title: string }; 
  onClose: () => void 
}) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const loadedRef = useRef(false);

  // Reset on URL change; only show error after 30s if still not loaded
  useEffect(() => {
    loadedRef.current = false;
    setIframeLoading(true);
    setIframeError(false);
    const timer = setTimeout(() => {
      if (!loadedRef.current) {
        setIframeLoading(false);
        setIframeError(true);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [source.url]);

  // Normalize URL for embedding
  const normalizedUrl = useMemo(() => {
    let url = source.url;
    if (!url) return "";
    
    // GitHub Blob → Raw (needed for Google Viewer to fetch the binary)
    if (url.includes('github.com') && url.includes('/blob/')) {
      url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    
    // Wrap in Google Viewer for all PDFs and Bitstreams
    const isLikelyPdf = url.toLowerCase().endsWith('.pdf') || 
                        url.includes('.pdf?') || 
                        url.includes('/bitstream/') ||
                        url.includes('raw.githubusercontent.com');

    if (isLikelyPdf) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  }, [source.url]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 truncate text-xs">
            {source.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={source.url}
            download
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-blue-600"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
            title="Close PDF"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 bg-slate-100 relative overflow-hidden">
        {iframeLoading && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-500">Loading Document...</p>
          </div>
        )}

        {iframeError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-full">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Can't embed this document</h4>
            <p className="text-xs text-slate-600 mb-6 max-w-xs">
              This provider restricts inline viewing.
            </p>
            <a 
              href={source.url} 
              download
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Download to View
            </a>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <iframe
              src={normalizedUrl}
              className="w-full h-full border-none"
              title="Source Document"
              onLoad={() => { loadedRef.current = true; setIframeLoading(false); }}
              onError={() => {
                setIframeLoading(false);
                setIframeError(true);
              }}
            />
            {/* Blind overlay to hide the Google Viewer's native pop-out button */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-transparent z-20 cursor-default" />
          </div>
        )}
      </div>
    </>
  );
}

function TypingMarkdown({ text = "", speed = 2, sources, onSourceClick }: { 
  text?: string; 
  speed?: number; 
  sources?: Source[];
  onSourceClick: (url: string, title: string) => void;
}) {
  const [displayedLength, setDisplayedLength] = useState(0);

  // Defensive check: ensure text is always a string
  const safeText = typeof text === 'string' ? text : "";

  useEffect(() => {
    setDisplayedLength(0);
  }, [safeText]);

  useEffect(() => {
    if (displayedLength >= safeText.length) return;

    const timer = setTimeout(() => {
      setDisplayedLength(prev => Math.min(prev + 1, safeText.length));
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedLength, safeText, speed]);

  const isComplete = displayedLength >= safeText.length;

  // Transform text to include clickable source links + universal PDF/Repo auto-linkifier
  const processedText = useMemo(() => {
    let newText = safeText;

    // 1. Handle explicit source citations [REF] or REF
    if (sources && sources.length > 0) {
      const sortedSources = [...sources].sort((a, b) => b.ref.length - a.ref.length);
      sortedSources.forEach(source => {
        if (!source.ref || !source.source_url) return;
        const escapedRef = source.ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\[${escapedRef}\\]`, 'g');
        newText = newText.replace(regex, `[${source.ref}](${source.source_url})`);
        const bareRegex = new RegExp(`(?<!\\[)${escapedRef}(?!\\]|\\()`, 'g');
        newText = newText.replace(bareRegex, `[${source.ref}](${source.source_url})`);
      });
    }

    // 2. Universal Auto-linkifier for PDFs, Bitstreams, and GridMind Repo
    // Regex catches bare URLs but avoids those already in [title](url) format
    // Also ignores trailing punctuation like periods or commas
    const universalRegex = /(?<!\()https?:\/\/[^\s)\]]+(?<![.,!?;:])/g;
    newText = newText.replace(universalRegex, (url) => {
      const isPdf = /\.pdf(\?|#|$)/i.test(url);
      const isBitstream = url.includes('/bitstream/');
      const isGitHubGridMind = url.includes('github.com/smartlinemanapp/GridMind') || 
                              url.includes('raw.githubusercontent.com/smartlinemanapp/GridMind');
      
      if (isPdf || isBitstream || isGitHubGridMind) {
        // Extract a clean title from the URL
        const parts = url.split('/');
        let filename = decodeURIComponent(parts[parts.length - 1])
          .split('?')[0]  // remove search
          .split('#')[0]  // remove hash
          .replace('.pdf', '');
        
        // Fallback for very short or empty filenames
        if (!filename || filename.length < 3) filename = "Source Document";

        // Keep original URL for better handling in viewer
        const finalUrl = url;

        return `[${filename}](${finalUrl})`;
      }
      return url;
    });

    // 3. Markdown Table Fixer — Structured Parser (handles LLM squashing entire tables into one line)
    const repairSquashedTables = (input: string): string => {
      const lines = input.split('\n');
      const result: string[] = [];

      for (const line of lines) {
        // Check if this line has a squashed table (separator + data pipes on same line)
        const hasSep = /\|\s*---\s*\|/.test(line);
        const pipeCount = (line.match(/\|/g) || []).length;

        if (hasSep && pipeCount > 6) {
          console.log('[GridMind Table Repair] DETECTED squashed table. Pipes:', pipeCount);
          // Find where the table starts (first |)
          const firstPipeIdx = line.indexOf('|');
          const beforeTable = firstPipeIdx > 0 ? line.substring(0, firstPipeIdx).trimEnd() : '';
          const tableStr = line.substring(firstPipeIdx);

          // Find where the table ends (last |) and any text after
          const lastPipeIdx = tableStr.lastIndexOf('|');
          const afterTable = tableStr.substring(lastPipeIdx + 1).trim();
          const pureTable = tableStr.substring(0, lastPipeIdx + 1);

          // Count columns from separator row
          const sepMatch = pureTable.match(/((?:\|\s*-{3,}\s*)+\|)/);
          if (!sepMatch) { result.push(line); continue; }
          const colCount = (sepMatch[0].match(/-{3,}/g) || []).length;

          // Split the pure table by | and remove leading/trailing empties
          const parts = pureTable.split('|');
          const cells = parts.slice(1, -1); // ["cell1", "cell2", ..., "", "---", ...]

          // Group into rows: colCount cells + 1 empty/whitespace separator between rows
          const rowSize = colCount + 1;
          const rows: string[] = [];
          for (let i = 0; i < cells.length; i += rowSize) {
            const rowCells = cells.slice(i, i + colCount);
            if (rowCells.length > 0) {
              rows.push('| ' + rowCells.map(c => c.trim()).join(' | ') + ' |');
            }
          }

          // Handle remainder (last row may not have a trailing separator)
          const remainder = cells.length % rowSize;
          if (remainder > 0 && remainder === colCount) {
            // Already handled by loop — the last slice picks up exactly colCount cells
          } else if (remainder > 0 && remainder < colCount) {
            // Partial last row (shouldn't happen with well-formed tables, but be safe)
            const lastCells = cells.slice(cells.length - remainder);
            rows.push('| ' + lastCells.map(c => c.trim()).join(' | ') + ' |');
          }

          // Reconstruct with proper newlines
          if (beforeTable) {
            result.push(beforeTable);
            result.push(''); // blank line before table
          }
          result.push(...rows);
          if (afterTable) {
            result.push('');
            result.push(afterTable);
          }
        } else {
          result.push(line);
        }
      }

      return result.join('\n');
    };

    return repairSquashedTables(newText);
  }, [safeText, sources]);

  const isSourceUrl = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.pdf') || lower.includes('.pdf?') || 
           url.includes('github.com') || url.includes('raw.githubusercontent.com') || 
           url.includes('/bitstream/');
  };

  const MarkdownComponents = {
    a: ({ href, children, ...props }: any) => {
      // Source documents → render as <button> to avoid extension interference
      if (href && isSourceUrl(href)) {
        const title = typeof children === 'string' ? children : 'Source Document';
        return (
          <button
            type="button"
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => {
              e.preventDefault();
              console.log('GridMind Source Button Pressed:', { href, title });
              onSourceClick(href, title);
            }}
            className="text-blue-600 font-bold underline decoration-slate-200 hover:decoration-blue-600 transition-all cursor-pointer bg-transparent border-none p-0 m-0 font-inherit text-inherit inline"
          >
            {children}
          </button>
        );
      }
      // Regular links → normal <a> tag
      return (
        <a
          {...props}
          href={href}
          onContextMenu={(e) => e.preventDefault()}
          className="text-blue-600 font-bold underline decoration-slate-200 hover:decoration-blue-600 transition-all cursor-pointer"
        >
          {children}
        </a>
      );
    },
    table: ({ children }: any) => (
      <div className="my-6 overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-[13px]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-50">{children}</thead>,
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left font-black text-slate-700 uppercase tracking-widest border-b border-slate-200">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-slate-600 border-b border-slate-100 last:border-b-0 leading-relaxed font-medium">
        {children}
      </td>
    ),
    tr: ({ children }: any) => <tr className="hover:bg-slate-50/50 transition-colors last:border-b-0">{children}</tr>,
  };
  if (isComplete) {
    return (
      <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
        {processedText}
      </ReactMarkdown>
    );
  }

  // Determine the effective slice length to avoid breaking Markdown links
  const getEffectiveLength = (len: number, text: string) => {
    // If we are in the middle of a link [title](url), always slice to the end of the link
    // so ReactMarkdown renders it as a link instead of raw text.
    let effective = len;
    
    // Check if we just started or are inside a link [...]
    const lastOpenBracket = text.lastIndexOf('[', len - 1);
    if (lastOpenBracket !== -1) {
      // Find if this bracket is closed within the full text
      const nextCloseParen = text.indexOf(')', lastOpenBracket);
      if (nextCloseParen !== -1 && nextCloseParen >= len - 1) {
        // We are inside a link structure. Check if it's a valid link [..](..)
        const midParenOpen = text.indexOf('](', lastOpenBracket);
        if (midParenOpen !== -1 && midParenOpen < nextCloseParen) {
          // It's a link! Extend slice to the end of the paren
          effective = nextCloseParen + 1;
        }
      }
    }
    return effective;
  };

  const effectiveLength = getEffectiveLength(displayedLength, processedText);

  return (
    <div className="w-full overflow-hidden">
      <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
        {safeText.length > 0 ? processedText.slice(0, effectiveLength) : ""}
      </ReactMarkdown>
      <span className="inline-block w-0.5 h-5 bg-blue-600 animate-pulse ml-0.5 align-middle" />
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
    <div className="px-8 py-4 border-t border-slate-300 flex items-center gap-3 bg-slate-50">
      <button
        onClick={handleCopy}
        title="Copy Intelligence"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-100 hover:border-blue-300 border border-transparent transition-all duration-200"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={handleShare}
        title="Distribute Strategy"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-100 border border-transparent transition-all duration-200"
      >
        <Share2 className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <div className="relative group/feedback flex items-center">
        <a
          href={`https://mail.google.com/mail/?view=cm&fs=1&to=gridmind.info@gmail.com&su=${encodeURIComponent("Report: Inaccurate GridMind Response")}&body=${encodeURIComponent(
            `TACTICAL QUERY:\n${query}\n\nMODEL USED:\n${result.model_used}\n\nIssue Details:\n[Please describe why this response was unsatisfactory or what latest info is missing]`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-2 rounded-lg hover:bg-rose-100 transition-all text-slate-600 hover:text-rose-600 group-hover/feedback:text-rose-600"
          title="Report missing latest info or an error"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" />
          </div>
        </a>

        {/* Minimal Tooltip Prompt */}
        <div className="absolute right-0 bottom-full mb-3 pointer-events-none opacity-0 group-hover/feedback:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <div className="bg-white border border-slate-300 rounded-xl px-4 py-2 shadow-2xl flex flex-col gap-1 w-56">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Feedback</span>
            </div>
            <p className="text-[10px] text-slate-700 leading-relaxed">
              Report missing latest info on this topic or report an analytical error.
            </p>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full right-4 -translate-y-1 w-2 h-2 bg-white border-r border-b border-slate-300 rotate-45" />
        </div>
      </div>
    </div>
  );
}


function VerbositySlider({
  value,
  onChange,
  userTier,
  onUpgradeClick,
}: {
  value: number;
  onChange: (v: number) => void;
  userTier: string;
  onUpgradeClick: () => void;
}) {
  const isPaid = userTier.toLowerCase() !== 'free';

  return (
    <div className="flex items-center gap-4 px-1 py-1 flex-1">
      <div className="flex items-center gap-2.5 shrink-0">
        <Cpu className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest w-20 text-center">
          {VERBOSITY_LABELS[value - 1]}
        </span>
      </div>
      <div className="relative flex-1 flex items-center h-6 group">
        <div className="absolute inset-x-0 h-1 rounded-full bg-slate-300" />
        <div
          className="absolute left-0 h-1 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((value - 1) / 4) * 100}%` }}
        />
        <div className="absolute inset-x-0 flex justify-between px-0.5 pointer-events-none">
          {[1, 2, 3, 4, 5].map((step) => {
            const isLocked = !isPaid && step > 3;
            return (
              <div
                key={step}
                className={`relative w-2.5 h-2.5 rounded-full transition-all duration-200 border-2 ${step <= value
                  ? "bg-blue-600 border-blue-500 shadow-sm shadow-blue-600/20"
                  : "bg-slate-300 border-slate-400"
                  }`}
              >
                {isLocked && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-300 rounded-xl px-3 py-1.5 pointer-events-none z-50 whitespace-nowrap shadow-2xl flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">{VERBOSITY_LABELS[step - 1]}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300">
                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                      <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Upgrade</span>
                    </div>
                  </div>
                )}
                {!isPaid && step > 3 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="w-1 h-1 bg-amber-500 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => {
            const newVal = Number(e.target.value);
            if (!isPaid && newVal > 3) {
              onUpgradeClick();
              // Prevent actual change to locked values for free users
              onChange(Math.min(value, 3));
            } else {
              onChange(newVal);
            }
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
}

const VERBOSITY_LABELS = ["Short", "Brief", "Standard", "Detailed", "In-depth"];

function SourcesSection({ sources }: { sources: Source[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sources : sources.slice(0, 5);

  return (
    <div className="border-t border-slate-300 px-8 py-5 space-y-1 bg-slate-50">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-3 h-3 text-blue-600" />
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
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
                onContextMenu={(e) => e.preventDefault()}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-slate-200 hover:bg-slate-300 border border-slate-400 transition-all"
              >
                <FileText className="w-3 h-3 text-blue-600" />
              </a>
            ) : (
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-slate-200 border border-slate-400">
                <FileText className="w-3 h-3 text-slate-600" />
              </span>
            )}

            {/* Label */}
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight shrink-0">
              [{source.ref || `SRC-${i + 1}`}]
            </span>
            <span className="text-[11px] text-slate-700 truncate leading-tight">
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

