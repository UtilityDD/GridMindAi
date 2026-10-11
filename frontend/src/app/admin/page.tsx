"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Shield,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Check,
  Ban,
  TrendingUp,
  Cpu,
  Mail,
  Calendar,
  Lock
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isUserAdmin } from "@/lib/admin";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  tier_id: string;
  tier_name: string;
  is_enabled: boolean;
  custom_daily_limit: number | null;
  today_queries: number;
  is_admin: boolean;
}

const TIERS = [
  { id: "free", label: "Basic (Free)", limit: 10 },
  { id: "basic", label: "Basic+", limit: 10 },
  { id: "advance", label: "Advance", limit: 50 },
  { id: "pro", label: "Pro", limit: 150 },
  { id: "admin", label: "Administrator", limit: 999999 },
];

export default function AdminUsersPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editable state buffer: user.id -> { tier_id, is_enabled, custom_daily_limit }
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        tier_id: string;
        is_enabled: boolean;
        custom_daily_limit: string;
      }
    >
  >({});

  const currentUserIsAdmin = useMemo(() => {
    return isUserAdmin(user?.email);
  }, [user]);

  const fetchUsers = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setUsers(data.users || []);

      // Populate drafts with current values
      const initialDrafts: typeof drafts = {};
      (data.users || []).forEach((u: AdminUser) => {
        initialDrafts[u.id] = {
          tier_id: u.tier_id,
          is_enabled: u.is_enabled,
          custom_daily_limit:
            u.custom_daily_limit !== null ? String(u.custom_daily_limit) : "",
        };
      });
      setDrafts(initialDrafts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load user records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && session?.access_token && currentUserIsAdmin) {
      fetchUsers();
    }
  }, [authLoading, session?.access_token, currentUserIsAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateUser = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft || !session?.access_token) return;

    setSavingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetUserId: userId,
          tierId: draft.tier_id,
          isEnabled: draft.is_enabled,
          customDailyLimit: draft.custom_daily_limit ? Number(draft.custom_daily_limit) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Update failed");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const matchedTier = TIERS.find((t) => t.id === draft.tier_id);
            return {
              ...u,
              tier_id: draft.tier_id,
              tier_name: matchedTier?.label || draft.tier_id,
              is_enabled: draft.is_enabled,
              custom_daily_limit: draft.custom_daily_limit ? Number(draft.custom_daily_limit) : null,
              is_admin: draft.tier_id === "admin" || isUserAdmin(u.email),
            };
          }
          return u;
        })
      );

      showToast("User updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      alert(msg);
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase());

      const matchesTier =
        tierFilter === "all"
          ? true
          : tierFilter === "restricted"
          ? !u.is_enabled
          : u.tier_id === tierFilter;

      return matchesSearch && matchesTier;
    });
  }, [users, search, tierFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const activeToday = users.filter((u) => u.today_queries > 0).length;
    const proOrAdmin = users.filter((u) => u.tier_id === "pro" || u.tier_id === "admin").length;
    const restricted = users.filter((u) => !u.is_enabled).length;
    return { total, activeToday, proOrAdmin, restricted };
  }, [users]);

  // Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs uppercase tracking-widest text-slate-400">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  // Unauthorized Screen
  if (!user || !currentUserIsAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center flex flex-col items-center gap-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Access Restricted</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This console is reserved exclusively for system administrators ({isUserAdmin(user?.email) ? "" : "dipnkr.das@gmail.com"}).
            </p>
          </div>
          <Link
            href="/"
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl font-bold text-xs shadow-2xl shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              title="Return to Main Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h1 className="text-base font-bold tracking-tight text-white">GridMind User Management</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage accounts, query quotas, and administrative privileges</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full flex flex-col gap-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats.total}</span>
            <span className="text-[10px] text-slate-500">Registered accounts</span>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Today</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{stats.activeToday}</span>
            <span className="text-[10px] text-slate-500">Sent queries today</span>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pro / Admin</span>
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats.proOrAdmin}</span>
            <span className="text-[10px] text-slate-500">High bandwidth tiers</span>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Restricted</span>
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">{stats.restricted}</span>
            <span className="text-[10px] text-slate-500">Access disabled</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or user UID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Tier Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All" },
              { id: "free", label: "Basic" },
              { id: "pro", label: "Pro" },
              { id: "admin", label: "Admin" },
              { id: "restricted", label: "Restricted" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTierFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  tierFilter === f.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="border border-white/5 bg-slate-900/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-4 px-6">User Account</th>
                  <th className="py-4 px-4">Tier Assignment</th>
                  <th className="py-4 px-4">Daily Quota</th>
                  <th className="py-4 px-4 text-center">Today Queries</th>
                  <th className="py-4 px-4 text-center">Account Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-400" />
                      Loading user records...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      No user accounts match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const draft = drafts[u.id] || {
                      tier_id: u.tier_id,
                      is_enabled: u.is_enabled,
                      custom_daily_limit: u.custom_daily_limit ? String(u.custom_daily_limit) : "",
                    };

                    const isModified =
                      draft.tier_id !== u.tier_id ||
                      draft.is_enabled !== u.is_enabled ||
                      draft.custom_daily_limit !== (u.custom_daily_limit ? String(u.custom_daily_limit) : "");

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* User Identity */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                                u.is_admin
                                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                  : "bg-white/5 text-slate-300 border border-white/10"
                              }`}
                            >
                              {u.email[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-white truncate max-w-xs">{u.email}</span>
                                {u.is_admin && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[180px]">
                                UID: {u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tier Selector */}
                        <td className="py-4 px-4">
                          <select
                            value={draft.tier_id}
                            onChange={(e) =>
                              setDrafts({
                                ...drafts,
                                [u.id]: { ...draft, tier_id: e.target.value },
                              })
                            }
                            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {TIERS.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Custom Daily Limit */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              placeholder={
                                draft.tier_id === "admin"
                                  ? "Unlimited"
                                  : draft.tier_id === "pro"
                                  ? "150"
                                  : draft.tier_id === "advance"
                                  ? "50"
                                  : "10"
                              }
                              value={draft.custom_daily_limit}
                              onChange={(e) =>
                                setDrafts({
                                  ...drafts,
                                  [u.id]: { ...draft, custom_daily_limit: e.target.value },
                                })
                              }
                              className="w-24 bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-slate-500">/day</span>
                          </div>
                        </td>

                        {/* Today's Usage */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`font-mono font-bold text-xs ${
                              u.today_queries > 0 ? "text-emerald-400" : "text-slate-500"
                            }`}
                          >
                            {u.today_queries}
                          </span>
                        </td>

                        {/* Account Status Toggle */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setDrafts({
                                ...drafts,
                                [u.id]: { ...draft, is_enabled: !draft.is_enabled },
                              })
                            }
                            className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border ${
                              draft.is_enabled
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                          >
                            {draft.is_enabled ? "Active" : "Disabled"}
                          </button>
                        </td>

                        {/* Action: Save Button */}
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            disabled={!isModified || savingId === u.id}
                            onClick={() => handleUpdateUser(u.id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                              isModified
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95"
                                : "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
                            }`}
                          >
                            {savingId === u.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : (
                              "Save"
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
