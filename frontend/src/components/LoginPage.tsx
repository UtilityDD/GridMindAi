"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

interface LoginPageProps {
  onBack?: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps = {}) {
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await getSupabase().auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      } else {
        const { error } = await getSupabase().auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage("Reset link sent — check your inbox.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  const submitLabel = mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,_#020617_0%,_#0d1424_50%,_#020617_100%)] px-4 text-white">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* ── Brand ── */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-white/12 bg-white/5 shadow-[0_0_40px_rgba(99,102,241,0.25)]">
            <BrainCircuit className="h-8 w-8 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">GridMind AI</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">Grid Regulations Intelligence</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">

          {/* Google — primary action */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white px-5 py-4 text-slate-900 transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.12)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
            )}
            <span className="flex-1 text-left text-sm font-semibold">Login with Google</span>
            <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
          </button>

          {/* Error / message */}
          <AnimatePresence>
            {(error || message) && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>
                  {error || message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email option toggle */}
          {!showEmail ? (
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => { setShowEmail(true); setMode("login"); setError(""); setMessage(""); }}
                className="transition hover:text-white"
              >
                Sign in with email
              </button>
              <span className="text-white/20">·</span>
              <button
                type="button"
                onClick={() => { setShowEmail(true); setMode("signup"); setError(""); setMessage(""); }}
                className="transition hover:text-white"
              >
                Create account
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Mode tabs */}
                <div className="mt-6 flex items-center justify-center gap-5 border-t border-white/8 pt-6 text-xs">
                  {(["login", "signup", "forgot"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError(""); setMessage(""); }}
                      className={`font-semibold uppercase tracking-[0.2em] transition ${mode === m ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      {m === "login" ? "Sign In" : m === "signup" ? "Sign Up" : "Reset"}
                    </button>
                  ))}
                </div>

                {/* Email form */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-indigo-400" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/8"
                    />
                  </div>

                  {mode !== "forgot" && (
                    <div className="group relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-indigo-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
                  </button>

                  {mode === "login" && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                        className="text-xs text-slate-500 transition hover:text-slate-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Back link */}
        {onBack && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-slate-500 transition hover:text-slate-300"
            >
              ← Back to home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
