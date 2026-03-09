import { Bot, User2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex max-w-[85%] items-start gap-3 rounded-2xl px-4 py-3 shadow-sm md:max-w-[78%]",
          isUser
            ? "bg-blue-600 text-white"
            : "border border-slate-200 bg-slate-100 text-slate-800",
        )}
      >
        <div
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            isUser ? "bg-white/15 text-white" : "bg-white text-slate-600",
          )}
        >
          {isUser ? <User2 className="size-4" /> : <Bot className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.14em]",
              isUser ? "text-blue-100" : "text-slate-500",
            )}
          >
            {isUser ? "You" : "Dr. Levan - AI ASSISTANT"}
          </p>
          <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6">
            {message.content}
          </p>
          {!isUser && message.metadata ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                Intent: {message.metadata.intent.replaceAll("_", " ")}
              </Badge>
              {message.metadata.toolUsed ? (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-600"
                >
                  Tool: {message.metadata.toolUsed.replaceAll("_", " ")}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
