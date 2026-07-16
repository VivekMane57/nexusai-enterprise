import { api } from "@/lib/api";

import type {
  Citation,
  ConversationMessageRequest,
  TokenUsage,
} from "@/types/chat";

export interface StreamStartData {
  conversation_id: string;
  user_message_id: string;
}

export interface StreamSourcesData {
  citations: Citation[];
  total: number;
}

export interface StreamTokenData {
  content: string;
}

export interface StreamDoneData {
  conversation_id: string;
  assistant_message_id: string;
  answer: string;
  model?: string | null;
  finish_reason?: string | null;

  token_usage?: TokenUsage;

  latency?: {
    retrieval_ms?: number | null;
    generation_ms?: number | null;
    total_ms?: number | null;
  };
}

export interface StreamErrorData {
  error?: string;
  message: string;
}

export interface StreamingChatCallbacks {
  onStart?: (
    data: StreamStartData,
  ) => void;

  onSources?: (
    data: StreamSourcesData,
  ) => void;

  onToken?: (
    data: StreamTokenData,
  ) => void;

  onDone?: (
    data: StreamDoneData,
  ) => void;
}

interface ParsedSseEvent {
  event: string;
  data: unknown;
}

function resolveAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const directKeys = [
    "access_token",
    "accessToken",
    "nexusai_access_token",
  ];

  for (const key of directKeys) {
    const value =
      window.localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  const jsonKeys = [
    "auth",
    "auth-storage",
    "nexusai-auth",
  ];

  for (const key of jsonKeys) {
    const value =
      window.localStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsed = JSON.parse(value);

      const token =
        parsed.access_token ??
        parsed.accessToken ??
        parsed.state?.access_token ??
        parsed.state?.accessToken;

      if (
        typeof token === "string" &&
        token
      ) {
        return token;
      }
    } catch {
      // Ignore non-JSON values.
    }
  }

  const defaultAuthorization =
    api.defaults.headers.common
      .Authorization;

  if (
    typeof defaultAuthorization ===
    "string"
  ) {
    return defaultAuthorization.replace(
      /^Bearer\s+/i,
      "",
    );
  }

  return null;
}

function buildStreamingUrl(
  conversationId: string,
): string {
  const baseUrl =
    api.defaults.baseURL ??
    "http://127.0.0.1:8000/api/v1";

  return `${baseUrl.replace(
    /\/$/,
    "",
  )}/conversations/${conversationId}/messages/stream`;
}

function parseSseBlock(
  block: string,
): ParsedSseEvent | null {
  const lines = block.split(/\r?\n/);

  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line
        .slice(6)
        .trim();

      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(
        line.slice(5).trimStart(),
      );
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawData =
    dataLines.join("\n");

  try {
    return {
      event: eventName,
      data: JSON.parse(rawData),
    };
  } catch {
    return {
      event: eventName,
      data: rawData,
    };
  }
}

export async function streamConversationMessage(
  conversationId: string,
  payload: ConversationMessageRequest,
  callbacks: StreamingChatCallbacks,
  signal?: AbortSignal,
): Promise<StreamDoneData> {
  const token = resolveAccessToken();

  if (!token) {
    throw new Error(
      "Authentication token not found. Please sign in again.",
    );
  }

  const response = await fetch(
    buildStreamingUrl(conversationId),
    {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type":
          "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal,
    },
  );

  if (!response.ok) {
    let message =
      `Streaming failed with HTTP ${response.status}.`;

    try {
      const body = await response.json();

      message =
        body.detail ??
        body.message ??
        message;
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error(
      "Streaming response body is unavailable.",
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";
  let doneData:
    | StreamDoneData
    | null = null;

  async function processBlock(
    block: string,
  ): Promise<void> {
    const parsed =
      parseSseBlock(block);

    if (!parsed) {
      return;
    }

    switch (parsed.event) {
      case "start":
        callbacks.onStart?.(
          parsed.data as StreamStartData,
        );
        break;

      case "sources":
        callbacks.onSources?.(
          parsed.data as StreamSourcesData,
        );
        break;

      case "token":
        callbacks.onToken?.(
          parsed.data as StreamTokenData,
        );
        break;

      case "done":
        doneData =
          parsed.data as StreamDoneData;

        callbacks.onDone?.(doneData);
        break;

      case "error": {
        const errorData =
          parsed.data as StreamErrorData;

        throw new Error(
          errorData.message ||
            "Streaming generation failed.",
        );
      }

      default:
        break;
    }
  }

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const blocks =
      buffer.split(/\r?\n\r?\n/);

    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      await processBlock(block);
    }
  }

  const remaining =
    buffer.trim();

  if (remaining) {
    await processBlock(remaining);
  }

  if (!doneData) {
    throw new Error(
      "Streaming connection closed before the final response.",
    );
  }

  return doneData;
}