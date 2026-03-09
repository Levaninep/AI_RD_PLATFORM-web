"use client";

import { SendHorizonal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ChatInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (message: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");

  async function handleSubmit() {
    const nextValue = value.trim();
    if (!nextValue || disabled) {
      return;
    }

    setValue("");
    await onSend(nextValue);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="chat-input"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            Ask Dr. Levan - AI ASSISTANT
          </label>
          <textarea
            id="chat-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="Ask about Brix, concentrate usage, acidity balance, CO2, ingredient substitution, or product ideas..."
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          />
        </div>

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={disabled || !value.trim()}
          className="h-12 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <SendHorizonal className="size-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
