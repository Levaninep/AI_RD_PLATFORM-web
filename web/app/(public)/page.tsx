import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowRight, FlaskConical, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 via-slate-100 to-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:py-20">
        <section className="rounded-2xl border bg-card p-8 shadow-sm sm:p-12">
          <Badge variant="secondary" className="mb-4">
            AI R&D Platform
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Welcome to the Future of R&amp;D
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            Professional formulation workflows, automatic calculations, and
            shelf-life intelligence in one clean SaaS workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {!session ? (
              <>
                <Button asChild size="lg">
                  <Link href="/signup">
                    Sign up <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Faster formulation workflows",
              text: "Standardized module-based creation with strong process visibility.",
            },
            {
              icon: FlaskConical,
              title: "Automatic calculations",
              text: "Juice %, CO₂, and COGS insights surfaced where teams work.",
            },
            {
              icon: ShieldCheck,
              title: "Shelf-life management",
              text: "Track test status, checkpoints, and outcomes in one timeline.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="shadow-sm">
              <CardHeader>
                <feature.icon className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {feature.text}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">Product preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview key modules before backend integration.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Dashboard KPIs and alerts",
                image: "/previews/dashboard-preview.svg",
              },
              {
                title: "Ingredient and formulation tables",
                image: "/previews/ingredients-formulations-preview.svg",
              },
              {
                title: "Calculator and shelf-life workspaces",
                image: "/previews/calculators-shelf-life-preview.svg",
              },
            ].map((item) => (
              <Card key={item.title} className="border-dashed">
                <CardContent className="p-6">
                  <div className="mb-3 rounded-xl border bg-muted/20 p-2">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={1200}
                      height={675}
                      className="h-auto w-full rounded-lg object-contain"
                    />
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
