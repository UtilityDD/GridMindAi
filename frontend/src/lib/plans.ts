import { Rocket, Zap, BrainCircuit, ShieldCheck } from "lucide-react";

export interface Plan {
    id: string;
    name: string;
    price: number;
    limit: string;
    duration: string;
    description: string;
    capabilities: {
        standard: boolean;
        better: boolean;
        detailed: boolean;
        highSpeed: boolean;
    };
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
        description: "Standard regulatory lookup for general users.",
        capabilities: {
            standard: true,
            better: false,
            detailed: false,
            highSpeed: false,
        },
        color: "from-slate-500 to-slate-700",
        icon: Rocket,
    },
    {
        id: "basic",
        name: "Basic+",
        price: 100,
        limit: "10 queries / day",
        duration: "No expiry",
        description: "Enhanced access with persistent account benefits.",
        capabilities: {
            standard: true,
            better: true,
            detailed: false,
            highSpeed: false,
        },
        color: "from-blue-500 to-indigo-600",
        icon: Zap,
    },
    {
        id: "advance",
        name: "Advance",
        price: 200,
        limit: "50 queries / day",
        duration: "No expiry",
        description: "Professional grade strategic intelligence.",
        capabilities: {
            standard: true,
            better: true,
            detailed: true,
            highSpeed: false,
        },
        color: "from-purple-500 to-indigo-600",
        icon: BrainCircuit,
    },
    {
        id: "pro",
        name: "Pro",
        price: 300,
        limit: "150 queries / day",
        duration: "No expiry",
        description: "Maximum bandwidth for enterprise-level operations.",
        capabilities: {
            standard: true,
            better: true,
            detailed: true,
            highSpeed: true,
        },
        color: "from-indigo-500 to-amber-600",
        icon: ShieldCheck,
    },
];

export const CAPABILITY_ROWS = [
    { key: "standard", label: "Standard response" },
    { key: "better", label: "Better response" },
    { key: "detailed", label: "Detailed/In-depth response" },
    { key: "highSpeed", label: "High-speed search" },
] as const;
