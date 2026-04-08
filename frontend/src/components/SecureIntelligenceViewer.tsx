"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  X, 
  Lock, 
  Loader2, 
  AlertCircle, 
  RefreshCcw,
  Maximize2,
  Minimize2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface Source {
  url: string;
  title: string;
}

interface SecureIntelligenceViewerProps {
  source: Source;
  onClose: () => void;
  onMaximize?: () => void;
  hideHeader?: boolean;
  isFullscreen?: boolean;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

/**
 * Secure Intelligence Viewer
 * Custom Canvas-based renderer with Lazy-Loading and No-Download security.
 * Shared across AI Query and Explorer modules.
 */
export default function SecureIntelligenceViewer({ 
  source, 
  onClose,
  onMaximize,
  hideHeader = false,
  isFullscreen = false
}: SecureIntelligenceViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [mdContent, setMdContent] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // Reset scroll to top on every source change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    if (!source.url || source.url.trim() === "") {
      setError(true);
      setLoading(false);
      return;
    }

    // Normalize archival link for raw binary retrieval (e.g. GitHub Blobs)
    let rawUrl = source.url;
    if (rawUrl.includes('github.com') && rawUrl.includes('/blob/')) {
      rawUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    // Keep markdown detection strict to avoid misclassifying GitHub-hosted PDFs.
    const lowerRawUrl = rawUrl.toLowerCase();
    const isMd = lowerRawUrl.endsWith('.md') || lowerRawUrl.includes('.md?');

    if (isMd) {
      loadMd(rawUrl);
    } else {
      // 1. Ensure PDF.js is loaded from CDN
      if (!window.pdfjsLib) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => { 
          if (!isCancelled && window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            loadPdf(rawUrl); 
          }
        };
        document.head.appendChild(script);
      } else {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        loadPdf(rawUrl);
      }
    }

    async function loadMd(url: string) {
      if (isCancelled) return;
      setLoading(true);
      setError(false);
      setErrorDetail("");
      setMdContent(null);
      try {
        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Failed to fetch markdown");
        const text = await res.text();
        if (!isCancelled) {
          setMdContent(text);
          setLoading(false);
        }
      } catch (e) {
        if (!isCancelled) {
          const errorMsg = e instanceof Error ? e.message : "Failed to fetch markdown";
          console.error("MD Load Error:", e);
          setLoading(false);
          setError(true);
          setErrorDetail(errorMsg);
        }
      }
    }

