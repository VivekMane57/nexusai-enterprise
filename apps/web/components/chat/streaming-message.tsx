"use client";

import {
  Bot,
  LoaderCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import CitationCard from "@/components/chat/citation-card";
import type {
  StreamingAssistantState,
} from "@/hooks/use-streaming-chat";

interface StreamingMessageProps {
  state: StreamingAssistantState;
}

export default function StreamingMessage({
  state,
}: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="flex w-full max-w-4xl items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Bot className="h-4 w-4" />
        </div>

        <article className="min-w-0 flex-1 overflow-hidden rounded-2xl rounded-tl-md border border-violet-200 bg-white shadow-sm">
          <div className="px-5 py-4">
            {state.content ? (
              <div className="text-sm leading-7 text-slate-700">
                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm,
                  ]}
                  components={{
                    p: ({ children }) => (
                      <p className="my-2 leading-7">
                        {children}
                      </p>
                    ),

                    ul: ({ children }) => (
                      <ul className="my-3 list-disc space-y-1 pl-5">
                        {children}
                      </ul>
                    ),

                    ol: ({ children }) => (
                      <ol className="my-3 list-decimal space-y-1 pl-5">
                        {children}
                      </ol>
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
                      <thead className="bg-slate-100">
                        {children}
                      </thead>
                    ),

                    th: ({ children }) => (
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                        {children}
                      </th>
                    ),

                    td: ({ children }) => (
                      <td className="border-b border-slate-100 px-4 py-3">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {state.content}
                </ReactMarkdown>

                <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-violet-600 align-middle" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin text-violet-700" />
                Retrieving sources and generating an answer...
              </div>
            )}
          </div>

          {state.citations.length >
            0 && (
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Sources (
                {state.citations.length})
              </p>

              <div className="space-y-3">
                {state.citations.map(
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
        </article>
      </div>
    </div>
  );
}