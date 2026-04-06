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
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#EDF2F7]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-310 items-center justify-between px-4 sm:px-6">
          <nav className="hidden items-center gap-1 text-[15px] font-medium text-slate-700 lg:flex">
            <div className="group relative">
              <button className="inline-flex items-center gap-1 rounded-lg px-4 py-2 transition-colors hover:text-slate-900">
                Features
                <svg
                  className="size-3.5 text-slate-400 transition-transform group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="pointer-events-none absolute left-0 top-full z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:pointer-events-auto group-hover:opacity-100">
                <a
                  href="#features"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  AI Formulations
                </a>
                <a
                  href="#modules"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Modules
                </a>
                <a
                  href="#features"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Integrations
                </a>
              </div>
            </div>
            <div className="group relative">
              <button className="inline-flex items-center gap-1 rounded-lg px-4 py-2 transition-colors hover:text-slate-900">
                Pricing
                <svg
                  className="size-3.5 text-slate-400 transition-transform group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="pointer-events-none absolute left-0 top-full z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:pointer-events-auto group-hover:opacity-100">
                <a
                  href="#pricing"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Plans
                </a>
                <a
                  href="#pricing"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Enterprise
                </a>
              </div>
            </div>
            <div className="group relative">
              <button className="inline-flex items-center gap-1 rounded-lg px-4 py-2 transition-colors hover:text-slate-900">
                Contact
                <svg
                  className="size-3.5 text-slate-400 transition-transform group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="pointer-events-none absolute left-0 top-full z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:pointer-events-auto group-hover:opacity-100">
                <a
                  href="#"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Support
                </a>
                <a
                  href="#"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Sales
                </a>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <Button
                asChild
                className="rounded-full bg-[#3B5BFF] px-6 text-white shadow-sm hover:bg-[#2F54EB]"
              >
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[15px] font-medium text-slate-700 transition-colors hover:text-slate-900"
                >
                  Log in
                </Link>
                <Button
                  asChild
                  className="rounded-full bg-[#3B5BFF] px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-[#2F54EB]"
                >
                  <Link href="/dashboard">Try it free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-310 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:pb-24 lg:pt-14">
        <section className="relative grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14">
          <div>
            <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3B5BFF] hover:bg-blue-50">
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
                  className="rounded-xl bg-[#3B5BFF] px-5 text-white shadow-[0_8px_20px_rgba(59,91,255,0.22)] hover:bg-[#2F54EB]"
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
                    className="rounded-xl bg-[#3B5BFF] px-5 text-white shadow-[0_8px_20px_rgba(59,91,255,0.22)] hover:bg-[#2F54EB]"
                  >
                    <Link href="/dashboard">
                      Get Started <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-slate-300 bg-white px-5 text-slate-700 hover:bg-slate-50"
                  >
                    <Link href="/dashboard">View Platform</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Formulation · Shelf-life · Costing · AI Insights
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[#3B5BFF]/15 blur-3xl" />
            <div className="relative grid grid-cols-[1.4fr_0.6fr] grid-rows-2 gap-3 sm:gap-4">
              {/* Top-left: Lab image */}
              <div className="overflow-hidden rounded-2xl bg-[#d5dfe8]">
                <Image
                  src="/image-4@2x.png"
                  alt="R&D Laboratory"
                  width={800}
                  height={400}
                  className="h-full w-full scale-105 object-cover"
                  priority
                />
              </div>
              {/* Right: Lemon/flask image (spans both rows) */}
              <div className="row-span-2 overflow-hidden rounded-2xl bg-[#d5dfe8]">
                <Image
                  src="/Container2@2x.png"
                  alt="Food science research"
                  width={400}
                  height={800}
                  className="h-full w-full scale-105 object-cover"
                  priority
                />
              </div>
              {/* Bottom-left: R&D brain image */}
              <div className="overflow-hidden rounded-2xl bg-[#d5dfe8]">
                <Image
                  src="/Container3@2x.png"
                  alt="AI-powered R&D"
                  width={800}
                  height={400}
                  className="h-full w-full object-cover object-center"
                  priority
                />
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

          <div className="mt-10 grid grid-rows-[1fr_1fr] gap-4 md:grid-cols-2">
            {[
              {
                title: "Formulation Design",
                text: "Design formulations with precision and ease.",
                image: "/Formulation Design.png",
                href: "/formulations",
                badges: [
                  { label: "Ingredient Management", position: "bottom-left" },
                  { label: "Nutritional Analysis", position: "top-right" },
                ],
              },
              {
                title: "Automated Calculations",
                text: "Automate nutritional and Brix calculations.",
                image: "/Automated Calculations.png",
                href: "/calculators",
                badges: [
                  { label: "Brix Calculation", position: "bottom-left" },
                  { label: "Acidity Levels", position: "top-right" },
                ],
              },
              {
                title: "Shelf-Life Simulation",
                text: "Simulate shelf-life for optimal product launch.",
                image: "/Shelf-life simulation.png",
                href: "/shelf-life",
                badges: [
                  { label: "Shelf-Life Analytics", position: "bottom-left" },
                  { label: "Launch Readiness", position: "top-right" },
                ],
              },
              {
                title: "Processing Optimization",
                text: "Optimize processing for better products.",
                image: "/proccess optimization.png",
                href: "/cogs",
                badges: [
                  { label: "Process Simulation", position: "bottom-left" },
                  { label: "Cost Efficiency", position: "top-right" },
                ],
              },
            ].map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-[#EDF2F7] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#3B5BFF]">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{feature.text}</p>

                <div className="relative mt-5 min-h-[280px] flex-1 overflow-hidden rounded-xl">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {feature.badges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`absolute z-10 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md ${
                        badge.position === "bottom-left"
                          ? "bottom-3 left-3"
                          : "right-3 top-3"
                      }`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="pricing" className="pt-18 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Flexible Pricing
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Choose the plan that fits your needs.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {/* Explorer */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-[#F4F8FB] p-7">
              <h3 className="text-lg font-bold text-slate-900">Explorer</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-slate-900">
                  $99
                </span>
                <span className="ml-1 text-base font-medium text-slate-500">
                  month
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Try us out first</p>
              <Button
                asChild
                variant="outline"
                className="mt-6 w-full rounded-full border-slate-300 bg-white py-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <Link href={session ? "/dashboard" : "/signup"}>
                  Start for free
                </Link>
              </Button>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
                <li>AI Formulation Builder</li>
                <li>Ingredient Database Access</li>
                <li>Brix, pH & TA Calculations</li>
                <li>Basic Costing (COGS)</li>
                <li>5 Saved Formulations</li>
                <li>1 User Seat</li>
                <li>Export to PDF</li>
                <li>Community Support</li>
              </ul>
            </div>

            {/* R&D Team — highlighted */}
            <div className="flex flex-col rounded-2xl border-2 border-[#3B5BFF] bg-[#F4F8FB] p-7 shadow-lg">
              <h3 className="text-lg font-bold text-[#3B5BFF]">R&D Team</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-[#14213D]">
                  $299
                </span>
                <span className="ml-1 text-base font-medium text-slate-500">
                  month
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Growing Teams
              </p>
              <Button
                asChild
                className="mt-6 w-full rounded-full bg-[#3B5BFF] py-5 text-sm font-semibold text-white hover:bg-[#2F54EB]"
              >
                <Link href={session ? "/dashboard" : "/signup"}>
                  Start with Plus
                </Link>
              </Button>
              <ul className="mt-8 flex-1 space-y-3 text-sm font-medium text-slate-700">
                <li>Everything in Explorer</li>
                <li>Unlimited Formulations</li>
                <li>Advanced Shelf-Life Simulation</li>
                <li>Process Optimization Tools</li>
                <li>CO₂ & Pressure Prediction</li>
                <li>Tunnel Pasteurization Calculator</li>
                <li>Team Collaboration Workspace</li>
                <li>Up to 20 Users</li>
                <li>Priority Support</li>
                <li>API / ERP Export Ready</li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-[#F4F8FB] p-7">
              <h3 className="text-lg font-bold text-slate-900">Enterprise</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-slate-900">
                  Custom
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Large Organizations</p>
              <Button
                asChild
                variant="outline"
                className="mt-6 w-full rounded-full border-slate-300 bg-white py-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <Link href={session ? "/dashboard" : "/signup"}>
                  Contact Sales
                </Link>
              </Button>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
                <li>Everything in R&D Team</li>
                <li>Unlimited Users</li>
                <li>Multi-Site Team Management</li>
                <li>Custom Simulation Models</li>
                <li>Private Ingredient Databases</li>
                <li>Role-Based Access Control</li>
                <li>SAP / ERP Integrations</li>
                <li>Custom AI Model Training</li>
                <li>Dedicated Customer Success</li>
                <li>SLA + Enterprise Security</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="pt-18 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl lg:text-5xl">
              Bring Your Next Beverage from Idea to Shelf Faster
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Formulate smarter, reduce development time, and launch
              market-ready products with confidence.
            </p>
            <div className="mt-8">
              <Button
                asChild
                className="rounded-full bg-[#3B5BFF] px-8 py-5 text-base font-semibold text-white shadow-[0_8px_20px_rgba(59,91,255,0.22)] hover:bg-[#2F54EB]"
              >
                <Link href={session ? "/dashboard" : "/signup"}>
                  Book a Live Demo
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              No credit card required &nbsp;•&nbsp; 14-day free trial
              &nbsp;•&nbsp; Setup in minutes
            </p>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-310 gap-8 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr]">
          {/* Social icons */}
          <div className="flex items-start gap-4 text-slate-500">
            <a href="#" aria-label="Facebook" className="hover:text-slate-700">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-slate-700">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.92 4.92 0 011.675 1.09 4.92 4.92 0 011.09 1.675c.163.46.35 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.92 4.92 0 01-1.09 1.675 4.92 4.92 0 01-1.675 1.09c-.46.163-1.26.35-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.92 4.92 0 01-1.675-1.09 4.92 4.92 0 01-1.09-1.675c-.163-.46-.35-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.92 4.92 0 011.09-1.675A4.92 4.92 0 015.4 2.636c.46-.163 1.26-.35 2.43-.403C9.096 2.175 9.476 2.163 12 2.163zm0 1.838c-3.153 0-3.506.012-4.748.069-1.075.049-1.658.228-2.047.379a3.09 3.09 0 00-1.147.746 3.09 3.09 0 00-.746 1.147c-.151.389-.33.972-.379 2.047C3.012 9.494 3 9.847 3 12s.012 2.506.069 3.748c.049 1.075.228 1.658.379 2.047.176.452.414.83.746 1.147.317.332.695.57 1.147.746.389.151.972.33 2.047.379 1.242.057 1.595.069 4.748.069s3.506-.012 4.748-.069c1.075-.049 1.658-.228 2.047-.379a3.09 3.09 0 001.147-.746c.332-.317.57-.695.746-1.147.151-.389.33-.972.379-2.047.057-1.242.069-1.595.069-4.748s-.012-3.506-.069-4.748c-.049-1.075-.228-1.658-.379-2.047a3.09 3.09 0 00-.746-1.147 3.09 3.09 0 00-1.147-.746c-.389-.151-.972-.33-2.047-.379C15.506 4.012 15.153 4 12 4zm0 3.838a4.162 4.162 0 110 8.324 4.162 4.162 0 010-8.324zm0 1.838a2.324 2.324 0 100 4.648 2.324 2.324 0 000-4.648zm4.965-2.212a.975.975 0 11-1.95 0 .975.975 0 011.95 0z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="X / Twitter"
              className="hover:text-slate-700"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Title</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Product Overview
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-slate-900">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-slate-900">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    API & Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Resources
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Webinars
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Case Studies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Social</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
