"use client";

import VisitorCounter from "./VisitorCounter";
import QueryCounter from "./QueryCounter";

export default function LiveStats() {
    return (
        <div className="flex items-center gap-6 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                    Grid Status
                </span>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[6px] font-black text-emerald-500/40 uppercase tracking-[0.2em] leading-none mb-0.5">
                        Total Queries
                    </span>
                    <QueryCounter />
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="text-[6px] font-black text-indigo-500/40 uppercase tracking-[0.2em] leading-none mb-0.5">
                        Active Uplinks
                    </span>
                    <VisitorCounter />
                </div>
            </div>
        </div>
    );
}
