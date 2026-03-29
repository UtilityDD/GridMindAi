import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    const lastUpdated = "March 29, 2026";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-6 py-20">

                {/* Header */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <Link href="/" className="mb-8 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Dashboard</span>
                    </Link>
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl mb-6">
                        <ShieldCheck className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Privacy Framework</h1>
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Last Updated: {lastUpdated}</p>
                </div>

                <div className="space-y-16">
                    <section className="scroll-mt-20">
                        <div className="prose prose-invert max-w-none space-y-6 text-slate-400 leading-relaxed text-sm">
                            <p className="text-lg text-slate-300">
                                At <strong>GridMind AI</strong>, we prioritize the uncompromised confidentiality of your strategic utility queries. This policy explicitly outlines our isolated data handling, AI processing, and telemetry mechanisms.
                            </p>

                            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 my-8">
                                <p className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-[10px]">🔒 Core Principle:</p>
                                <p className="text-slate-300 italic text-xs leading-relaxed">
                                    "Your queries are tools for utility management, not data-harvesting commodities. We adhere to strict data-minimization rules."
                                </p>
                            </div>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">1. Identity & Telemetry Management</h3>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li>
                                    <strong className="text-slate-300">Authentication:</strong> We utilize Google OAuth and Supabase exclusively as identity providers. We receive your basic profile (Email, Name, Avatar) to enforce subscription tiers and maintain session integrity. We do not aggregate your social graph.
                                </li>
                                <li>
                                    <strong className="text-slate-300">Query Analytics (Reranking):</strong> To optimize our neural search algorithms, we retain a log of generalized search telemetry (the queries you submit). This allows the system to identify frequently-searched concepts (e.g., "ROPA 2020" or "Section 135") and proactively refine our database indexing. <strong>You must NOT enter personally identifiable information (PII) or classified grid-operational secrets into the search prompt.</strong>
                                </li>
                            </ul>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">2. Vector Embeddings (Data Representation)</h3>
                             <p>
                                When documents are ingested into our system, they are converted into mathematical arrays called <strong className="text-slate-300">Vector Embeddings</strong> via our semantic pipelines (e.g., Gemini). These vectors are conceptually irreversible algorithms designed purely for calculating document similarity (Supabase pgvector / Pinecone). We do not store or attempt to reconstruct sensitive original documents dynamically from these vectors outside of our controlled Retrieval-Augmented Generation (RAG) context limits.
                             </p>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">3. Computational AI Partners (Safe Inference)</h3>
                            <p>
                                GridMind operates across a decentralized <strong>"Mega-Pool"</strong> of neural inference providers including <strong className="text-slate-300">SambaNova, Groq, GitHub Models (OpenAI endpoint proxies), and OpenRouter</strong>.
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li><strong>Zero-Training Policy:</strong> GridMind exclusively utilizes "API-Tier" or Enterprise endpoints. According to the stated policies of our providers (OpenAI, Meta APIs via Groq/SambaNova), your queries and retrieved WBSEDCL context are <strong>NOT used to train their foundational models</strong>.</li>
                                <li><strong>Transient State:</strong> Prompts sent to these external nodes exist solely for the milliseconds required to compute the inference (Token Generation) and are immediately volatile on their endpoint.</li>
                            </ul>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">4. User Contributions & Reference Sharing</h3>
                            <p>
                                GridMind features a collaborative <strong>Share Document</strong> tool. When you upload a reference file (such as localized office orders):
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li>The file securely routed to Google Drive or Supabase Storage.</li>
                                <li>Your registered email address is permanently logging against that specific file ID in our isolated metadata tables. This is to maintain strict accountability and audit trails for malicious or copyrighted uploads.</li>
                                <li>While the <em>content</em> of the file may be made accessible to the AI querying engine, your email identity remains hidden from other end-users and is only accessible by GridMind Administrators.</li>
                            </ul>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">5. Data Deletion & Erasure Requests</h3>
                            <p>
                                You retain sovereignty over your identity. You may request total erasure of your identity from the GridMind database. Note that generalized search telemetry previously logged may be anonymized and stripped of your UserID, retaining its value for search optimization without being linkable to you.
                            </p>
                            <p className="mt-4">
                                For data and privacy inquiries, or deletion requests, please email our administrative team at: 
                                <br/><strong className="text-indigo-400">gridmind.info@gmail.com</strong>
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-24 pt-12 border-t border-white/5 flex flex-col items-center justify-center space-y-4">
                    <p className="text-xs text-slate-600 italic">GridMind AI: Decide Fast. Act Fast.</p>
                    <div className="flex space-x-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms of Use</Link>
                        <span>|</span>
                        <Link href="/privacy" className="text-indigo-400">Privacy Policy</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
