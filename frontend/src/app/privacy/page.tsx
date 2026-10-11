import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, FileText, Cpu, UserCheck, Mail } from "lucide-react";

export default function PrivacyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-800 font-sans selection:bg-slate-900 selection:text-white flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-[11px] font-semibold text-slate-400">
            GridMind AI Legal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Title Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-sm mb-5">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Core Principle Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm mb-12">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Core Privacy Commitment</span>
          </div>
          <p className="text-slate-700 text-xs sm:text-sm leading-relaxed italic">
            "Your regulatory inquiries are research tools for power utility management, not data-harvesting commodities. We adhere to strict data-minimization rules and zero-training guarantees."
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>1. Identity & Account Governance</span>
            </h2>
            <p>
              At <strong>GridMind AI</strong>, we maintain a minimal footprint of user data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Authentication:</strong> We use Google OAuth and Supabase exclusively for authentication and session integrity. We receive basic profile information (Email address, User ID) solely to maintain account authorization and rate quotas.
              </li>
              <li>
                <strong className="text-slate-800">No Payment or Financial Data:</strong> GridMind does not collect, process, or store credit cards, bank accounts, or financial transaction details. User access and quotas are managed directly through system administrative permissions.
              </li>
              <li>
                <strong className="text-slate-800">Query Telemetry:</strong> Anonymized query logs are recorded to improve retrieval relevance and index coverage (e.g. tracking frequently requested regulations like WBSEDCL Procedure Codes or WBERC Tariffs). We explicitly advise users <strong>not to input confidential operational passwords or unredacted personal details</strong> into search prompts.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>2. Vector Embeddings & Document Retrieval</span>
            </h2>
            <p>
              When official documents, circulars, and procedure orders are ingested into the GridMind database, they are converted into high-dimensional mathematical vector arrays using semantic embedding models. These vector embeddings are irreversible numerical representations used solely to measure similarity during vector searches. Original confidential documents are not reconstructed from these vectors outside the designated Retrieval-Augmented Generation (RAG) context.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>3. AI Processing & Zero-Training Guarantee</span>
            </h2>
            <p>
              GridMind operates dedicated API-tier neural inference nodes powered by enterprise cloud providers (including Google Gemini and Groq):
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Zero-Training Policy:</strong> All model calls are executed via API endpoints whose explicit contractual terms state that your queries and retrieved regulatory excerpts are <strong>never used to train or fine-tune public foundation models</strong>.
              </li>
              <li>
                <strong className="text-slate-800">Ephemeral Processing:</strong> Prompts sent to model providers exist only in volatile memory during the milliseconds required to generate the response token stream and are not stored by the inference engine.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>4. Document Sharing & Community Contributions</span>
            </h2>
            <p>
              GridMind provides an optional <strong>Share Document</strong> feature allowing authorized utility engineers to share hard-to-find official circulars:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Uploaded documents are securely archived in isolated cloud storage.</li>
              <li>Your registered uploader email is preserved in internal administrative metadata strictly for copyright, audit, and verification compliance.</li>
              <li>Your email identity is never exposed to other public users of the search interface.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>5. Data Sovereignty & Contact</span>
            </h2>
            <p>
              You maintain full sovereignty over your account data. You may request the deletion of your account record and associated logs at any time.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-700">
              For privacy requests, data deletion, or compliance inquiries, please contact our administrative team at:
              <br />
              <strong className="text-blue-600 font-semibold font-mono text-[13px] mt-1 inline-block">
                gridmind.info@gmail.com
              </strong>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-6 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GridMind AI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-wider">
            <Link href="/terms" className="text-slate-500 hover:text-slate-900 transition-colors">
              Terms of Use
            </Link>
            <span>•</span>
            <Link href="/privacy" className="text-blue-600 font-bold">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
