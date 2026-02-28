"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Search,
  Loader2,
  FileText,
  ExternalLink,
  Sparkles,
  Clock,
  BrainCircuit,
  ChevronDown,
  Wand2,
  Copy,
  Check,
  Share2,
  LogOut,
  Cpu,
  Settings,
  Menu,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import LoginPage from "@/components/LoginPage";
import { getSupabase } from "@/lib/supabase";

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

const EXAMPLE_QUERIES = [
  "What are the grid connectivity standards for renewable integration?",
  "Tell me about power theft prevention and monitoring guidelines",
  "What is the standard procedure for grid stability management?",
  "What are the procurement policies for public utility projects?",
  "Explain the career progression protocols in the energy sector",
  "What are the regulatory requirements for high-tension claims?",
];

import Sidebar from "@/components/Sidebar";

function ScanningPulse() {
  const [step, setStep] = useState(0);
  const steps = [
    "Initializing Neural Mapping...",
    "Scanning Tier 1 Grid Regulations...",
    "Analyzing Operational Frameworks...",
    "Synthesizing Strategic Response...",
    "Verifying Institutional Alignment...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d152b] rounded-full border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
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
            {steps[step]}
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
  const [userTier, setUserTier] = useState<string>("free");
  const [history, setHistory] = useState<
    { question: string; result: QueryResult }[]
  >([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchTier = async () => {
      const { data, error } = await getSupabase()
        .from("profiles")
        .select("tier_id")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setUserTier(data.tier_id);
      }
    };
    fetchTier();
  }, [user]);

  // Scroll-driven search bar fade
  const [searchOpacity, setSearchOpacity] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      // Only fade when results are showing
      if (!result) { setSearchOpacity(1); return; }
      const scrollY = el.scrollTop;
      const fadeStart = 60;
      const fadeEnd = 200;
      const opacity = Math.max(0, Math.min(1, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart)));
      setSearchOpacity(opacity);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [result]);

  // Dynamic Placeholder Effect
  const [placeholder, setPlaceholder] = useState("");
  const [queryIndex, setQueryIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentQuery = EXAMPLE_QUERIES[queryIndex];
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
        setQueryIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, queryIndex]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600">Initializing Core...</p>
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
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.question !== question);
        return [{ question, result: data }, ...filtered].slice(0, 50); // Keep max 50 items
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Operational failure encountered.");
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
        userEmail={user.email || ""}
        onSignOut={signOut}
        history={history}
        onHistoryClick={(q) => {
          const item = history.find((h) => h.question === q);
          if (item) {
            setQuery(q);
            setResult(item.result);
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          } else {
            setQuery(q);
            handleSubmit(q);
          }
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userTier={userTier}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col min-w-0 relative bg-[#020617] overflow-y-auto scroll-smooth"
      >
        {/* Ambient background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/[0.02] rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[10%] w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
        </div>

        {/* Top Header / Bar */}
        <AnimatePresence>
          {(!loading && !result) && (
            <motion.header
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative z-20 glass-panel border-b-0 sticky top-0 px-8 py-4 flex items-center justify-between shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-3">
                {/* Hamburger toggle – visible on mobile only */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  aria-label="Open menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="md:hidden w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xs font-bold text-white tracking-widest uppercase">
                    GridMind <span className="text-indigo-400">Tactical</span>
                  </h1>
                  <p className="text-[9px] text-slate-500 font-medium tracking-tight">Power Sector Strategic Intelligence v2.0</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <SettingsMenu
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  verbosity={verbosity}
                  setVerbosity={setVerbosity}
                />
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Main Interface */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-8 py-10">
          <AnimatePresence mode="wait">
            {!result && !loading && history.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="pt-14 pb-8 flex flex-col items-center text-center"
              >
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4 max-w-2xl">
                  Decode Energy <br />
                  <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Power Intelligence</span>
                </h2>

                <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed mb-8">
                  Instant access to power sector regulations, operational frameworks, and institutional knowledge.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search / Command Bar */}
          <motion.div
            layout
            style={{
              opacity: searchFocused ? 1 : searchOpacity,
              pointerEvents: searchOpacity < 0.1 && !loading ? "none" : "auto",
            }}
            transition={{
              layout: { type: "spring", damping: 25, stiffness: 200 },
              opacity: { duration: 0.2 }
            }}
            className={`${(!result && !loading && history.length === 0) ? "pt-10" : "pt-4"} pb-8 sticky ${(!result && !loading) ? "top-[100px]" : "top-6"} z-30`}
          >
            <div className="relative group shadow-2xl shadow-indigo-500/10">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-transparent rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-xl" />
              <div className="relative flex items-start gap-4 glass-panel border-white/10 rounded-[1.5rem] px-6 py-5 group-focus-within:border-indigo-500/40 group-focus-within:bg-slate-900/80 transition-all duration-300">
                <Search className="w-5 h-5 text-slate-500 mt-1.5 shrink-0 group-focus-within:text-indigo-400 transition-colors" />
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder || "Initialize policy inquiry..."}
                  rows={1}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 bg-transparent text-base text-white placeholder:text-slate-600 outline-none resize-none leading-relaxed pt-0.5"
                  style={{ minHeight: "28px", maxHeight: "150px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "28px";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />

                <AnimatePresence mode="wait">
                  <motion.button
                    key={loading ? "loading" : "idle"}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleSubmit()}
                    disabled={loading || !query.trim()}
                    className={`shrink-0 h-10 px-6 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed border ${loading
                      ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                      : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500/20 text-white shadow-indigo-600/20"
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Execute"
                    )}
                  </motion.button>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Immersive Loading State */}
          <AnimatePresence>
            {loading && (
              <ScanningPulse />
            )}
          </AnimatePresence>

          {/* Error Section */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 p-5 rounded-2xl bg-red-500/[0.03] border border-red-500/10 text-sm text-red-400 flex items-center gap-3 backdrop-blur-md"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
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
                className="mt-12 space-y-8 pb-32"
              >
                {/* Strategic Result Container */}
                <div ref={resultsRef} className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40">
                  {/* Result Header */}
                  <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Strategic Insight</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Validated by Regulatory Intelligence</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-indigo-500/60" />
                        <span>{result.model_used.split('/')[1] || result.model_used}</span>
                      </div>
                      <div className="w-px h-3 bg-white/10" />
                      <span>Lat: {result.elapsed_ms}ms</span>
                    </div>
                  </div>

                  {/* Rewritten query node */}
                  {result.rewritten_query && (
                    <div className="mx-8 mt-6 px-5 py-4 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400/80" />
                        <span className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest">
                          Neural Query Refinement
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                        &quot;{result.rewritten_query}&quot;
                      </p>
                    </div>
                  )}

                  {/* Answer Content Area */}
                  <div className="px-8 py-8">
                    <div className="markdown-content text-[15px] text-slate-200 leading-[1.7] font-normal">
                      <ReactMarkdown>{result.answer}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Share bar node */}
                  <ShareBar result={result} query={query} />

                  {/* Structured Sources Section */}
                  {result.sources.length > 0 && (
                    <SourcesSection sources={result.sources} />
                  )}
                </div>

                {/* Collateral History (Only if no results yet, or secondary) */}
                {history.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="pt-8 border-t border-white/5"
                  >
                    <div className="flex items-center gap-3 mb-6 px-2">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">
                        Previous Operational Inquiries
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {history.slice(1, 4).map((h, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(h.question);
                            setResult(h.result);
                          }}
                          className="group flex flex-col gap-2 px-5 py-4 rounded-2xl glass-panel text-left hover:border-indigo-500/30 hover:bg-white/[0.02] transition-all duration-300"
                        >
                          <p className="text-sm text-slate-400 group-hover:text-white transition-colors truncate font-medium">
                            {h.question}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                              {h.result.sources.length} SOURCES
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                              {(h.result.elapsed_ms / 1000).toFixed(2)}s LATENCY
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div >
    </div >
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
        className="group flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 hover:border-white/10 transition-all duration-300 shadow-lg"
      >
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{current.label}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-64 glass-panel rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-y-auto max-h-80 z-50 p-1.5"
          >
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  onChange(m.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${m.value === value ? "bg-indigo-500/10" : "hover:bg-white/5"
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
    <div className="flex items-center gap-6 px-4 py-2 bg-slate-900/30 rounded-xl border border-white/5 flex-1">
      <div className="flex items-center gap-2.5 shrink-0">
        <Cpu className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] w-20">
          Synthesist Level: <span className="text-slate-300">{VERBOSITY_LABELS[value - 1]}</span>
        </span>
      </div>
      <div className="relative flex-1 flex items-center h-6 group">
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/5" />
        <div
          className="absolute left-0 h-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
          style={{ width: `${((value - 1) / 4) * 100}%` }}
        />
        <div className="absolute inset-x-0 flex justify-between px-0.5">
          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => onChange(step)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 border-2 ${step <= value
                ? "bg-indigo-500 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                : "bg-slate-800 border-white/10 hover:border-slate-500"
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
    <div className="border-t border-white/5 px-8 py-5 space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-3 h-3 text-indigo-400/60" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/10 hover:border-indigo-500/30 transition-all"
              >
                <FileText className="w-3 h-3 text-indigo-400" />
              </a>
            ) : (
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-white/5 border border-white/5">
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
              className="absolute top-full right-0 mt-3 w-80 glass-panel rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 border border-white/10"
            >
              <div className="p-5 space-y-6">
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
