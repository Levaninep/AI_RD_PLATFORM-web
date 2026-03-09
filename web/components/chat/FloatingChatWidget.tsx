"use client";

import { Bot, MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/api"];

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !pathname) {
    return null;
  }

  const shouldHide =
    pathname === "/chat" ||
    HIDDEN_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (shouldHide) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto flex max-w-screen-2xl justify-end px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col items-end gap-3">
          <div
            className={cn(
              "pointer-events-auto w-[min(26rem,calc(100vw-2rem))] origin-bottom-right transition duration-200",
              open
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-4 scale-95 opacity-0",
            )}
          >
            <ChatWindow mode="widget" onClose={() => setOpen(false)} />
          </div>

          <Button
            type="button"
            size="icon"
            onClick={() => setOpen((current) => !current)}
            aria-label={
              open
                ? "Close Dr. Levan - AI ASSISTANT"
                : "Open Dr. Levan - AI ASSISTANT"
            }
            className="pointer-events-auto relative size-16 rounded-full bg-sky-500 text-white shadow-[0_18px_45px_rgba(14,165,233,0.4)] transition hover:bg-sky-600 hover:shadow-[0_22px_55px_rgba(14,165,233,0.48)]"
          >
            <span className="absolute -left-1 -top-1 rounded-full border border-white bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 shadow-sm">
              AI
            </span>
            {open ? <X className="size-7" /> : <Bot className="size-7" />}
          </Button>

          {!open ? (
            <div className="pointer-events-none rounded-full border border-sky-100 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-sky-500" />
                Ask Dr. Levan - AI ASSISTANT
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
