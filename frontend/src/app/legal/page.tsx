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
                        <div className="prose prose-invert max-w-none space-y-4 text-slate-400 leading-relaxed text-sm">
                            <p>At <strong>GridMind AI</strong>, we prioritize the confidentiality of your strategic inquiries. This policy outlines our data handling frameworks.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">1. Strategic Intelligence Data</h3>
                            <p>We collect and manage only the data essential for precision retrieval:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>Identity Management:</strong> We utilize Google Auth and Supabase to uniquely identify users for subscription tier enforcement and customized experience.</li>
                                <li><strong>Query Telemetry:</strong> To improve our neural reranking, we log search queries and feedback. No sensitive personal data should be entered into the query field.</li>
                                <li><strong>Vector Embeddings:</strong> We store mathematical representations (vectors) of regulatory documents. These are non-reversible and used solely for semantic matching via Pinecone/Supabase.</li>
                            </ul>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">2. Computational Partners</h3>
                            <p>Your queries are processed through high-security APIs (Gemini, Groq, SambaNova). No permanent storage of your queries is maintained by these providers beyond the transient inference window.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">3. Data Sovereignty</h3>
                            <p>You may request the deletion of your account and associated telemetry at any time. We maintain a zero-sale policy regarding your strategic search history.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">4. Community Submissions</h3>
                            <p>When you contribute a "Reference File" via the Contribution Vault, we store the file content and the uploader's email address for audit and attribution purposes. This information is accessible only to platform administrators.</p>
                        </div>
                    </section>

                    {/* Terms of Service */}
                    <section id="terms" className="scroll-mt-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="w-8 h-px bg-indigo-500/50" />
                            Terms of Service & Legal Disclaimer
                        </h2>
                        <div className="prose prose-invert max-w-none space-y-4 text-slate-400 leading-relaxed text-sm">
                            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8">
                                <p className="text-amber-400 font-bold mb-2 uppercase tracking-widest text-[10px]">⚖️ Legal Mandate:</p>
                                <p className="text-slate-300 italic text-xs leading-relaxed">
                                    "By accessing GridMind AI, you acknowledge that this is a <strong>Strategic Research Index</strong> and NOT an official government portal. AI responses are synthesized and MUST be verified against original departmental gazettes."
                                </p>
                            </div>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">1. Limitation of Liability (Neural Hallucinations)</h3>
                            <p>AI models periodically generate inaccurate or "hallucinated" tactical information. GridMind AI and its developers are not liable for any operational losses, financial errors, or legal disputes arising from actions taken based on synthesized responses.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">2. No Official Affiliation</h3>
                            <p>GridMind AI is an independent platform for regulatory research. We are NOT affiliated with, endorsed by, or authorized by **WBSEDCL**, **WBERC**, **Ministry of Power**, or any other government authority. All trademarks remain the property of their respective owners.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">3. Source of Truth Hierarchy</h3>
                            <p>In all instances of conflict, the **Original Departmental Circular**, **State Gazette**, or **Official Regulatory Order** shall override any information provided by GridMind AI. Our the system is a reference assistant, not an authority.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">4. Intellectual Property & Redistribution</h3>
                            <p>While the circulars themselves are public domain records, our <strong>Proprietary Neural Index</strong>, design, and retrieval architecture are protected. Users are prohibited from bulk-downloading, scraping, or mass-redistributing documents hosted in our viewer to third-party platforms without explicit authorization.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">5. Error Reporting & Verification</h3>
                            <p>Users bear the responsibility to use the built-in "Report" feature to notify developers of missing 2024-25 circulars or analytical errors. Your proactive reporting maintains the platform's strategic fidelity.</p>

                            <h3 className="text-white font-semibold mt-6 uppercase tracking-widest text-[11px]">6. Community-Sourced Content (User Uploads)</h3>
                            <p>GridMind includes a "Contribution Vault" for community-sourced reference materials. By uploading, you affirm that the content does not violate third-party copyrights. GridMind acts as a passive service provider (Safe Harbor) and is <strong>not liable</strong> for the legal provenance of user-uploaded files. Any infringing content will be removed upon valid DMCA/Copyright take-down requests.</p>
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
