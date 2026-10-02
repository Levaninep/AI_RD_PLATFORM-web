import Link from "next/link";

export const metadata = {
  title: "Privacy Notice",
  description: "Privacy information for the BevOrigin R&D Workspace.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F3F7F8] px-5 py-12 text-[#07151E] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#147F82]">← Back to workspace</Link>
        <p className="mt-10 text-xs font-extrabold uppercase tracking-[0.18em] text-[#147F82]">BevOrigin</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Privacy notice</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 2 October 2026</p>
        <div className="mt-8 space-y-7 leading-7 text-slate-600">
          <section><h2 className="text-xl font-bold text-[#07151E]">Information we process</h2><p className="mt-2">The workspace may process account information, project records you enter, technical calculations, formulation data, shelf-life records and basic service logs needed to operate and secure the platform.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">How information is used</h2><p className="mt-2">Information is used to provide the agreed BevOrigin service, maintain workspace access, support beverage development work, troubleshoot the platform and protect accounts.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">Access and sharing</h2><p className="mt-2">Workspace access is limited to approved accounts. Project information is not sold. Service providers may process limited information where necessary to host, authenticate or maintain the platform.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">Retention and requests</h2><p className="mt-2">Project information is retained for the active engagement and a reasonable operational period afterwards, subject to the project agreement and applicable requirements. To request access, correction or deletion, contact BevOrigin.</p></section>
          <section><h2 className="text-xl font-bold text-[#07151E]">Contact</h2><p className="mt-2">Email <Link href="mailto:info@bevorigin.com" className="font-semibold text-[#147F82]">info@bevorigin.com</Link> for privacy questions or requests.</p></section>
        </div>
      </article>
    </main>
  );
}
