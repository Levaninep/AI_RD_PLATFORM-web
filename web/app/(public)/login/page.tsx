"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(20,127,130,0.16),_transparent_36%),linear-gradient(145deg,#F5F9FA_0%,#EAF1F3_100%)] px-5 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto mb-8 flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="BevOrigin R&D Workspace home">
          <Image src="/bevorigin-mark.svg" alt="" width={38} height={38} />
          <span>
            <strong className="block text-sm tracking-[0.13em] text-[#07151E]">BEVORIGIN</strong>
            <span className="block text-[9px] font-semibold tracking-[0.14em] text-slate-500">R&amp;D WORKSPACE</span>
          </span>
        </Link>
        <Link href="https://bevorigin.com" className="text-sm font-semibold text-slate-600 hover:text-[#147F82]">
          Back to BevOrigin
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="hidden border-slate-200/80 bg-[#07151E] text-white shadow-xl lg:block">
          <CardHeader>
            <Badge className="w-fit border border-[#74D8D5]/30 bg-[#147F82]/20 text-[#9BE8E5] hover:bg-[#147F82]/20">
              Invitation-only client workspace
            </Badge>
            <CardTitle className="mt-4 text-4xl leading-tight text-white">Technical work, organised around your beverage project.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-relaxed text-slate-300">
            <p>Secure access for active BevOrigin engagements and approved client teams.</p>
            <ul className="space-y-3">
              <li className="border-l-2 border-[#74D8D5] pl-3">Build and review formulations</li>
              <li className="border-l-2 border-[#74D8D5] pl-3">Run technical and product-cost calculations</li>
              <li className="border-l-2 border-[#74D8D5] pl-3">Structure shelf-life planning and results</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/95 shadow-xl">
          <CardHeader>
            <Badge variant="secondary" className="w-fit bg-[#147F82]/10 text-[#0F6F72] lg:hidden">Private client access</Badge>
            <CardTitle className="text-2xl">Log in to your workspace</CardTitle>
            <p className="text-sm text-muted-foreground">Use the account approved for your BevOrigin project.</p>
          </CardHeader>
          <CardContent>
            <GoogleSignInButton callbackUrl={callbackUrl} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error || oauthError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error ?? "This Google account has not been approved for workspace access."}
                </p>
              ) : null}

              <Button type="submit" disabled={submitting} className="w-full bg-[#147F82] text-white hover:bg-[#0F6F72]">
                {submitting ? "Logging in..." : "Log in"}
              </Button>
            </form>

            <p className="mt-5 text-sm text-muted-foreground">
              Need access or login support?{" "}
              <Link href="/request-access" className="font-semibold text-[#147F82] hover:text-[#0F6F72]">
                Contact BevOrigin
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 px-6 py-12">
          <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Loading login...
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
