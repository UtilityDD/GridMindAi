import { NextRequest, NextResponse } from "next/server";
import gridMindRepoFiles from "@/lib/github-gridmind-files.json";

export const dynamic = "force-dynamic";

const RESOLVED_URL_CACHE = new Map<string, string>();
const CACHE_MAX_ENTRIES = 500;

function setResolvedUrlCache(key: string, value: string) {
  if (RESOLVED_URL_CACHE.has(key)) {
    RESOLVED_URL_CACHE.delete(key);
  }
  RESOLVED_URL_CACHE.set(key, value);
  if (RESOLVED_URL_CACHE.size > CACHE_MAX_ENTRIES) {
    const firstKey = RESOLVED_URL_CACHE.keys().next().value;
    if (firstKey) RESOLVED_URL_CACHE.delete(firstKey);
  }
}

function cleanFilenameForMatching(name: string): string {
  return decodeURIComponent(name)
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]/g, "");
}

function findGridMindRepoMatch(filename: string): string | null {
  const targetClean = cleanFilenameForMatching(filename);
  if (!targetClean) return null;

  for (const path of gridMindRepoFiles as string[]) {
    const fileClean = cleanFilenameForMatching(path);
    if (fileClean === targetClean) {
      return path;
    }
  }
  return null;
}

function normalizeGitHubPdfUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com" && (parsed.pathname.includes("/blob/") || parsed.pathname.includes("/raw/"))) {
      const rawPath = parsed.pathname.replace("/blob/", "/").replace("/raw/", "/");
      return `https://raw.githubusercontent.com${rawPath}${parsed.search}`;
    }
  } catch {
    // ignore invalid URLs and return original
  }
  return url;
}

function hasPdfSignature(data: ArrayBuffer): boolean {
  const bytes = new Uint8Array(data.slice(0, 1024));
  for (let i = 0; i <= bytes.length - 4; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 // F
    ) {
      return true;
    }
  }
  return false;
}

function extractRawGitHubUrlFromHtml(html: string): string | null {
  const rawUrlMatch = html.match(new RegExp('"rawUrl"\\s*:\\s*"(https:\\\\/\\\\/raw\\.githubusercontent\\.com[^"]+)"', "i"));
  if (rawUrlMatch?.[1]) {
    return rawUrlMatch[1].replace(/\\\//g, "/");
  }

  const hrefMatch = html.match(/href="(\/[^\"]+\/raw\/[^"]+)"/i);
  if (hrefMatch?.[1]) {
    return `https://github.com${hrefMatch[1]}`;
  }

  return null;
}

function buildCandidateUrls(rawUrl: string): string[] {
  const candidates: string[] = [];
  const add = (candidate: string | null | undefined) => {
    if (!candidate) return;
    const trimmed = candidate.trim();
    if (trimmed && !candidates.includes(trimmed)) {
      candidates.push(trimmed);
    }
  };

  const cached = RESOLVED_URL_CACHE.get(rawUrl);
  if (cached) add(cached);

  // 1. Check if this is a smartlinemanapp/GridMind repo document
  if (rawUrl.includes("smartlinemanapp/GridMind")) {
    const parts = rawUrl.split("/");
    const lastPart = parts[parts.length - 1]?.split("?")[0]?.split("#")[0] || "";
    
    // Fuzzy match against known repository tree files
    const matchedPath = findGridMindRepoMatch(lastPart);
    if (matchedPath) {
      add(`https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/${encodeURIComponent(matchedPath).replace(/%2F/g, "/")}`);
    }

    // Try underscore-to-space converted variation
    if (lastPart.includes("_")) {
      const spaceVariation = lastPart.replace(/_+/g, " ");
      const matchSpace = findGridMindRepoMatch(spaceVariation);
      if (matchSpace) {
        add(`https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/${encodeURIComponent(matchSpace).replace(/%2F/g, "/")}`);
      }
      add(`https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/${encodeURIComponent(spaceVariation)}`);
    }
  }

  // 2. Fix www.tssawbseb.com DNS anomaly (domain only responds on root without www)
  if (rawUrl.includes("www.tssawbseb.com")) {
    add(rawUrl.replace("www.tssawbseb.com", "tssawbseb.com"));
    add(rawUrl.replace("www.tssawbseb.com", "tssawbseb.com").replace("http://", "https://"));
  }

  // 3. GitHub direct raw conversions
  const normalized = normalizeGitHubPdfUrl(rawUrl);
  add(normalized);

  // 4. Underscore-to-space fallback on raw URL
  if (normalized.includes("_")) {
    add(normalized.replace(/_+/g, "%20"));
  }

  // 5. HTTPS <-> HTTP fallbacks
  if (rawUrl.startsWith("http://")) {
    add(rawUrl.replace("http://", "https://"));
  } else if (rawUrl.startsWith("https://")) {
    add(rawUrl.replace("https://", "http://"));
  }

  // Only add rawUrl if it's not a github blob (since blob HTML returns 503/429)
  if (!rawUrl.includes("github.com") || !rawUrl.includes("/blob/")) {
    add(rawUrl);
  }

  return candidates;
}

