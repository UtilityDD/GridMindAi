import Link from "next/link";
import { Scale, ArrowLeft, AlertTriangle, FileCheck, ShieldAlert, Mail } from "lucide-react";

export default function TermsPage() {
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
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-sm mb-5">
            <Scale className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Terms of Use
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Non-Affiliation Mandate Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm mb-12">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Independent Research Tool & Non-Affiliation Mandate</span>
          </div>
          <p className="text-amber-900/90 text-xs sm:text-sm leading-relaxed italic">
            "GridMind AI is an independent technical research index. We are NOT affiliated with, endorsed by, funded by, or authorized by WBSEDCL, WBERC, the Central Electricity Authority (CEA), or any government body. AI synthesized answers must be independently cross-verified against official gazetted documents."
          </p>
        </div>

        {/* Terms Body */}
        <div className="space-y-10 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>1. Limitation of Liability & Verification Duty</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Probabilistic Nature of AI:</strong> Retrieval-Augmented Generation (RAG) models produce synthesized outputs probabilistically. Users recognize that AI may occasionally misinterpret tables, omit historical amendments, or conflate revision years.
              </li>
              <li>
                <strong className="text-slate-800">No Legal or Engineering Liability:</strong> The developers and operators of GridMind AI accept zero liability for grid operational decisions, administrative actions, tariff estimations, or compliance filings based on AI responses.
              </li>
              <li>
                <strong className="text-slate-800">Mandatory Human Verification:</strong> Users are obligated to examine the cited raw circular or official notification before signing estimates or taking formal departmental actions.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>2. Hierarchy of Authority</span>
            </h2>
            <p>
              In any discrepancy between AI synthesized summaries and the signed physical or digital departmental circular issued by the competent authority, the <strong>Original Official Notification or Gazette</strong> shall unconditionally prevail as the definitive authority.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>3. Anti-Scraping & Acceptable Usage</span>
            </h2>
            <p>
              GridMind’s semantic vector index, chunking architecture, and retrieval weights are protected systems:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Automated scraping, bulk programmatic extraction, and denial-of-service abuse are strictly forbidden.</li>
              <li>Accounts found generating abusive request bursts or attempting to compromise backend security will be revoked immediately.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>4. Takedown Notices & Inquiries</span>
            </h2>
            <p>
              If you represent an official authority and believe any document should be removed or corrected, please contact our administrative team:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-700">
              Legal & Administrative Inquiries:
              <br />
              <strong className="text-slate-900 font-semibold font-mono text-[13px] mt-1 inline-block">
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
            <Link href="/terms" className="text-amber-600 font-bold">
              Terms of Use
            </Link>
            <span>•</span>
            <Link href="/privacy" className="text-slate-500 hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
