"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { BrainCircuit, Zap, Shield, BarChart3, ArrowRight, Menu, Globe, Cpu, Activity, FileText, Check, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PLANS } from "@/lib/plans";

interface LandingPageProps {
    onGetStarted: () => void;
    buttonLabel?: string;
    isLoggedIn?: boolean;
}

const QA_PAIRS = [
    {
        q: "Documents for a new industrial connection?",
        aPre: "For industrial load, the primary requirement is a valid trade license and ",
        aHighlight: "land ownership/tenancy proof.",
        source: "State Electricity Supply Code (Annexure 1)"
    },
    {
        q: "CEA limit for voltage harmonic distortion?",
        aPre: "As per CEA (Technical Standards), the Total Harmonic Distortion (THD) limit at the PCC is ",
        aHighlight: "maximum 5%.",
        source: "CEA Grid Standards (Manual of 2010)"
    },
    {
        q: "Restoration time for a blown fuse?",
        aPre: "In cities and towns, the distribution licensee must restore supply within ",
        aHighlight: "4 hours.",
        source: "WBERC Standard of Performance Regulations"
    },
    {
        q: "Higher scale eligibility under ROPA 2020?",
        aPre: "Technical staff is eligible for the first higher scale after completing ",
        aHighlight: "8 years of continuous service.",
        source: "State Finance Department (ROPA Circular)"
    }
];

