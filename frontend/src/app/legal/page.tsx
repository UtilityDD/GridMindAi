import Link from "next/link";
import { BrainCircuit, ArrowLeft } from "lucide-react";

export default function LegalPage() {
    const lastUpdated = "March 9, 2026";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-6 py-20">

                {/* Header */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <Link href="/" className="mb-8 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
                    </Link>
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl mb-6">
                        <BrainCircuit className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Legal Framework</h1>
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Last Updated: {lastUpdated}</p>
                </div>

                <div className="space-y-16">

                    {/* Privacy Policy */}
                    <section id="privacy" className="scroll-mt-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="w-8 h-px bg-indigo-500/50" />
                            Privacy Policy
                        </h2>
                        <div className="prose prose-invert max-w-none space-y-4 text-slate-400 leading-relaxed">
                            <p>At <strong>GridMind AI</strong>, we take your data security and privacy seriously. This policy explains how we handle your information.</p>

                            <h3 className="text-white font-semibold mt-6">1. Information We Collect</h3>
                            <p>We collect only the information necessary to provide our strategic search services:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Account Information:</strong> When you sign in with Google or Email, we store your email address and name to manage your subscription tier.</li>
                                <li><strong>Usage Data:</strong> We track the number of queries made to manage your daily/monthly limits.</li>
                                <li><strong>Query Metadata:</strong> We may store search keywords to improve retrieval accuracy (this is not linked to your identity in our analytics).</li>
                            </ul>

                            <h3 className="text-white font-semibold mt-6">2. Third-Party Services</h3>
                            <p>We use trusted infrastructure to power GridMind AI:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Supabase:</strong> Our database and authentication provider.</li>
                                <li><strong>Google/Gemini:</strong> Used for generating embeddings and AI responses. Your personal identity is never shared with the AI models.</li>
                            </ul>

                            <h3 className="text-white font-semibold mt-6">3. Data Security</h3>
                            <p>Your data is encrypted at rest and in transit. We never sell your personal information or search history to third parties.</p>
                        </div>
                    </section>

                    {/* Terms of Service */}
                    <section id="terms" className="scroll-mt-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="w-8 h-px bg-indigo-500/50" />
                            Terms of Service
                        </h2>
                        <div className="prose prose-invert max-w-none space-y-4 text-slate-400 leading-relaxed">
                            <p>By using GridMind AI, you agree to the following terms and conditions.</p>

                            <h3 className="text-white font-semibold mt-6">1. Use of Service</h3>
                            <p>GridMind AI is a strategic research tool. While we aim for 100% accuracy, AI-generated responses should always be verified against oficial departmental circulars before taking legal or operational action.</p>

                            <h3 className="text-white font-semibold mt-6">2. Tier Limits</h3>
                            <p>Free (Basic) users are subject to daily and monthly query limits. These limits are reset automatically and cannot be transferred.</p>

                            <h3 className="text-white font-semibold mt-6">3. Intellectual Property</h3>
                            <p>The code, brand, and design of GridMind AI are the intellectual property of its developers. Users may not attempt to scrape, reverse engineer, or redistribute our proprietary document indices.</p>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="mt-24 pt-12 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-600 italic">GridMind AI: Decide Fast. Act Fast.</p>
                </div>

            </div>
        </div>
    );
}
