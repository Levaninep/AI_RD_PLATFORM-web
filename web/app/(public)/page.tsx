import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Manrope } from "next/font/google";
import {
  ArrowRight,
  BadgeCheck,
  Beaker,
  Calculator,
  ClipboardCheck,
  FlaskConical,
  LockKeyhole,
  ShieldCheck,
  TestTube2,
  UsersRound,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const capabilities = [
  {
    title: "Formulations",
    text: "Build, review and save structured beverage formulations with ingredient-level inputs.",
    icon: FlaskConical,
  },
  {
    title: "Cost & calculations",
    text: "Check product economics and run Brix, juice, calories, CO₂ and density calculations.",
    icon: Calculator,
  },
  {
    title: "Ingredient library",
    text: "Keep technical, commercial and nutritional ingredient information organised.",
    icon: Beaker,
  },
  {
    title: "Shelf-life planning",
    text: "Plan conditions and sampling points, then track results and technical decisions.",
    icon: TestTube2,
  },
];

const accessSteps = [
  {
    number: "01",
    title: "Confirm the project fit",
    text: "We review your development stage, technical challenge and the support you need.",
  },
  {
    number: "02",
    title: "Approve client access",
    text: "BevOrigin provisions access for the people involved in the agreed project scope.",
  },
  {
    number: "03",
    title: "Work in one place",
    text: "Use the relevant tools and keep project decisions structured throughout development.",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions).catch(() => null);

  return (
    <main className={`${manrope.className} min-h-screen bg-[#F3F7F8] text-[#07151E]`}>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#F3F7F8]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="BevOrigin R&D Workspace home">
            <Image src="/bevorigin-mark.svg" alt="" width={38} height={38} priority />
            <span className="leading-none">
              <strong className="block text-sm tracking-[0.13em]">BEVORIGIN</strong>
              <span className="mt-1 block text-[9px] font-semibold tracking-[0.14em] text-slate-500">R&amp;D WORKSPACE</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex" aria-label="Workspace information">
            <a href="#capabilities" className="hover:text-[#147F82]">Capabilities</a>
            <a href="#access" className="hover:text-[#147F82]">How access works</a>
            <a href="#security" className="hover:text-[#147F82]">Private access</a>
            <Link href="https://bevorigin.com" className="hover:text-[#147F82]">BevOrigin</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <Button asChild className="rounded-full bg-[#147F82] px-5 text-white hover:bg-[#0F6F72]">
                <Link href="/dashboard">Open workspace</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="hidden px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#147F82] sm:block">
                  Client login
                </Link>
                <Button asChild className="rounded-full bg-[#147F82] px-5 text-white hover:bg-[#0F6F72]">
                  <Link href="/request-access">Request access</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-48 top-10 size-150 rounded-full bg-[#6FD8D1]/20 blur-3xl" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <div className="relative z-10">
            <Badge className="rounded-full border border-[#147F82]/20 bg-[#147F82]/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0F6F72] hover:bg-[#147F82]/8">
              Private workspace for BevOrigin clients
            </Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Technical decisions, organised in one place.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A structured digital workspace for active beverage development projects—combining formulations, product economics, technical calculations and shelf-life planning with BevOrigin support.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {session ? (
                <Button asChild size="lg" className="rounded-xl bg-[#147F82] px-6 text-white shadow-[0_12px_28px_rgba(20,127,130,0.24)] hover:bg-[#0F6F72]">
                  <Link href="/dashboard">Open your workspace <ArrowRight className="ml-1 size-4" /></Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="rounded-xl bg-[#147F82] px-6 text-white shadow-[0_12px_28px_rgba(20,127,130,0.24)] hover:bg-[#0F6F72]">
                    <Link href="/request-access">Request client access <ArrowRight className="ml-1 size-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-xl border-slate-300 bg-white px-6 text-slate-700 hover:bg-white hover:text-[#147F82]">
                    <Link href="/request-access#demo">Book a workspace demo</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-2"><LockKeyhole className="size-4 text-[#147F82]" /> Invitation only</span>
              <span className="flex items-center gap-2"><UsersRound className="size-4 text-[#147F82]" /> Project-based access</span>
              <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#147F82]" /> Guided onboarding</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[36px] bg-[#147F82]/12 blur-3xl" />
            <div className="relative grid grid-cols-[1.45fr_0.55fr] grid-rows-2 gap-3 rounded-[30px] border border-white/80 bg-white/55 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur sm:gap-4 sm:p-4">
              <div className="overflow-hidden rounded-2xl bg-slate-200">
                <Image src="/image-4@2x.png" alt="Beverage development laboratory" width={800} height={430} className="h-full w-full object-cover" priority />
              </div>
              <div className="row-span-2 overflow-hidden rounded-2xl bg-slate-200">
                <Image src="/Container2@2x.png" alt="Beverage product testing" width={420} height={860} className="h-full w-full object-cover" priority />
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-[#07151E] p-6 text-white sm:p-8">
                <ShieldCheck className="size-8 text-[#74D8D5]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#74D8D5]">Client workspace</p>
                  <p className="mt-2 text-xl font-bold leading-tight sm:text-2xl">From brief to production readiness.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#147F82]">Inside the workspace</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">The tools behind better project decisions.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
              Access is configured around the agreed engagement. Clients see the relevant modules and work with BevOrigin through a structured technical process.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {capabilities.map((item, index) => (
              <article key={item.title} className="group rounded-2xl border border-slate-200 bg-[#F3F7F8] p-7 transition hover:-translate-y-1 hover:border-[#147F82]/40 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#147F82] text-white shadow-lg shadow-[#147F82]/15">
                    <item.icon className="size-5" />
                  </div>
                  <span className="text-xs font-extrabold tracking-[0.16em] text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 max-w-xl leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="access" className="bg-[#07151E] text-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#74D8D5]">How access works</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">A client workspace, configured around real work.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">There is no public self-service signup. Access starts with a project conversation and is approved by BevOrigin.</p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/12 lg:grid-cols-3">
            {accessSteps.map((step) => (
              <article key={step.number} className="bg-[#0B202B] p-8 lg:p-9">
                <span className="text-xs font-extrabold tracking-[0.18em] text-[#74D8D5]">{step.number}</span>
                <h3 className="mt-8 text-2xl font-bold">{step.title}</h3>
                <p className="mt-4 leading-7 text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="bg-[#EAF2F3]">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#147F82]">Private by design</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">Access for approved project participants.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Workspace accounts are provisioned for active engagements. Authentication is required before project tools and records can be accessed.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: LockKeyhole, title: "Invitation-only accounts", text: "Public registration is disabled. New access is reviewed by BevOrigin." },
              { icon: ShieldCheck, title: "Authenticated workspace", text: "Internal pages and project APIs require a signed-in account." },
              { icon: ClipboardCheck, title: "Structured records", text: "Formulations, calculations and shelf-life work remain organised for review." },
              { icon: UsersRound, title: "Project onboarding", text: "Access and workflow are aligned with the agreed client engagement." },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <item.icon className="size-6 text-[#147F82]" />
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#74D8D5]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0F5E61]">Start with the project</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">See how the workspace fits your development process.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl bg-[#07151E] px-6 text-white hover:bg-[#0B202B]">
              <Link href="/request-access#demo">Book a demo</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl border-[#07151E]/20 bg-white/80 px-6 text-[#07151E] hover:bg-white">
              <Link href="/login">Client login</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#07151E] text-slate-300">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold tracking-[0.12em] text-white">BEVORIGIN</p>
            <p className="mt-1 text-xs">R&amp;D Workspace · From Idea to Shelf</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm" aria-label="Footer">
            <Link href="https://bevorigin.com" className="hover:text-white">Main website</Link>
            <Link href="https://bevorigin.com/contact/" className="hover:text-white">Contact</Link>
            <Link href="https://www.linkedin.com/in/levannepharidze" className="hover:text-white">LinkedIn</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </nav>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} BevOrigin</p>
        </div>
      </footer>
    </main>
  );
}