const NAV_LINKS = [
    { name: "The Solution", id: "hero" },
    { name: "Regulatory Scope", id: "regulatory-scope" },
    { name: "Institutional", id: "institutional" },
    { name: "Contributions", id: "pricing" },
    { name: "About", id: "about" },
] as const;

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
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        NAV_LINKS.forEach(link => {
            const el = document.getElementById(link.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (!el) return;

        const top = el.getBoundingClientRect().top + window.scrollY - 96;
        window.history.replaceState(null, "", `#${id}`);
        window.scrollTo({ top, behavior: "smooth" });
        setActiveSection(id);
    };

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
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center">
                            <BrainCircuit className="w-8 h-8 text-blue-600" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">GridMind <span className="text-blue-600">AI</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={(e) => handleNavClick(e, link.id)}
                                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${ activeSection === link.id ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                {link.name}
                                {activeSection === link.id && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-600"
                                    />
                                )}
                            </a>
                        ))}
                    </div>

                    <button
                        onClick={onGetStarted}
                        className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                    >
                        {isLoggedIn ? "Dashboard" : "Sign In"}
                    </button>
                </div>
            </nav>

            {/* Progress Bar */}
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-[60]" style={{ scaleX }} />

            {/* Hero Section */}
            <section id="hero" className="relative pt-40 pb-32 px-6 overflow-hidden min-h-screen flex items-center">

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="flex flex-col gap-8"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 w-fit">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Decide Fast. Act Fast.</span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
                            Stop scrolling through PDFs. <br /> <span className="text-blue-600">Get the exact clause.</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-lg text-slate-600 leading-relaxed max-w-xl">
                            Electricity Act, Tariff Policy, MoP guidelines, SERC rules, CEA standards, DISCOM circulars, financial and purchase rules, and IS codes, aligned with CVC and financial discipline. GridMind turns changing notifications into instant, actionable answers.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-4">
                            <button
                                onClick={onGetStarted}
                                className="group px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                {buttonLabel}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>

                        {/* Sector Labels */}
                        <motion.div variants={itemVariants} className="flex items-center gap-8 pt-6 opacity-60 hover:opacity-100 transition-all">
                            {['Generation', 'Transmission', 'Distribution'].map((sector) => (
                                <div key={sector} className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-600" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{sector}</span>
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
                        <div className="relative rounded-[3rem] overflow-hidden border border-slate-300 shadow-lg bg-white aspect-[4/3] flex items-center justify-center">
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
                                    className="absolute p-3 rounded-xl bg-gray-50 border border-slate-300 shadow-md w-32 md:w-40 text-[8px] md:text-[10px] text-slate-800 font-serif opacity-40 z-0"
                                    style={{ top: doc.top, left: doc.left }}
                                >
                                    <div className="w-full h-1 bg-red-500/20 mb-2 rounded" />
                                    <div className="w-3/4 h-1 bg-slate-200 mb-1 rounded" />
                                    <div className="w-full h-1 bg-slate-200 mb-1 rounded" />
                                    <div className="w-5/6 h-1 bg-slate-200 mb-2 rounded" />
                                    <span className="font-bold flex items-center justify-center mt-2 border-t pt-2">{doc.text}</span>
                                </motion.div>
                            ))}

                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />

                            {/* Clarity: The Answer */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, duration: 1 }}
                                className="relative z-20 w-3/4 max-w-sm"
                            >
                                <div className="p-4 rounded-t-2xl border border-slate-300 bg-white shadow-sm flex items-center gap-3">
                                    <BrainCircuit className="w-5 h-5 text-blue-600" />
                                    <div className="w-full h-8 bg-gray-100 rounded-lg flex items-center px-3 border border-slate-300 overflow-hidden">
                                        <span className="text-[10px] text-slate-600 font-mono truncate">{displayedQ}<span className="animate-pulse">|</span></span>
                                    </div>
                                </div>
                                <div className="p-5 rounded-b-2xl border-x border-b border-slate-300 bg-white shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                            {qaPhase === 'typing-q' ? 'Searching...' : 'Target Acquired'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed font-serif min-h-[80px]">
                                        {qaPhase !== 'typing-q' ? (
                                            <>
                                                "{displayedAPre}
                                                {displayedAHighlight && <strong className="text-slate-900 bg-blue-100 px-1 rounded">{displayedAHighlight}</strong>}
                                                {qaPhase !== 'showing' && <span className="animate-pulse">|</span>}
                                                {qaPhase === 'showing' && '"'}
                                            </>
                                        ) : (
                                            <span className="text-slate-500 italic">Scanning regulatory database...</span>
                                        )}
                                    </p>
                                    <div className="pt-2 border-t border-slate-300 flex justify-between items-center h-6 overflow-hidden">
                                        {qaPhase !== 'typing-q' && (
                                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-slate-600 font-mono truncate mr-2 flex items-center gap-1.5">
                                                <FileText className="w-3 h-3 text-red-500" />
                                                {QA_PAIRS[qaIndex].source}
                                            </motion.span>
                                        )}
                                        {qaPhase !== 'typing-q' && <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
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
                className="relative bg-gray-50 px-6 py-28 border-t border-slate-200"
            >
                <div className="mx-auto max-w-6xl">
                    <div className="mb-14 text-center">
                        <h2 className="text-3xl font-bold tracking-tight md:text-5xl text-slate-900">Regulatory Scope</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                            One clean path from law to field execution.
                        </p>
                    </div>

                    <div className="relative mx-auto max-w-5xl">
                        {/* Desktop path */}
                        <div className="relative hidden md:block">
                            <div className="absolute left-0 right-0 top-8 h-px bg-slate-300" />
                            <motion.div
                                className="absolute left-0 top-8 h-px bg-blue-600"
                                initial={{ width: 0 }}
                                whileInView={{ width: "100%" }}
                                transition={{ duration: 2.2, ease: "easeOut" }}
                                viewport={{ once: true }}
                            />

                            <div className="grid grid-cols-6 gap-4">
                                {[
                                    { title: "Electricity Act 2003", short: "Primary law" },
                                    { title: "National Electricity Policy", short: "National direction" },
                                    { title: "Tariff Policy", short: "Pricing framework" },
                                    { title: "CERC / SERC Regulations", short: "Regulatory rules" },
                                    { title: "Grid Code & Standards", short: "Technical rules" },
                                    { title: "Utility Circulars / SOPs", short: "Operational execution" },
                                ].map((step, i) => (
                                    <motion.div
                                        key={step.title}
                                        initial={{ opacity: 0, y: 18 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.45, delay: i * 0.16 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        className="relative"
                                    >
                                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
                                            <BrainCircuit className="h-5 w-5" />
                                        </div>
                                        <div className="rounded-2xl border border-slate-300 bg-white p-4 text-center shadow-sm">
                                            <h3 className="text-sm font-semibold leading-snug text-slate-900">{step.title}</h3>
                                            <p className="mt-2 text-xs text-slate-600">{step.short}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile path */}
                        <div className="relative md:hidden">
                            <div className="absolute left-3 top-1 bottom-1 w-px bg-slate-300" />
                            <motion.div
                                className="absolute left-3 top-1 w-px bg-blue-600 origin-top"
                                initial={{ height: 0 }}
                                whileInView={{ height: "100%" }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                viewport={{ once: true }}
                            />

                            <div className="space-y-5">
                                {[
                                    { title: "Electricity Act 2003", short: "Primary law" },
                                    { title: "National Electricity Policy", short: "National direction" },
                                    { title: "Tariff Policy", short: "Pricing framework" },
                                    { title: "CERC / SERC Regulations", short: "Regulatory rules" },
                                    { title: "Grid Code & Standards", short: "Technical rules" },
                                    { title: "Utility Circulars / SOPs", short: "Operational execution" },
                                ].map((step, i) => (
                                    <motion.div
                                        key={step.title}
                                        initial={{ opacity: 0, x: 14 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: i * 0.14 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        className="relative pl-9"
                                    >
                                        <div className="absolute left-0 top-5 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600">
                                            <BrainCircuit className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                                            <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                                            <p className="mt-1 text-xs text-slate-600">{step.short}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Institutional Architecture */}
            <motion.section
                id="institutional"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1 }}
                className="relative border-t border-slate-200 bg-white px-6 py-28"
            >
                <div className="relative z-10 mx-auto max-w-6xl">
                    <div className="mb-14 text-center">
                        <h2 className="text-3xl font-bold tracking-tight md:text-5xl text-slate-900">
                            Institutional Architecture
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                            A clear governance chain from policy authority to field execution.
                        </p>
                    </div>

                    <div className="relative mx-auto max-w-5xl">
                        {/* Central signal spine */}
                        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-300 lg:block" />
                        <motion.div
                            className="absolute left-1/2 top-0 hidden w-px -translate-x-1/2 bg-blue-600 lg:block"
                            initial={{ height: 0 }}
                            whileInView={{ height: "100%" }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            viewport={{ once: true }}
                        />

                        <div className="space-y-6">
                            {[
                                {
                                    title: "Policy Authority",
                                    primary: "Ministry of Power (MoP)",
                                    chips: ["Government of India", "National policy leadership"],
                                    icon: Shield,
                                    tone: "from-blue-50 to-blue-50 border-blue-200 text-blue-600",
                                },
                                {
                                    title: "Regulation Layer",
                                    primary: "CEA | CERC | SERCs",
                                    chips: ["Technical standards", "Tariff and compliance"],
                                    icon: Activity,
                                    tone: "from-slate-50 to-slate-50 border-slate-300 text-slate-600",
                                },
                                {
                                    title: "System Operations",
                                    primary: "Grid Controller | RLDCs | SLDCs",
                                    chips: ["Real-time dispatch", "Reliability supervision"],
                                    icon: BrainCircuit,
                                    tone: "from-amber-50 to-amber-50 border-amber-200 text-amber-600",
                                },
                                {
                                    title: "Execution Layer",
                                    primary: "Generation | Transmission | Distribution | Consumers",
                                    chips: ["Utility operations", "End-user delivery"],
                                    icon: Cpu,
                                    tone: "from-emerald-50 to-emerald-50 border-emerald-200 text-emerald-600",
                                },
                            ].map((layer, i) => {
                                const Icon = layer.icon;
                                return (
                                    <motion.div
                                        key={layer.title}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.15 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        className="relative"
                                    >
                                        <div className={`rounded-3xl border bg-gradient-to-r p-[1px] ${layer.tone}`}>
                                            <div className="rounded-[1.45rem] border border-slate-200 bg-white p-5 md:p-6">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${layer.tone}`}>
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">{layer.title}</p>
                                                            <h3 className="mt-1 text-base font-semibold text-slate-900 md:text-lg">{layer.primary}</h3>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {layer.chips.map((chip) => (
                                                            <span
                                                                key={chip}
                                                                className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600"
                                                            >
                                                                {chip}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
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
                className="relative z-10 border-y border-slate-200 bg-gray-50 py-28"
            >
                <div className="mx-auto max-w-7xl px-6">
                <div className="mb-14 flex flex-col items-center text-center">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
                        API Cost Compensation
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PLANS.map((plan, index) => {
                        const isPro = plan.id === 'pro';
                        const Icon = plan.icon;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative flex flex-col rounded-[1.75rem] border bg-white p-6 shadow-sm ${isPro ? "border-blue-300 shadow-blue-100" : "border-slate-300"
                                    }`}
                            >
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.color}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">{plan.duration}</p>
                                    </div>
                                </div>
                                <div className="mb-5 border-b border-slate-300 pb-5">
                                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">₹{plan.price}</span>
                                    <span className="ml-2 text-sm text-slate-600">/ month</span>
                                </div>
                                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                                    {plan.limit}
                                </p>
                                <button
                                    onClick={onGetStarted}
                                    className={`w-full rounded-2xl py-3 text-xs font-bold uppercase tracking-widest transition-all ${isPro
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                                        }`}
                                >
                                    Contribute & Support
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
                </div>
            </motion.section>

            {/* Footer / CTA Section */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="py-32 px-6 text-center border-t border-slate-200 relative bg-white">
                <div className="absolute inset-0 bg-blue-50/30 blur-3xl opacity-30" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto flex flex-col gap-10 items-center"
                >
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-slate-900">
                        Stop digging through folders. <br />
                        <span className="text-blue-600">Start acting on intelligence.</span>
                    </h2>
                    <button
                        onClick={onGetStarted}
                        className="px-12 py-5 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest text-sm hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Decide Fast. Act Fast.
                    </button>
                </motion.div>
            </motion.section>

            {/* About Section */}
            <section id="about" className="border-t border-slate-200">
                {/* About body */}
                <div className="max-w-6xl mx-auto px-6 py-28 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                    {/* Left — identity */}
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <BrainCircuit className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-base font-bold tracking-tight">GridMind <span className="text-blue-600">AI</span></span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-slate-900">
                            Built for the<br />
                            <span className="text-blue-600">people who decide.</span>
                        </h2>
                        <p className="text-slate-600 text-base leading-relaxed max-w-md">
                            GridMind AI turns dense regulations, circulars, and standards into precise, actionable answers — in seconds. No searching. No second-guessing.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="self-start px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
                        >
                            Get Started Free
                        </button>
                    </div>

                    {/* Right — facts */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { stat: "30+", label: "Regulations Indexed" },
                            { stat: "< 5s", label: "Average Response Time" },
                            { stat: "100%", label: "Indian Electrical Standards" },
                            { stat: "24 / 7", label: "Always Available" },
                        ].map(({ stat, label }) => (
                            <div key={label} className="rounded-2xl border border-slate-300 bg-white p-6 flex flex-col gap-2 shadow-sm">
                                <span className="text-3xl font-bold text-slate-900 tracking-tight">{stat}</span>
                                <span className="text-xs text-slate-600 uppercase tracking-[0.2em] font-semibold">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer bar */}
                <div className="border-t border-slate-200 py-6 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.22em]">Decide Fast. Act Fast.</p>
                        <div className="flex items-center gap-6 text-[10px] text-slate-600 uppercase tracking-widest">
                            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
                            <span>© 2026 GridMind AI</span>
                        </div>
                    </div>
                </div>
            </section>

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
