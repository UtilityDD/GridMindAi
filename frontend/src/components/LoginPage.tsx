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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* ── Brand ── */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-blue-200 bg-blue-50">
            <BrainCircuit className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">GridMind AI</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-600">Grid Regulations Intelligence</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="rounded-[1.75rem] border border-slate-300 bg-white p-7 shadow-sm">

          {/* Google — primary action */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group flex w-full items-center gap-4 rounded-2xl border border-slate-300 bg-gray-50 px-5 py-4 text-slate-900 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
            )}
            <span className="flex-1 text-left text-sm font-semibold">Login with Google</span>
            <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5" />
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
                <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
                  {error || message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email option toggle */}
          {!showEmail ? (
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => { setShowEmail(true); setMode("login"); setError(""); setMessage(""); }}
                className="transition hover:text-slate-900"
              >
                Sign in with email
              </button>
              <span className="text-slate-400">·</span>
              <button
                type="button"
                onClick={() => { setShowEmail(true); setMode("signup"); setError(""); setMessage(""); }}
                className="transition hover:text-slate-900"
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
                <div className="mt-6 flex items-center justify-center gap-5 border-t border-slate-300 pt-6 text-xs">
                  {(["login", "signup", "forgot"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError(""); setMessage(""); }}
                      className={`font-semibold uppercase tracking-[0.2em] transition ${mode === m ? "text-slate-900" : "text-slate-600 hover:text-slate-700"}`}
                    >
                      {m === "login" ? "Sign In" : m === "signup" ? "Sign Up" : "Reset"}
                    </button>
                  ))}
                </div>

                {/* Email form */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition group-focus-within:text-blue-600" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {mode !== "forgot" && (
                    <div className="group relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition group-focus-within:text-blue-600" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-900"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
                  </button>

                  {mode === "login" && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                        className="text-xs text-slate-600 transition hover:text-slate-900"
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
              className="text-xs text-slate-600 transition hover:text-slate-900"
            >
              ← Back to home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
