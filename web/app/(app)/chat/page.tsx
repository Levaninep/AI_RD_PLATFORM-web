"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  async function sendMessage() {
    const nextValue = input.trim();
    if (!nextValue || isLoading) {
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

      const reply = typeof data?.reply === "string" ? data.reply : null;

      if (!response.ok || !reply) {
        throw new Error(
          data?.error || "Error: I could not connect to the local AI model.",
        );
      }

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
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Dr. Levan - AI ASSISTANT
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            Local chatbot powered by Ollama
          </p>
        </header>

        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="flex h-[75vh] min-h-168 flex-col">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-sm font-medium text-slate-700">
                Food & Beverage formulation support
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ask technical questions and receive clear, business-style
                answers.
              </p>
            </div>

            <div className="h-[60vh] flex-1 overflow-y-auto bg-slate-50 px-4 py-5 md:px-6">
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
                            ? "max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm leading-6 text-white shadow-sm md:max-w-[70%]"
                            : "max-w-[85%] rounded-2xl bg-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm md:max-w-[70%]"
                        }
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}

                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm md:max-w-[70%]">
                      AI is thinking...
                    </div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-4 md:px-6">
              <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row md:items-end">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="chat-input"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
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
                    disabled={isLoading}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
