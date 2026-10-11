"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Ban,
  TrendingUp,
  Cpu,
  Lock,
  Calendar,
  Sparkles,
  Check,
  ChevronRight,
  UserCheck,
  UserX
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

      showToast("User account settings saved");
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

  // Verification Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  // Unauthorized Screen
  if (!user || !currentUserIsAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans text-slate-900">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center flex flex-col items-center gap-5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Access Restricted</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This administrative console is reserved exclusively for system administrators.
            </p>
          </div>
          <Link
            href="/"
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans selection:bg-slate-900 selection:text-white flex flex-col">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl font-semibold text-xs shadow-2xl shadow-slate-900/20 border border-slate-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
              title="Return to Main Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  GridMind Admin Console
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Governance
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                Manage accounts, query consumption quotas, and administrative permissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-[11px] text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[140px] sm:max-w-none">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Accounts</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {stats.total}
            </span>
            <span className="text-[11px] text-slate-500">Registered users in database</span>
          </div>

          {/* Active Today */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Today</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight font-mono">
              {stats.activeToday}
            </span>
            <span className="text-[11px] text-slate-500">Submitted queries today</span>
          </div>

          {/* High Tiers */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pro & Admin</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {stats.proOrAdmin}
            </span>
            <span className="text-[11px] text-slate-500">High bandwidth tiers</span>
          </div>

          {/* Restricted Accounts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Restricted</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight font-mono">
              {stats.restricted}
            </span>
            <span className="text-[11px] text-slate-500">Access disabled</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white border border-slate-200/80 p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or UID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Tier Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Users", count: users.length },
              { id: "free", label: "Basic", count: users.filter((u) => u.tier_id === "free" || u.tier_id === "basic").length },
              { id: "pro", label: "Pro", count: users.filter((u) => u.tier_id === "pro").length },
              { id: "admin", label: "Admin", count: users.filter((u) => u.tier_id === "admin").length },
              { id: "restricted", label: "Restricted", count: stats.restricted },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTierFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  tierFilter === f.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    tierFilter === f.id ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-6">User Account</th>
                  <th className="py-3.5 px-4">Tier Assignment</th>
                  <th className="py-3.5 px-4">Daily Quota</th>
                  <th className="py-3.5 px-4 text-center">Today Queries</th>
                  <th className="py-3.5 px-4 text-center">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-600" />
                      Loading user accounts...
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
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* User Identity */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ${
                                u.is_admin
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {u.email[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900 truncate max-w-xs">{u.email}</span>
                                {u.is_admin && (
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                <span className="truncate max-w-[140px] sm:max-w-[200px]" title={u.id}>
                                  ID: {u.id.slice(0, 8)}...
                                </span>
                                {u.created_at && (
                                  <span className="text-slate-400 hidden sm:inline">
                                    • Joined {new Date(u.created_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
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
                            className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white cursor-pointer transition-all"
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
                                  ? "∞ Unlimited"
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
                              className="w-24 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                            />
                            <span className="text-[10px] font-semibold text-slate-400">/day</span>
                          </div>
                        </td>

                        {/* Today's Usage */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg inline-block ${
                              u.today_queries > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "text-slate-400"
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
                            className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border inline-flex items-center gap-1.5 ${
                              draft.is_enabled
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            }`}
                          >
                            {draft.is_enabled ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>Disabled</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action: Save Button */}
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            disabled={!isModified || savingId === u.id}
                            onClick={() => handleUpdateUser(u.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto ${
                              isModified
                                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:scale-95"
                                : "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed"
                            }`}
                          >
                            {savingId === u.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                {isModified && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                <span>Save</span>
                              </>
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
