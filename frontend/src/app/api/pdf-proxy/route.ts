import { NextRequest, NextResponse } from "next/server";

/**
 * GridMind PDF Proxy
 * Bypasses CORS and attachment-force headers to enable "Instant View"
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing URL", { status: 400 });

  try {
    // 1. Fetch the remote PDF
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    
    const fetchedContentType = res.headers.get("Content-Type") || "";
    // If it's a redirect to an HTML login page or a generic error page, abort
    if (fetchedContentType.includes("text/html")) {
      throw new Error(`Remote source returned HTML instead of PDF (likely a login page or error)`);
    }
    
    // 2. Capture as blob
    const blob = await res.blob();
    
    // 3. Return with forced inline PDF headers to ensure browser native viewer kicks in
    const headers = new Headers();
    // We override content-type to application/pdf to help the browser engine, 
    // but only if we're fairly confident it's a binary file.
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", "inline");
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for 1 year
    
    return new NextResponse(blob, { headers });
  } catch (e) {
    console.error("GridMind PDF Proxy Error:", e);
    // Returning 415 (Unsupported Media Type) or 404 to help the frontend distinguish
    return new NextResponse(`Proxy error: ${e}`, { status: 502 }); // Bad Gateway for remote issues
  }
}
