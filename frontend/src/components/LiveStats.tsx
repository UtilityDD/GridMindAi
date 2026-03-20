"use client";

import VisitorCounter from "./VisitorCounter";
import QueryCounter from "./QueryCounter";
import { Users, BarChart3 } from "lucide-react";

export default function LiveStats() {
    return (
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/50 border border-slate-200 backdrop-blur-sm shadow-sm">
            {/* Visitors */}
            <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visits:</span>
                    <VisitorCounter />
                </div>
            </div>

            {/* Separator */}
            <div className="w-[1px] h-3 bg-slate-200" />

            {/* Queries */}
            <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Queries:</span>
                    <QueryCounter />
                </div>
            </div>

            {/* Tiny live dot */}
            <div className="ml-1 w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        </div>
    );
}
