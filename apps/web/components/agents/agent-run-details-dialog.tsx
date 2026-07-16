"use client";

import {
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  LoaderCircle,
  Wrench,
  X,
} from "lucide-react";

import type {
  AgentRunDetail,
} from "@/types/agent";

interface AgentRunDetailsDialogProps {
  open: boolean;
  run: AgentRunDetail | null;
  isLoading?: boolean;

  onClose: () => void;
}

function formatMilliseconds(
  value: number | null,
): string {
  if (value == null) {
    return "—";
  }

  if (value >= 1000) {
    return `${(
      value / 1000
    ).toFixed(2)} s`;
  }

  return `${value} ms`;
}

function formatJson(
  value: Record<
    string,
    unknown
  >,
): string {
  return JSON.stringify(
    value,
    null,
    2,
  );
}

export function AgentRunDetailsDialog({
  open,
  run,
  isLoading = false,
  onClose,
}: AgentRunDetailsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !isLoading
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-full w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Agent execution trace
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Step-by-step execution, tools, telemetry and citations.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading && (
          <div className="flex min-h-80 flex-col items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-violet-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading agent trace...
            </p>
          </div>
        )}

        {!isLoading &&
          run && (
            <div className="space-y-6 px-6 py-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Status
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {run.status}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Confidence
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {run.confidence_score !=
                    null
                      ? `${(
                          run.confidence_score *
                          100
                        ).toFixed(
                          1,
                        )}%`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Total latency
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {formatMilliseconds(
                      run.total_latency_ms,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Total tokens
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {run.total_tokens ??
                      0}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-950">
                  Task
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {run.task}
                </p>
              </section>

              {run.result && (
                <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                  <h3 className="font-semibold text-violet-950">
                    Final result
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-violet-900">
                    {run.result}
                  </p>
                </section>
              )}

              <section>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-violet-700" />

                  <h3 className="text-lg font-semibold text-slate-950">
                    Execution steps
                  </h3>
                </div>

                <div className="mt-5 space-y-4">
                  {run.steps.map(
                    (step) => (
                      <article
                        key={step.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                step.status ===
                                "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : step.status ===
                                      "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {step.status ===
                              "completed" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : step.status ===
                                "failed" ? (
                                <CircleAlert className="h-4 w-4" />
                              ) : (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                                Step{" "}
                                {
                                  step.step_index
                                }
                                {" · "}
                                {
                                  step.step_type
                                }
                              </p>

                              <h4 className="mt-1 font-semibold text-slate-900">
                                {
                                  step.title
                                }
                              </h4>

                              {step.description && (
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {
                                    step.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="shrink-0 text-xs font-medium text-slate-400">
                            {formatMilliseconds(
                              step.latency_ms,
                            )}
                          </span>
                        </div>

                        {step.output && (
                          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                            <p className="whitespace-pre-wrap text-xs leading-5 text-slate-600">
                              {
                                step.output
                              }
                            </p>
                          </div>
                        )}

                        {step.tool_name && (
                          <details className="mt-4">
                            <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-violet-700">
                              <Wrench className="h-3.5 w-3.5" />
                              Tool:{" "}
                              {
                                step.tool_name
                              }
                            </summary>

                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-200">
                                {formatJson(
                                  step.tool_input,
                                )}
                              </pre>

                              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-200">
                                {formatJson(
                                  step.tool_output,
                                )}
                              </pre>
                            </div>
                          </details>
                        )}
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-700" />

                  <h3 className="text-lg font-semibold text-slate-950">
                    Citations
                  </h3>
                </div>

                {run.citations.length ===
                0 ? (
                  <p className="mt-4 text-sm text-slate-400">
                    No citations were returned.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {run.citations.map(
                      (
                        citation,
                        index,
                      ) => (
                        <article
                          key={index}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <p className="text-xs font-semibold text-violet-700">
                            Source{" "}
                            {index + 1}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {String(
                              citation.filename ??
                                citation.document_name ??
                                "Document",
                            )}
                          </p>

                          <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-500">
                            {String(
                              citation.content_preview ??
                                citation.content ??
                                "",
                            )}
                          </p>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
      </div>
    </div>
  );
}