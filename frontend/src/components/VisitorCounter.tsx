"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

    return (
        <span className="text-[12px] font-bold text-blue-600 font-mono tracking-tight">
            {count.toLocaleString()}
        </span>
    );
}
