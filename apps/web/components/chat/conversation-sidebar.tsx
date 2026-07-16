"use client";

import {
  Check,
  LoaderCircle,
  MessageSquarePlus,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Conversation } from "@/types/chat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId?: string;

  isCreating?: boolean;
  isDeletingId?: string |null;
  disabled?: boolean;

  onSelect: (conversationId: string) => void;
  onNewChat: () => void;

  onDelete: (
    conversation: Conversation,
  ) => void;

  // Optional
  onRename?: (
    conversation: Conversation,
    title: string,
  ) => void;
}

function formatConversationDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default function ConversationSidebar({
  conversations,
  activeId,
  isCreating = false,
  isDeletingId = null,
  disabled = false,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
}: ConversationSidebarProps) {
  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  useEffect(() => {
    const close = () =>
      setOpenMenuId(null);

    window.addEventListener(
      "click",
      close,
    );

    return () =>
      window.removeEventListener(
        "click",
        close,
      );
  }, []);

  const filtered =
    useMemo(() => {
      if (!search.trim()) {
        return conversations;
      }

      return conversations.filter(
        (conversation) =>
          conversation.title
            ?.toLowerCase()
            .includes(
              search
                .trim()
                .toLowerCase(),
            ),
      );
    }, [conversations, search]);

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">

      {/* Header */}

      <div className="border-b border-slate-200 p-4">

        <button
          type="button"
          disabled={
            disabled ||
            isCreating
          }
          onClick={onNewChat}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-4 w-4" />
          )}

          {isCreating
            ? "Creating..."
            : "New Chat"}
        </button>

        <div className="relative mt-4">

          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            placeholder="Search conversations..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white"
          />
        </div>

      </div>

      {/* Title */}

      <div className="border-b border-slate-100 px-4 py-3">

        <div className="flex items-center gap-2">

          <MessagesSquare className="h-4 w-4 text-violet-700" />

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Conversations
          </span>

        </div>

      </div>

      {/* List */}

      <div className="flex-1 overflow-y-auto p-2">

        {filtered.length === 0 ? (

          <div className="flex min-h-[240px] flex-col items-center justify-center text-center">

            <MessagesSquare className="h-10 w-10 text-slate-300" />

            <h3 className="mt-4 text-sm font-semibold">
              No conversations
            </h3>

            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
              Create a conversation or change
              the search query.
            </p>

          </div>

        ) : (

          <div className="space-y-2">

            {filtered.map(
              (conversation) => {
                const active =
                  conversation.id ===
                  activeId;

                const deleting =
                  isDeletingId ===
                  conversation.id;

                const menuOpen =
                  openMenuId ===
                  conversation.id;

                const editing =
                  editingId ===
                  conversation.id;

                return (

                  <div
                    key={
                      conversation.id
                    }
                    className="relative"
                  >

                    <button
                      type="button"
                      disabled={
                        deleting
                      }
                      onClick={() =>
                        onSelect(
                          conversation.id,
                        )
                      }
                      className={`w-full rounded-xl border px-3 py-3 pr-11 text-left transition ${
                        active
                          ? "border-violet-200 bg-violet-50"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >

                      {editing ? (

                        <input
                          autoFocus
                          value={
                            editingTitle
                          }
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                          onChange={(
                            e,
                          ) =>
                            setEditingTitle(
                              e.target
                                .value,
                            )
                          }
                          className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-violet-500"
                        />

                      ) : (

                        <p className="truncate text-sm font-semibold">
                          {conversation.title ||
                            "Untitled conversation"}
                        </p>

                      )}

                      <div className="mt-2 flex items-center justify-between">

                        <span className="text-[11px] text-slate-400">
                          {formatConversationDate(
                            conversation.updated_at,
                          )}
                        </span>

                        {conversation.message_count !=
                          null && (
                          <span className="text-[11px] text-slate-400">
                            {
                              conversation.message_count
                            }{" "}
                            msgs
                          </span>
                        )}

                      </div>

                    </button>

                    <button
                      onClick={(
                        e,
                      ) => {
                        e.stopPropagation();

                        setOpenMenuId(
                          menuOpen
                            ? null
                            : conversation.id,
                        );
                      }}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white"
                    >
                      {deleting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </button>

                    {menuOpen && (

                      <div className="absolute right-2 top-11 z-30 w-44 rounded-xl border bg-white p-1 shadow-xl">

                        {editing ? (

                          <button
                            onClick={() => {

                              onRename?.(
                                conversation,
                                editingTitle.trim(),
                              );

                              setEditingId(
                                null,
                              );

                              setOpenMenuId(
                                null,
                              );
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                          >
                            <Check className="h-4 w-4" />
                            Save
                          </button>

                        ) : (

                          <button
                            onClick={() => {

                              setEditingId(
                                conversation.id,
                              );

                              setEditingTitle(
                                conversation.title,
                              );
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Rename
                          </button>

                        )}

                        <button
                          onClick={() => {

                            setOpenMenuId(
                              null,
                            );

                            onDelete(
                              conversation,
                            );
                          }}
                          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>

                        <button
                          onClick={() => {

                            setOpenMenuId(
                              null,
                            );

                            setEditingId(
                              null,
                            );
                          }}
                          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                        >
                          <X className="h-4 w-4" />
                          Close
                        </button>

                      </div>

                    )}

                  </div>

                );
              },
            )}

          </div>

        )}

      </div>

    </aside>
  );
}