import { NextRequest, NextResponse } from "next/server";

function normalizeGitHubPdfUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com" && parsed.pathname.includes("/blob/")) {
      const rawPath = parsed.pathname.replace("/blob/", "/");
      return `https://raw.githubusercontent.com${rawPath}${parsed.search}`;
    }
  } catch {
    // ignore invalid URLs and use original
  }
  return url;
}

/**
 * GridMind PDF Proxy
 * Bypasses CORS and attachment-force headers to enable "Instant View"
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing URL", { status: 400 });

  const normalizedUrl = normalizeGitHubPdfUrl(url);

  try {
    // 1. Fetch the remote PDF
    const res = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Remote source returned status ${res.status}`);
    }

    const fetchedContentType = res.headers.get("Content-Type") || "";
    const data = await res.arrayBuffer();
    const header = new TextDecoder().decode(new Uint8Array(data.slice(0, 4)));

    if (fetchedContentType.includes("text/html") || header.startsWith("<htm") || header.startsWith("<!do")) {
      throw new Error(`Remote source returned HTML instead of PDF (likely a login page, error page, or redirect)`);
    }

    if (!fetchedContentType.includes("application/pdf") && !header.startsWith("%PDF")) {
      throw new Error(`Remote source did not appear to be a valid PDF (content-type=${fetchedContentType})`);
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", "inline");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(data, { headers });
  } catch (e) {
    console.error("GridMind PDF Proxy Error:", e);
    return new NextResponse(`Proxy error: ${e instanceof Error ? e.message : String(e)}`, { status: 502 });
  }
}
