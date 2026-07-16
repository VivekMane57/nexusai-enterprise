"use client";

import {
  CheckCircle2,
  CircleAlert,
  FileSearch,
  FlaskConical,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import type {
  EvaluationRunRequest,
  EvaluationRunResponse,
} from "@/types/evaluation";

interface RunEvaluationDialogProps {
  open: boolean;
  isSubmitting?: boolean;

  result:
    | EvaluationRunResponse
    | null;

  onClose: () => void;

  onSubmit: (
    payload: EvaluationRunRequest,
  ) => Promise<void>;
}

interface EvaluationFormContentProps {
  isSubmitting: boolean;

  result:
    | EvaluationRunResponse
    | null;

  onClose: () => void;

  onSubmit: (
    payload: EvaluationRunRequest,
  ) => Promise<void>;
}

function formatPercentage(
  value: number,
): string {
  const percentage =
    value <= 1
      ? value * 100
      : value;

  return `${percentage.toFixed(1)}%`;
}

function EvaluationFormContent({
  isSubmitting,
  result,
  onClose,
  onSubmit,
}: EvaluationFormContentProps) {
  const [
    question,
    setQuestion,
  ] = useState("");

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    expectedAnswer,
    setExpectedAnswer,
  ] = useState("");

  const [
    contexts,
    setContexts,
  ] = useState<string[]>([
    "",
  ]);

  const [
    validationError,
    setValidationError,
  ] = useState<
    string | null
  >(null);

  function updateContext(
    index: number,
    value: string,
  ): void {
    setContexts(
      (current) =>
        current.map(
          (
            context,
            contextIndex,
          ) =>
            contextIndex === index
              ? value
              : context,
        ),
    );
  }

  function addContext(): void {
    setContexts(
      (current) => [
        ...current,
        "",
      ],
    );
  }

  function removeContext(
    index: number,
  ): void {
    setContexts(
      (current) => {
        if (
          current.length === 1
        ) {
          return [""];
        }

        return current.filter(
          (
            _context,
            contextIndex,
          ) =>
            contextIndex !== index,
        );
      },
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedQuestion =
      question.trim();

    const normalizedAnswer =
      answer.trim();

    if (
      normalizedQuestion.length <
      3
    ) {
      setValidationError(
        "Question must contain at least 3 characters.",
      );

      return;
    }

    if (!normalizedAnswer) {
      setValidationError(
        "Enter the generated answer to evaluate.",
      );

      return;
    }

    setValidationError(null);

    const normalizedContexts =
      contexts
        .map(
          (context) =>
            context.trim(),
        )
        .filter(Boolean);

    const citations =
      normalizedContexts.map(
        (
          context,
          index,
        ) => ({
          citation_number:
            index + 1,

          content: context,

          document_name:
            `Manual context ${index + 1}`,
        }),
      );

    await onSubmit({
      question:
        normalizedQuestion,

      answer:
        normalizedAnswer,

      expected_answer:
        expectedAnswer.trim() ||
        null,

      contexts:
        normalizedContexts,

      citations,
    });
  }

  function handleClose(): void {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evaluation-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <FlaskConical className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                RAG quality testing
              </p>

              <h2
                id="evaluation-dialog-title"
                className="mt-1 text-xl font-semibold text-slate-950"
              >
                Run evaluation
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Evaluate answer quality, grounding, citations and hallucination risk.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            disabled={
              isSubmitting
            }
            onClick={
              handleClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(
              event,
            );
          }}
          className="space-y-6 px-6 py-6"
        >
          <div>
            <label
              htmlFor="evaluation-question"
              className="text-sm font-medium text-slate-700"
            >
              Question
            </label>

            <textarea
              id="evaluation-question"
              value={question}
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                setQuestion(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="What was the revenue growth in FY 2025-26?"
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="evaluation-answer"
              className="text-sm font-medium text-slate-700"
            >
              Generated answer
            </label>

            <textarea
              id="evaluation-answer"
              value={answer}
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                setAnswer(
                  event.target.value,
                )
              }
              rows={6}
              placeholder="Revenue increased from INR 1,320 lakh to INR 1,845 lakh, representing 39.8% growth [Source 1]."
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="expected-answer"
              className="text-sm font-medium text-slate-700"
            >
              Expected answer{" "}
              <span className="font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <textarea
              id="expected-answer"
              value={
                expectedAnswer
              }
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) =>
                setExpectedAnswer(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Revenue growth was 39.8%."
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Retrieved contexts
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Add source chunks used to generate the answer.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  isSubmitting
                }
                onClick={
                  addContext
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add context
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {contexts.map(
                (
                  context,
                  index,
                ) => (
                  <div
                    key={index}
                    className="flex items-start gap-2"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <FileSearch className="h-4 w-4" />
                    </div>

                    <textarea
                      value={
                        context
                      }
                      disabled={
                        isSubmitting
                      }
                      onChange={(
                        event,
                      ) =>
                        updateContext(
                          index,
                          event.target
                            .value,
                        )
                      }
                      rows={3}
                      placeholder={`Context ${index + 1}`}
                      className="min-w-0 flex-1 resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                    />

                    <button
                      type="button"
                      aria-label={`Remove context ${index + 1}`}
                      disabled={
                        isSubmitting
                      }
                      onClick={() =>
                        removeContext(
                          index,
                        )
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>

          {validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      result.passed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {result.passed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <CircleAlert className="h-6 w-6" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Evaluation{" "}
                      {result.passed
                        ? "passed"
                        : "failed"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Grade{" "}
                      {result.grade}
                      {" · "}
                      {result.citation_count} citations
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-3xl font-semibold text-slate-950">
                    {result.overall_percentage.toFixed(
                      1,
                    )}
                    %
                  </p>

                  <p className="text-xs text-slate-400">
                    Overall score
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.metrics.map(
                  (metric) => (
                    <div
                      key={
                        metric.name
                      }
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">
                          {
                            metric.name
                          }
                        </p>

                        <span
                          className={`text-xs font-semibold ${
                            metric.passed
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercentage(
                            metric.percentage,
                          )}
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          style={{
                            width: `${Math.max(
                              2,
                              Math.min(
                                100,
                                metric.percentage,
                              ),
                            )}%`,
                          }}
                          className={`h-full rounded-full ${
                            metric.passed
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />
                      </div>

                      <p className="mt-3 text-[11px] leading-5 text-slate-400">
                        {
                          metric.explanation
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800">
                  Hallucination risk:{" "}
                  {formatPercentage(
                    result.hallucination_risk,
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={
                isSubmitting
              }
              onClick={
                handleClose
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}

              {isSubmitting
                ? "Evaluating..."
                : "Run evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RunEvaluationDialog({
  open,
  isSubmitting = false,
  result,
  onClose,
  onSubmit,
}: RunEvaluationDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <EvaluationFormContent
      key={
        result?.id ??
        "new-evaluation"
      }
      isSubmitting={
        isSubmitting
      }
      result={result}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}