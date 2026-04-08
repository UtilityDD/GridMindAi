import { NextRequest, NextResponse } from "next/server";

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

function normalizeGitHubPdfUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com" && parsed.pathname.includes("/blob/")) {
      const rawPath = parsed.pathname.replace("/blob/", "/");
      return `https://raw.githubusercontent.com${rawPath}${parsed.search}`;
    }

    // Also normalize /raw/ style GitHub links to raw.githubusercontent.com
    if (parsed.hostname === "github.com" && parsed.pathname.includes("/raw/")) {
      const rawPath = parsed.pathname.replace("/raw/", "/");
      return `https://raw.githubusercontent.com${rawPath}${parsed.search}`;
    }
  } catch {
    // ignore invalid URLs and use original
  }
  return url;
}

function hasPdfSignature(data: ArrayBuffer): boolean {
  const bytes = new Uint8Array(data.slice(0, 1024));
  // Some servers prepend BOM/whitespace before %PDF
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
  // Common GitHub blob page embeds "rawUrl":"https://raw.githubusercontent.com/..."
  const rawUrlMatch = html.match(new RegExp('"rawUrl"\\s*:\\s*"(https:\\\\/\\\\/raw\\.githubusercontent\\.com[^"]+)"', 'i'));
  if (rawUrlMatch?.[1]) {
    return rawUrlMatch[1].replace(/\\\//g, "/");
  }

  // Fallback: look for direct raw href in anchor tags
  const hrefMatch = html.match(/href="(\/[^\"]+\/raw\/[^"]+)"/i);
  if (hrefMatch?.[1]) {
    return `https://github.com${hrefMatch[1]}`;
  }

  return null;
}

function parseGitHubBlobUrl(url: string): { owner: string; repo: string; ref: string; path: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    // owner/repo/blob/ref/path/to/file.pdf
    if (parts.length < 5 || parts[2] !== "blob") return null;
    const owner = parts[0];
    const repo = parts[1];
    const ref = parts[3];
    const path = parts.slice(4).join("/");
    if (!owner || !repo || !ref || !path) return null;
    return { owner, repo, ref, path };
  } catch {
    return null;
  }
}

async function resolveRawUrlViaGitHubApi(url: string): Promise<string | null> {
  const parsedBlob = parseGitHubBlobUrl(url);
  if (!parsedBlob) return null;

  const { owner, repo, ref, path } = parsedBlob;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GridMind-PDF-Proxy",
  };

  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_MODELS_KEY || "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.download_url === "string" && data.download_url.length > 0) {
      return data.download_url;
    }
  } catch {
    // Ignore API fallback failures and continue with existing candidates.
  }

  return null;
}

/**
 * GridMind PDF Proxy
 * Bypasses CORS and attachment-force headers to enable "Instant View"
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing URL", { status: 400 });

  const normalizedUrl = normalizeGitHubPdfUrl(url);
  const candidateUrls: string[] = [];
  const seenCandidates = new Set<string>();
  const addCandidate = (candidate: string | null | undefined) => {
    if (!candidate) return;
    const normalized = normalizeGitHubPdfUrl(candidate);
    if (!seenCandidates.has(normalized)) {
      seenCandidates.add(normalized);
      candidateUrls.push(normalized);
    }
  };

  addCandidate(RESOLVED_URL_CACHE.get(url));
  addCandidate(normalizedUrl);

  // For GitHub blob links, keep ?raw=1 fallback candidate as browsers handle this well.
  try {
    const parsedOriginal = new URL(url);
    if (parsedOriginal.hostname === "github.com" && parsedOriginal.pathname.includes("/blob/")) {
      const withRaw = new URL(url);
      withRaw.searchParams.set("raw", "1");
      addCandidate(withRaw.toString());
    }
  } catch {
    // ignore malformed URL and proceed with normalized candidate only
  }

  addCandidate(await resolveRawUrlViaGitHubApi(url));

  try {
    let lastError = "Failed to fetch PDF from remote source";

    for (const candidateUrl of candidateUrls) {
      // 1. Fetch remote document
      const res = await fetch(candidateUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/pdf,*/*",
        },
      });

      if (!res.ok) {
        lastError = `Remote source returned status ${res.status}`;
        continue;
      }

      const fetchedContentType = (res.headers.get("Content-Type") || "").toLowerCase();
      const data = await res.arrayBuffer();
      const initialText = new TextDecoder().decode(new Uint8Array(data.slice(0, 300))).trimStart().toLowerCase();
      const isHtml = fetchedContentType.includes("text/html") || initialText.startsWith("<htm") || initialText.startsWith("<!do");
      const isPdfBySignature = hasPdfSignature(data);

      // 2. If HTML came back from GitHub, extract the embedded raw URL and retry once.
      if (isHtml) {
        const html = new TextDecoder().decode(new Uint8Array(data));
        const extractedRaw = extractRawGitHubUrlFromHtml(html);

        addCandidate(extractedRaw);
        addCandidate(await resolveRawUrlViaGitHubApi(candidateUrl));

        lastError = "Remote source returned HTML instead of PDF";
        continue;
      }

      // 3. Accept if either content-type suggests PDF OR signature is found.
      if (!fetchedContentType.includes("application/pdf") && !isPdfBySignature) {
        lastError = `Remote source did not appear to be a valid PDF (content-type=${fetchedContentType})`;
        continue;
      }

      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set("Content-Disposition", "inline");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      setResolvedUrlCache(url, candidateUrl);

      return new NextResponse(data, { headers });
    }

    throw new Error(lastError);
  } catch (e) {
    console.error("GridMind PDF Proxy Error:", e);
    return new NextResponse(`Proxy error: ${e instanceof Error ? e.message : String(e)}`, { status: 502 });
  }
}
