"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function OdometerDigit({ digit, index }: { digit: string, index: number }) {
    return (
        <div className="relative w-[13px] h-[20px] bg-white border border-slate-300 rounded-sm overflow-hidden flex flex-col items-center shadow-inner">
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
                className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-blue-600 font-mono tracking-tighter"
            >
                {digit}
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-200/30 to-transparent pointer-events-none" />
        </div>
    );
}

export default function VisitorCounter() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/stats/visitor", { method: "POST" });
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count);
                }
            } catch (err) {
                console.error("Failed to load visitor stats", err);
            }
        };

        fetchCount();
    }, []);

    if (count === null) return null;

    const countStr = count.toString().padStart(5, "0");

    return (
        <div className="inline-flex gap-[1px]">
            {countStr.split("").map((d, i) => (
                <OdometerDigit key={`${i}-${d}`} digit={d} index={i} />
            ))}
        </div>
    );
}
