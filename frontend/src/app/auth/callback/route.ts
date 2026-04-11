import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function resolveSafeRedirect(origin: string, nextParam: string) {
    // Allow same-origin relative paths.
    if (nextParam.startsWith('/')) {
        return `${origin}${nextParam}`;
    }

    // Allow localhost absolute redirects for local development flows.
    try {
        const target = new URL(nextParam);
        const isLocalhost = target.hostname === 'localhost' || target.hostname === '127.0.0.1';
        if (isLocalhost && (target.protocol === 'http:' || target.protocol === 'https:')) {
            return target.toString();
        }
    } catch {
        // Fall back to root on invalid URL.
    }

    return `${origin}/`;
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/";
    const origin = requestUrl.origin;
    const safeRedirect = resolveSafeRedirect(origin, next);

    console.log("Auth callback received. Origin:", origin);
    console.log("Code param:", code ? "present" : "missing");
    
    // If we have a code (authorization code flow), exchange it
    if (code) {
        console.log("Exchanging code for session...");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            console.log("Exchange successful. Redirecting to:", safeRedirect);
            return NextResponse.redirect(safeRedirect);
        }
        console.error("Auth helper error during exchange:", error.message);
        return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    // If no code, the tokens are in the URL fragment (implicit flow)
    // The client will detect them automatically via detectSessionInUrl: true
    // Just redirect to the target page
    console.log("No code found - tokens in fragment. Redirecting to:", safeRedirect);
    return NextResponse.redirect(safeRedirect);
}
