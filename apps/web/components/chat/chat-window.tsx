"use client";

import {
  MessageSquareText,
} from "lucide-react";
import {
  useEffect,
  useRef,
} from "react";

import Message from "@/components/chat/message";
import StreamingMessage from "@/components/chat/streaming-message";
import type {
  StreamingAssistantState,
} from "@/hooks/use-streaming-chat";
import type {
  ConversationMessage,
} from "@/types/chat";

interface ChatWindowProps {
  messages: ConversationMessage[];

  optimisticQuestion?:
    | string
    | null;

  streamingAssistant?:
    | StreamingAssistantState
    | null;
}

export default function ChatWindow({
  messages,
  optimisticQuestion,
  streamingAssistant,
}: ChatWindowProps) {
  const bottomRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    messages,
    optimisticQuestion,
    streamingAssistant?.content,
  ]);

  const hasMessages =
    messages.length > 0 ||
    Boolean(optimisticQuestion) ||
    Boolean(streamingAssistant);

  if (!hasMessages) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <MessageSquareText className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-xl font-semibold text-slate-950">
          Ask your first question
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Ask questions about indexed
          documents and receive grounded
          answers with citations.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {messages.map(
          (message) => (
            <Message
              key={message.id}
              role={message.role}
              content={message.content}
              citations={
                message.citations ?? []
              }
              model={message.model}
              totalLatencyMs={
                message.total_latency_ms
              }
              tokenUsage={
                message.token_usage
              }
            />
          ),
        )}

        {optimisticQuestion && (
          <Message
            role="user"
            content={
              optimisticQuestion
            }
          />
        )}

        {streamingAssistant && (
          <StreamingMessage
            state={
              streamingAssistant
            }
          />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}