import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ChatMessage } from "@/types/chat";

const SYSTEM_MESSAGE =
  "You are Dr. Levan - AI ASSISTANT, an AI R&D assistant for a Food and Beverage platform. Help with beverage formulation, Brix, acidity, juice content, ingredient functionality, and product development. Be practical, clear, and professional. Do not invent lab results, regulations, or legal claims.";

const DEFAULT_LOCAL_OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const OLLAMA_URL = process.env.OLLAMA_URL?.trim() || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL?.trim() || "llama3";

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

function resolveOllamaUrl() {
  if (OLLAMA_URL) {
    return OLLAMA_URL;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_LOCAL_OLLAMA_URL;
  }

  return null;
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

  const ollamaUrl = resolveOllamaUrl();

  if (!ollamaUrl) {
    return NextResponse.json(
      {
        error:
          "AI chat is not configured for production. Set OLLAMA_URL to a reachable Ollama server, or use the app locally with Ollama running on this machine.",
      },
      { status: 503 },
    );
  }

  try {
    const ollamaResponse = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
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
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to connect to Ollama at ${ollamaUrl}. ${error.message}`
            : `Failed to connect to Ollama at ${ollamaUrl}.`,
      },
      { status: 500 },
    );
  }
}
