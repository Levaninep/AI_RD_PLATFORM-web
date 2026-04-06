import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ChatMessage } from "@/types/chat";

const SYSTEM_MESSAGE =
  "You are Dr. Levan - AI ASSISTANT, an AI R&D assistant for a Food and Beverage platform. Help with beverage formulation, Brix, acidity, juice content, ingredient functionality, and product development. Be practical, clear, and professional. Do not invent lab results, regulations, or legal claims.";

const DEFAULT_LOCAL_OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const OLLAMA_URL = process.env.OLLAMA_URL?.trim() || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL?.trim() || "llama3";
const OLLAMA_AUTH_TOKEN = process.env.OLLAMA_AUTH_TOKEN?.trim() || "";

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

function buildProbeUrl(ollamaUrl: string) {
  return new URL("/api/tags", ollamaUrl).toString();
}

function buildOllamaHeaders(contentType?: string) {
  const headers = new Headers();

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (OLLAMA_AUTH_TOKEN) {
    headers.set("authorization", `Bearer ${OLLAMA_AUTH_TOKEN}`);
  }

  return headers;
}

async function buildAvailability() {
  const ollamaUrl = resolveOllamaUrl();

  if (!ollamaUrl) {
    return {
      available: false,
      reason:
        "AI chat is currently available only in local development. To enable it in production, set OLLAMA_URL to a reachable Ollama server.",
    };
  }

  try {
    const response = await fetch(buildProbeUrl(ollamaUrl), {
      method: "GET",
      cache: "no-store",
      headers: buildOllamaHeaders(),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        available: false,
        reason:
          "The configured Ollama endpoint is not responding correctly. Chat is temporarily unavailable in production.",
      };
    }
  } catch {
    return {
      available: false,
      reason:
        "The configured Ollama endpoint is currently unreachable from production. Chat is temporarily unavailable.",
    };
  }

  return {
    available: true,
    reason: null,
  };
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

export async function GET() {
  return NextResponse.json(await buildAvailability());
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

  const availability = await buildAvailability();

  if (!availability.available) {
    return NextResponse.json(
      {
        error: availability.reason,
      },
      { status: 503 },
    );
  }

  const resolvedOllamaUrl = resolveOllamaUrl() as string;

  try {
    const ollamaResponse = await fetch(resolvedOllamaUrl, {
      method: "POST",
      headers: buildOllamaHeaders("application/json"),
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
            ? `Failed to connect to Ollama at ${resolvedOllamaUrl}. ${error.message}`
            : `Failed to connect to Ollama at ${resolvedOllamaUrl}.`,
      },
      { status: 500 },
    );
  }
}
