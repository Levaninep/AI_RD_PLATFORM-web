import Link from "next/link";

export const metadata = {
  title: "Workspace Terms",
  description: "Terms for access to the BevOrigin R&D Workspace.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F3F7F8] px-5 py-12 text-[#07151E] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#147F82]">← Back to workspace</Link>
        <p className="mt-10 text-xs font-extrabold uppercase tracking-[0.18em] text-[#147F82]">BevOrigin</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Workspace terms</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 2 October 2026</p>
        <div className="mt-8 space-y-7 leading-7 text-slate-600">
          <section><h2 className="text-xl font-bold text-[#07151E]">Private client access</h2><p className="mt-2">The BevOrigin R&D Workspace is provided to approved users in connection with a defined project or service relationship. Accounts may not be shared or transferred without approval.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">Professional judgment</h2><p className="mt-2">Calculators and records support product development decisions. They do not replace laboratory verification, regulatory review, safety assessment, production trials or professional judgment appropriate to the product and market.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">Client responsibilities</h2><p className="mt-2">Users are responsible for the accuracy of information entered, safeguarding account access and validating technical outputs before relying on them for production or commercial decisions.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">Project terms</h2><p className="mt-2">Commercial scope, deliverables, confidentiality, intellectual property and payment terms are governed by the applicable BevOrigin proposal or project agreement.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">Contact</h2><p className="mt-2">For access or service questions, contact <Link href="mailto:info@bevorigin.com" className="font-semibold text-[#147F82]">info@bevorigin.com</Link>.</p></section>
        </div>
      </article>
    </main>
  );
}
