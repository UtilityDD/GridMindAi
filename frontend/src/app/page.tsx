"use client";

import { useState, useRef, useEffect, useCallback, useMemo, MouseEvent as ReactMouseEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
  RefreshCcw,
  Minimize2,
  ChevronDown,
  Plus,
  PanelLeft,
  SquarePen,
  Search as SearchIcon,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Paperclip,
  Globe,
  SlidersHorizontal,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { getSupabase } from "@/lib/supabase";
import SearchGuidanceModal from "@/components/SearchGuidanceModal";
import AIProgressIndicator from "@/components/AIProgressIndicator";
import AnimatedLogo from "@/components/AnimatedLogo";

// Dynamic Imports for Performance Optimization (Lazy Loading)
const LandingPage = dynamic(() => import("@/components/LandingPage"), { ssr: true });
const LoginPage = dynamic(() => import("@/components/LoginPage"), { ssr: false });
const Sidebar = dynamic(() => import("@/components/Sidebar"), { ssr: false });
const PricingModal = dynamic(() => import("@/components/PricingModal"), { ssr: false });
const DisclaimerModal = dynamic(() => import("@/components/DisclaimerModal"), { ssr: false });
const LiveStats = dynamic(() => import("@/components/LiveStats"), { ssr: false });
// ShareDocument is managed inside Sidebar.tsx

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
  "Transformer tripping repeatedly - what checks to do step by step?",
  "33kV line passing over house - is it safe or violation?",
  "How to calculate load before giving new connection on existing feeder?",
  "DTR overloading - when to replace vs augment?",
  "LT line touching tree - what is standard clearance rule?",
  "Voltage low at tail end - quick solutions?",
  "How to identify illegal hooking from line?",
  "Pole leaning - when is it unsafe?",
  "Frequent fuse blow in rural feeder - probable causes?",
  "What is safe earthing resistance value in field?",
  "What tests to do before charging a new transformer?",
  "CT/PT ratio mismatch - how to detect?",
  "Megger value acceptable for LT cable?",
  "How to check health of VCB in substation?",
  "What is acceptable oil BDV for transformer in service?",
  "How to check if isolator contacts are worn out?",
  "Minimum sag for 11kV line in summer?",
  "What is standard conductor spacing for 33kV line?",
  "New connection delay - what is maximum allowed time?",
  "Consumer complaining high bill - how to verify?",
  "Load extension without permission - what action to take?",
  "Difference between provisional and final assessment?",
  "Meter stopped - how to bill consumer?",
  "How to calculate connected load quickly in field?",
  "What documents needed for commercial connection?",
  "Net meter installation - eligibility and process?",
  "When is employee eligible for next promotion?",
  "How many leaves can be carried forward?",
  "Pension calculation formula for WBSEDCL employees?",
  "What is benefit after 16 years service?",
  "How ACR rating affects promotion?",
  "Transfer policy basics?",
  "Salary fixation after promotion?",
  "How to apply for medical reimbursement?",
  "Theft case detected - what to do immediately?",
  "Section 135 case - steps after detection?",
  "How to calculate theft assessment amount?",
  "Difference between Section 126 and 135 (practical)?",
  "Can supply be disconnected immediately in theft case?",
  "FIR required or not for electricity theft?",
  "Unauthorized extension - what penalty applies?",
  "Minimum safe distance from 11kV line?",
  "What PPE is mandatory for line work?",
  "Can work be done without shutdown?",
  "Steps before climbing electric pole?",
  "What to check before energizing a line?",
  "Common causes of electrical accidents in field?",
  "Earthing failure - how dangerous?",
];

