"use client";

import { BrainCircuit, ChevronRight, History, LogOut, MessageSquare, X, PanelLeftClose } from "lucide-react";
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
    onHistoryClick: (question: string) => void;
    open?: boolean;
    onClose: () => void;
    userTier?: string;
    onUpgradeClick?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function Sidebar({ userEmail, onSignOut, history, onHistoryClick, open, onClose, userTier = "free", onUpgradeClick, collapsed = false, onToggleCollapse }: SidebarProps) {
    return (
        <>
            {/* Desktop: collapsible sidebar */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 250 }}
                        className="bg-slate-900/50 border-r border-white/5 flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex overflow-hidden"
                    >
                        <SidebarContent userEmail={userEmail} onSignOut={onSignOut} history={history} onHistoryClick={onHistoryClick} onClose={onClose} showClose={false} userTier={userTier} onUpgradeClick={onUpgradeClick} onToggleCollapse={onToggleCollapse} />
                    </motion.aside>
                )}
            </AnimatePresence>

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
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={onClose}
                        />
                        {/* Sidebar panel */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 left-0 h-full w-72 z-50 bg-[#060d1f] border-r border-white/5 flex flex-col md:hidden shadow-2xl shadow-black"
                        >
                            <SidebarContent userEmail={userEmail} onSignOut={onSignOut} history={history} onHistoryClick={onHistoryClick} onClose={onClose} showClose={true} userTier={userTier} onUpgradeClick={onUpgradeClick} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}


function SidebarContent({
    userEmail, onSignOut, history, onHistoryClick, onClose, showClose, userTier, onUpgradeClick, onToggleCollapse
}: SidebarProps & { showClose: boolean }) {
    return (
        <>
            {/* Brand */}
            <div className="p-6 flex items-center justify-between gap-3 border-b border-white/5 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                            GridMind <span className="text-indigo-400">AI</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                            v2.0 Enterprise
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {!showClose && onToggleCollapse && (
                        <button onClick={onToggleCollapse} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all" title="Collapse sidebar">
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                    {showClose && (
                        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>


            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
                <div className="space-y-1">
                    <label className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Intelligence</label>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-medium transition-all">
                        <MessageSquare className="w-4 h-4" />
                        <span>New Inquiry</span>
                    </button>
                </div>

                <div className="space-y-1">
                    <div className="px-3 flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">History</label>
                        <History className="w-3 h-3 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                        {history.length === 0 ? (
                            <p className="px-3 py-4 text-[11px] text-slate-600 italic leading-relaxed">
                                Your tactical inquiries will appear here.
                            </p>
                        ) : (
                            history.slice(0, 10).map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { onHistoryClick(item.question); onClose(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs text-left group transition-all"
                                >
                                    <span className="truncate flex-1">{item.question}</span>
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 mt-auto border-t border-white/5 bg-slate-900/40">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                        {userEmail[0]?.toUpperCase()}
                    </div>
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
                                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 animate-pulse transition-colors"
                                >
                                    Upgrade
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                    </div>
                </div>

                <button
                    onClick={onSignOut}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/5 bg-white/0 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-slate-400 text-xs font-semibold transition-all group"
                >
                    <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Terminate Session</span>
                </button>
            </div>
        </>
    );
}
