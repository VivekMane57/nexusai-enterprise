"use client";

import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  FlaskConical,
  Gauge,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import {
  type ComponentType,
  useMemo,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  RunEvaluationDialog,
} from "@/components/evaluation/run-evaluation-dialog";
import {
  AppShell,
} from "@/components/layout/app-shell";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  getEvaluationDashboard,
  runEvaluation,
} from "@/services/evaluation";
import type {
  EvaluationHistoryItem,
  EvaluationRunResponse,
  EvaluationTrendPoint,
} from "@/types/evaluation";

type ResultFilter =
  | "all"
  | "passed"
  | "failed";

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(value);
}

function formatCompactNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  ).format(value);
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

function formatMilliseconds(
  value: number,
): string {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "0 ms";
  }

  if (value >= 1000) {
    return `${(
      value / 1000
    ).toFixed(2)} s`;
  }

  return `${value.toFixed(0)} ms`;
}

function formatDateTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatShortDate(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(date);
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;

  icon: ComponentType<{
    className?: string;
  }>;

  tone?:
    | "violet"
    | "blue"
    | "emerald"
    | "amber"
    | "red";
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "violet",
}: MetricCardProps) {
  const toneClasses = {
    violet:
      "bg-violet-100 text-violet-700",
    blue:
      "bg-blue-100 text-blue-700",
    emerald:
      "bg-emerald-100 text-emerald-700",
    amber:
      "bg-amber-100 text-amber-700",
    red:
      "bg-red-100 text-red-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </article>
  );
}

interface QualityMetricProps {
  label: string;
  score: number;
  description: string;
}

function QualityMetric({
  label,
  score,
  description,
}: QualityMetricProps) {
  const percentage =
    Math.max(
      0,
      Math.min(
        100,
        score * 100,
      ),
    );

  const isGood =
    percentage >= 65;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          {label}
        </p>

        <span
          className={`text-sm font-semibold ${
            isGood
              ? "text-emerald-600"
              : "text-red-600"
          }`}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          style={{
            width: `${Math.max(
              2,
              percentage,
            )}%`,
          }}
          className={`h-full rounded-full ${
            isGood
              ? "bg-emerald-500"
              : "bg-red-500"
          }`}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

interface TrendChartProps {
  data: EvaluationTrendPoint[];

  valueKey:
    | "evaluations"
    | "average_score"
    | "average_groundedness"
    | "average_relevancy";

  label: string;

  percentage?: boolean;
}

function TrendChart({
  data,
  valueKey,
  label,
  percentage = false,
}: TrendChartProps) {
  const values =
    data.map(
      (item) =>
        Number(
          item[valueKey],
        ) || 0,
    );

  const maximum =
    Math.max(
      ...values,
      percentage
        ? 1
        : 1,
    );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {label}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Last seven days
          </p>
        </div>

        <TrendingUp className="h-5 w-5 text-violet-700" />
      </div>

      <div className="mt-6 flex h-44 items-end gap-3">
        {data.map(
          (item) => {
            const value =
              Number(
                item[valueKey],
              ) || 0;

            const height =
              Math.max(
                value > 0
                  ? 8
                  : 2,

                value /
                  maximum *
                  100,
              );

            const title =
              percentage
                ? formatPercentage(
                    value,
                  )
                : formatNumber(
                    value,
                  );

            return (
              <div
                key={`${valueKey}-${item.timestamp}`}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="group relative flex h-32 w-full items-end">
                  <div
                    title={title}
                    style={{
                      height: `${height}%`,
                    }}
                    className="w-full rounded-t-lg bg-violet-600 transition hover:bg-violet-700"
                  />

                  <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white group-hover:block">
                    {title}
                  </span>
                </div>

                <span className="truncate text-[10px] text-slate-400">
                  {formatShortDate(
                    item.timestamp,
                  )}
                </span>
              </div>
            );
          },
        )}
      </div>
    </article>
  );
}

function EvaluationResultBadge({
  item,
}: {
  item: EvaluationHistoryItem;
}) {
  if (item.passed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Passed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
      <XCircle className="h-3.5 w-3.5" />
      Failed
    </span>
  );
}

function EvaluationSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 8,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={index}
              className="h-36 rounded-2xl bg-slate-200"
            />
          ),
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="h-72 rounded-2xl bg-slate-200" />
        <div className="h-72 rounded-2xl bg-slate-200" />
        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>

      <div className="h-96 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default function EvaluationPage() {
  const queryClient =
    useQueryClient();

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    evaluationResult,
    setEvaluationResult,
  ] =
    useState<
      EvaluationRunResponse | null
    >(null);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    resultFilter,
    setResultFilter,
  ] =
    useState<ResultFilter>(
      "all",
    );

  const dashboardQuery =
    useQuery({
      queryKey: [
        "evaluation-dashboard",
      ],

      queryFn: () =>
        getEvaluationDashboard(
          7,
          50,
        ),

      refetchInterval:
        30000,

      refetchIntervalInBackground:
        true,
    });

  const runMutation =
    useMutation({
      mutationFn:
        runEvaluation,

      onSuccess:
        async (
          result,
        ) => {
          setEvaluationResult(
            result,
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "evaluation-dashboard",
              ],
            },
          );

          toast.success(
            `Evaluation completed with grade ${result.grade}.`,
          );
        },

      onError: (
        mutationError,
      ) => {
        toast.error(
          getApiErrorMessage(
            mutationError,
          ),
        );
      },
    });

  const dashboard =
    dashboardQuery.data;

  const summary =
    dashboard?.summary;

  const trends =
    useMemo(
      () =>
        dashboard?.trends ??
        [],
      [
        dashboard?.trends,
      ],
    );

  const recentEvaluations =
    useMemo(
      () =>
        dashboard
          ?.recent_evaluations ??
        [],
      [
        dashboard
          ?.recent_evaluations,
      ],
    );

  const filteredEvaluations =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      return recentEvaluations.filter(
        (item) => {
          const matchesSearch =
            !normalizedQuery ||
            item.question
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            item.answer_preview
              .toLowerCase()
              .includes(
                normalizedQuery,
              );

          const matchesResult =
            resultFilter ===
              "all" ||
            (
              resultFilter ===
                "passed" &&
              item.passed
            ) ||
            (
              resultFilter ===
                "failed" &&
              !item.passed
            );

          return (
            matchesSearch &&
            matchesResult
          );
        },
      );
    }, [
      recentEvaluations,
      searchQuery,
      resultFilter,
    ]);

  async function handleRefresh(): Promise<void> {
    try {
      await dashboardQuery.refetch();

      toast.success(
        "Evaluation data refreshed.",
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

  function openEvaluationDialog(): void {
    setEvaluationResult(
      null,
    );

    setDialogOpen(true);
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <FlaskConical className="h-3.5 w-3.5" />
              AI quality assurance
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Evaluation
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Measure grounding, relevance, citation quality, hallucination risk and answer completeness.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={
                dashboardQuery.isFetching
              }
              onClick={() => {
                void handleRefresh();
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {dashboardQuery.isFetching ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>

            <button
              type="button"
              onClick={
                openEvaluationDialog
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800"
            >
              <FlaskConical className="h-4 w-4" />
              Run evaluation
            </button>
          </div>
        </section>

        {dashboardQuery.isLoading && (
          <EvaluationSkeleton />
        )}

        {dashboardQuery.isError && (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center">
            <CircleAlert className="h-11 w-11 text-red-700" />

            <h2 className="mt-5 text-xl font-semibold text-red-950">
              Evaluation data could not be loaded
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-red-700">
              {getApiErrorMessage(
                dashboardQuery.error,
              )}
            </p>

            <button
              type="button"
              onClick={() => {
                void handleRefresh();
              }}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        )}

        {dashboard &&
          summary && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Total evaluations"
                  value={formatNumber(
                    summary.total_evaluations,
                  )}
                  description="Conversation answers analyzed"
                  icon={FlaskConical}
                />

                <MetricCard
                  title="Pass rate"
                  value={`${summary.pass_rate.toFixed(
                    1,
                  )}%`}
                  description={`${summary.passed_evaluations} passed · ${summary.failed_evaluations} failed`}
                  icon={BadgeCheck}
                  tone={
                    summary.pass_rate >=
                    65
                      ? "emerald"
                      : "red"
                  }
                />

                <MetricCard
                  title="Average score"
                  value={formatPercentage(
                    summary.average_score,
                  )}
                  description="Weighted RAG quality score"
                  icon={Target}
                  tone="blue"
                />

                <MetricCard
                  title="Hallucination risk"
                  value={formatPercentage(
                    summary.average_hallucination_risk,
                  )}
                  description="Lower values indicate stronger grounding"
                  icon={ShieldAlert}
                  tone={
                    summary.average_hallucination_risk <=
                    0.35
                      ? "emerald"
                      : "red"
                  }
                />

                <MetricCard
                  title="Groundedness"
                  value={formatPercentage(
                    summary.average_groundedness,
                  )}
                  description="Answer support from retrieved sources"
                  icon={BrainCircuit}
                  tone="emerald"
                />

                <MetricCard
                  title="Answer relevancy"
                  value={formatPercentage(
                    summary.average_relevancy,
                  )}
                  description="Alignment with user questions"
                  icon={Sparkles}
                  tone="violet"
                />

                <MetricCard
                  title="Average latency"
                  value={formatMilliseconds(
                    summary.average_latency_ms,
                  )}
                  description="End-to-end evaluated response latency"
                  icon={Gauge}
                  tone="blue"
                />

                <MetricCard
                  title="Total tokens"
                  value={formatCompactNumber(
                    summary.total_tokens,
                  )}
                  description="Tokens used by evaluated responses"
                  icon={Zap}
                  tone="amber"
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        Quality dimensions
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Average score by evaluation category.
                      </p>
                    </div>

                    <Activity className="h-5 w-5 text-violet-700" />
                  </div>

                  <div className="mt-5 grid gap-4">
                    <QualityMetric
                      label="Groundedness"
                      score={
                        summary.average_groundedness
                      }
                      description="Checks whether answer claims are supported by retrieved evidence."
                    />

                    <QualityMetric
                      label="Answer relevancy"
                      score={
                        summary.average_relevancy
                      }
                      description="Measures alignment between the question and generated response."
                    />

                    <QualityMetric
                      label="Citation coverage"
                      score={
                        summary.average_citation_coverage
                      }
                      description="Measures whether important answer claims include source references."
                    />

                    <QualityMetric
                      label="Context utilization"
                      score={
                        summary.average_context_utilization
                      }
                      description="Measures how effectively retrieved chunks are used."
                    />
                  </div>
                </article>

                <section className="grid gap-5 md:grid-cols-2">
                  <TrendChart
                    data={trends}
                    valueKey="evaluations"
                    label="Evaluation runs"
                  />

                  <TrendChart
                    data={trends}
                    valueKey="average_score"
                    label="Average quality score"
                    percentage
                  />

                  <TrendChart
                    data={trends}
                    valueKey="average_groundedness"
                    label="Groundedness trend"
                    percentage
                  />

                  <TrendChart
                    data={trends}
                    valueKey="average_relevancy"
                    label="Relevancy trend"
                    percentage
                  />
                </section>
              </section>

              <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    value={
                      searchQuery
                    }
                    onChange={(
                      event,
                    ) =>
                      setSearchQuery(
                        event.target.value,
                      )
                    }
                    placeholder="Search evaluation questions or answers..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <select
                  value={
                    resultFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setResultFilter(
                      event.target
                        .value as ResultFilter,
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="all">
                    All results
                  </option>

                  <option value="passed">
                    Passed
                  </option>

                  <option value="failed">
                    Failed
                  </option>
                </select>
              </section>

              {recentEvaluations.length ===
              0 ? (
                <section className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <FlaskConical className="h-8 w-8" />
                  </div>

                  <h2 className="mt-6 text-xl font-semibold text-slate-950">
                    No evaluations available
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Ask questions in chat or run a manual evaluation to generate quality metrics.
                  </p>

                  <button
                    type="button"
                    onClick={
                      openEvaluationDialog
                    }
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800"
                  >
                    <FlaskConical className="h-4 w-4" />
                    Run evaluation
                  </button>
                </section>
              ) : filteredEvaluations.length ===
                0 ? (
                <section className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
                  <Search className="h-10 w-10 text-slate-300" />

                  <h2 className="mt-4 text-lg font-semibold text-slate-900">
                    No matching evaluations
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setResultFilter(
                        "all",
                      );
                    }}
                    className="mt-4 text-sm font-semibold text-violet-700"
                  >
                    Clear filters
                  </button>
                </section>
              ) : (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">
                          Evaluation history
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Recent quality checks from stored RAG conversations.
                        </p>
                      </div>

                      <Clock3 className="h-5 w-5 text-violet-700" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1150px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-4 font-semibold">
                            Question
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Result
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Score
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Groundedness
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Relevancy
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Citations
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Risk
                          </th>

                          <th className="px-5 py-4 font-semibold">
                            Created
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredEvaluations.map(
                          (item) => (
                            <tr
                              key={
                                item.id
                              }
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                            >
                              <td className="max-w-md px-5 py-4">
                                <p
                                  title={
                                    item.question
                                  }
                                  className="truncate text-sm font-semibold text-slate-900"
                                >
                                  {
                                    item.question
                                  }
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                                  {
                                    item.answer_preview
                                  }
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <EvaluationResultBadge
                                  item={
                                    item
                                  }
                                />
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {formatPercentage(
                                      item.overall_score,
                                    )}
                                  </span>

                                  <span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                                    {
                                      item.grade
                                    }
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm font-medium text-slate-600">
                                {formatPercentage(
                                  item.groundedness,
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm font-medium text-slate-600">
                                {formatPercentage(
                                  item.answer_relevancy,
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <FileCheck2 className="h-4 w-4 text-violet-600" />

                                  {
                                    item.citation_count
                                  }
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`text-sm font-semibold ${
                                    item.hallucination_risk <=
                                    0.35
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatPercentage(
                                    item.hallucination_risk,
                                  )}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-xs text-slate-400">
                                {formatDateTime(
                                  item.created_at,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
      </div>

      <RunEvaluationDialog
        open={dialogOpen}
        isSubmitting={
          runMutation.isPending
        }
        result={
          evaluationResult
        }
        onClose={() => {
          if (
            !runMutation.isPending
          ) {
            setDialogOpen(
              false,
            );

            setEvaluationResult(
              null,
            );
          }
        }}
        onSubmit={async (
          payload,
        ) => {
          await runMutation.mutateAsync(
            payload,
          );
        }}
      />
    </AppShell>
  );
}