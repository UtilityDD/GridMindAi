import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                    <div className="w-16 h-16 rounded-2xl bg-amber-900 border border-amber-500/10 flex items-center justify-center shadow-2xl mb-6">
                        <Scale className="w-8 h-8 text-amber-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Terms of Use</h1>
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Last Updated: {lastUpdated}</p>
                </div>

                <div className="space-y-16">
                    <section className="scroll-mt-20">
                        <div className="prose prose-invert max-w-none space-y-6 text-slate-400 leading-relaxed text-sm">
                            <p className="text-lg text-slate-300">
                                This document dictates the robust limitations and binding obligations governing your specialized use of the <strong>GridMind AI Platform</strong>. 
                                We exist exclusively as a Semantic Technical Index. We are NOT legal advisors.
                            </p>

                            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 my-8">
                                <p className="text-amber-500 font-bold mb-2 uppercase tracking-widest text-[11px] flex items-center gap-2">
                                    <Scale className="w-4 h-4" /> Non-Affiliation Mandate
                                </p>
                                <p className="text-slate-300 italic text-sm leading-relaxed">
                                    GridMind AI is an independent index system. <strong>We are NOT affiliated with, endorsed by, funded by, or authorized by WBSEDCL, WBERC, the Ministry of Power, the Central Electricity Authority (CEA), or any other Government Entity.</strong> Do not misrepresent AI output as official departmental rulings to your superiors, subordinates, or consumers.
                                </p>
                            </div>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">1. Limitation of Liability (Neural Hallucinations)</h3>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li>
                                    <strong className="text-slate-300">System Imperfection:</strong> Neural networks (LLMs) used in the Retrieval Authmented Generation (RAG) backend are probabilistically driven. They can and will occasionally hallucinate numbers, misread tabular specifications, or conflate WBERC ROPA years (e.g., swapping a 2020 pay-matrix with a 2009 revision).
                                </li>
                                <li>
                                    <strong className="text-slate-300">Zero Liability:</strong> The developers of GridMind AI expressly bear absolutely zero liability for any operational grid accidents, legal disputes, suspension from duty, financial losses, or estimation errors originating from decisions you executed based on AI synthesized answers. 
                                </li>
                                <li>
                                    <strong className="text-slate-300">Obligation to Verify:</strong> You agree that GridMind AI serves only to <em>locate</em> potentially relevant policies. <strong>You MUST manually verify the raw, original documents (Gazettes, Circulars) before signing estimates, taking legal action, or altering field equipment.</strong>
                                </li>
                            </ul>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">2. Source of Truth Hierarchy</h3>
                             <p>
                                When citing rules or taking official actions, the hierarchy of authority unconditionally places the <strong>Original Official Gazette or Departmental Order</strong> above any textual summary or interpretation provided on GridMind AI. If the AI output contradicts a physical circular you hold, the circular is correct. If you find anomalies, it is your responsibility as the platform user to report the error so the indexing can be corrected.
                             </p>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">3. Proprietary RAG Database & Anti-Scraping Policy</h3>
                            <p>
                                While the core electricity acts, standards, and circular text are strictly public domain, the <strong>GridMind AI proprietary Semantic Vector Index (the database schema, document meta-tags, and retrieval weights)</strong> is highly protected intellectual property.
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li>You are strictly prohibited from automating basic queries, bulk-downloading files via scripts, or using bots to scrape our processed documents to build a competing model.</li>
                                <li>Accounts found executing programmatic, unnatural bursts of requests will be permanently banned via IP and Email footprinting.</li>
                                <li>The raw files provided directly to consumers via WBSEDCL/WBERC portals are not ours stringently; however, abusing the bandwidth of GridMind AI’s indexing services is theft of service.</li>
                            </ul>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">4. User Contribution Vault (Safe Harbor & Liability)</h3>
                            <p>
                                GridMind features a <strong>"Contribution Vault"</strong> allowing utility personnel to asynchronously upload hard-to-find internal circulars for the collective intelligence of the grid community.
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li><strong>User Indemnification:</strong> By uploading a file, you certify that the file does NOT violate third-party copyrighted patents, is not classified/confidential, and does not contain PII (Personally Identifiable Information) or sensitive national security grid schematics. You are wholly legally liable for the materials you inject into the vault.</li>
                                <li><strong>Safe Harbor Status:</strong> GridMind AI acts fundamentally as a passive digital service provider. We do not proactively screen every file uploaded. If copyrighted material is posted, we abide by the DMCA (Digital Millennium Copyright Act) protocols. </li>
                                <li>GridMind Administrators reserve the absolute, unquestionable right to reject, delete, or blacklist any document or user without prior warning.</li>
                            </ul>

                            <h3 className="text-white font-semibold mt-10 uppercase tracking-widest text-[11px] border-b border-white/10 pb-2">5. DMCA / Takedown / Contact Procedures</h3>
                            <p>
                                If you are an official representing WBSEDCL, WBERC, or the MoP and you discover controlled, confidential internal-only documents mistakenly uploaded to the GridMind Index, please issue an immediate Takedown Notice to our administrative wing. We will purge the vectors and files instantly.
                            </p>
                            <p className="mt-4">
                                Legal Affairs & Takedown Notices:
                                <br/><strong className="text-amber-500">gridmind.info@gmail.com</strong>
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-24 pt-12 border-t border-white/5 flex flex-col items-center justify-center space-y-4">
                    <p className="text-xs text-slate-600 italic">GridMind AI: Decide Fast. Act Fast.</p>
                    <div className="flex space-x-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Link href="/terms" className="text-amber-500">Terms of Use</Link>
                        <span>|</span>
                        <Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
