"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { BrainCircuit, Zap, Shield, BarChart3, ArrowRight, Menu, Globe, Cpu, Activity, FileText, Rocket, ShieldCheck, Check, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LandingPageProps {
    onGetStarted: () => void;
    buttonLabel?: string;
    isLoggedIn?: boolean;
}

const QA_PAIRS = [
    {
        q: "Restoration time for a blown fuse?",
        aPre: "In cities and towns, the distribution licensee must restore supply within ",
        aHighlight: "4 hours.",
        source: "WBERC Standard of Performance Regulations"
    },
    {
        q: "Maximum load for single-phase connection?",
        aPre: "A new connection can be provided on single-phase 230V if the contract demand is up to ",
        aHighlight: "5 kW.",
        source: "State Electricity Supply Code"
    },
    {
        q: "Penalty for delayed electricity bill payment?",
        aPre: "Delayed Payment Surcharge (DPS) is levied at the rate of ",
        aHighlight: "1.25% per month.",
        source: "State Tariff Order 2024-25"
    },
    {
        q: "Timeframe to resolve billing disputes?",
        aPre: "The licensee must resolve billing complaints and issue a corrected bill within ",
        aHighlight: "15 days.",
        source: "Consumer Grievance Redressal Forum Regulations"
    }
];

const PLANS = [
    {
        id: "free",
        name: "Basic",
        price: 0,
        limit: "20 queries / day",
        description: "Standard regulatory lookup for general users.",
        features: ["Standard search", "Basic history", "Web access"],
        color: "from-slate-500 to-slate-700",
        icon: Rocket,
    },
    {
        id: "basic",
        name: "Basic+",
        price: 200,
        limit: "100 queries / day",
        description: "Enhanced bandwidth for active policy research.",
        features: ["High-speed search", "Priority support", "Extended history"],
        color: "from-blue-500 to-indigo-600",
        icon: Zap,
    },
    {
        id: "advance",
        name: "Advance",
        price: 300,
        limit: "300 queries / day",
        description: "Professional grade strategic intelligence.",
        features: ["Full database access", "Extended context", "Priority support"],
        color: "from-purple-500 to-indigo-600",
        icon: BrainCircuit,
    },
    {
        id: "pro",
        name: "Pro",
        price: 500,
        limit: "500 queries / day",
        description: "Maximum bandwidth for enterprise-level operations.",
        features: ["Enterprise support", "Unlimited history", "Advanced analytics"],
        color: "from-indigo-500 to-amber-600",
        icon: ShieldCheck,
    },
];

