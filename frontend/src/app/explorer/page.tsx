"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, BookOpen, FileText, Settings, X, ChevronRight, Sparkles, Loader2, ArrowLeft, AlertCircle, ShieldCheck, Book, Calendar, Hash, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, category);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [query, category, performSearch]);

  const displayedGroups = groupedResults.slice(0, visibleDocsCount);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
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

          <div className="flex-1 max-w-2xl relative group">
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
              placeholder="Search regulations, technical specs, acts..."
              className="w-full h-12 pl-12 pr-4 bg-slate-100 border-none rounded-2xl text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-inner"
            />
            <AnimatePresence>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-10">
        
        {/* --- Sidebar Filters --- */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-8">
          <div>
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Filters
            </h4>
            <div className="flex flex-col gap-2">
              <FilterButton active={category === "all"} label="All Documents" onClick={() => setCategory("all")} />
              <FilterButton active={category === "regulations"} label="Regulations" onClick={() => setCategory("regulations")} />
              <FilterButton active={category === "ts"} label="Tech Specs" onClick={() => setCategory("ts")} />
              <FilterButton active={category === "acts"} label="Related Acts" onClick={() => setCategory("acts")} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <Sparkles className="absolute top-2 right-2 w-12 h-12 text-white/10 group-hover:scale-110 transition-transform" />
            <h5 className="text-xs font-black uppercase tracking-widest mb-2">Power Search</h5>
            <p className="text-[10px] leading-relaxed text-indigo-100 font-medium">Looking for something specific? GridMind Explorer uses Full Text Search to find exact matches across thousands of clauses instantly.</p>
          </div>
        </aside>

        {/* --- Results Feed --- */}
        <section className="flex-1 min-w-0">
          {!query && category === "all" ? (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
              <BookOpen className="w-16 h-16 text-slate-300 mb-6" />
              <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">Ready to explore</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs">Search the entire library for matching documents.</p>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col">
              {/* Search Diagnostics */}
              <div className="mb-6 pb-2 text-[13px] text-slate-400 font-normal italic">
                About {totalMatches} results ({searchTime.toFixed(2)} seconds)
              </div>

              <div className="flex flex-col">
                <AnimatePresence mode="popLayout">
                  {displayedGroups.map((g) => (
                    <GoogleResultGroup 
                      key={g.doc_id} 
                      group={g} 
                      query={query} 
                      onClick={(res) => setSelectedResult(res)} 
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
        </section>
      </main>

      {/* --- Side Drawer Preview --- */}
      <AnimatePresence>
        {selectedResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResult(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 shrink-0">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Preview Mode</span>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-1">
                    <HighlightText text={selectedResult.title} highlight={query} />
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all ml-4 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 markdown-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</p>,
                    li: ({ children }) => <li>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</li>,
                    h1: ({ children }) => <h1>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</h1>,
                    h2: ({ children }) => <h2>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</h2>,
                    h3: ({ children }) => <h3>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</h3>,
                    h4: ({ children }) => <h4>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</h4>,
                    td: ({ children }) => <td>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</td>,
                    th: ({ children }) => <th>{React.Children.map(children, c => typeof c === "string" ? <HighlightText text={c} highlight={query} /> : c)}</th>
                  }}
                >
                  {selectedResult.content}
                </ReactMarkdown>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Source File</span>
                   <button 
                     onClick={() => setViewingSource({ url: selectedResult.source_url, title: selectedResult.title })}
                     className="text-[11px] font-bold text-blue-600 hover:text-blue-700 text-left underline underline-offset-2 transition-colors max-w-sm truncate"
                   >
                     {selectedResult.ref || "View Original Document"}
                   </button>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Done Reading
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- PDF Viewer Overlay --- */}
      <AnimatePresence>
        {viewingSource && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[80]"
              onClick={() => setViewingSource(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-6 md:inset-12 bg-white rounded-3xl shadow-2xl z-[90] flex flex-col overflow-hidden border border-white/20"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 line-clamp-1">{viewingSource.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tactical Reference Archive</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSource(null)}
                  className="p-2.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Legal Warning Banner */}
              <div className="bg-amber-50 px-8 py-2.5 border-b border-amber-100 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">
                  Not an official copy. For legal purposes, refer to the Original Gazette or official authority website.
                </p>
              </div>

              <div className="flex-1 bg-slate-100 relative">
                {iframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing PDF...</p>
                  </div>
                )}
                
                <div className="w-full h-full relative">
                  <iframe
                    src={normalizedUrl}
                    className="w-full h-full border-none"
                    onLoad={() => setIframeLoading(false)}
                    onError={() => { setIframeLoading(false); setIframeError(true); }}
                  />
                  {/* Blind overlay to hide Google Docs Viewer pop-out button */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-transparent z-20 cursor-default" />
                </div>
              </div>

              {/* Takedown Notice Overlay */}
              <div className="bg-slate-900 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Subject to Community Upload Safe Harbor conditions
                  </span>
                </div>
                <div className="text-[10px] font-black text-blue-400 tracking-widest uppercase opacity-40">
                  GridMind Secure Viewer
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
