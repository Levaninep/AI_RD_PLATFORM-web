export type BrowserChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatAccessResult = {
  available: boolean;
  mode: "server" | "browser-local" | "unavailable";
  reason: string | null;
};

const LOCAL_OLLAMA_TAGS_URL = "http://localhost:11434/api/tags";
const LOCAL_OLLAMA_CHAT_URL = "http://localhost:11434/api/chat";
const LOCAL_OLLAMA_MODEL = "llama3";
const SYSTEM_MESSAGE =
  "You are Dr. Levan - AI ASSISTANT, an AI R&D assistant for a Food and Beverage platform. Help with beverage formulation, Brix, acidity, juice content, ingredient functionality, and product development. Be practical, clear, and professional. Do not invent lab results, regulations, or legal claims.";

async function canReachLocalOllamaFromBrowser() {
  const response = await fetch(LOCAL_OLLAMA_TAGS_URL, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });

  return response.ok;
}

export async function detectChatAccess(): Promise<ChatAccessResult> {
  const response = await fetch("/api/chat", {
    method: "GET",
    cache: "no-store",
  }).catch(() => null);

  const payload = (await response?.json().catch(() => null)) as {
    available?: boolean;
    reason?: string | null;
  } | null;

  if (payload?.available) {
    return {
      available: true,
      mode: "server",
      reason: null,
    };
  }

  try {
    const localAvailable = await canReachLocalOllamaFromBrowser();

    if (localAvailable) {
      return {
        available: true,
        mode: "browser-local",
        reason:
          "Connected directly to local Ollama from this browser. This only works on the machine where Ollama is running.",
      };
    }
  } catch {
    return {
      available: false,
      mode: "unavailable",
      reason:
        "Production chat cannot reach Ollama, and this browser also cannot connect to local Ollama. If Ollama is running on this machine, allow browser access from this domain and restart Ollama.",
    };
  }

  return {
    available: false,
    mode: "unavailable",
    reason:
      payload?.reason ??
      "Chat is temporarily unavailable because no reachable Ollama endpoint was found.",
  };
}

export async function sendBrowserLocalChat(messages: BrowserChatMessage[]) {
  const response = await fetch(LOCAL_OLLAMA_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: LOCAL_OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_MESSAGE,
        },
        ...messages,
      ],
      stream: false,
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    message?: {
      content?: string;
    };
  } | null;

  const reply = payload?.message?.content?.trim();

  if (!response.ok || !reply) {
    throw new Error(
      payload?.error ||
        "Failed to connect to local Ollama from this browser. Check that Ollama is running and allows browser access.",
    );
  }

  return reply;
}
