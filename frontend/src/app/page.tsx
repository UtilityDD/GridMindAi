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
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import LoginPage from "@/components/LoginPage";

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
  "What is the latest circular about employee promotions?",
  "What are the rules for LTC/HTC claims?",
  "Tell me about the electricity theft detection guidelines",
  "What is the purchase policy for WBSEDCL?",
  "What are the office orders about Career Progression Scheme?",
  "Rate contract for spot billing",
];

export default function Home() {
  const { user, session, loading: authLoading, signOut } = useAuth();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [verbosity, setVerbosity] = useState(3);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [history, setHistory] = useState<
    { question: string; result: QueryResult }[]
  >([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
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
        setError("Session expired. Please sign in again.");
        await signOut();
        return;
      }

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: QueryResult = await res.json();
      setResult(data);
      setHistory((prev) => [{ question, result: data }, ...prev]);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
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
    <div className="min-h-screen noise-bg relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">
                GridMind AI
              </h1>
              <p className="text-[11px] text-neutral-500 tracking-wide">
                DECISIONS, ACCELERATED
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] text-neutral-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Hero section - only show when no results */}
        <AnimatePresence mode="wait">
          {!result && history.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="pt-24 pb-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-[11px] text-neutral-400 mb-6"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                Powered by three-way RAG retrieval
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight mb-3">
                Faster decisions,
                <br />
                <span className="text-neutral-500">backed by policy</span>
              </h2>

              <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                Ask anything. Get accurate, source-cited answers in seconds.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar */}
        <motion.div
          layout
          className={`${!result && history.length === 0 ? "pt-4" : "pt-8"} pb-6`}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
            <div className="relative flex items-start gap-3 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl px-5 py-4 group-focus-within:border-white/[0.1] transition-colors duration-300">
              <Search className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask GridMind anything..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none resize-none leading-relaxed"
                style={{ minHeight: "24px", maxHeight: "120px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "24px";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !query.trim()}
                className="shrink-0 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>

          {/* Controls row */}
          <div className="mt-3 flex items-center gap-6">
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
            <div className="flex-1">
              <VerbositySlider value={verbosity} onChange={setVerbosity} />
            </div>
          </div>
        </motion.div>

        {/* Example queries */}
        <AnimatePresence>
          {!result && history.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="pb-12"
            >
              <p className="text-[11px] text-neutral-600 uppercase tracking-widest mb-3">
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((eq, i) => (
                  <motion.button
                    key={eq}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    onClick={() => {
                      setQuery(eq);
                      handleSubmit(eq);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-xs text-neutral-400 hover:text-white hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200"
                  >
                    {eq}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/[0.04] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
                <div className="absolute -inset-3 bg-blue-500/5 rounded-3xl blur-xl animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-300">Searching circulars</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Retrieving from chunks, summaries &amp; titles...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="pb-20"
            >
              {/* Answer card */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
                {/* Answer header */}
                <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-neutral-300">
                      AI Answer
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(result.elapsed_ms / 1000).toFixed(1)}s
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.04]">
                      {result.model_used}
                    </span>
                  </div>
                </div>

                {/* Rewritten query */}
                {result.rewritten_query && (
                  <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/[0.06]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wand2 className="w-3 h-3 text-blue-400/70" />
                      <span className="text-[11px] text-blue-400/70 font-medium">
                        Optimized search query
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {result.rewritten_query}
                    </p>
                  </div>
                )}

                {/* Answer body */}
                <div className="px-6 py-5">
                  <div className="markdown-content text-sm text-neutral-300 leading-relaxed">
                    <ReactMarkdown>{result.answer}</ReactMarkdown>
                  </div>
                </div>

                {/* Share bar */}
                <ShareBar result={result} query={query} />

                {/* Sources */}
                {result.sources.length > 0 && (
                  <SourcesSection sources={result.sources} />
                )}
              </div>

              {/* History */}
              {history.length > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <p className="text-[11px] text-neutral-600 uppercase tracking-widest mb-3">
                    Previous queries
                  </p>
                  <div className="space-y-2">
                    {history.slice(1, 6).map((h, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(h.question);
                          setResult(h.result);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-colors duration-200 group"
                      >
                        <p className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors truncate">
                          {h.question}
                        </p>
                        <p className="text-[11px] text-neutral-600 mt-1">
                          {h.result.sources.length} sources &middot;{" "}
                          {(h.result.elapsed_ms / 1000).toFixed(1)}s
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-neutral-700">
          <span>GridMind AI &middot; Internal Use Only</span>
          <span>Three-way RAG &middot; Gemini</span>
        </div>
      </footer>
    </div>
  );
}

function ShareBar({ result, query }: { result: QueryResult; query: string }) {
  const [copied, setCopied] = useState(false);

  const buildShareText = () => {
    let text = `Q: ${query}\n\n${result.answer}`;
    if (result.sources.length > 0) {
      text += "\n\nSources:";
      for (const s of result.sources) {
        text += `\n• ${s.ref} (${s.date}): ${s.title}`;
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
        await navigator.share({ title: "GridMind AI", text });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="px-6 py-3 border-t border-white/[0.04] flex items-center gap-1">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-all duration-200"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-all duration-200"
      >
        <Share2 className="w-3 h-3" />
        <span>Share</span>
      </button>
    </div>
  );
}

const MODEL_OPTIONS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Gemini" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Groq" },
  { value: "moonshotai/kimi-k2-instruct", label: "Kimi K2 Instruct", provider: "Groq" },
  { value: "moonshotai/kimi-k2-instruct-0905", label: "Kimi K2 0905", provider: "Groq" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B", provider: "Groq" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B", provider: "Groq" },
  { value: "qwen/qwen3-32b", label: "Qwen3 32B", provider: "Groq" },
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
      >
        <Cpu className="w-3.5 h-3.5 text-neutral-500" />
        <span className="text-[11px] text-neutral-400">{current.label}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-600">
          {current.provider}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="w-3 h-3 text-neutral-600" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-white/[0.08] bg-[#111111] shadow-2xl shadow-black/80 overflow-hidden z-50 backdrop-blur-none"
            style={{ backgroundColor: "#111111" }}
          >
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  onChange(m.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-white/[0.04] transition-colors ${
                  m.value === value ? "bg-blue-500/[0.06]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {m.value === value && (
                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                  )}
                  <span
                    className={`text-xs ${
                      m.value === value
                        ? "text-blue-300 font-medium"
                        : "text-neutral-400"
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-600">
                  {m.provider}
                </span>
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

const VERBOSITY_LABELS = ["Brief", "Concise", "Balanced", "Detailed", "Exhaustive"];

function VerbositySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <svg
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5 text-neutral-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="10" y2="8" />
          <line x1="2" y1="12" x2="12" y2="12" />
        </svg>
        <span className="text-[11px] text-neutral-600 w-16">
          {VERBOSITY_LABELS[value - 1]}
        </span>
      </div>
      <div className="relative flex-1 flex items-center h-6 group">
        {/* Track background */}
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/[0.04]" />
        {/* Active track */}
        <div
          className="absolute left-0 h-[3px] rounded-full bg-gradient-to-r from-blue-500/40 to-blue-500/60 transition-all duration-200"
          style={{ width: `${((value - 1) / 4) * 100}%` }}
        />
        {/* Step dots */}
        <div className="absolute inset-x-0 flex justify-between px-[1px]">
          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => onChange(step)}
              className={`w-[7px] h-[7px] rounded-full transition-all duration-200 ${
                step <= value
                  ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"
                  : "bg-white/[0.08] hover:bg-white/[0.15]"
              }`}
            />
          ))}
        </div>
        {/* Native range input (invisible, for drag) */}
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

function SourcesSection({ sources }: { sources: Source[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sources : sources.slice(0, 3);

  return (
    <div className="border-t border-white/[0.04]">
      <div className="px-6 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>
            {sources.length} source{sources.length !== 1 ? "s" : ""}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {(expanded || sources.length <= 3) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 grid gap-2">
              {visible.map((source, i) => (
                <motion.div
                  key={source.doc_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <SourceCard source={source} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  return (
    <div className="group flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
      <div className="w-8 h-8 rounded-lg bg-blue-500/[0.07] border border-blue-500/[0.1] flex items-center justify-center shrink-0 mt-0.5">
        <FileText className="w-3.5 h-3.5 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-neutral-300 truncate">
          {source.ref || "Document"}
        </p>
        <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
          {source.title}
        </p>
        {source.date && (
          <p className="text-[11px] text-neutral-600 mt-0.5">{source.date}</p>
        )}
      </div>
      {source.source_url && (
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.04] text-neutral-600 hover:text-blue-400 transition-colors"
          title="Open PDF"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
