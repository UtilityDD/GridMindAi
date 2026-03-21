import { Rocket, Zap, BrainCircuit, ShieldCheck } from "lucide-react";

export interface Plan {
    id: string;
    name: string;
    price: number;
    limit: string;
    duration: string;
    description: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const PLANS: Plan[] = [
    {
        id: "free",
        name: "Basic",
        price: 0,
        limit: "10 queries / day",
        duration: "30 days only",
        description: "Standard Response for general regulatory inquiries.",
        color: "from-slate-500 to-slate-700",
        icon: Rocket,
    },
    {
        id: "basic",
        name: "Basic+",
        price: 100,
        limit: "10 queries / day",
        duration: "No expiry",
        description: "Stable Strategic Bandwidth with Standard Response Quality.",
        color: "from-blue-500 to-indigo-600",
        icon: Zap,
    },
    {
        id: "advance",
        name: "Advance",
        price: 200,
        limit: "50 queries / day",
        duration: "No expiry",
        description: "Detailed/In-depth Intelligence with high-precision search.",
        color: "from-purple-500 to-indigo-600",
        icon: BrainCircuit,
    },
    {
        id: "pro",
        name: "Pro",
        price: 300,
        limit: "150 queries / day",
        duration: "No expiry",
        description: "Detailed/In-depth Response with Maximum Bandwidth.",
        color: "from-indigo-500 to-amber-600",
        icon: ShieldCheck,
    },
];
