"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  streamConversationMessage,
  type StreamDoneData,
} from "@/services/chat-stream";
import type {
  Citation,
  ConversationMessageRequest,
  TokenUsage,
} from "@/types/chat";

export interface StreamingAssistantState {
  content: string;
  citations: Citation[];
  model?: string | null;
  finishReason?: string | null;
  tokenUsage?: TokenUsage;

  retrievalLatencyMs?:
    | number
    | null;

  generationLatencyMs?:
    | number
    | null;

  totalLatencyMs?:
    | number
    | null;
}

interface StartStreamingInput {
  conversationId: string;
  question: string;
}

export function useStreamingChat() {
  const abortControllerRef =
    useRef<AbortController | null>(
      null,
    );

  const [
    isStreaming,
    setIsStreaming,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const [
    assistantState,
    setAssistantState,
  ] =
    useState<StreamingAssistantState | null>(
      null,
    );

  const reset = useCallback(() => {
    setAssistantState(null);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const start = useCallback(
    async ({
      conversationId,
      question,
    }: StartStreamingInput): Promise<StreamDoneData> => {
      stop();

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      setError(null);
      setIsStreaming(true);

      setAssistantState({
        content: "",
        citations: [],
      });

      const payload: ConversationMessageRequest =
        {
          question: question.trim(),
          dense_top_k: 20,
          sparse_top_k: 20,
          retrieval_top_k: 15,
          final_context_top_k: 6,
          enable_reranking: true,
          reranker_batch_size: 16,
          dense_score_threshold: null,
          sparse_minimum_score: 0,
          temperature: 0.1,
          max_tokens: 1200,
        };

      try {
        const result =
          await streamConversationMessage(
            conversationId,
            payload,
            {
              onSources(data) {
                setAssistantState(
                  (current) => ({
                    content:
                      current?.content ??
                      "",
                    citations:
                      data.citations,
                    model:
                      current?.model,
                    tokenUsage:
                      current?.tokenUsage,
                  }),
                );
              },

              onToken(data) {
                setAssistantState(
                  (current) => ({
                    content:
                      `${current?.content ?? ""}${data.content}`,
                    citations:
                      current?.citations ??
                      [],
                    model:
                      current?.model,
                    tokenUsage:
                      current?.tokenUsage,
                  }),
                );
              },

              onDone(data) {
                setAssistantState(
                  (current) => ({
                    content:
                      data.answer ||
                      current?.content ||
                      "",

                    citations:
                      current?.citations ??
                      [],

                    model: data.model,

                    finishReason:
                      data.finish_reason,

                    tokenUsage:
                      data.token_usage,

                    retrievalLatencyMs:
                      data.latency
                        ?.retrieval_ms,

                    generationLatencyMs:
                      data.latency
                        ?.generation_ms,

                    totalLatencyMs:
                      data.latency
                        ?.total_ms,
                  }),
                );
              },
            },
            controller.signal,
          );

        return result;
      } catch (streamError) {
        if (
          streamError instanceof
            DOMException &&
          streamError.name ===
            "AbortError"
        ) {
          throw streamError;
        }

        const message =
          streamError instanceof Error
            ? streamError.message
            : "Streaming failed.";

        setError(message);

        throw streamError;
      } finally {
        if (
          abortControllerRef.current ===
          controller
        ) {
          abortControllerRef.current =
            null;
        }

        setIsStreaming(false);
      }
    },
    [stop],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    isStreaming,
    error,
    assistantState,
    start,
    stop,
    reset,
  };
}