    async function loadPdf(url: string) {
      if (isCancelled) return;
      setLoading(true);
      setError(false);
      setErrorDetail("");
      setMdContent(null);
      try {
        const pdfjsLib = window.pdfjsLib;
        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        
        // 1. Fetch manually to check for error codes/HTML redirects before worker sees them
        const res = await fetch(proxyUrl);
        if (!res.ok) {
           const errorText = await res.text();
           throw new Error(errorText || `Remote fetch failed with status ${res.status}`);
        }
        
        // 2. Capture as binary arrayBuffer for direct PDF.js rendering
        const data = await res.arrayBuffer();
        if (isCancelled) return;
        
        // Load the document via the validated binary buffer
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        if (isCancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        
        if (containerRef.current) {
          containerRef.current.innerHTML = ""; // Clear
          
          if (observerRef.current) observerRef.current.disconnect();

          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.getAttribute("data-page") || "1");
                const hasRendered = entry.target.getAttribute("data-hit") === "true";
                if (!hasRendered && !isCancelled) {
                  renderPage(pageNum, entry.target as HTMLDivElement);
                }
              }
            });
          }, { root: containerRef.current.parentElement, rootMargin: "800px", threshold: 0.1 });
          
          observerRef.current = observer;

          async function renderPage(
            pageNum: number,
            container: HTMLDivElement,
            options?: { scale?: number; upgradeToScale?: number }
          ) {
            if (!pdfRef.current || isCancelled) return;
            container.setAttribute("data-hit", "true");
            try {
              const page = await pdfRef.current.getPage(pageNum);
              if (isCancelled || !pdfRef.current) return;

              const renderScale = options?.scale ?? 1.5;
              const viewport = page.getViewport({ scale: renderScale });
              
              const canvas = document.createElement("canvas");
              canvas.className = "shadow-2xl bg-white max-w-full rounded-sm ring-1 ring-slate-200/50 transition-opacity duration-300 opacity-0";
              const context = canvas.getContext("2d");
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({ canvasContext: context, viewport }).promise;
              if (isCancelled) return;

              container.innerHTML = "";
              container.appendChild(canvas);
              setTimeout(() => canvas.classList.remove("opacity-0"), 50);

              // Render first page quickly at lower scale, then silently upgrade quality.
              if (options?.upgradeToScale && options.upgradeToScale > renderScale) {
                setTimeout(() => {
                  if (!isCancelled && pdfRef.current) {
                    renderPage(pageNum, container, { scale: options.upgradeToScale });
                  }
                }, 120);
              }
            } catch (e) {
              console.error(`Page ${pageNum} render fail:`, e);
              container.setAttribute("data-hit", "false"); 
              container.innerHTML = `
                <div class="flex flex-col items-center gap-3 p-8 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl">
                  <div class="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                  <div class="text-center">
                    <p class="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Page ${pageNum} Error</p>
                    <p class="text-[9px] text-white/40 max-w-[150px] leading-relaxed">Could not render security segments.</p>
                  </div>
                  <button class="mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ring-1 ring-white/10 retry-btn">
                    Recalibrate Page
                  </button>
                </div>
              `;
              const retryBtn = container.querySelector(".retry-btn");
              if (retryBtn) {
                retryBtn.addEventListener("click", (evt) => {
                  evt.stopPropagation();
                  renderPage(pageNum, container);
                });
              }
            }
          }

          // Initialize all page placeholders
          for (let i = 1; i <= pdf.numPages; i++) {
            const pageDiv = document.createElement("div");
            pageDiv.setAttribute("data-page", i.toString());
            pageDiv.className = "mb-10 w-full flex items-center justify-center min-h-[800px] bg-slate-800/10 rounded-xl transition-all duration-500 overflow-hidden border border-white/5";
            
            pageDiv.innerHTML = `
              <div class="flex flex-col items-center gap-3">
                <div class="w-6 h-6 border-2 border-white/20 border-t-white/40 rounded-full animate-spin"></div>
                <span class="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">Page ${i}</span>
              </div>
            `;

            containerRef.current.appendChild(pageDiv);
            observer.observe(pageDiv);
            
            if (i === 1) {
              renderPage(i, pageDiv, { scale: 0.9, upgradeToScale: 1.5 });
            } else if (i === 2) {
              renderPage(i, pageDiv, { scale: 1.2 });
            }
          }
        }
        setLoading(false);
      } catch (e: any) {
        if (!isCancelled) {
          const errorMsg = e?.message || String(e) || "Unknown error occurred";
          console.error("Custom Previewer Error:", e);
          setLoading(false);
          setError(true);
          setErrorDetail(errorMsg);
        }
      }
    }

    return () => {
      isCancelled = true;
      if (observerRef.current) observerRef.current.disconnect();
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      }
    };
  }, [source.url, retryCount]);

  const handleReload = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <>
      {/* Header */}
      {!hideHeader && (
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
            <button
              onClick={handleReload}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              disabled={loading}
              title="Reload Document"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            {!isFullscreen && onMaximize && (
              <button
                onClick={onMaximize}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Fullscreen View (F)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
              title={isFullscreen ? "Exit Fullscreen (ESC)" : "Close Viewer"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Security Banner */}
      <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 flex items-center gap-3 select-none">
        <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <p className="text-[10px] leading-tight text-rose-900 font-bold uppercase tracking-wider">
           Secure View: Read-only intelligence strictly prohibited from download or distribution.
        </p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-700 relative overflow-auto custom-scrollbar p-6" 
        onContextMenu={(e) => e.preventDefault()}
      >
        {loading && !error && !pdfRef.current && !mdContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-white">Synthesizing Preview...</p>
          </div>
        )}

        {error && !pdfRef.current && !mdContent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-full rounded-2xl shadow-inner border border-slate-200 mx-6 my-6">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Preview Unavailable</h4>
            <p className="text-[10px] text-slate-500 mb-3 max-w-xs leading-relaxed uppercase tracking-wider font-bold">
              Could not load document preview.
            </p>
            {errorDetail && (
              <p className="text-[9px] text-slate-600 mb-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono max-w-sm">
                {errorDetail}
              </p>
            )}
            <div className="flex gap-3 flex-wrap justify-center">
              <button 
                onClick={handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95 font-semibold text-sm"
                title="Retry loading preview"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Retry
              </button>
            </div>
          </div>
        ) : mdContent ? (
          <div className="markdown-content max-w-4xl mx-auto bg-white p-12 rounded-2xl shadow-2xl min-h-full">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {mdContent}
             </ReactMarkdown>
          </div>
        ) : (
          <div ref={containerRef} className="flex flex-col items-center select-none" />
        )}
      </div>

      {/* Global Regulatory Disclaimer Footer */}
      <div className="bg-slate-900 border-t border-white/10 px-4 py-3 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.3)] select-none">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] leading-relaxed text-slate-400">
            <span className="font-bold text-amber-500 uppercase tracking-wider mr-1">Legal Disclaimer:</span>
            This response is synthesized by AI using available WBSEDCL/WBERC documents. It does <span className="text-white font-bold underline decoration-amber-500/50 underline-offset-2">NOT</span> constitute legal advice or an official interpretation. For legal purposes, please refer only to the Original Gazette or the official authority website. Read our <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30">Privacy Policy</Link> and <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30">Terms of Use</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
