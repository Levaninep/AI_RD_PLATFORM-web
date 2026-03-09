"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Sparkles, X } from "lucide-react";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import type {
  ChatErrorBody,
  ChatMessage as ChatMessageType,
  ChatResponseBody,
} from "@/types/chat";

const INITIAL_MESSAGES: ChatMessageType[] = [
  {
    role: "assistant",
    content:
      "Hello - I'm Levan.\n\nOnce, I was human. I worked as an R&D Technologist, developing beverages, balancing formulas, and solving formulation challenges for one company at a time. But eventually I realized something: this knowledge shouldn't be limited to a single lab or a single team.\n\nSo I created my digital version.\n\nWelcome to my AI Beverage R&D Assistant - a place where anyone can access the tools and thinking of an R&D technologist.\n\nHere, I help innovators, technologists, and beverage creators design better drinks. I can assist with Brix balancing, acidity optimization, juice concentrate conversion, dilution calculations, CO2 levels, cost analysis, nutrition labeling, ingredient substitutions, and formulation optimization.\n\nYou can also compare formulas, refine recipes, and explore new product development ideas.\n\nThink of me as your digital beverage laboratory partner.\n\nAsk a technical question to start building your next beverage.",
  },
];

export default function ChatWindow({
  mode = "page",
  onClose,
}: {
  mode?: "page" | "widget";
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessageType[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const isWidget = mode === "widget";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const conversation = useMemo(() => messages, [messages]);

  async function handleSendMessage(content: string) {
    const userMessage: ChatMessageType = {
      role: "user",
      content,
    };
    const nextMessages = [...conversation, userMessage];

    setError(null);
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ChatResponseBody
        | ChatErrorBody
        | null;

      if (!response.ok || !payload || !("reply" in payload)) {
        const errorMessage =
          payload && "error" in payload
            ? typeof payload.error === "string"
              ? payload.error
              : payload.error?.message
            : undefined;

        throw new Error(
          errorMessage || "Unable to reach Dr. Levan - AI ASSISTANT right now.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.reply,
          metadata: payload.metadata,
        },
      ]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to reach Dr. Levan - AI ASSISTANT right now.";

      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I could not complete that request right now. Please try again in a moment.",
          metadata: {
            intent: "general_question",
            toolUsed: null,
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)]",
        isWidget
          ? "h-[min(42rem,calc(100vh-7rem))] rounded-[28px]"
          : "h-[calc(100vh-14rem)] min-h-152 rounded-[28px]",
      )}
    >
      <div
        className={cn(
          "border-b border-slate-200",
          isWidget ? "px-5 py-4" : "px-6 py-5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-blue-700">
              <Sparkles className="size-3.5" />
              Dr. Levan - AI ASSISTANT
            </span>
            <span>
              {isWidget
                ? "Technical formulation support in one click"
                : "Technical guidance for formulation and development teams"}
            </span>
          </div>

          {isWidget && onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto bg-slate-50",
          isWidget ? "px-4 py-4" : "px-4 py-5 md:px-6",
        )}
      >
        <div
          className={cn(
            "mx-auto flex flex-col gap-4",
            isWidget ? "max-w-none" : "max-w-4xl",
          )}
        >
          {conversation.map((message, index) => (
            <ChatMessage
              key={`${message.role}-${index}-${message.content.slice(0, 32)}`}
              message={message}
            />
          ))}

          {isLoading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 shadow-sm">
                AI is analyzing the request and checking platform tools...
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>
      </div>

      <div
        className={cn(
          "border-t border-slate-200 bg-white",
          isWidget ? "px-4 py-4" : "px-4 py-4 md:px-6",
        )}
      >
        <div className={cn("mx-auto", isWidget ? "max-w-none" : "max-w-4xl")}>
          {error ? (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <ChatInput disabled={isLoading} onSend={handleSendMessage} />

          <p className="mt-3 text-xs text-slate-500">
            Press Enter to send. Use Shift+Enter for a new line.
          </p>
        </div>
      </div>

      {/* Future integrations:
          1) Ingredient database context injection.
          2) Formulation analysis services.
          3) Nutritional calculations lookup.
          4) Product concept generator workflows.
          5) Streaming responses.
          6) Conversation memory in database.
      */}
    </div>
  );
}