export default function LandingPage({ onGetStarted, buttonLabel = "Get Started Now", isLoggedIn = false }: LandingPageProps) {
    const [activeSection, setActiveSection] = useState("hero");

    const [qaIndex, setQaIndex] = useState(0);
    const [displayedQ, setDisplayedQ] = useState("");
    const [displayedAPre, setDisplayedAPre] = useState("");
    const [displayedAHighlight, setDisplayedAHighlight] = useState("");
    const [qaPhase, setQaPhase] = useState<'typing-q' | 'typing-a-pre' | 'typing-a-high' | 'showing' | 'clearing'>('typing-q');

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const current = QA_PAIRS[qaIndex];

        if (qaPhase === 'typing-q') {
            if (displayedQ.length < current.q.length) {
                timeout = setTimeout(() => setDisplayedQ(current.q.slice(0, displayedQ.length + 1)), 40);
            } else {
                timeout = setTimeout(() => setQaPhase('typing-a-pre'), 600);
            }
        } else if (qaPhase === 'typing-a-pre') {
            if (displayedAPre.length < current.aPre.length) {
                timeout = setTimeout(() => setDisplayedAPre(current.aPre.slice(0, displayedAPre.length + 1)), 25);
            } else {
                setQaPhase('typing-a-high');
            }
        } else if (qaPhase === 'typing-a-high') {
            if (displayedAHighlight.length < current.aHighlight.length) {
                timeout = setTimeout(() => setDisplayedAHighlight(current.aHighlight.slice(0, displayedAHighlight.length + 1)), 35);
            } else {
                timeout = setTimeout(() => setQaPhase('showing'), 4000);
            }
        } else if (qaPhase === 'showing') {
            setQaPhase('clearing');
        } else if (qaPhase === 'clearing') {
            setDisplayedQ("");
            setDisplayedAPre("");
            setDisplayedAHighlight("");
            setQaIndex((prev) => (prev + 1) % QA_PAIRS.length);
            setQaPhase('typing-q');
        }

        return () => clearTimeout(timeout);
    }, [displayedQ, displayedAPre, displayedAHighlight, qaPhase, qaIndex]);

    useEffect(() => {
        const sections = ["hero", "regulatory-scope", "institutional", "pricing", "about"];
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.3 }
        );

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center">
                            <BrainCircuit className="w-8 h-8 text-indigo-500" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">GridMind <span className="text-indigo-400">AI</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {[
                            { name: "The Solution", id: "hero" },
                            { name: "Regulatory Scope", id: "regulatory-scope" },
                            { name: "Institutional", id: "institutional" },
                            { name: "Pricing", id: "pricing" },
                            { name: "About", id: "about" }
                        ].map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeSection === link.id ? "text-indigo-400" : "text-slate-500 hover:text-white"
                                    }`}
                            >
                                {link.name}
                                {activeSection === link.id && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                    />
                                )}
                            </a>
                        ))}
                    </div>

                    <button
                        onClick={onGetStarted}
                        className="px-6 py-2.5 rounded-full bg-white text-slate-950 text-xs font-bold uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-white/5"
                    >
                        {isLoggedIn ? "Dashboard" : "Sign In"}
                    </button>
                </div>
            </nav>

            {/* Progress Bar */}
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 origin-left z-[60] shadow-[0_0_15px_rgba(79,70,229,0.8)]" style={{ scaleX }} />

            {/* Scanline Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] scanline" />

            {/* Hero Section */}
            <section id="hero" className="relative pt-40 pb-32 px-6 overflow-hidden min-h-screen flex items-center">
                {/* Background Atmosphere */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="flex flex-col gap-8"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Built for Indian Power Sector Professionals</span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
                            Stop scrolling through PDFs. <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Get the exact clause.</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-lg text-slate-400 leading-relaxed max-w-xl">
                            Electricity Act. Tariff Policies. MoP Guidelines. SERC Regulations. CEA Standards. DISCOM Circulars. Financial Rules. Purchase Policies. IS Codes. All within the larger aspect of CVC Guidelines and Financial Discipline. We turn the chaos of changing power sector notifications into instant, actionable answers.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-4">
                            <button
                                onClick={onGetStarted}
                                className="group px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                {buttonLabel}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>

                        {/* Sector Labels */}
                        <motion.div variants={itemVariants} className="flex items-center gap-8 pt-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                            {['Generation', 'Transmission', 'Distribution'].map((sector) => (
                                <div key={sector} className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{sector}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="hidden lg:block relative perspective-1000"
                    >
                        <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl bg-slate-950 aspect-[4/3] flex items-center justify-center">
                            {/* Chaos: Floating Manuals */}
                            {[
                                { text: "Electricity Act 2003", top: "10%", left: "10%", delay: 0 },
                                { text: "SERC Regulations", top: "70%", left: "15%", delay: 0.2 },
                                { text: "IS Codes", top: "20%", left: "60%", delay: 0.4 },
                                { text: "Financial Rules", top: "80%", left: "70%", delay: 0.6 },
                                { text: "DISCOM Circulars", top: "45%", left: "5%", delay: 0.8 },
                                { text: "Purchase Policies", top: "50%", left: "80%", delay: 1.0 },
                            ].map((doc, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [0, -10, 0, 10, 0],
                                        rotate: [0, 2, -2, 1, 0],
                                        opacity: [0.3, 0.6, 0.3],
                                        filter: ["blur(2px)", "blur(0px)", "blur(2px)"]
                                    }}
                                    transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: doc.delay }}
                                    className="absolute p-3 rounded-xl bg-white border border-slate-200 shadow-xl w-32 md:w-40 text-[8px] md:text-[10px] text-slate-800 font-serif opacity-30 z-0"
                                    style={{ top: doc.top, left: doc.left }}
                                >
                                    <div className="w-full h-1 bg-red-500/20 mb-2 rounded" />
                                    <div className="w-3/4 h-1 bg-slate-200 mb-1 rounded" />
                                    <div className="w-full h-1 bg-slate-200 mb-1 rounded" />
                                    <div className="w-5/6 h-1 bg-slate-200 mb-2 rounded" />
                                    <span className="font-bold flex items-center justify-center mt-2 border-t pt-2">{doc.text}</span>
                                </motion.div>
                            ))}

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent z-10" />

                            {/* Clarity: The Answer */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, duration: 1 }}
                                className="relative z-20 w-3/4 max-w-sm"
                            >
                                <div className="p-4 rounded-t-2xl border border-white/10 bg-slate-900 shadow-xl flex items-center gap-3">
                                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                                    <div className="w-full h-8 bg-slate-800 rounded-lg flex items-center px-3 border border-white/5 overflow-hidden">
                                        <span className="text-[10px] text-slate-400 font-mono truncate">{displayedQ}<span className="animate-pulse">|</span></span>
                                    </div>
                                </div>
                                <div className="p-5 rounded-b-2xl border-x border-b border-white/10 bg-slate-900/95 backdrop-blur shadow-2xl space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-indigo-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                            {qaPhase === 'typing-q' ? 'Searching...' : 'Target Acquired'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed font-serif min-h-[80px]">
                                        {qaPhase !== 'typing-q' ? (
                                            <>
                                                "{displayedAPre}
                                                {displayedAHighlight && <strong className="text-white bg-indigo-500/20 px-1 rounded">{displayedAHighlight}</strong>}
                                                {qaPhase !== 'showing' && <span className="animate-pulse">|</span>}
                                                {qaPhase === 'showing' && '"'}
                                            </>
                                        ) : (
                                            <span className="text-slate-600 italic">Scanning regulatory database...</span>
                                        )}
                                    </p>
                                    <div className="pt-2 border-t border-white/10 flex justify-between items-center h-6 overflow-hidden">
                                        {qaPhase !== 'typing-q' && (
                                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-slate-500 font-mono truncate mr-2 flex items-center gap-1.5">
                                                <FileText className="w-3 h-3 text-red-400" />
                                                {QA_PAIRS[qaIndex].source}
                                            </motion.span>
                                        )}
                                        {qaPhase !== 'typing-q' && <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Document Flow Section */}
            <motion.section
                id="regulatory-scope"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="py-32 px-6 bg-slate-900/40 relative"
            >
                <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 ml-8 hidden lg:block" />
                <div className="max-w-5xl mx-auto">
                    <div className="sticky top-20 z-20 py-10 mb-10">
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The <span className="text-indigo-400">Regulatory Cascade.</span></h2>
                            <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
                                From parliamentary acts to daily utility operations, rules flow downwards. We index every layer so you can pinpoint the exact mandate governing your work.
                            </p>
                        </div>
                    </div>

                    <div className="relative max-w-3xl mx-auto">
                        {/* Timeline Track */}
                        <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-slate-800 -translate-x-1/2" />
                        <motion.div
                            className="absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-indigo-500 -translate-x-1/2 origin-top"
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            viewport={{ once: true }}
                        />

                        {[
                            { title: "Electricity Act 2003", desc: "The primary legislation governing the power sector in India." },
                            { title: "National Electricity Policy", desc: "Broad framework for development of the power system based on the Act." },
                            { title: "Tariff Policy", desc: "Guidelines for pricing of electricity by generating companies and licensees." },
                            { title: "CERC / SERC Regulations", desc: "Detailed rules for tariff determination, open access, and market mechanisms." },
                            { title: "Grid Code & Technical Standards", desc: "CEA standards and Grid Controller mandates for safe operation." },
                            { title: "Utility Procedures & Circulars", desc: "Day-to-day SOPs, commercial circulars, and operational guidelines." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: i * 0.2 }}
                                viewport={{ once: true, margin: "-50px" }}
                                className={`relative flex items-center mb-12 last:mb-0 ${i % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'} flex-row`}
                            >
                                {/* Center Node */}
                                <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 -translate-x-1/2 z-10 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />

                                <div className={`ml-20 md:ml-0 md:w-1/2 ${i % 2 === 0 ? 'md:pl-12 text-left' : 'md:pr-12 md:text-right'}`}>
                                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 transition-colors backdrop-blur-sm shadow-xl">
                                        <h3 className="text-lg font-bold text-indigo-300 mb-2">{item.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Institutional Hierarchy Flowchart */}
            <motion.section
                id="institutional"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1 }}
                className="py-32 px-6 bg-slate-950 relative border-t border-white/5"
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="sticky top-20 z-20 py-10 mb-12">
                        <div className="text-center">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">The Power Sector <span className="text-indigo-400">Ecosystem.</span></h2>
                            <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                                A unified view of the authorities, regulators, and operators that define the Indian Power Sector. GridMind AI maps every node to its corresponding mandate.
                            </p>
                        </div>
                    </div>

                    {/* Flowchart Container */}
                    <div className="flex flex-col items-center max-w-5xl mx-auto relative cursor-default">
                        {/* Connecting Lines (Background) */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-800 -translate-x-1/2 z-0 hidden md:block" />

                        {/* Level 1: Gov */}
                        <div className="relative z-10 bg-slate-900 border border-white/10 px-8 py-4 rounded-2xl shadow-xl mb-12 flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Government of India</span>
                            <span className="text-white font-bold text-lg">Ministry of Power (MoP)</span>
                        </div>

                        {/* Level 2: CEA & CERC */}
                        <div className="relative z-10 w-full flex flex-col md:flex-row justify-center gap-8 md:gap-32 mb-12">
                            {/* Horizontal connector */}
                            <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />

                            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/80 backdrop-blur border border-indigo-500/30 px-6 py-4 rounded-2xl shadow-lg shadow-indigo-500/5 text-center relative z-10 w-full md:w-64">
                                <h3 className="text-indigo-300 font-bold">CEA</h3>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Technical Standards & Planning</p>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/80 backdrop-blur border border-blue-500/30 px-6 py-4 rounded-2xl shadow-lg shadow-blue-500/5 text-center relative z-10 w-full md:w-64">
                                <h3 className="text-blue-300 font-bold">CERC</h3>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Interstate Markets & Tariff</p>
                            </motion.div>
                        </div>

                        {/* Level 3: Grid Controllers */}
                        <div className="relative z-10 bg-slate-900/60 border border-white/10 p-6 rounded-3xl w-full max-w-3xl mb-12 backdrop-blur-sm">
                            <h4 className="text-center text-xs font-bold text-slate-500 mb-6 uppercase tracking-[0.2em]">Grid Operation Supervision</h4>

                            <div className="flex flex-col items-center mb-6">
                                <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-3 rounded-xl text-center w-full sm:w-auto">
                                    <span className="text-amber-400 font-bold text-sm block">Grid Controller of India</span>
                                    <span className="text-[10px] text-amber-500/70 uppercase tracking-widest mt-1 block">NLDC</span>
                                </div>
                            </div>

                            {/* RLDCs */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative">
                                {['Northern', 'Western', 'Eastern', 'Southern/NE'].map((rldc) => (
                                    <div key={rldc} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-center relative z-10">
                                        <span className="text-xs text-slate-300 font-medium">{rldc} RLDC</span>
                                    </div>
                                ))}
                            </div>

                            {/* SLDCs & SERCs */}
                            <div className="flex flex-col sm:flex-row justify-center gap-4 border-t border-white/5 pt-6">
                                <div className="bg-slate-950 border border-slate-700 p-4 rounded-xl text-center flex-1">
                                    <span className="text-xs font-bold text-slate-300 block mb-1">SLDCs</span>
                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">State Load Dispatch</span>
                                </div>
                                <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl text-center flex-1">
                                    <span className="text-xs font-bold text-indigo-300 block mb-1">SERCs</span>
                                    <span className="text-[9px] text-indigo-500/70 uppercase tracking-widest">State Regulators</span>
                                </div>
                            </div>
                        </div>

                        {/* Level 4: Utilities & Consumers */}
                        <div className="relative z-10 w-full max-w-4xl">
                            <div className="absolute -top-12 left-1/2 w-px h-12 bg-slate-800 -translate-x-1/2 z-0 hidden md:block" />
                            <div className="grid md:grid-cols-3 gap-6">
                                <motion.div whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center group">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center mb-3 group-hover:bg-rose-500/20 transition-colors">
                                        <Zap className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-200">Generation</h4>
                                    <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">GENCOs / IPPs</p>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center group">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                                        <Globe className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-200">Transmission</h4>
                                    <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">STU / CTU</p>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center group flex flex-col justify-between">
                                    <div>
                                        <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                                            <Cpu className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-200">Distribution</h4>
                                        <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">DISCOMs</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Consumers</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.section>

            {/* Pricing Section */}
            <motion.section
                id="pricing"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="py-24 px-6 max-w-7xl mx-auto relative z-10"
            >
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-4"
                    >
                        <Sparkles className="w-3 h-3" />
                        Platform Access
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        Strategic Pricing Plans
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base font-serif">
                        Choose the operational bandwidth that matches your intelligence requirements.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PLANS.map((plan, index) => {
                        const Icon = plan.icon;
                        const isPro = plan.id === 'pro';
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative p-6 rounded-3xl border flex flex-col bg-slate-900 shadow-xl ${isPro ? "border-indigo-500 shadow-indigo-500/10" : "border-slate-800"
                                    }`}
                            >
                                {isPro && (
                                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                                        <span className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                                            Recommended
                                        </span>
                                    </div>
                                )}
                                <div className="mb-6 flex justify-between items-start">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${plan.color}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200">{plan.name}</h3>
                                </div>
                                <div className="mb-4">
                                    <span className="text-4xl font-extrabold tracking-tight">₹{plan.price}</span>
                                    <span className="text-slate-500 text-sm ml-2">/ month</span>
                                </div>
                                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
                                    {plan.limit}
                                </div>
                                <p className="text-sm text-slate-400 mb-6 font-serif leading-relaxed h-12">
                                    {plan.description}
                                </p>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-indigo-400" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={onGetStarted}
                                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${isPro
                                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                                        : "bg-slate-800 hover:bg-slate-700 text-white"
                                        }`}
                                >
                                    Select Plan
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.section>

            <div className="h-32 flex justify-center items-center overflow-hidden">
                <motion.div
                    animate={{ height: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-[1px] bg-gradient-to-b from-transparent via-indigo-500 to-transparent"
                />
            </div>

            {/* Footer / CTA Section */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="py-32 px-6 text-center border-t border-white/5 relative"
            >
                <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] opacity-30" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto flex flex-col gap-10 items-center"
                >
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                        Stop digging through folders. <br />
                        <span className="text-indigo-400">Start acting on intelligence.</span>
                    </h2>
                    <button
                        onClick={onGetStarted}
                        className="px-12 py-5 rounded-2xl bg-white text-slate-950 font-bold uppercase tracking-widest text-sm hover:bg-slate-200 transition-all active:scale-95 shadow-2xl shadow-white/10"
                    >
                        Enter GridMind Mission Control
                    </button>
                </motion.div>
            </motion.section>

            <footer id="about" className="py-12 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 opacity-50">
                        <BrainCircuit className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm font-bold tracking-tight">GridMind Strategic Dashboard</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] italic">Decide Fast. Act Fast.</p>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                        © 2026 GridMind AI. All Rights Reserved.
                    </div>
                </div>
            </footer>

            <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
        </div>
    );
}
