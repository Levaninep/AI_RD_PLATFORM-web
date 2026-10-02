import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Request Client Access",
  description: "Request access to the private BevOrigin R&D Workspace or book a project demonstration.",
};

export default function RequestAccessPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(20,127,130,0.18),_transparent_34%),linear-gradient(145deg,#F5F9FA_0%,#E8F1F2_100%)] px-5 py-8 text-[#07151E] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="BevOrigin R&D Workspace home">
            <Image src="/bevorigin-mark.svg" alt="" width={38} height={38} />
            <span>
              <strong className="block text-sm tracking-[0.13em]">BEVORIGIN</strong>
              <span className="block text-[9px] font-semibold tracking-[0.14em] text-slate-500">R&amp;D WORKSPACE</span>
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#147F82]">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </header>

        <div className="grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-20">
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#147F82]">Private client access</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-6xl">Start with a project conversation.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              The workspace is available to approved BevOrigin clients and project teams. Tell us what you are developing and where technical structure would help.
            </p>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#147F82]/20 bg-white/70 p-5 text-sm leading-6 text-slate-600">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#147F82]" />
              Access is reviewed and configured around the agreed project scope. Public self-registration is disabled.
            </div>
          </section>

          <section className="space-y-4">
            <article id="demo" className="rounded-2xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-900/5 sm:p-8">
              <CalendarDays className="size-7 text-[#147F82]" />
              <h2 className="mt-5 text-2xl font-bold">Book a workspace demo</h2>
              <p className="mt-3 leading-7 text-slate-600">See how formulations, calculations and shelf-life planning can support your development workflow.</p>
              <Button asChild className="mt-6 bg-[#147F82] text-white hover:bg-[#0F6F72]">
                <Link href="mailto:info@bevorigin.com?subject=BevOrigin%20R%26D%20Workspace%20demo">Request a demo by email</Link>
              </Button>
            </article>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Mail className="size-6 text-[#147F82]" />
                <h2 className="mt-4 text-lg font-bold">Email</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Best for a brief, documents and detailed access requests.</p>
                <Link href="mailto:info@bevorigin.com?subject=BevOrigin%20Workspace%20access%20request" className="mt-5 inline-block font-semibold text-[#147F82] hover:text-[#0F6F72]">info@bevorigin.com</Link>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <MessageCircle className="size-6 text-[#147F82]" />
                <h2 className="mt-4 text-lg font-bold">WhatsApp</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Useful for a short introduction before sharing the project brief.</p>
                <Link href="https://wa.me/995591950065?text=Hello%20Levan%2C%20I%20would%20like%20to%20discuss%20BevOrigin%20Workspace%20access." className="mt-5 inline-block font-semibold text-[#147F82] hover:text-[#0F6F72]">+995 591 950 065</Link>
              </article>
            </div>

            <div className="rounded-2xl bg-[#07151E] p-7 text-white">
              <h2 className="text-lg font-bold">Helpful details to include</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Beverage category · target market · current development stage · key technical challenge · expected timeline</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