const MOBILE_EXAMPLE_QUERIES = [
  "Transformer tripping: checks?",
  "33kV line over house safe?",
  "DTR overload: replace or augment?",
  "High bill complaint: verify how?",
  "Section 135 steps after detection?",
  "Mandatory PPE for line work?",
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

// Dynamic topics for the search page header animation (field-focused)
const DYNAMIC_SEARCH_TOPICS = [
  "Transformer Tripping Checks",
  "33kV Line Safety Over Buildings",
  "Feeder Load Calculation",
  "DTR Overloading Decisions",
  "LT Tree Clearance Rules",
  "Tail-End Voltage Improvement",
  "Illegal Hooking Detection",
  "Pole Leaning Risk Assessment",
  "Rural Fuse Blow Diagnosis",
  "Field Earthing Resistance",
  "Pre-Charging Transformer Tests",
  "CT/PT Ratio Verification",
  "LT Cable Megger Acceptance",
  "VCB Health Check",
  "Transformer Oil BDV Limits",
  "Isolator Contact Wear",
  "11kV Summer Sag Limits",
  "33kV Conductor Spacing",
  "New Connection Timeline",
  "High Bill Verification",
  "Unauthorized Load Extension Action",
  "Provisional vs Final Assessment",
  "Stopped Meter Billing Method",
  "Connected Load Field Estimation",
  "Commercial Connection Documents",
  "Net Meter Eligibility",
  "Promotion Eligibility",
  "Leave Carry Forward Rules",
  "Pension Calculation Basics",
  "16-Year Service Benefit",
  "ACR Impact on Promotion",
  "Transfer Policy Basics",
  "Salary Fixation After Promotion",
  "Medical Reimbursement Process",
  "Immediate Action in Theft Case",
  "Section 135 Procedure",
  "Theft Assessment Calculation",
  "Section 126 vs 135 Practical",
  "Immediate Disconnection in Theft",
  "FIR Requirement in Theft",
  "Penalty for Unauthorized Extension",
  "Minimum Safe Distance from 11kV",
  "Mandatory PPE for Line Work",
  "Shutdown Requirement for Work",
  "Steps Before Climbing Pole",
  "Pre-Energization Checklist",
  "Common Electrical Accident Causes",
  "Earthing Failure Risk",
  "Substation Safety Checklist",
  "Field O&M Quick Guidance",
  "Daily Utility Operations",
];

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
  return <AIProgressIndicator />;
}


// Global cache for preloaded PDF blobs to enable "Instant View"
const PDF_BLOB_CACHE: Record<string, string> = {};

function normalizeGitHubPdfUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com" && parsed.pathname.includes("/blob/")) {
      const normalizedPath = parsed.pathname.replace("/blob/", "/");
      return `https://raw.githubusercontent.com${normalizedPath}${parsed.search}`;
    }
  } catch {
    // fallback to original URL if parsing fails
  }
  return url;
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
  const [questionCopied, setQuestionCopied] = useState(false);
  const [activeSource, setActiveSource] = useState<{ url: string; title: string } | null>(null);
  const [isFullscreenViewer, setIsFullscreenViewer] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [clarificationData, setClarificationData] = useState<{ keyword: string, title: string, options: string[], originalQuery: string } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  





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
  const requestAbortRef = useRef<AbortController | null>(null);
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

  useEffect(() => {
    return () => {
      requestAbortRef.current?.abort();
      requestAbortRef.current = null;
    };
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ tierId, promoCode }),
      });

      const orderData = await res.json();
      if (orderData.error) throw new Error(orderData.error);

      // Handle Instant Free Upgrade (100% Promo)
      if (orderData.free) {
        setUserTier(tierId);
        setIsPricingOpen(false);
        refreshUsage(); // Get new limits immediately
        return;
      }

      // Step 2: Open Razorpay Checkout for paid plans
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



  // Header topic smooth-scroll index (interval-based, no typing)
  const [topicIndex, setTopicIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTopicIndex((prev) => (prev + 1) % DYNAMIC_SEARCH_TOPICS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Track last used random index to avoid consecutive repeats
  const lastRandomRef = useRef<number>(-1);

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

  // Keyboard shortcuts for fullscreen viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close fullscreen viewer
      if (e.key === "Escape" && isFullscreenViewer) {
        setIsFullscreenViewer(false);
      }
      // F to open fullscreen viewer (when source is active)
      if (e.key === "f" && activeSource && !isFullscreenViewer && e.ctrlKey === false && e.metaKey === false) {
        setIsFullscreenViewer(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreenViewer, activeSource]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <AnimatedLogo />
          <p className="text-sm font-medium text-slate-600">Loading...</p>
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

    // Guidance Modal logic: Show only for first-time or explicit manual triggers
    if (typeof window !== "undefined" && !q) {
      const seen = localStorage.getItem("gridmind_guidance_seen");
      if (!seen) {
        setShowGuidanceModal(true);
        return;
      }
    }

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
    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        signal: controller.signal,
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
      refreshUsage();

      // Strategic Pre-warming: Preload top document sources and viewer resources
      if (data.sources && data.sources.length > 0) {
        // Pre-connect to viewer domain fallback
        if (!document.getElementById('google-viewer-preconnect')) {
          const preconnect = document.createElement('link');
          preconnect.id = 'google-viewer-preconnect';
          preconnect.rel = 'preconnect';
          preconnect.href = 'https://docs.google.com';
          document.head.appendChild(preconnect);
        }

        data.sources.slice(0, 3).forEach(async (s) => {
          if (!s.source_url) return;

          // 1. Prefetch via standard link tag for browser cache
          const docLink = document.createElement('link');
          docLink.rel = 'prefetch';
          docLink.as = 'fetch';
          docLink.href = s.source_url;
          document.head.appendChild(docLink);

          // 2. "Instant View" Background Fetch: Capture as Blob for native iframe bypass
          // We only do this for PDF-like URLs and route through our proxy to bypass CORS/Blocked-by-Client
          const isPdf = s.source_url.toLowerCase().endsWith('.pdf') || s.source_url.includes('.pdf?') || s.source_url.includes('/bitstream/');
          if (isPdf && !PDF_BLOB_CACHE[s.source_url]) {
            try {
              const proxySourceUrl = normalizeGitHubPdfUrl(s.source_url);
              const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(proxySourceUrl)}`;
              const blobRes = await fetch(proxyUrl);
              
              if (blobRes.ok) {
                const blob = await blobRes.blob();
                const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                PDF_BLOB_CACHE[s.source_url] = blobUrl;
                console.log(`GridMind Instant View: Proxy Preloaded ${s.ref}`);
              }
            } catch (e) {
              console.warn(`GridMind: Could not pre-fetch blob via proxy for ${s.ref}`, e);
            }
          }
        });
      }

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.question !== question);
        return [{ question, result: data }, ...filtered].slice(0, 50); // Keep max 50 items
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("Search canceled.");
        return;
      }

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
      if (requestAbortRef.current === controller) {
        requestAbortRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleStopSearch = () => {
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewInquiry = () => {
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
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
      <SearchGuidanceModal 
        isOpen={showGuidanceModal} 
        onClose={() => {
          setShowGuidanceModal(false);
          localStorage.setItem("gridmind_guidance_seen", "true");
          handleSubmit(); 
        }}
        onProceed={() => {
          setShowGuidanceModal(false);
          localStorage.setItem("gridmind_guidance_seen", "true");
          handleSubmit();
        }}
      />
      <Sidebar
        userEmail={user?.email || ""}
        onSignOut={signOut}
        history={history}
        onHistoryClick={(q, res) => handleSubmit(q, res)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userTier={userTier}
        onUpgradeClick={() => {}}
        onNewInquiry={handleNewInquiry}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        usage={usage}
      />

      {/* PricingModal hidden: authorization managed via admin panel */}
      {false && (
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
          currentTier={userTier}
          onSelectPlan={handleSelectPlan}
        />
      )}

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
        {/* Top Header / Bar (ChatGPT Style) */}
        <header
          className="relative z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 px-4 sm:px-6 py-2.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Model Pill (ChatGPT Style) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 text-slate-800 text-sm font-semibold cursor-default transition-colors">
              <span className="font-bold">GridMind 4.0</span>
              <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">RAG</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* New Chat Button */}
            <button
              onClick={handleNewInquiry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Start New Inquiry"
            >
              <SquarePen className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <div className="hidden md:block ml-1 border-l border-slate-200 pl-3">
              <LiveStats />
            </div>
          </div>
        </header>

        {/* ── MOBILE LIVE STATS BAR ── */}
        <div className="md:hidden bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex justify-center sticky top-[53px] z-40">
          <LiveStats />
        </div>

        {/* ── CHAT CONTAINER (ChatGPT Style) ── */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto">
          {/* Main conversation scroll area */}
          <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
            {/* Graceful Limit Alert */}
            {error && (() => {
              const lowerErr = error.toLowerCase();
              const isLimit = lowerErr.includes("limit") || lowerErr.includes("reached") || lowerErr.includes("lockout") || lowerErr.includes("cooling") || lowerErr.includes("bandwidth");
              const isExpired = lowerErr.includes("expired") || lowerErr.includes("trial");

              return (
                <div className={`mb-6 p-4 border rounded-2xl flex items-center justify-between gap-4 ${isExpired ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-red-50 border-red-200 text-red-900"}`}>
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`w-5 h-5 shrink-0 ${isExpired ? "text-amber-600" : "text-red-600"}`} />
                    <p className="text-xs font-medium leading-relaxed">{error}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setError("")} className="p-1 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── EMPTY STATE: ChatGPT Landing Prompt ── */}
            {!result && !loading && (
              <div className="my-auto py-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-5 shadow-sm">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-2">
                  What can I help with?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-8">
                  Ask any question across 4,200+ indexed WBSEDCL circulars, tariff orders, and CEA technical standards.
                </p>

                {/* ChatGPT-style 2x2 Suggestion Cards */}
                <div className="grid sm:grid-cols-2 gap-3 w-full text-left">
                  {[
                    {
                      title: "Theft & Inspection Procedure",
                      desc: "Section 135 unauthorized extraction steps",
                      query: "What is the procedure for Section 135 unauthorized extraction?",
                    },
                    {
                      title: "Supply Restoration Norms",
                      desc: "Restoration time for a blown transformer fuse",
                      query: "What is the restoration time for a blown transformer fuse in urban areas?",
                    },
                    {
                      title: "Single-Phase Load Ceiling",
                      desc: "Maximum connected load permitted on 230V",
                      query: "What is the maximum connected load permitted on single-phase 230V?",
                    },
                    {
                      title: "Delayed Payment Surcharge",
                      desc: "Tariff order interest rate calculation",
                      query: "What is the Delayed Payment Surcharge rate under the 2024-25 tariff order?",
                    },
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(card.query);
                        handleSubmit(card.query);
                      }}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all group flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">{card.title}</span>
                      <span className="text-[12px] text-slate-500 mt-1 line-clamp-1 group-hover:text-slate-600">{card.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTIVE CONVERSATION (ChatGPT Style) ── */}
            {(loading || result) && (
              <div className="flex flex-col gap-6 pb-32">
                {/* User Message Bubble */}
                {activeQuestion && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-3xl bg-[#f4f4f4] text-slate-900 text-[15px] leading-relaxed shadow-sm flex items-start gap-3">
                      <p className="flex-1">{activeQuestion}</p>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(activeQuestion);
                          setQuestionCopied(true);
                          setTimeout(() => setQuestionCopied(false), 2000);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title="Copy question"
                      >
                        {questionCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-start gap-4 py-6">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <ThinkingIndicator />
                      <button
                        onClick={handleStopSearch}
                        className="mt-4 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Stop Search</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Assistant Response (ChatGPT Style) */}
                {result && !loading && (
                  <div ref={resultsRef} className="flex items-start gap-4 pt-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Markdown Body */}
                      <div className="markdown-content text-[15px] text-slate-800 leading-[1.75] font-normal">
                        <TypingMarkdown
                          text={result.answer}
                          speed={2}
                          sources={result.sources}
                          onSourceClick={(url, title) => setActiveSource({ url, title })}
                        />
                      </div>

                      {/* Sources Section (ChatGPT Search style) */}
                      {result.sources.length > 0 && (
                        <SourcesSection
                          sources={result.sources}
                          onOpenSource={(source) => setActiveSource({ url: source.source_url, title: source.title })}
                        />
                      )}

                      {/* Action Bar (ChatGPT Style) */}
                      <ChatGptActionBar
                        result={result}
                        query={activeQuestion || query}
                        onRetry={() => handleSubmit(activeQuestion || query)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── FLOATING CHATGPT INPUT BAR ── */}
          <div className="sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-4 pb-4 px-4 sm:px-6 z-30">
            <div className="max-w-3xl mx-auto w-full">
              {/* Clarification Alert Overlay if needed */}
              <AnimatePresence>
                {clarificationData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-3 bg-white p-4 rounded-2xl border border-blue-200 shadow-xl flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">{clarificationData.title}</span>
                      <button onClick={() => setClarificationData(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {clarificationData.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            const refined = `${opt} ${clarificationData.originalQuery}`;
                            setQuery(refined);
                            setClarificationData(null);
                            setTimeout(() => handleSubmit(refined), 50);
                          }}
                          className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ChatGPT Input Pill */}
              <div className="relative flex flex-col bg-[#f4f4f4] rounded-[26px] border border-slate-200/90 shadow-sm focus-within:bg-white focus-within:border-slate-400 focus-within:shadow-md transition-all duration-200 p-2">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Message GridMind..."
                  className="w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none resize-none px-3.5 pt-2 pb-1 leading-relaxed"
                  style={{ minHeight: "44px", maxHeight: "180px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "44px";
                    target.style.height = `${Math.min(target.scrollHeight, 180)}px`;
                  }}
                />

                <div className="flex items-center justify-between px-2 pt-1">
                  {/* Left Controls: Plus / Browse Vault & Response Depth Slider */}
                  <div className="flex items-center gap-1">
                    <Link
                      href="/explorer"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors shrink-0"
                      title="Explore 4,200+ Circular Vault"
                    >
                      <Plus className="w-4 h-4" />
                    </Link>
                    <VerbositySlider
                      value={verbosity}
                      onChange={setVerbosity}
                      userTier={userTier}
                      onUpgradeClick={() => setIsPricingOpen(true)}
                    />
                  </div>

                  {/* Right Control: Iconic Round Send Button */}
                  <button
                    onClick={() => handleSubmit()}
                    disabled={loading || !query.trim()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      query.trim() && !loading
                        ? "bg-slate-900 text-white hover:bg-slate-700 active:scale-95 shadow-sm"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-50"
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Micro Disclaimer */}
              <p className="text-[11px] text-center text-slate-400 mt-2 font-normal">
                GridMind can make mistakes. Always verify critical statutory clauses from official circulars.
              </p>
            </div>
          </div>
        </div>
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
            <div className="flex-1 flex flex-col h-full bg-slate-50 border-l border-slate-200 overflow-hidden" style={{ width: `${100 - splitRatio}%` }}>
              <SecureIntelligenceViewer 
                source={activeSource} 
                onClose={() => setActiveSource(null)}
                onMaximize={() => setIsFullscreenViewer(true)}
                isFullscreen={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Fullscreen PDF Viewer Modal */}
      {isFullscreenViewer && activeSource && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col animate-in fade-in duration-300">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-white text-base truncate">
                  {activeSource.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Fullscreen Document Viewer</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsFullscreenViewer(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-all active:scale-95"
                title="Exit Fullscreen (ESC)"
              >
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </button>
            </div>
          </div>

          {/* Fullscreen Viewer Content */}
          <div className="flex-1 overflow-auto bg-slate-900">
            <SecureIntelligenceViewer
              source={activeSource}
              onClose={() => setIsFullscreenViewer(false)}
              hideHeader={true}
              isFullscreen={true}
            />
          </div>

          {/* Fullscreen Footer */}
          <div className="px-6 py-3 bg-slate-800 border-t border-slate-700 text-xs text-slate-300 flex items-center justify-between">
            <p>Press <span className="px-2 py-1 bg-slate-700/70 rounded font-mono text-slate-200 ml-1 inline-block">ESC</span> to exit fullscreen</p>
            <p className="text-slate-400">GridMind Secure Document Viewer</p>
          </div>
        </div>
      )}
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
 * Secure Intelligence Viewer (Dynamic Import)
 * standardizes the canvas-based, zero-download preview experience.
 */
const SecureIntelligenceViewer = dynamic(() => import("@/components/SecureIntelligenceViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 relative pointer-events-none select-none">
       <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-sm z-0" />
       <div className="relative z-10 flex flex-col items-center gap-4">
         <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin shadow-lg" />
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Initializing Secure Sandbox...</p>
       </div>
    </div>
  )
});

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

    // Burst mode: 5 characters per 1ms for "Very Fast" response simulation
    const timer = setTimeout(() => {
      setDisplayedLength(prev => Math.min(prev + 5, safeText.length));
    }, 1);

    return () => clearTimeout(timer);
  }, [displayedLength, safeText]);

  const isComplete = displayedLength >= safeText.length;

  // Transform text to include clickable source links + universal PDF/Repo auto-linkifier
  const processedText = useMemo(() => {
    let newText = safeText;

    // 0. SANITIZATION: Strip all bare URLs that aren't already in markdown [text](url) format
    // This removes visible URLs like: Citation(https://...) or bare https://...
    // but preserves markdown links like [text](https://...)
    
    // Remove URLs inside parentheses: something(https://...) → something()
    newText = newText.replace(/\(https?:\/\/[^\s)]+\)/g, '()');
    // Clean up empty parentheses: () → (remove)
    newText = newText.replace(/\(\s*\)/g, '');
    // Remove any remaining bare URLs that aren't in markdown format
    // This regex avoids URLs already in [text](url) by checking they're not preceded by ]
    newText = newText.replace(/(?<!\])\s*https?:\/\/[^\s)\]]+(?![)\]])/g, '');
    
    // 1. Skip explicit source citation auto-linking so source URLs never appear in response text.
    //    Only raw URLs are sanitized here; source references remain plain text.

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

    // 3. Markdown Table Fixer — Advanced Parser (handles missing newlines and LLM squashing)
    const repairSquashedTables = (input: string): string => {
      // 1. Mandatory blank line before tables (if text immediately precedes a table start)
      let fixedInput = input.replace(/([^\n])(\s*\|\s*[^\s|].*?\|\s*\n\s*\|\s*[-: ]+\s*\|)/g, '$1\n\n$2');

      // 2. Remove extra blank lines between potential headers and valid separator rows
      // This specifically fixes the LLM mistake where it puts a newline between header and |---|
      fixedInput = fixedInput.replace(/(\|\s*[^\s|].*?\s*\|)\s*\n\s*\n+(\s*\|\s*[-: ]+\s*\|)/g, '$1\n$2');

      const lines = fixedInput.split('\n');
      const result: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // DETECT squashed table: separator + data pipes on same line
        const hasSep = /\|\s*[-: ]{3,}\s*\|/.test(line);
        const pipeCount = (line.match(/\|/g) || []).length;

        if (hasSep && pipeCount > 5) {
          // Find where the table starts (first |)
          const firstPipeIdx = line.indexOf('|');
          const beforeTable = firstPipeIdx > 0 ? line.substring(0, firstPipeIdx).trimEnd() : '';
          const tableStr = line.substring(firstPipeIdx);

          // Find where the table ends (last |) and any text after
          const lastPipeIdx = tableStr.lastIndexOf('|');
          const afterTable = tableStr.substring(lastPipeIdx + 1).trim();
          const pureTable = tableStr.substring(0, lastPipeIdx + 1);

          // Reconstruct with proper newlines
          const sepMatch = pureTable.match(/((?:\|\s*[-: ]{3,}\s*)+\|)/);
          if (!sepMatch) { result.push(line); continue; }
          const colCount = (sepMatch[0].match(/[-:]{3,}/g) || []).length;
          
          const parts = pureTable.split('|');
          const cells = parts.slice(1, -1);
          const rows: string[] = [];
          
          for (let k = 0; k < cells.length; k += colCount) {
            const rowCells = cells.slice(k, k + colCount).map(c => c.trim());
            if (rowCells.length > 0) {
              // Ensure row matches column count (pad with empty cells if needed)
              while (rowCells.length < colCount) rowCells.push('');
              rows.push('| ' + rowCells.join(' | ') + ' |');
            }
          }

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
      <div className="my-6 overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="min-w-full border-collapse text-[13px] leading-relaxed">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-50/80 border-b border-slate-200">{children}</thead>,
    th: ({ children }: any) => (
      <th className="px-5 py-3.5 text-left font-extrabold text-slate-800 uppercase tracking-widest text-[11px] whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-5 py-3 text-slate-600 border-b border-slate-100 last:border-b-0 font-medium">
        {children}
      </td>
    ),
    tr: ({ children }: any) => <tr className="hover:bg-blue-50/30 transition-colors even:bg-slate-50/30">{children}</tr>,
  };
  if (isComplete) {
    return (
      <div className="markdown-content">
        <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
          {processedText}
        </ReactMarkdown>
      </div>
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

  // Helper: Sanitize URLs from displayed text during typing animation
  const sanitizeDisplayedText = (text: string): string => {
    let sanitized = text;
    // Remove URLs inside parentheses
    sanitized = sanitized.replace(/\(https?:\/\/[^\s)]+\)/g, '()');
    // Clean up empty parentheses
    sanitized = sanitized.replace(/\(\s*\)/g, '');
    // Remove any remaining bare URLs
    sanitized = sanitized.replace(/(?<!\])\s*https?:\/\/[^\s)\]]+(?![)\]])/g, '');
    return sanitized;
  };

  const displayedText = sanitizeDisplayedText(processedText.slice(0, effectiveLength));

  return (
    <div className="w-full overflow-hidden markdown-content">
      <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
        {safeText.length > 0 ? displayedText : ""}
      </ReactMarkdown>
      <span className="inline-block w-0.5 h-5 bg-blue-600 animate-pulse ml-0.5 align-middle" />
    </div>
  );
}

function ChatGptActionBar({
  result,
  query,
  onRetry,
}: {
  result: QueryResult;
  query: string;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

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
    await navigator.clipboard.writeText(result.answer);
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
    <div className="flex items-center gap-1 text-slate-500 pt-3 mt-2 border-t border-slate-100">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        title="Copy answer"
        className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center gap-1 text-xs"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        {copied && <span className="text-[11px] text-emerald-600 font-medium">Copied</span>}
      </button>

      {/* Thumbs up */}
      <button
        onClick={() => setFeedback(feedback === "up" ? null : "up")}
        title="Good response"
        className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${
          feedback === "up" ? "text-blue-600 bg-blue-50" : "hover:text-slate-800"
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>

      {/* Thumbs down */}
      <button
        onClick={() => setFeedback(feedback === "down" ? null : "down")}
        title="Bad response"
        className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${
          feedback === "down" ? "text-rose-600 bg-rose-50" : "hover:text-slate-800"
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>

      {/* Retry / Regenerate */}
      {onRetry && (
        <button
          onClick={onRetry}
          title="Regenerate response"
          className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}

      {/* Share */}
      <button
        onClick={handleShare}
        title="Share synthesis"
        className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {/* Report error link */}
      <a
        href={`https://mail.google.com/mail/?view=cm&fs=1&to=gridmind.info@gmail.com&su=${encodeURIComponent("Report: Inaccurate GridMind Response")}&body=${encodeURIComponent(
          `QUERY:\n${query}\n\nMODEL USED:\n${result.model_used}\n\nIssue Details:\n[Please describe the issue or missing circular]`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors text-slate-400"
        title="Report inaccuracy"
      >
        <MessageSquare className="w-4 h-4" />
      </a>

      {/* Model & elapsed time */}
      <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
        <Cpu className="w-3 h-3 text-slate-400" />
        <span>{result.model_used?.replace(/\s*\(\s*pool\s*\)/gi, "").replace(/pool/gi, "").trim()}</span>
        <span>•</span>
        <span>{(result.elapsed_ms / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}


function VerbositySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
  userTier?: string;
  onUpgradeClick?: () => void;
}) {
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
            return (
              <div
                key={step}
                className={`relative w-2.5 h-2.5 rounded-full transition-all duration-200 border-2 ${step <= value
                  ? "bg-blue-600 border-blue-500 shadow-sm shadow-blue-600/20"
                  : "bg-slate-300 border-slate-400"
                  }`}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
}

const VERBOSITY_LABELS = ["Short", "Brief", "Standard", "Detailed", "In-depth"];

function SourcesSection({
  sources,
  onOpenSource,
}: {
  sources: Source[];
  onOpenSource?: (source: Source) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sources : sources.slice(0, 4);

  return (
    <div className="mt-4 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2.5">
        <Globe className="w-3.5 h-3.5 text-slate-400" />
        <span>Sources ({sources.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visible.map((source, i) => (
          <button
            key={source.doc_id || i}
            type="button"
            onClick={() => onOpenSource?.(source)}
            className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 text-left transition-all group"
          >
            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-slate-400 transition-colors">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-800 truncate">
                  {source.ref || `DOC-${i + 1}`}
                </span>
                {source.date && (
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">{source.date}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1 group-hover:text-slate-700 transition-colors">
                {source.title}
              </p>
            </div>
          </button>
        ))}
      </div>

      {sources.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          {expanded ? "Show fewer sources ↑" : `+${sources.length - 4} more sources ↓`}
        </button>
      )}
    </div>
  );
}