/**
 * GridMind Document & PDF Proxy
 * Bypasses CORS, handles remote domain quirks (like tssawbseb.com DNS),
 * fuzzy-matches repository file paths to avoid 404/503 errors,
 * and serves clean inline streams with no arbitrary restrictions.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing URL", { status: 400 });

  const candidateUrls = buildCandidateUrls(url);
  const isMarkdownRequested = url.toLowerCase().endsWith(".md") || url.toLowerCase().includes(".md?");

  try {
    let lastError = "Failed to fetch document from remote source";

    for (const candidateUrl of candidateUrls) {
      try {
        const res = await fetch(candidateUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: isMarkdownRequested ? "text/plain,text/markdown,*/*" : "application/pdf,*/*",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          lastError = `Remote source returned status ${res.status}`;
          // If 503, 429, or 404, continue to next candidate URL without giving up
          continue;
        }

        const fetchedContentType = (res.headers.get("Content-Type") || "").toLowerCase();
        const data = await res.arrayBuffer();

        // Check if remote returned HTML error page instead of PDF
        const initialText = new TextDecoder().decode(new Uint8Array(data.slice(0, 300))).trimStart().toLowerCase();
        const isHtml = fetchedContentType.includes("text/html") || initialText.startsWith("<htm") || initialText.startsWith("<!do");

        if (isHtml) {
          // If GitHub blob returned HTML, attempt to extract embedded raw URL
          const html = new TextDecoder().decode(new Uint8Array(data));
          const extractedRaw = extractRawGitHubUrlFromHtml(html);
          if (extractedRaw && !candidateUrls.includes(extractedRaw)) {
            candidateUrls.push(extractedRaw);
          }
          lastError = "Remote source returned HTML instead of PDF binary";
          continue;
        }

        // Markdown handling
        if (isMarkdownRequested || fetchedContentType.includes("text/markdown") || fetchedContentType.includes("text/plain")) {
          const headers = new Headers();
          headers.set("Content-Type", "text/markdown; charset=utf-8");
          headers.set("Content-Disposition", "inline");
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
          setResolvedUrlCache(url, candidateUrl);
          return new NextResponse(data, { headers });
        }

        // PDF validation: either has %PDF signature, or content-type is pdf, or URL is a .pdf and response is binary
        const isPdfBySig = hasPdfSignature(data);
        const isPdfByMime = fetchedContentType.includes("application/pdf") || fetchedContentType.includes("application/octet-stream");
        const isPdfByExt = candidateUrl.toLowerCase().includes(".pdf") || url.toLowerCase().includes(".pdf");

        if (!isPdfBySig && !isPdfByMime && !isPdfByExt) {
          lastError = `Remote document did not match PDF format (type=${fetchedContentType})`;
          continue;
        }

        const headers = new Headers();
        headers.set("Content-Type", "application/pdf");
        headers.set("Content-Disposition", "inline");
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

        setResolvedUrlCache(url, candidateUrl);
        return new NextResponse(data, { headers });
      } catch (err: any) {
        lastError = err?.message || String(err);
        continue;
      }
    }

    throw new Error(lastError);
  } catch (e) {
    console.error("GridMind PDF Proxy Error:", e);
    return new NextResponse(`Proxy error: ${e instanceof Error ? e.message : String(e)}`, { status: 502 });
  }
}
