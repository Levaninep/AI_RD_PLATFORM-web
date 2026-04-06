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
      <div className="mx-auto flex max-w-screen-2xl justify-end px-5 pb-5 sm:px-8 sm:pb-7">
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
            className="pointer-events-auto relative size-14 rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-[0_12px_32px_rgba(14,165,233,0.35)] transition hover:shadow-[0_16px_40px_rgba(14,165,233,0.45)] hover:scale-105"
          >
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-lg bg-white text-[9px] font-bold text-sky-600 shadow-sm">
              AI
            </span>
            {open ? <X className="size-6" /> : <Bot className="size-6" />}
          </Button>

          {!open ? (
            <div className="pointer-events-none rounded-xl bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-gray-200/50 backdrop-blur">
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-sky-500" />
                Dr. Levan — AI Assistant
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
