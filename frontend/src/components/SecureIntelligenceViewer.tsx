"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  X, 
  Loader2, 
  AlertCircle, 
  RefreshCcw,
  Maximize2,
  ExternalLink,
  Download,
  BookOpen,
  Monitor
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
    pdfjsLib?: any;
  }
}

/**
 * Clean, unrestricted Document & PDF Viewer
 * Uses native browser PDF rendering as the primary high-fidelity engine
 * (ensuring every single page loads seamlessly with zero memory issues),
 * with a built-in Reader Mode (PDF.js) and Markdown support.
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
  const [viewMode, setViewMode] = useState<"native" | "reader">("native");
  const [totalPages, setTotalPages] = useState<number>(0);
  const [renderedPages, setRenderedPages] = useState<number>(0);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  const rawUrl = source.url || "";
  const lowerUrl = rawUrl.toLowerCase();
  const isMarkdown = lowerUrl.endsWith(".md") || lowerUrl.includes(".md?");
  const proxyUrl = rawUrl ? `/api/pdf-proxy?url=${encodeURIComponent(rawUrl)}` : "";

  // Reset states on source URL change
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(false);
    setErrorDetail("");
    setMdContent(null);
    setTotalPages(0);
    setRenderedPages(0);

    if (!rawUrl || rawUrl.trim() === "") {
      setError(true);
      setErrorDetail("No source URL provided.");
      setLoading(false);
      return;
    }

    if (isMarkdown) {
      loadMarkdownDocument();
    } else {
      if (viewMode === "reader") {
        loadReaderPdf();
      } else {
        // Native iframe mode - loading state resolves on iframe onLoad or timeout
        const timer = setTimeout(() => {
          if (!isCancelled) setLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }

    async function loadMarkdownDocument() {
      try {
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch document`);
        const text = await res.text();
        if (!isCancelled) {
          setMdContent(text);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Markdown load error:", err);
          setError(true);
          setErrorDetail(err?.message || "Failed to load markdown content");
          setLoading(false);
        }
      }
    }

    async function loadReaderPdf() {
      try {
        // Ensure PDF.js CDN is loaded
        if (!window.pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Could not load PDF engine from CDN"));
            document.head.appendChild(script);
          });
        }

        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }

        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch PDF`);
        const data = await res.arrayBuffer();

        if (isCancelled) return;

        const loadingTask = window.pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;

        if (isCancelled) {
          pdf.destroy();
          return;
        }

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setLoading(false);

        // Render pages sequentially into container
        if (canvasContainerRef.current) {
          canvasContainerRef.current.innerHTML = "";
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            if (isCancelled) break;
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.3 });

            const pageWrapper = document.createElement("div");
            pageWrapper.className = "mb-8 flex flex-col items-center bg-white shadow-md rounded-md p-2 ring-1 ring-slate-200/80 max-w-full";

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = "max-w-full h-auto";

            await page.render({ canvasContext: context, viewport }).promise;
            pageWrapper.appendChild(canvas);

            const pageLabel = document.createElement("div");
            pageLabel.className = "mt-2 text-[11px] font-medium text-slate-400";
            pageLabel.textContent = `Page ${pageNum} of ${pdf.numPages}`;
            pageWrapper.appendChild(pageLabel);

            if (canvasContainerRef.current) {
              canvasContainerRef.current.appendChild(pageWrapper);
            }
            setRenderedPages(pageNum);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Reader Mode PDF Error:", err);
          // Auto fallback to native iframe mode if reader mode encountered an issue
          setViewMode("native");
          setLoading(false);
        }
      }
    }

    return () => {
      isCancelled = true;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [rawUrl, isMarkdown, viewMode, retryCount]);

  const handleReload = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden text-slate-200">
      {/* Top Utility Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/80 bg-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0 pr-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-xs truncate" title={source.title}>
                {source.title || "Document Viewer"}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {isMarkdown ? "Markdown Summary" : totalPages > 0 ? `${totalPages} Pages` : "Official Regulatory Docket"}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Switch (for PDFs) */}
            {!isMarkdown && (
              <button
                onClick={() => setViewMode(prev => prev === "native" ? "reader" : "native")}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 border border-slate-600/60"
                title={viewMode === "native" ? "Switch to Reader Canvas Mode" : "Switch to Standard Interactive PDF Viewer"}
              >
                {viewMode === "native" ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reader View</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Standard View</span>
                  </>
                )}
              </button>
            )}

            {/* Direct Open in New Tab */}
            <a
              href={proxyUrl || rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/80 rounded-lg transition-all"
              title="Open Document in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Direct Download */}
            <a
              href={proxyUrl || rawUrl}
              download={`${source.title || "document"}.pdf`}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80 rounded-lg transition-all"
              title="Download Document"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Reload */}
            <button
              onClick={handleReload}
              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/80 rounded-lg transition-all"
              title="Reload Document"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Fullscreen Toggle */}
            {!isFullscreen && onMaximize && (
              <button
                onClick={onMaximize}
                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/80 rounded-lg transition-all"
                title="Fullscreen View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded-lg transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Close Viewer"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Viewer Body */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-20 pointer-events-none">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <p className="text-xs uppercase font-semibold tracking-wider text-slate-200">
              Loading Document...
            </p>
          </div>
        )}

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900 m-4 rounded-xl border border-slate-800">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Document Unavailable</h4>
            <p className="text-xs text-slate-400 mb-3 max-w-sm">
              The remote source could not be loaded directly into the inline viewer.
            </p>
            {errorDetail && (
              <p className="text-[10px] text-slate-500 mb-4 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 font-mono max-w-md break-all">
                {errorDetail}
              </p>
            )}
            <div className="flex gap-2.5 flex-wrap justify-center">
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Source Link Directly
              </a>
              <button 
                onClick={handleReload}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-xs font-semibold border border-slate-700"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          </div>
        ) : isMarkdown ? (
          <div className="flex-1 overflow-auto p-6 md:p-8 bg-slate-900">
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 text-slate-200 prose prose-invert prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {mdContent || ""}
              </ReactMarkdown>
            </div>
          </div>
        ) : viewMode === "reader" ? (
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center bg-slate-900 custom-scrollbar">
            <div ref={canvasContainerRef} className="w-full max-w-3xl flex flex-col items-center" />
          </div>
        ) : (
          <div className="w-full h-full flex-1 bg-white relative">
            <iframe
              src={proxyUrl}
              title={source.title}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
            />
          </div>
        )}
      </div>

      {/* Regulatory & Disclaimer Footer */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 shrink-0 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2 overflow-hidden">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="truncate">
            <span className="font-semibold text-amber-400 mr-1">Regulatory Context:</span>
            Synthesized from authenticated WBSEDCL/WBERC circular records. Always verify against original gazettes.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Use</Link>
        </div>
      </div>
    </div>
  );
}
