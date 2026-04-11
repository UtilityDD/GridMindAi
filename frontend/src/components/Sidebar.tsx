"use client";

import { useState } from "react";
import { BrainCircuit, ChevronRight, History, LogOut, MessageSquare, X, PanelLeftClose, PanelLeftOpen, Cpu, Menu, AlertCircle, Lock, ShieldCheck, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ShareDocument from "./ShareDocument";

interface Source {
    doc_id: string;
    ref: string;
    date: string;
    title: string;
    source_url: string;
}

interface QueryResult {
    answer: string;
    sources: Source[];
    model_used: string;
    elapsed_ms: number;
    rewritten_query: string | null;
}

interface SidebarProps {
    userEmail: string;
    onSignOut: () => void;
    history: { question: string; result: QueryResult }[];
    onHistoryClick: (question: string, result: QueryResult) => void;
    open?: boolean;
    onClose: () => void;
    userTier?: string;
    onUpgradeClick?: () => void;
    onNewInquiry?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    usage?: {
        dailyCount: number;
        dailyLimit: number;
        monthlyCount: number;
        monthlyLimit: number;
        tierName: string;
        tierId: string;
        hasCustomLimit?: boolean;
        isTrialExpired?: boolean;
        daysUntilExpiry?: number;
    } | null;
}

export default function Sidebar({ userEmail, onSignOut, history, onHistoryClick, open, onClose, userTier = "free", onUpgradeClick, onNewInquiry, collapsed = false, onToggleCollapse, usage }: SidebarProps) {
    const [showShareModal, setShowShareModal] = useState(false);

    return (
        <>
            <ShareDocument 
                isOpen={showShareModal} 
                onClose={() => setShowShareModal(false)} 
                userEmail={userEmail} 
            />
            {/* Desktop: collapsible sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 256 }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex overflow-hidden"
            >
                <SidebarContent
                    userEmail={userEmail}
                    onSignOut={onSignOut}
                    history={history}
                    onHistoryClick={onHistoryClick}
                    onClose={onClose}
                    showClose={false}
                    userTier={userTier}
                    onUpgradeClick={onUpgradeClick}
                    onNewInquiry={onNewInquiry}
                    onToggleCollapse={onToggleCollapse}
                    usage={usage}
                    collapsed={collapsed}
                    onVaultOpen={() => setShowShareModal(true)}
                />
            </motion.aside>

            {/* Mobile: sliding overlay */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[90] bg-slate-950/20 md:hidden"
                            onClick={onClose}
                        />
                        {/* Sidebar panel */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 left-0 h-full w-72 z-[100] bg-white border-r border-slate-200 flex flex-col md:hidden shadow-2xl"
                        >
                            <SidebarContent 
                                userEmail={userEmail} 
                                onSignOut={onSignOut} 
                                history={history} 
                                onHistoryClick={onHistoryClick} 
                                onClose={onClose} 
                                showClose={true} 
                                userTier={userTier} 
                                onUpgradeClick={onUpgradeClick} 
                                onNewInquiry={onNewInquiry} 
                                usage={usage} 
                                onVaultOpen={() => setShowShareModal(true)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

interface SidebarContentProps extends SidebarProps {
    showClose: boolean;
    onVaultOpen: () => void;
}

function SidebarContent({
    userEmail, onSignOut, history, onHistoryClick, onClose, showClose, userTier, onUpgradeClick, onNewInquiry, onToggleCollapse, usage, collapsed, onVaultOpen
}: SidebarContentProps) {
    const [logoHovered, setLogoHovered] = useState(false);
    const progress = usage ? Math.min(100, (usage.dailyCount / usage.dailyLimit) * 100) : 0;

    return (
        <>
            {/* Brand */}
            <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 border-b border-slate-200 bg-white`}>
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onMouseEnter={() => setLogoHovered(true)}
                    onMouseLeave={() => setLogoHovered(false)}
                    onClick={collapsed ? onToggleCollapse : undefined}
                >
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        {collapsed && logoHovered ? (
                            <PanelLeftOpen className="w-6 h-6 text-blue-600 animate-in fade-in zoom-in duration-200" />
                        ) : (
                            <BrainCircuit className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                        )}
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                                GridMind <span className="text-blue-600">AI</span>
                            </h1>
                            <p className="text-[9px] text-blue-600/60 font-bold tracking-wide uppercase mt-0.5 whitespace-nowrap">
                                Decide Fast. Act Fast.
                            </p>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <div className="flex items-center gap-1">
                        {!showClose && onToggleCollapse && (
                            <button onClick={onToggleCollapse} className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all" title="Collapse sidebar">
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        )}
                        {showClose && (
                            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
            {/* Collapsed view spacer replaced redundant menu button */}
            {collapsed && <div className="h-6" />}


            {/* Navigation */}
            <div className={`flex-1 overflow-y-auto py-6 ${collapsed ? 'px-2' : 'px-3'} space-y-8`}>
                <div className="space-y-1">
                    {!collapsed && <label className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">Intelligence</label>}
                    <div className="space-y-1">
                        <button 
                            onClick={() => { onNewInquiry?.(); onClose(); }}
                            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            {!collapsed && <span className="truncate whitespace-nowrap">New Inquiry</span>}
                        </button>
                        <Link 
                            href="/explorer"
                            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-bold transition-all hover:bg-slate-50 hover:border-slate-300 group`}
                        >
                            <Search className={`w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform`} />
                            {!collapsed && <span className="truncate whitespace-nowrap">GridMind Explorer</span>}
                        </Link>
                    </div>
                </div>

                <div className="space-y-1">
                    {!collapsed && (
                        <div className="px-3 flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">History</label>
                            <History className="w-3 h-3 text-slate-700" />
                        </div>
                    )}
                    <div className="space-y-1">
                        {history.length === 0 ? (
                            !collapsed && (
                                <p className="px-3 py-4 text-[11px] text-slate-600 italic leading-relaxed">
                                    Your tactical inquiries will appear here.
                                </p>
                            )
                        ) : (
                            history.slice(0, 10).map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { onHistoryClick(item.question, item.result); onClose(); }}
                                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-3'} py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-200 text-xs text-left group transition-all`}
                                    title={collapsed ? item.question : undefined}
                                >
                                    <span className={`truncate whitespace-nowrap flex-1 ${collapsed ? 'hidden' : 'block'}`}>{item.question}</span>
                                    {collapsed ? <History className="w-4 h-4" /> : <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    {!collapsed && <label className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 block">Community</label>}
                    <button 
                        onClick={() => { onVaultOpen(); onClose(); }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold transition-all hover:bg-blue-100 group shadow-sm`}
                    >
                        <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {!collapsed && <span className="truncate whitespace-nowrap">Share Document</span>}
                    </button>
                </div>
            </div>

            {/* Consumption Meter */}
            {usage && (
                <div className={`${collapsed ? 'px-2 py-3 mx-2' : 'px-6 py-4 mx-3'} mb-6 bg-slate-100 border border-slate-300 rounded-2xl space-y-3`}>
                    <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'justify-between'}`}>
                        <div className="flex items-center gap-2">
                            <Cpu className="w-3 h-3 text-blue-600" />
                            {!collapsed && (
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap">Consumption</span>
                                    {usage.hasCustomLimit && (
                                        <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 uppercase tracking-tighter whitespace-nowrap">
                                            Promo Active
                                        </span>
                                    )}
                                    {usage.isTrialExpired && (
                                        <span className="text-[8px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 uppercase tracking-tighter whitespace-nowrap">
                                            Expired
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-900 tracking-widest leading-none">
                            {collapsed ? `${usage.dailyCount}/${usage.dailyLimit}` : `${usage.dailyCount} / ${usage.dailyLimit}`}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-300 rounded-full overflow-hidden border border-slate-400/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className={`h-full ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-orange-400' : 'bg-blue-600'} shadow-[0_0_10px_rgba(37,99,235,0.3)]`}
                        />
                    </div>
                    {!collapsed && (
                        <p className="text-[9px] text-slate-600 font-medium leading-tight">
                            {usage.isTrialExpired 
                                ? "Your 30-day trial has concluded." 
                                : <>Daily limit resets in approx. {24 - new Date().getHours()}h. {(usage.daysUntilExpiry !== undefined && usage.daysUntilExpiry !== null) ? <span className="text-red-500 font-bold ml-1">Expires in {usage.daysUntilExpiry} days.</span> : ""}</>}
                        </p>
                    )}
                    {usage.isTrialExpired && !collapsed && (
                        <button 
                            onClick={onUpgradeClick}
                            className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Lock className="w-3 h-3" />
                            Renew Access
                        </button>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className={`p-4 mt-auto border-t border-slate-200 bg-white ${collapsed ? 'items-center' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3'} px-2 mb-4`}>
                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-400 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                        {userEmail[0]?.toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-semibold text-slate-900 truncate whitespace-nowrap">{userEmail.split('@')[0]}</p>
                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${userTier === 'pro' ? 'bg-blue-100/80 border-blue-400 text-blue-700' :
                                    userTier === 'basic' ? 'bg-slate-200 border-slate-400 text-slate-700' :
                                        'bg-slate-200 border-slate-400 text-slate-700'
                                    } whitespace-nowrap`}>
                                    {usage?.hasCustomLimit ? 'Promo' : (usage?.tierName || userTier)}
                                </span>
                                {usage?.hasCustomLimit && (
                                    <span className="text-[8px] font-bold text-slate-600 uppercase whitespace-nowrap">
                                        Applied
                                    </span>
                                )}
                                {userTier !== 'pro' && !usage?.hasCustomLimit && (
                                    <button
                                        onClick={onUpgradeClick}
                                        className="text-[9px] font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
                                    >
                                        Upgrade
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-600 truncate">{userEmail}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onSignOut}
                    className={`w-full flex items-center justify-center ${collapsed ? 'p-2' : 'gap-2 px-3 py-2'} rounded-xl border border-slate-300 bg-slate-100 hover:bg-red-100 hover:text-red-700 hover:border-red-300 text-slate-700 text-xs font-semibold transition-all group shadow-sm`}
                    title={collapsed ? "Logout" : undefined}
                >
                    <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </>
    );
}
