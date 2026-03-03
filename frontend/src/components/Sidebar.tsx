"use client";

import { useState } from "react";
import { BrainCircuit, ChevronRight, History, LogOut, MessageSquare, X, PanelLeftClose, PanelLeftOpen, Cpu, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    usage?: {
        dailyCount: number;
        dailyLimit: number;
        monthlyCount: number;
        monthlyLimit: number;
        tierName: string;
    } | null;
}

export default function Sidebar({ userEmail, onSignOut, history, onHistoryClick, open, onClose, userTier = "free", onUpgradeClick, collapsed = false, onToggleCollapse, usage }: SidebarProps) {
    return (
        <>
            {/* Desktop: collapsible sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 256 }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex overflow-hidden"
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
                    onToggleCollapse={onToggleCollapse}
                    usage={usage}
                    collapsed={collapsed}
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
                            className="fixed inset-0 z-[90] bg-slate-950/80 md:hidden"
                            onClick={onClose}
                        />
                        {/* Sidebar panel */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 left-0 h-full w-72 z-[100] bg-slate-900 border-r border-slate-800 flex flex-col md:hidden shadow-2xl"
                        >
                            <SidebarContent userEmail={userEmail} onSignOut={onSignOut} history={history} onHistoryClick={onHistoryClick} onClose={onClose} showClose={true} userTier={userTier} onUpgradeClick={onUpgradeClick} usage={usage} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}


function SidebarContent({
    userEmail, onSignOut, history, onHistoryClick, onClose, showClose, userTier, onUpgradeClick, onToggleCollapse, usage, collapsed
}: SidebarProps & { showClose: boolean }) {
    const [logoHovered, setLogoHovered] = useState(false);
    const progress = usage ? Math.min(100, (usage.dailyCount / usage.dailyLimit) * 100) : 0;

    return (
        <>
            {/* Brand */}
            <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 border-b border-slate-800 bg-slate-900`}>
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onMouseEnter={() => setLogoHovered(true)}
                    onMouseLeave={() => setLogoHovered(false)}
                    onClick={collapsed ? onToggleCollapse : undefined}
                >
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        {collapsed && logoHovered ? (
                            <PanelLeftOpen className="w-6 h-6 text-indigo-400 animate-in fade-in zoom-in duration-200" />
                        ) : (
                            <BrainCircuit className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                        )}
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                                GridMind <span className="text-indigo-400">AI</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                                v2.0 Enterprise
                            </p>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <div className="flex items-center gap-1">
                        {!showClose && onToggleCollapse && (
                            <button onClick={onToggleCollapse} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all" title="Collapse sidebar">
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        )}
                        {showClose && (
                            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
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
                    {!collapsed && <label className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Intelligence</label>}
                    <button className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500`}>
                        <MessageSquare className="w-4 h-4" />
                        {!collapsed && <span>New Inquiry</span>}
                    </button>
                </div>

                <div className="space-y-1">
                    {!collapsed && (
                        <div className="px-3 flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">History</label>
                            <History className="w-3 h-3 text-slate-600" />
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
                                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-3'} py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs text-left group transition-all`}
                                    title={collapsed ? item.question : undefined}
                                >
                                    <span className={`truncate flex-1 ${collapsed ? 'hidden' : 'block'}`}>{item.question}</span>
                                    {collapsed ? <History className="w-4 h-4" /> : <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Consumption Meter */}
            {usage && (
                <div className={`${collapsed ? 'px-2 py-3 mx-2' : 'px-6 py-4 mx-3'} mb-6 bg-slate-800 border border-slate-700 rounded-2xl space-y-3`}>
                    <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'justify-between'}`}>
                        <div className="flex items-center gap-2">
                            <Cpu className="w-3 h-3 text-indigo-400" />
                            {!collapsed && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consumption</span>}
                        </div>
                        <span className="text-[10px] font-bold text-white tracking-widest leading-none">
                            {collapsed ? `${usage.dailyCount}/${usage.dailyLimit}` : `${usage.dailyCount} / ${usage.dailyLimit}`}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-700/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className={`h-full ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-orange-400' : 'bg-indigo-600'} shadow-[0_0_10px_rgba(79,70,229,0.3)]`}
                        />
                    </div>
                    {!collapsed && (
                        <p className="text-[9px] text-slate-500 font-medium leading-tight">
                            Daily limit resets in ~{24 - new Date().getHours()}h.
                        </p>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className={`p-4 mt-auto border-t border-slate-800 bg-slate-900 ${collapsed ? 'items-center' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3'} px-2 mb-4`}>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0">
                        {userEmail[0]?.toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-semibold text-white truncate">{userEmail.split('@')[0]}</p>
                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${userTier === 'pro' ? 'bg-indigo-500/10 border-indigo-400 text-indigo-400' :
                                    userTier === 'basic' ? 'bg-blue-500/10 border-blue-400 text-blue-400' :
                                        'bg-slate-500/10 border-slate-500 text-slate-500'
                                    }`}>
                                    {userTier}
                                </span>
                                {userTier !== 'pro' && (
                                    <button
                                        onClick={onUpgradeClick}
                                        className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                                    >
                                        Upgrade
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onSignOut}
                    className={`w-full flex items-center justify-center ${collapsed ? 'p-2' : 'gap-2 px-3 py-2'} rounded-xl border border-slate-700 bg-slate-800 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 text-slate-400 text-xs font-semibold transition-all group shadow-sm`}
                    title={collapsed ? "Logout" : undefined}
                >
                    <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </>
    );
}
