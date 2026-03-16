import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/";
    const origin = requestUrl.origin;

    console.log("Auth callback received. Origin:", origin);
    if (code) {
        console.log("Exchanging code for session...");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            console.log("Exchange successful. Redirecting to:", `${origin}${next}`);
            return NextResponse.redirect(`${origin}${next}`);
        }
        console.error("Auth helper error during exchange:", error.message);
    } else {
        console.warn("No auth code found in callback URL.");
    }

    // In case of error or no code, send back to login with a clear error
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
