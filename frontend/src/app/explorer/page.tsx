"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, BookOpen, FileText, Settings, X, ChevronRight, Sparkles, Loader2, ArrowLeft, AlertCircle, ShieldCheck, Book, Calendar, Hash, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

const SecureIntelligenceViewer = dynamic(() => import("@/components/SecureIntelligenceViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 relative pointer-events-none select-none h-full">
       <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-sm z-0" />
       <div className="relative z-10 flex flex-col items-center gap-4">
         <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin shadow-lg" />
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Initializing Secure Sandbox...</p>
       </div>
    </div>
  )
});

// --- Types ---
interface SearchResult {
  id: string;
  doc_id: string;
  title: string;
  content: string;
  ref: string;
  date: string;
  source_url: string;
  rank: number;
}

interface DocumentGroup {
  doc_id: string;
  title: string;
  ref: string;
  date: string;
  source_url: string;
  chunks: SearchResult[];
}

// --- Components ---

const HighlightText = ({ text, highlight }: { text: string; highlight: string | null }) => {
  if (!highlight || !highlight.trim()) return <>{text}</>;
  
  // Clean query and split into terms
  const rawTerms = highlight.trim().split(/\s+/).filter(t => t.length > 2);
  
  // Create an expanded list of terms (Singular/Plural)
  const expandedTerms = new Set<string>();
  rawTerms.forEach(t => {
    expandedTerms.add(t);
    // If plural "s", also match singular
    if (t.toLowerCase().endsWith('s') && t.length > 3) {
      expandedTerms.add(t.slice(0, -1));
    }
  });

  const terms = Array.from(expandedTerms).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) return <>{text}</>;
  
  const regex = new RegExp(`(${terms.sort((a,b) => b.length - a.length).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => (
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </>
  );
};

const FilterButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
      active
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
        : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
    }`}
  >
    {label}
  </button>
);

