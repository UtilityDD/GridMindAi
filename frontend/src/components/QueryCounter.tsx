"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function OdometerDigit({ digit, index }: { digit: string, index: number }) {
    return (
        <div className="relative w-[13px] h-[20px] bg-[#020617] border border-white/5 rounded-sm overflow-hidden flex flex-col items-center shadow-inner">
            <motion.div
                key={digit}
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{
                    type: "spring",
                    damping: 18,
                    stiffness: 110,
                    delay: (index * 0.05)
                }}
                className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-emerald-400 font-mono tracking-tighter"
            >
                {digit}
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        </div>
    );
}

export default function QueryCounter() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/stats/queries");
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count);
                }
            } catch (err) {
                console.error("Failed to load query stats", err);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    if (count === null) return null;

    const countStr = count.toString().padStart(6, "0");

    return (
        <div className="inline-flex gap-[1px]">
            {countStr.split("").map((d, i) => (
                <OdometerDigit key={`${i}-${d}`} digit={d} index={i} />
            ))}
        </div>
    );
}
