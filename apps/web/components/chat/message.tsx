"use client";

import {
  Bot,
  Check,
  Copy,
  User,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import CitationCard from "@/components/chat/citation-card";
import type {
  ChatMessageRole,
  Citation,
  TokenUsage,
} from "@/types/chat";

interface MessageProps {
  role: ChatMessageRole;
  content: string;
  citations?: Citation[];
  model?: string | null;
  totalLatencyMs?: number | null;
  tokenUsage?: TokenUsage | null;
}

export default function Message({
  role,
  content,
  citations = [],
  model,
  totalLatencyMs,
  tokenUsage,
}: MessageProps) {
  const [copied, setCopied] =
    useState(false);

  const isUser =
    role === "user";

  const isSystem =
    role === "system";

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        content,
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1500,
      );
    } catch {
      setCopied(false);
    }
  }

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm leading-6 text-amber-800">
          {content}
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-3xl items-start gap-3">
          <div className="rounded-2xl rounded-tr-md bg-violet-700 px-4 py-3 text-sm leading-7 text-white shadow-sm">
            <p className="whitespace-pre-wrap">
              {content}
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex w-full max-w-4xl items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Bot className="h-4 w-4" />
        </div>

        <article className="min-w-0 flex-1 overflow-hidden rounded-2xl rounded-tl-md border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4">
            <div className="prose prose-slate max-w-none text-sm leading-7">
              <ReactMarkdown
                remarkPlugins={[
                  remarkGfm,
                ]}
                components={{
                  h1: ({
                    children,
                  }) => (
                    <h1 className="mb-3 mt-4 text-xl font-semibold text-slate-950 first:mt-0">
                      {children}
                    </h1>
                  ),

                  h2: ({
                    children,
                  }) => (
                    <h2 className="mb-2 mt-4 text-lg font-semibold text-slate-950 first:mt-0">
                      {children}
                    </h2>
                  ),

                  h3: ({
                    children,
                  }) => (
                    <h3 className="mb-2 mt-3 text-base font-semibold text-slate-900">
                      {children}
                    </h3>
                  ),

                  p: ({
                    children,
                  }) => (
                    <p className="my-2 text-sm leading-7 text-slate-700">
                      {children}
                    </p>
                  ),

                  ul: ({
                    children,
                  }) => (
                    <ul className="my-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {children}
                    </ul>
                  ),

                  ol: ({
                    children,
                  }) => (
                    <ol className="my-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                      {children}
                    </ol>
                  ),

                  blockquote: ({
                    children,
                  }) => (
                    <blockquote className="my-3 border-l-4 border-violet-300 bg-violet-50 px-4 py-2 text-sm text-slate-700">
                      {children}
                    </blockquote>
                  ),

                  table: ({
                    children,
                  }) => (
                    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        {children}
                      </table>
                    </div>
                  ),

                  thead: ({
                    children,
                  }) => (
                    <thead className="bg-slate-100 text-slate-700">
                      {children}
                    </thead>
                  ),

                  th: ({
                    children,
                  }) => (
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                      {children}
                    </th>
                  ),

                  td: ({
                    children,
                  }) => (
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                      {children}
                    </td>
                  ),

                  code: ({
                    className,
                    children,
                  }) => {
                    const isBlock =
                      Boolean(
                        className,
                      );

                    if (!isBlock) {
                      return (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-violet-700">
                          {children}
                        </code>
                      );
                    }

                    return (
                      <code className="font-mono text-xs text-slate-100">
                        {children}
                      </code>
                    );
                  },

                  pre: ({
                    children,
                  }) => (
                    <pre className="my-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                      {children}
                    </pre>
                  ),

                  a: ({
                    href,
                    children,
                  }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-violet-700 underline underline-offset-2"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>

          {citations.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Sources ({citations.length})
              </p>

              <div className="space-y-3">
                {citations.map(
                  (
                    citation,
                    index,
                  ) => (
                    <CitationCard
                      key={
                        citation.id ??
                        citation.chunk_id ??
                        `${citation.document_id}-${index}`
                      }
                      citation={
                        citation
                      }
                      index={index}
                    />
                  ),
                )}
              </div>
            </div>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              {model && (
                <span>
                  Model: {model}
                </span>
              )}

              {totalLatencyMs !=
                null && (
                <span>
                  Latency:{" "}
                  {(
                    totalLatencyMs /
                    1000
                  ).toFixed(2)}
                  s
                </span>
              )}

              {tokenUsage?.total_tokens !=
                null && (
                <span>
                  Tokens:{" "}
                  {
                    tokenUsage.total_tokens
                  }
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                void handleCopy()
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}

              {copied
                ? "Copied"
                : "Copy"}
            </button>
          </footer>
        </article>
      </div>
    </div>
  );
}