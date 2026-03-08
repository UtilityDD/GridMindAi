"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import LiveStats from "@/components/LiveStats";

type Mode = "login" | "signup" | "forgot";

interface LoginPageProps {
  onBack?: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps = {}) {
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
        const { error } = await getSupabase().auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await getSupabase().auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      } else {
        const { error } = await getSupabase().auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage("Password reset email sent.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative font-sans selection:bg-indigo-500/30">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px] mx-4"
      >

        {/* Minimal Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="flex flex-col items-center mb-10 text-center">
                <motion.button
                  onClick={onBack}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={onBack ? { scale: 1.05 } : {}}
                  whileTap={onBack ? { scale: 0.95 } : {}}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl mb-4 relative group ${onBack ? 'cursor-pointer hover:border-indigo-500/50' : ''}`}
                >
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <BrainCircuit className="w-7 h-7 text-indigo-400 relative z-10" />
                </motion.button>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-1">GridMind AI</h1>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Grid Regulations Made Simple</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-950/50 border border-white/5 text-sm text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-slate-950 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Password Field */}
                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot");
                            setError("");
                            setMessage("");
                          }}
                          className="text-[11px] font-bold text-indigo-500/70 hover:text-indigo-400 transition-colors uppercase tracking-wider"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-4 rounded-2xl bg-slate-950/50 border border-white/5 text-sm text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-slate-950 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                <AnimatePresence>
                  {(error || message) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`p-4 rounded-2xl text-[13px] font-medium ${error ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                        {error || message}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/10 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-3 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-transparent text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Return to Home
                  </button>
                )}
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Secondary Action */}
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">
              {mode === "login" ? (
                <>No account? <button onClick={() => setMode("signup")} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign up</button></>
              ) : (
                <>Already a member? <button onClick={() => setMode("login")} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign in</button></>
              )}
            </p>
          </div>
        </div>

        {/* Minimal Spacer for padding */}
        <div className="mt-12 h-1" />
      </motion.div>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
