"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GuestGate({
  children,
  isGuest,
}: {
  children: React.ReactNode;
  isGuest: boolean;
}) {
  if (!isGuest) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Sign-in banner */}
      <div className="sticky top-14 z-40 mx-auto mb-4 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Lock className="size-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-900">
            You&apos;re viewing in preview mode. Sign in to unlock all features.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-lg border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-lg bg-[#3B5BDB] text-white hover:bg-[#364FC7]"
          >
            <Link href="/signup">Sign up free</Link>
          </Button>
        </div>
      </div>

      {/* Grayed-out interactive content */}
      <div className="guest-preview pointer-events-none select-none opacity-60">
        {children}
      </div>

      <style jsx global>{`
        .guest-preview input,
        .guest-preview textarea,
        .guest-preview select,
        .guest-preview button,
        .guest-preview [role="button"],
        .guest-preview a[href]:not([href^="#"]) {
          cursor: not-allowed !important;
          filter: grayscale(0.3);
        }
      `}</style>
    </div>
  );
}
