"use client";

import {
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useState } from "react";

import type {
  Citation,
} from "@/types/chat";

interface CitationCardProps {
  citation: Citation;
  index: number;
}

function getCitationContent(
  citation: Citation,
): string {
  return (
    citation.content ??
    citation.content_preview ??
    citation.excerpt ??
    citation.text ??
    ""
  );
}

function getCitationFilename(
  citation: Citation,
): string {
  return (
    citation.document_name ??
    citation.filename ??
    "Document source"
  );
}

function getCitationScore(
  citation: Citation,
): number | null {
  const score =
    citation.rerank_score ??
    citation.reranker_score ??
    citation.fusion_score ??
    citation.score ??
    citation.dense_score ??
    citation.sparse_score;

  if (
    score === null ||
    score === undefined ||
    Number.isNaN(score)
  ) {
    return null;
  }

  return score;
}

function formatScore(
  citation: Citation,
): string | null {
  const score =
    getCitationScore(citation);

  if (score === null) {
    return null;
  }

  if (
    score >= 0 &&
    score <= 1
  ) {
    return `${Math.round(
      score * 100,
    )}%`;
  }

  return score.toFixed(3);
}

export default function CitationCard({
  citation,
  index,
}: CitationCardProps) {
  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const content =
    getCitationContent(
      citation,
    );

  const filename =
    getCitationFilename(
      citation,
    );

  const score =
    formatScore(
      citation,
    );

  const sourceNumber =
    citation.citation_number ??
    index + 1;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={
          expanded
        }
        onClick={() =>
          setExpanded(
            (current) =>
              !current,
          )
        }
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Source{" "}
              {sourceNumber}
            </p>

            <p
              title={
                filename
              }
              className="mt-1 truncate text-sm font-semibold text-slate-900"
            >
              {filename}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {citation.page_number !=
                null && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Page{" "}
                  {
                    citation.page_number
                  }
                </span>
              )}

              {citation.chunk_index !=
                null && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Chunk{" "}
                  {
                    citation.chunk_index
                  }
                </span>
              )}

              {score && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  Score{" "}
                  {score}
                </span>
              )}
            </div>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
          {content ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {content}
            </p>
          ) : (
            <p className="text-sm italic text-slate-400">
              Source text is not
              included in the
              current API response.
            </p>
          )}
        </div>
      )}
    </article>
  );
}