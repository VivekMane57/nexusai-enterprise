"use client";

import {
  BrainCircuit,
  CircleAlert,
  Database,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Square,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import {
  toast,
} from "sonner";

import ChatInput from "@/components/chat/chat-input";
import ChatWindow from "@/components/chat/chat-window";
import ConversationSidebar from "@/components/chat/conversation-sidebar";
import { AppShell } from "@/components/layout/app-shell";
import {
  useAllKnowledgeBases,
} from "@/hooks/use-all-knowledge-bases";
import {
  useConversation,
} from "@/hooks/use-conversation";
import {
  useConversations,
} from "@/hooks/use-conversations";
import {
  useCreateConversation,
} from "@/hooks/use-create-conversation";
import {
  useDeleteConversation,
} from "@/hooks/use-delete-conversation";
import {
  useStreamingChat,
} from "@/hooks/use-streaming-chat";
import {
  getApiErrorMessage,
} from "@/lib/api";
import type {
  Conversation,
} from "@/types/chat";

export default function ChatPage() {
  const [
    selectedKnowledgeBaseId,
    setSelectedKnowledgeBaseId,
  ] = useState<
    string | undefined
  >();

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<
    string | undefined
  >();

  const [
    optimisticQuestion,
    setOptimisticQuestion,
  ] = useState<
    string | null
  >(null);

  const knowledgeBasesQuery =
    useAllKnowledgeBases();

  const knowledgeBases =
    knowledgeBasesQuery.knowledgeBases;

  const activeKnowledgeBaseId =
    selectedKnowledgeBaseId ??
    knowledgeBases[0]?.id;

  const activeKnowledgeBase =
    useMemo(
      () =>
        knowledgeBases.find(
          (knowledgeBase) =>
            knowledgeBase.id ===
            activeKnowledgeBaseId,
        ),
      [
        activeKnowledgeBaseId,
        knowledgeBases,
      ],
    );

  const conversationsQuery =
    useConversations(
      activeKnowledgeBaseId,
    );

  const conversations =
    useMemo(
      () =>
        conversationsQuery.data
          ?.items ?? [],
      [
        conversationsQuery.data
          ?.items,
      ],
    );

  const activeConversationId =
    selectedConversationId &&
    conversations.some(
      (conversation) =>
        conversation.id ===
        selectedConversationId,
    )
      ? selectedConversationId
      : conversations[0]?.id;

  const conversationQuery =
    useConversation(
      activeConversationId,
    );

  const createConversationMutation =
    useCreateConversation();

  const deleteConversationMutation =
    useDeleteConversation();

  const streamingChat =
    useStreamingChat();

  const pageError =
    knowledgeBasesQuery.error ??
    conversationsQuery.error ??
    conversationQuery.error;

  const hasError =
    knowledgeBasesQuery.isError ||
    conversationsQuery.isError ||
    conversationQuery.isError;

  const isInitialLoading =
    knowledgeBasesQuery.isLoading;

  const isBusy =
    streamingChat.isStreaming ||
    createConversationMutation.isPending ||
    deleteConversationMutation.isPending;

  function clearStreamingState(): void {
    streamingChat.stop();
    streamingChat.reset();

    setOptimisticQuestion(
      null,
    );
  }

  function handleKnowledgeBaseChange(
    knowledgeBaseId: string,
  ): void {
    clearStreamingState();

    setSelectedKnowledgeBaseId(
      knowledgeBaseId,
    );

    setSelectedConversationId(
      undefined,
    );
  }

  function handleConversationSelect(
    conversationId: string,
  ): void {
    if (
      streamingChat.isStreaming
    ) {
      toast.error(
        "Stop the current response before changing conversations.",
      );

      return;
    }

    streamingChat.reset();

    setOptimisticQuestion(
      null,
    );

    setSelectedConversationId(
      conversationId,
    );
  }

  async function handleNewChat(): Promise<void> {
    if (
      !activeKnowledgeBaseId
    ) {
      toast.error(
        "Select a knowledge base first.",
      );

      return;
    }

    if (
      streamingChat.isStreaming
    ) {
      toast.error(
        "Stop the current response before creating a new chat.",
      );

      return;
    }

    try {
      const conversation =
        await createConversationMutation.mutateAsync(
          {
            knowledgeBaseId:
              activeKnowledgeBaseId,

            title:
              "New conversation",
          },
        );

      await conversationsQuery.refetch();

      streamingChat.reset();

      setOptimisticQuestion(
        null,
      );

      setSelectedConversationId(
        conversation.id,
      );

      toast.success(
        "New conversation created.",
      );
    } catch (
      mutationError
    ) {
      toast.error(
        getApiErrorMessage(
          mutationError,
        ),
      );
    }
  }

  async function handleSendMessage(
    question: string,
  ): Promise<void> {
    const normalizedQuestion =
      question.trim();

    if (
      !normalizedQuestion
    ) {
      return;
    }

    if (
      !activeConversationId
    ) {
      toast.error(
        "Create a new conversation first.",
      );

      return;
    }

    if (
      streamingChat.isStreaming
    ) {
      toast.error(
        "A response is already being generated.",
      );

      return;
    }

    setOptimisticQuestion(
      normalizedQuestion,
    );

    streamingChat.reset();

    try {
      await streamingChat.start(
        {
          conversationId:
            activeConversationId,

          question:
            normalizedQuestion,
        },
      );

      /*
       * The backend saves both the user message
       * and completed assistant message before
       * sending the final SSE event.
       */
      await Promise.all([
        conversationQuery.refetch(),
        conversationsQuery.refetch(),
      ]);

      setOptimisticQuestion(
        null,
      );

      streamingChat.reset();
    } catch (
      streamError
    ) {
      if (
        streamError instanceof
          DOMException &&
        streamError.name ===
          "AbortError"
      ) {
        setOptimisticQuestion(
          null,
        );

        streamingChat.reset();

        toast.message(
          "Response generation stopped.",
        );

        /*
         * The backend may already have persisted
         * the user message before the connection
         * was stopped, so refresh conversation data.
         */
        await Promise.all([
          conversationQuery.refetch(),
          conversationsQuery.refetch(),
        ]);

        return;
      }

      toast.error(
        streamError instanceof
          Error
          ? streamError.message
          : "Streaming response failed.",
      );

      /*
       * Refresh because the backend may have
       * persisted the user message before failing.
       */
      await Promise.all([
        conversationQuery.refetch(),
        conversationsQuery.refetch(),
      ]);

      setOptimisticQuestion(
        null,
      );
    }
  }

  async function handleDeleteConversation(
    conversation: Conversation,
  ): Promise<void> {
    if (
      !activeKnowledgeBaseId
    ) {
      return;
    }

    if (
      streamingChat.isStreaming
    ) {
      toast.error(
        "Stop the current response before deleting a conversation.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${conversation.title}"?\n\nThis action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteConversationMutation.mutateAsync(
        {
          conversationId:
            conversation.id,

          knowledgeBaseId:
            activeKnowledgeBaseId,
        },
      );

      if (
        selectedConversationId ===
        conversation.id ||
        activeConversationId ===
        conversation.id
      ) {
        setSelectedConversationId(
          undefined,
        );

        setOptimisticQuestion(
          null,
        );

        streamingChat.reset();
      }

      await conversationsQuery.refetch();

      toast.success(
        "Conversation deleted.",
      );
    } catch (
      mutationError
    ) {
      toast.error(
        getApiErrorMessage(
          mutationError,
        ),
      );
    }
  }

  async function handleRefresh(): Promise<void> {
    if (
      streamingChat.isStreaming
    ) {
      toast.error(
        "Stop the current response before refreshing.",
      );

      return;
    }

    try {
      await Promise.all([
        knowledgeBasesQuery.refetchAll(),
        conversationsQuery.refetch(),
        activeConversationId
          ? conversationQuery.refetch()
          : Promise.resolve(),
      ]);

      toast.success(
        "Chat data refreshed.",
      );
    } catch (
      refreshError
    ) {
      toast.error(
        getApiErrorMessage(
          refreshError,
        ),
      );
    }
  }

  function handleStopGenerating(): void {
    streamingChat.stop();

    toast.message(
      "Stopping response generation...",
    );
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-2rem)] min-h-[680px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <ConversationSidebar
          conversations={
            conversations
          }
          activeId={
            activeConversationId
          }
          isCreating={
            createConversationMutation.isPending
          }
          isDeletingId={
            deleteConversationMutation.isPending
              ? deleteConversationMutation.variables
                  ?.conversationId ??
                null
              : null
          }
          disabled={
            !activeKnowledgeBaseId ||
            streamingChat.isStreaming
          }
          onSelect={
            handleConversationSelect
          }
          onNewChat={() => {
            void handleNewChat();
          }}
          onDelete={(
            conversation,
          ) => {
            void handleDeleteConversation(
              conversation,
            );
          }}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
          <header className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <MessageSquareText className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-950">
                      NexusAI Chat
                    </h1>

                    {streamingChat.isStreaming && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                        Streaming
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Grounded enterprise RAG with live citations
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-72">
                  <label
                    htmlFor="knowledge-base-selector"
                    className="sr-only"
                  >
                    Select knowledge base
                  </label>

                  <select
                    id="knowledge-base-selector"
                    value={
                      activeKnowledgeBaseId ??
                      ""
                    }
                    disabled={
                      knowledgeBasesQuery.isLoading ||
                      knowledgeBases.length ===
                        0 ||
                      streamingChat.isStreaming
                    }
                    onChange={(
                      event,
                    ) =>
                      handleKnowledgeBaseChange(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {knowledgeBases.length ===
                    0 ? (
                      <option value="">
                        No knowledge bases available
                      </option>
                    ) : (
                      knowledgeBases.map(
                        (
                          knowledgeBase,
                        ) => (
                          <option
                            key={
                              knowledgeBase.id
                            }
                            value={
                              knowledgeBase.id
                            }
                          >
                            {
                              knowledgeBase.name
                            }{" "}
                            —{" "}
                            {
                              knowledgeBase.project_name
                            }
                          </option>
                        ),
                      )
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={
                    knowledgeBasesQuery.isFetching ||
                    conversationsQuery.isFetching ||
                    streamingChat.isStreaming
                  }
                  onClick={() => {
                    void handleRefresh();
                  }}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {knowledgeBasesQuery.isFetching ||
                  conversationsQuery.isFetching ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  Refresh
                </button>
              </div>
            </div>

            {activeKnowledgeBase && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                  <BrainCircuit className="h-3.5 w-3.5" />

                  {
                    activeKnowledgeBase.name
                  }
                </span>

                <span className="text-xs text-slate-400">
                  {
                    activeKnowledgeBase.organization_name
                  }
                  {" / "}
                  {
                    activeKnowledgeBase.project_name
                  }
                </span>

                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Database className="h-3.5 w-3.5" />

                  {activeKnowledgeBase.chunk_count ??
                    0}{" "}
                  indexed chunks
                </span>
              </div>
            )}
          </header>

          {isInitialLoading && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-violet-700" />

              <p className="mt-4 text-sm text-slate-500">
                Loading knowledge bases...
              </p>
            </div>
          )}

          {!isInitialLoading &&
            hasError && (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <CircleAlert className="h-7 w-7" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-950">
                  Chat could not be loaded
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {getApiErrorMessage(
                    pageError,
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void handleRefresh();
                  }}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
                >
                  <RefreshCw className="h-4 w-4" />

                  Try again
                </button>
              </div>
            )}

          {!isInitialLoading &&
            !hasError &&
            knowledgeBases.length ===
              0 && (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <BrainCircuit className="h-8 w-8" />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-950">
                  No knowledge base available
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create a knowledge base and upload an indexed document before starting a grounded conversation.
                </p>
              </div>
            )}

          {!isInitialLoading &&
            !hasError &&
            knowledgeBases.length >
              0 && (
              <>
                <div className="flex min-h-0 flex-1 flex-col">
                  {activeConversationId ? (
                    <>
                      {conversationQuery.isLoading &&
                      !optimisticQuestion ? (
                        <div className="flex flex-1 items-center justify-center">
                          <LoaderCircle className="h-7 w-7 animate-spin text-violet-700" />
                        </div>
                      ) : (
                        <ChatWindow
                          messages={
                            conversationQuery.data
                              ?.messages ??
                            []
                          }
                          optimisticQuestion={
                            optimisticQuestion
                          }
                          streamingAssistant={
                            streamingChat.assistantState
                          }
                        />
                      )}
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                        <MessageSquareText className="h-8 w-8" />
                      </div>

                      <h2 className="mt-5 text-xl font-semibold text-slate-950">
                        Start a new conversation
                      </h2>

                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Click New Chat and ask questions grounded in your indexed documents.
                      </p>

                      <button
                        type="button"
                        disabled={
                          createConversationMutation.isPending ||
                          isBusy
                        }
                        onClick={() => {
                          void handleNewChat();
                        }}
                        className="mt-6 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {createConversationMutation.isPending
                          ? "Creating..."
                          : "Create new chat"}
                      </button>
                    </div>
                  )}
                </div>

                {streamingChat.error && (
                  <div className="border-t border-red-100 bg-red-50 px-6 py-3">
                    <div className="mx-auto flex max-w-5xl items-center gap-2 text-sm text-red-700">
                      <CircleAlert className="h-4 w-4 shrink-0" />

                      <p>
                        {
                          streamingChat.error
                        }
                      </p>
                    </div>
                  </div>
                )}

                {streamingChat.isStreaming && (
                  <div className="flex justify-center border-t border-slate-100 bg-white py-2.5">
                    <button
                      type="button"
                      onClick={
                        handleStopGenerating
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />

                      Stop generating
                    </button>
                  </div>
                )}

                <ChatInput
                  loading={
                    streamingChat.isStreaming
                  }
                  onSend={(
                    question,
                  ) => {
                    void handleSendMessage(
                      question,
                    );
                  }}
                />
              </>
            )}
        </main>
      </div>
    </AppShell>
  );
}