import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ChatMessage } from "@/types/chat";

const SYSTEM_MESSAGE =
  "You are Dr. Levan - AI ASSISTANT, an AI R&D assistant for a Food and Beverage platform. Help with beverage formulation, Brix, acidity, juice content, ingredient functionality, and product development. Be practical, clear, and professional. Do not invent lab results, regulations, or legal claims.";

const OLLAMA_URL = "http://localhost:11434/api/chat";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

function buildCompletionMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid chat request payload." },
      { status: 400 },
    );
  }

  try {
    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          {
            role: "system",
            content: SYSTEM_MESSAGE,
          },
          ...buildCompletionMessages(parsed.data.messages),
        ],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text().catch(() => "");
      return NextResponse.json(
        {
          error:
            errorText.trim() ||
            `Ollama request failed with status ${ollamaResponse.status}.`,
        },
        { status: 500 },
      );
    }

    const data = (await ollamaResponse.json()) as {
      message?: {
        content?: string;
      };
    };

    const reply = data.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "The local AI returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to local AI." },
      { status: 500 },
    );
  }
}
