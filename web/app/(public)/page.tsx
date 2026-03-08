import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { Manrope } from "next/font/google";
import { authOptions } from "@/lib/auth";
import {
  ArrowRight,
  Beaker,
  Calculator,
  CheckCircle2,
  FlaskConical,
  Microscope,
  Sparkles,
  ShieldCheck,
  TestTube2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  return (
    <main
      className={`${manrope.className} min-h-screen bg-[#F4F8FB] text-slate-900`}
    >
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-18 w-full max-w-310 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-[#14213D] text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">
              AI R&D Platform
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            <a
              className="transition-colors hover:text-slate-900"
              href="#features"
            >
              Features
            </a>
            <a
              className="transition-colors hover:text-slate-900"
              href="#modules"
            >
              Modules
            </a>
            <a
              className="transition-colors hover:text-slate-900"
              href="#pricing"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {session ? (
              <Button
                asChild
                className="rounded-xl bg-[#14213D] px-4 text-white shadow-sm hover:bg-[#101A31]"
              >
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-xl px-4 text-slate-700 hover:bg-slate-100"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-xl bg-[#14213D] px-4 text-white shadow-sm hover:bg-[#101A31]"
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-310 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:pb-24 lg:pt-14">
        <section className="relative grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14">
          <div>
            <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 hover:bg-blue-50">
              AI for Food & Beverage Innovation
            </Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-[#0F172A] sm:text-5xl xl:text-6xl">
              Build Better Products Faster with AI-Powered R&D
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
              Unify formulation workflows, automatic calculations, shelf-life
              intelligence, and product optimization in one premium command
              workspace built for modern R&D teams.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {session ? (
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-[#2563EB] px-5 text-white shadow-sm hover:bg-[#1D4ED8]"
                >
                  <Link href="/dashboard">
                    Go to dashboard <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-[#2563EB] px-5 text-white shadow-sm hover:bg-[#1D4ED8]"
                  >
                    <Link href="/signup">
                      Get Started <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-slate-300 bg-white px-5 text-slate-700 hover:bg-slate-50"
                  >
                    <Link href="/login">View Platform</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Formulation · Shelf-life · Costing · AI Insights
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-blue-400/15 blur-3xl" />
            <div className="relative rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-5">
              <div className="rounded-2xl border border-slate-200 bg-[#132647] p-4 text-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>R&D Command Center</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5">
                    Live
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
                      Formulations
                    </p>
                    <p className="mt-1.5 text-lg font-semibold text-white">
                      24
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
                      Avg COGS
                    </p>
                    <p className="mt-1.5 text-lg font-semibold text-white">
                      €0.37/L
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
                      Shelf-life
                    </p>
                    <p className="mt-1.5 text-lg font-semibold text-white">
                      Running
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                    Recent formulations
                  </p>
                  <div className="mt-2 space-y-2 text-xs">
                    <p className="flex items-center justify-between rounded-lg bg-white/10 px-2.5 py-2">
                      <span>Orange Juice v12</span>
                      <span className="text-slate-300">2m ago</span>
                    </p>
                    <p className="flex items-center justify-between rounded-lg bg-white/10 px-2.5 py-2">
                      <span>Peach Test Batch</span>
                      <span className="text-slate-300">8m ago</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Stability trend
                  </p>
                  <div className="mt-2.5 h-20 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <div className="flex h-full items-end gap-1">
                      {[22, 35, 31, 52, 47, 62, 71, 78].map((value) => (
                        <div
                          key={value}
                          className="flex-1 rounded-sm bg-blue-500/70"
                          style={{ height: `${value}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    AI Suggestions
                  </p>
                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <p className="rounded-lg bg-blue-50 px-2.5 py-2">
                      Reduce ingredient cost by 6%
                    </p>
                    <p className="rounded-lg bg-slate-50 px-2.5 py-2">
                      Simulate shelf-life test
                    </p>
                    <p className="rounded-lg bg-slate-50 px-2.5 py-2">
                      Improve pH balance target
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="pt-18 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything Your R&D Team Needs in One Platform
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Production-grade workflows and technical intelligence designed for
              beverage and food product development teams.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: FlaskConical,
                title: "Formulation Workflows",
                text: "Create, iterate, and version formulations with repeatable process control.",
              },
              {
                icon: Calculator,
                title: "Automatic Calculations",
                text: "Run Brix, CO2, yield, and ratio calculations with fewer manual steps.",
              },
              {
                icon: TestTube2,
                title: "Shelf-Life Management",
                text: "Track validation cycles, testing checkpoints, and decision outcomes.",
              },
              {
                icon: TrendingUp,
                title: "Cost & COGS Intelligence",
                text: "See cost impact early with embedded analytics across every recipe.",
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="rounded-2xl border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.09)]"
              >
                <CardContent className="p-6">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="modules" className="pt-18 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Designed for Modern Product Development
            </h2>
            <p className="mt-3 text-base text-slate-600">
              A connected workspace that gives technical teams visibility from
              first concept to validation-ready product.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="rounded-3xl border-slate-200 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] sm:p-5">
              <CardContent className="p-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Platform Overview
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      Dashboard, KPI Signals, and Activity Intelligence
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Live workspace
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2">
                  <Image
                    src="/previews/dashboard-preview.svg"
                    alt="Dashboard module preview"
                    width={1200}
                    height={675}
                    className="h-auto w-full rounded-xl object-contain"
                  />
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">KPI Blocks</p>
                    <p className="mt-1">Core R&D metrics in one view.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Analytics</p>
                    <p className="mt-1">Trend snapshots for rapid decisions.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Activity Log</p>
                    <p className="mt-1">
                      Recent formulation updates and events.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Card className="rounded-3xl border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.07)]">
                <CardContent className="p-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <Beaker className="size-3.5" />
                    Ingredient + Formulation Workspace
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2">
                    <Image
                      src="/previews/ingredients-formulations-preview.svg"
                      alt="Ingredient and formulation workspace"
                      width={1200}
                      height={675}
                      className="h-auto w-full rounded-xl object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.07)]">
                <CardContent className="p-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <Microscope className="size-3.5" />
                    Calculators + Shelf-life Workspace
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2">
                    <Image
                      src="/previews/calculators-shelf-life-preview.svg"
                      alt="Calculators and shelf-life workspace"
                      width={1200}
                      height={675}
                      className="h-auto w-full rounded-xl object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="pt-18 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From Idea to Validation in One Workspace
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Eliminate fragmented tools and give R&D, quality, and technical
              teams one source of truth.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: "Standardize formulation development",
                text: "Use repeatable workflow templates to improve consistency across product lines.",
              },
              {
                icon: Calculator,
                title: "Centralize technical calculations",
                text: "Run validated calculations in context without switching between disconnected files.",
              },
              {
                icon: ShieldCheck,
                title: "Track validation and shelf-life decisions",
                text: "Keep QA decisions, test outcomes, and formulation updates synchronized.",
              },
            ].map((benefit) => (
              <Card
                key={benefit.title}
                className="rounded-2xl border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.09)]"
              >
                <CardContent className="p-6">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                    <benefit.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {benefit.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="pt-18 sm:pt-20 lg:pt-24">
          <div className="overflow-hidden rounded-[30px] border border-blue-900/20 bg-linear-to-r from-[#14213D] via-[#1C2F56] to-[#1E3A8A] p-8 text-white shadow-[0_22px_54px_rgba(20,33,61,0.34)] sm:p-10 lg:p-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                Start now
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Start Building the Next Generation of Food Products
              </h2>
              <p className="mt-4 text-base leading-relaxed text-blue-100">
                Bring formulation, calculations, and shelf-life intelligence
                together in one modern R&D workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-white px-5 text-[#14213D] hover:bg-blue-50"
                >
                  <Link href={session ? "/dashboard" : "/signup"}>
                    Create Account
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/45 bg-white/10 px-5 text-white hover:bg-white/20"
                >
                  <Link href={session ? "/dashboard" : "/login"}>
                    Request Demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