const GoogleResultGroup = ({ group, query, onClick }: { group: DocumentGroup; query: string; onClick: (result: SearchResult) => void }) => {
  const primaryMatch = group.chunks[0];
  const otherMatchesCount = group.chunks.length - 1;
  const cleanSnippet = primaryMatch.content
    .replace(/\|/g, " ")
    .replace(/-{2,}/g, " ")
    .replace(/\s+/g, " ")
    .substring(0, 180) + "...";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group mb-8 max-w-2xl px-2"
    >
      {/* Google-style Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500 overflow-hidden whitespace-nowrap">
        <span className="font-bold text-green-800/80">{group.ref || "Regulation"}</span>
        <span className="opacity-40 italic">›</span>
        <span className="truncate opacity-70">GridMind › {group.title.substring(0, 40)}...</span>
        <span className="opacity-40 italic">›</span>
        <span className="opacity-60">{group.date || "2026"}</span>
      </div>

      {/* Google-style Title (Blue, underlined on hover) */}
      <button
        onClick={() => onClick(primaryMatch)}
        className="block text-lg font-medium text-[#1a0dab] hover:underline mb-1 text-left decoration-1 underline-offset-[3px] leading-snug"
      >
        <HighlightText text={group.title} highlight={query} />
      </button>

      {/* Snippet with highlighting */}
      <p className="text-[13px] leading-relaxed text-[#4d5156] mb-2 line-clamp-2">
        <HighlightText text={cleanSnippet} highlight={query} />
      </p>

      {/* Matches Indicator */}
      {otherMatchesCount > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <div className="h-4 w-4 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Hash className="w-2.5 h-2.5 text-slate-400" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {otherMatchesCount} more related {otherMatchesCount === 1 ? 'fragment' : 'fragments'} in this document
          </span>
          <button 
            onClick={() => onClick(primaryMatch)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest ml-2"
          >
            Explore All
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("all");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [viewingSource, setViewingSource] = useState<{ url: string; title: string } | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [visibleDocsCount, setVisibleDocsCount] = useState(3);
  const [searchTime, setSearchTime] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [splitRatio, setSplitRatio] = useState(100); // 100 means no split
  const [explorerView, setExplorerView] = useState<"analysis" | "source">("analysis");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // --- Grouping Logic ---
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, DocumentGroup> = {};
    results.forEach(r => {
      const id = r.doc_id || r.title;
      if (!groups[id]) {
        groups[id] = {
          doc_id: id,
          title: r.title,
          ref: r.ref,
          date: r.date,
          source_url: r.source_url,
          chunks: []
        };
      }
      groups[id].chunks.push(r);
    });
    // Sort groups by the highest rank of their first chunk
    return Object.values(groups).sort((a, b) => b.chunks[0].rank - a.chunks[0].rank);
  }, [results]);

  // --- PDF Logic ---
  const normalizedUrl = React.useMemo(() => {
    if (!viewingSource?.url) return "";
    let url = viewingSource.url;
    // GitHub Blob → Raw
    if (url.includes('github.com') && url.includes('/blob/')) {
      url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    // Wrap in Google Viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }, [viewingSource]);

  // --- History Management ---
  useEffect(() => {
    const saved = localStorage.getItem("gridmind_explorer_history");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved).slice(0, 10));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const addToHistory = useCallback((q: string) => {
    if (!q || q.trim().length < 3) return;
    setSearchHistory(prev => {
      const cleanQ = q.trim();
      const filtered = prev.filter(item => item.toLowerCase() !== cleanQ.toLowerCase());
      const newHistory = [cleanQ, ...filtered].slice(0, 12);
      localStorage.setItem("gridmind_explorer_history", JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("gridmind_explorer_history");
    setSearchHistory([]);
  };

  const removeFromHistory = (itemToRemove: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(it => it !== itemToRemove);
      localStorage.setItem("gridmind_explorer_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  useEffect(() => {
    if (viewingSource) {
      setIframeLoading(true);
      setIframeError(false);
      const timer = setTimeout(() => {
        setIframeLoading(false); // Fallback if it takes too long
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [viewingSource]);

  // --- Search Logic with Debounce ---
  const performSearch = useCallback(async (q: string, cat: string) => {
    if (!q && cat === "all") {
      setResults([]);
      setVisibleDocsCount(3);
      return;
    }
    setLoading(true);
    const start = performance.now();
    try {
      const resp = await fetch(`/api/explorer/search?q=${encodeURIComponent(q)}&category=${cat}`);
      const data = await resp.json();
      const end = performance.now();
      setSearchTime((end - start) / 1000);
      
      // Sort: Rank (desc) then Date (desc)
      const sortedResults = (data.results || []).sort((a: any, b: any) => {
        if (b.rank !== a.rank) return b.rank - a.rank;
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

      setResults(sortedResults);
      setTotalMatches(sortedResults.length);
      setVisibleDocsCount(3);
      if (q) addToHistory(q);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [addToHistory]);

  const handleSearchClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(query, category);
  };

  // Re-trigger search automatically ONLY when category changes
  useEffect(() => {
    performSearch(query, category);
  }, [category, performSearch]);

  // --- Instant Intelligence Pre-fetching for Explorer ---
  useEffect(() => {
    if (results.length > 0) {
      // Pre-fetch top 5 results to the proxy cache
      const topResults = results.slice(0, 5);
      topResults.forEach(res => {
        if (!res.source_url) return;
        
        let rawUrl = res.source_url;
        if (rawUrl.includes('github.com') && rawUrl.includes('/blob/')) {
          rawUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(rawUrl)}`;
        fetch(proxyUrl).catch(() => {}); // SILENT background cache populator
      });
    }
  }, [results]);

  const displayedGroups = groupedResults.slice(0, visibleDocsCount);

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      
      {/* --- Static Global Header (Fixed) --- */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 z-50 shadow-sm relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                GridMind <span className="text-blue-600">Explorer</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">Live</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Search with keywords</p>
            </div>
          </div>

          <form 
            onSubmit={handleSearchClick}
            className="flex-1 max-w-2xl relative group"
          >
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              {loading ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search regulations (e.g. WBSEDCL acts, metering specs...)"
              className="w-full h-12 pl-12 pr-28 bg-slate-100 border-none rounded-2xl text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-inner"
            />
            <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1">
              <AnimatePresence>
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </AnimatePresence>
              <button
                type="submit"
                className="h-full px-5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* --- Sidebar History --- */}
        <aside className="w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white p-6 overflow-y-auto custom-scrollbar">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <Book className="w-3 h-3" /> Recent Searches
              </h4>
              <button 
                onClick={clearHistory}
                className="text-[9px] font-bold text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors"
                title="Clear all history"
              >
                Clear All
              </button>
            </div>
            
            {searchHistory.length > 0 ? (
              <div className="flex flex-col gap-1">
                {searchHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    className="group/item flex items-center justify-between relative"
                  >
                    <button
                      onClick={() => setQuery(item)}
                      className="flex-1 text-left py-2 px-3 rounded-xl hover:bg-blue-50 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-all truncate"
                    >
                      {item}
                    </button>
                    <button
                      onClick={() => removeFromHistory(item)}
                      className="absolute right-2 opacity-0 group-hover/item:opacity-40 hover:opacity-100 p-1 text-slate-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 text-center font-bold tracking-tight">Your search path is currently empty.</p>
              </div>
            )}
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <Sparkles className="absolute top-2 right-2 w-12 h-12 text-white/10 group-hover:scale-110 transition-transform" />
            <h5 className="text-xs font-black uppercase tracking-widest mb-2">Power Search</h5>
            <p className="text-[10px] leading-relaxed text-indigo-100 font-medium leading-tight">Looking for something specific? Explorer uses Full Text Search to find exact clauses.</p>
          </div>
        </aside>

        {/* --- Results Section --- */}
        <div 
          className="flex flex-col border-r border-slate-200 bg-slate-50 overflow-hidden transition-all duration-500 ease-in-out"
          style={{ width: `${splitRatio}%` }}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-4xl mx-auto">
              {!query && category === "all" ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <BookOpen className="w-16 h-16 text-slate-300 mb-6" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">Ready to explore</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs">Search the entire library for matching documents.</p>
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col">
                  {/* Search Diagnostics */}
                  <div className="mb-6 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>About {totalMatches} results ({searchTime.toFixed(2)} seconds)</span>
                    <Filter className="w-3.5 h-3.5 opacity-40" />
                  </div>

                  <div className="flex flex-col">
                    <AnimatePresence mode="popLayout">
                      {displayedGroups.map((g) => (
                        <GoogleResultGroup 
                          key={g.doc_id} 
                          group={g} 
                          query={query} 
                          onClick={(res) => {
                            setSelectedResult(res);
                            setSplitRatio(45);
                            setExplorerView("analysis");
                          }} 
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {groupedResults.length > visibleDocsCount && (
                    <button
                      onClick={() => setVisibleDocsCount(prev => prev + 3)}
                      className="w-fit px-8 py-3 mt-4 rounded-xl hover:bg-slate-100 text-blue-600 text-[11px] font-black uppercase tracking-[0.2em] border border-blue-50 hover:border-blue-100 transition-all group flex items-center gap-3 shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                      View More Documents
                    </button>
                  )}
                </div>
              ) : !loading && (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <X className="w-12 h-12 text-slate-300 mb-6" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">No matches found</h3>
                  <p className="text-xs text-slate-500 font-medium">Try broader keywords or check your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Preview Canvas Section --- */}
        <AnimatePresence>
          {splitRatio < 100 && selectedResult && (
            <motion.div 
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="flex flex-col bg-white border-l border-slate-200 overflow-hidden relative"
              style={{ width: `${100 - splitRatio}%` }}
            >
              {/* Internal Navigation Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl">
                  <button
                    onClick={() => setExplorerView("analysis")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      explorerView === "analysis" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Analysis
                  </button>
                  <button
                    onClick={() => setExplorerView("source")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      explorerView === "source" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Source PDF
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSplitRatio(100);
                    setSelectedResult(null);
                  }}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden relative flex flex-col">
                {explorerView === "analysis" ? (
                  <div className="flex-1 overflow-y-auto p-10 markdown-content bg-white h-full selection:bg-blue-100">
                    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                      <div className="mb-8 pb-6 border-b border-slate-100">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-2">Selected Part</span>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                           {selectedResult.title}
                        </h2>
                      </div>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-4 text-slate-700 leading-relaxed">{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</p>,
                        }}
                      >
                        {selectedResult.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <SecureIntelligenceViewer 
                    source={{ url: selectedResult.source_url, title: selectedResult.title }}
                    onClose={() => setExplorerView("analysis")}
                    hideHeader={true}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
