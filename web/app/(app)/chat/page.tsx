"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import {
  detectChatAccess,
  sendBrowserLocalChat,
  type ChatAccessResult,
} from "@/lib/ollama-browser";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatStatus = {
  available: boolean;
  reason: string | null;
};

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hello - I'm Levan.\n\nOnce, I was human. I worked as an R&D Technologist, developing beverages, balancing formulas, and solving formulation challenges for one company at a time. But eventually I realized something: this knowledge shouldn't be limited to a single lab or a single team.\n\nSo I created my digital version.\n\nWelcome to my AI Beverage R&D Assistant - a place where anyone can access the tools and thinking of an R&D technologist.\n\nHere, I help innovators, technologists, and beverage creators design better drinks. I can assist with Brix balancing, acidity optimization, juice concentrate conversion, dilution calculations, CO2 levels, cost analysis, nutrition labeling, ingredient substitutions, and formulation optimization.\n\nYou can also compare formulas, refine recipes, and explore new product development ideas.\n\nThink of me as your digital beverage laboratory partner.\n\nAsk a technical question to start building your next beverage.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ChatStatus>({
    available: true,
    reason: null,
  });
  const [chatAccess, setChatAccess] = useState<ChatAccessResult>({
    available: true,
    mode: "server",
    reason: null,
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      const payload = await detectChatAccess().catch(() => null);

      if (!cancelled && payload) {
        setChatAccess(payload);
        setStatus(payload);
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  async function sendMessage() {
    const nextValue = input.trim();
    if (!nextValue || isLoading || !status.available) {
      return;
    }

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: nextValue },
    ];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const reply =
        chatAccess.mode === "browser-local"
          ? await sendBrowserLocalChat(updatedMessages)
          : await (async () => {
              const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({ messages: updatedMessages }),
              });

              const data = (await response.json().catch(() => null)) as {
                reply?: string;
                error?: string;
              } | null;

              const nextReply =
                typeof data?.reply === "string" ? data.reply : null;

              if (!response.ok || !nextReply) {
                throw new Error(
                  data?.error ||
                    "Error: I could not connect to the local AI model.",
                );
              }

              return nextReply;
            })();

      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Error: I could not connect to the local AI model.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative space-y-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/25">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-violet-700 uppercase">
              AI Assistant
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dr. Levan
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Your AI beverage R&D partner — powered by Ollama.
          </p>
        </div>
      </div>

      {/* Main workspace card */}
      <div className="cogs-workspace-card p-0! overflow-hidden">
        <div className="flex h-[72vh] min-h-140 flex-col">
          {/* Chat header bar */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Food & Beverage formulation support
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Ask technical questions and receive clear, business-style
                answers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {status.available ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* Status banners */}
          {!status.available && status.reason ? (
            <div className="mx-6 mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
              {status.reason}
            </div>
          ) : chatAccess.mode === "browser-local" && chatAccess.reason ? (
            <div className="mx-6 mt-3 rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-3 text-sm text-blue-800">
              {chatAccess.reason}
            </div>
          ) : null}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50 px-4 py-5 md:px-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                    className={
                      isUser ? "flex justify-end" : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        isUser
                          ? "max-w-[85%] rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 px-4 py-3 text-sm leading-6 text-white shadow-sm md:max-w-[70%]"
                          : "max-w-[85%] rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm leading-6 text-gray-800 shadow-sm md:max-w-[70%]"
                      }
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm leading-6 text-gray-500 shadow-sm md:max-w-[70%]">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />
                      <span className="ml-2">AI is thinking…</span>
                    </span>
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:px-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row md:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="chat-input"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400"
                >
                  Ask the assistant
                </label>
                <textarea
                  id="chat-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask about Brix, acidity, juice percentage, formulation logic, or product ideas..."
                  rows={3}
                  disabled={isLoading || !status.available}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isLoading || !input.trim() || !status.available}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none"
              >
                <Send className="mr-2 h-4 w-4" />
                Send
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {status.available
                ? chatAccess.mode === "browser-local"
                  ? "This page is using your browser's direct connection to local Ollama."
                  : "Press Enter to send. Use Shift+Enter for a new line."
                : "Chat input is disabled until a reachable Ollama endpoint is configured for this environment."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
