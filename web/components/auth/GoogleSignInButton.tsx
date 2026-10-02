"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({
  callbackUrl = "/dashboard",
}: {
  callbackUrl?: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    getProviders()
      .then((providers) => {
        if (active) {
          setEnabled(Boolean(providers?.google));
        }
      })
      .catch(() => {
        if (active) {
          setEnabled(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div className="mb-5 space-y-4">
      <Button
        type="button"
        variant="outline"
        disabled={submitting}
        className="w-full border-slate-300 bg-white"
        onClick={() => {
          setSubmitting(true);
          void signIn("google", { callbackUrl });
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 size-4">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.37l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.39 13.92a6 6 0 0 1 0-3.84V7.46H3.04a10 10 0 0 0 0 9.08l3.35-2.62Z" />
          <path fill="#EA4335" d="M12 5.95c1.47 0 2.78.5 3.82 1.49l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z" />
        </svg>
        {submitting ? "Connecting..." : "Continue with Google"}
      </Button>
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or use email
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
