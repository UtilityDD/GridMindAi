"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

    return (
        <span className="text-[12px] font-bold text-emerald-600 font-mono tracking-tight">
            {count.toLocaleString()}
        </span>
    );
}
