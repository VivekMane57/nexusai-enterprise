"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  HardDrive,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Server,
  Sparkles,
  Timer,
  TrendingUp,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";
import {
  useMemo,
} from "react";
import {
  useQuery,
} from "@tanstack/react-query";
import {
  toast,
} from "sonner";

import {
  AppShell,
} from "@/components/layout/app-shell";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  getMonitoringDashboard,
} from "@/services/monitoring";
import type {
  MonitoringActivity,
  MonitoringTrendPoint,
  ServiceHealth,
} from "@/types/monitoring";

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

function formatMilliseconds(
  value: number,
): string {
  if (!Number.isFinite(value)) {
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
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown time";
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
  const date = new Date(value);

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

function calculateSuccessRate(
  successful: number,
  total: number,
): number {
  if (total <= 0) {
    return 100;
  }

  return (
    successful / total
  ) * 100;
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{
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

function ServiceHealthCard({
  service,
}: {
  service: ServiceHealth;
}) {
  const normalizedStatus =
    service.status.toLowerCase();

  const isHealthy =
    normalizedStatus ===
      "healthy" ||
    normalizedStatus ===
      "ready" ||
    normalizedStatus ===
      "available";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isHealthy
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <Server className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {service.name}
            </p>

            <p
              className={`mt-1 text-xs font-medium ${
                isHealthy
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {isHealthy
                ? "Operational"
                : "Unavailable"}
            </p>
          </div>
        </div>

        {isHealthy ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-red-600" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          Response latency
        </span>

        <span className="text-xs font-semibold text-slate-700">
          {service.latency_ms != null
            ? formatMilliseconds(
                service.latency_ms,
              )
            : "—"}
        </span>
      </div>

      {service.message && (
        <p className="mt-3 line-clamp-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {service.message}
        </p>
      )}
    </article>
  );
}

interface MiniBarChartProps {
  data: MonitoringTrendPoint[];
  valueKey:
    | "requests"
    | "total_tokens"
    | "average_latency_ms";
  label: string;
  formatter: (
    value: number,
  ) => string;
}

function MiniBarChart({
  data,
  valueKey,
  label,
  formatter,
}: MiniBarChartProps) {
  const values = data.map(
    (point) =>
      Number(point[valueKey]) ||
      0,
  );

  const maximum =
    Math.max(...values, 1);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Last seven days
          </p>
        </div>

        <TrendingUp className="h-5 w-5 text-violet-700" />
      </div>

      <div className="mt-6 flex h-44 items-end gap-3">
        {data.map(
          (point) => {
            const value =
              Number(
                point[valueKey],
              ) || 0;

            const height =
              Math.max(
                (value / maximum) *
                  100,
                value > 0 ? 8 : 2,
              );

            return (
              <div
                key={`${valueKey}-${point.timestamp}`}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="group relative flex h-32 w-full items-end">
                  <div
                    title={formatter(
                      value,
                    )}
                    style={{
                      height: `${height}%`,
                    }}
                    className="w-full rounded-t-lg bg-violet-600 transition hover:bg-violet-700"
                  />

                  <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white group-hover:block">
                    {formatter(value)}
                  </span>
                </div>

                <span className="truncate text-[10px] text-slate-400">
                  {formatShortDate(
                    point.timestamp,
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

function ActivityIcon({
  activity,
}: {
  activity: MonitoringActivity;
}) {
  if (
    activity.activity_type ===
    "document"
  ) {
    return (
      <FileText className="h-4 w-4" />
    );
  }

  if (
    activity.activity_type ===
    "chat"
  ) {
    return (
      <MessageSquareText className="h-4 w-4" />
    );
  }

  return (
    <Activity className="h-4 w-4" />
  );
}

function ActivityStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  const isSuccess =
    [
      "success",
      "ready",
      "indexed",
      "completed",
      "healthy",
    ].includes(normalized);

  const isFailure =
    [
      "failed",
      "error",
      "unhealthy",
    ].includes(normalized);

  if (isSuccess) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        {status}
      </span>
    );
  }

  if (isFailure) {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
        {status}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
      {status}
    </span>
  );
}

function MonitoringSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 8,
        }).map(
          (_, index) => (
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
    </div>
  );
}

export default function MonitoringPage() {
  const monitoringQuery =
    useQuery({
      queryKey: [
        "monitoring-dashboard",
      ],

      queryFn:
        getMonitoringDashboard,

      refetchInterval: 15000,

      refetchIntervalInBackground:
        true,
    });

  const dashboard =
    monitoringQuery.data;

  const metrics =
    dashboard?.metrics;

  const trends = useMemo(
    () =>
      dashboard?.trends ?? [],
    [dashboard?.trends],
  );

  const services =
    dashboard?.services ?? [];

  const activities =
    dashboard?.recent_activity ??
    [];

  const successRate =
    calculateSuccessRate(
      metrics?.successful_requests ??
        0,
      metrics?.total_requests ?? 0,
    );

  async function handleRefresh(): Promise<void> {
    try {
      await monitoringQuery.refetch();

      toast.success(
        "Monitoring data refreshed.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <Activity className="h-3.5 w-3.5" />
              AI observability
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Monitoring
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track RAG requests, latency, token consumption, document processing and infrastructure health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dashboard && (
              <p className="hidden text-xs text-slate-400 md:block">
                Last updated{" "}
                {formatDateTime(
                  dashboard.generated_at,
                )}
              </p>
            )}

            <button
              type="button"
              disabled={
                monitoringQuery.isFetching
              }
              onClick={() => {
                void handleRefresh();
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {monitoringQuery.isFetching ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>
          </div>
        </section>

        {monitoringQuery.isLoading && (
          <MonitoringSkeleton />
        )}

        {monitoringQuery.isError && (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center">
            <CircleAlert className="h-11 w-11 text-red-700" />

            <h2 className="mt-5 text-xl font-semibold text-red-950">
              Monitoring data could not be loaded
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-red-700">
              {getApiErrorMessage(
                monitoringQuery.error,
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
          metrics && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Total AI requests"
                  value={formatNumber(
                    metrics.total_requests,
                  )}
                  description="Assistant responses generated"
                  icon={Bot}
                />

                <MetricCard
                  title="Success rate"
                  value={`${successRate.toFixed(
                    1,
                  )}%`}
                  description={`${metrics.successful_requests} successful requests`}
                  icon={CheckCircle2}
                  tone="emerald"
                />

                <MetricCard
                  title="Average latency"
                  value={formatMilliseconds(
                    metrics.average_latency_ms,
                  )}
                  description="End-to-end answer generation"
                  icon={Gauge}
                  tone="blue"
                />

                <MetricCard
                  title="Failed requests"
                  value={formatNumber(
                    metrics.failed_requests,
                  )}
                  description="Requests requiring attention"
                  icon={AlertTriangle}
                  tone={
                    metrics.failed_requests >
                    0
                      ? "red"
                      : "emerald"
                  }
                />

                <MetricCard
                  title="Retrieval latency"
                  value={formatMilliseconds(
                    metrics.average_retrieval_latency_ms,
                  )}
                  description="Hybrid search and reranking"
                  icon={Timer}
                  tone="blue"
                />

                <MetricCard
                  title="Generation latency"
                  value={formatMilliseconds(
                    metrics.average_generation_latency_ms,
                  )}
                  description="Azure OpenAI response generation"
                  icon={Sparkles}
                  tone="violet"
                />

                <MetricCard
                  title="Total tokens"
                  value={formatCompactNumber(
                    metrics.total_tokens,
                  )}
                  description={`${formatNumber(
                    metrics.prompt_tokens,
                  )} prompt · ${formatNumber(
                    metrics.completion_tokens,
                  )} completion`}
                  icon={Zap}
                  tone="amber"
                />

                <MetricCard
                  title="Indexed chunks"
                  value={formatNumber(
                    metrics.indexed_chunks,
                  )}
                  description="Searchable vector retrieval units"
                  icon={Database}
                  tone="emerald"
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Infrastructure health
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Live availability and response latency.
                    </p>
                  </div>

                  <HardDrive className="h-5 w-5 text-violet-700" />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {services.map(
                    (service) => (
                      <ServiceHealthCard
                        key={service.name}
                        service={service}
                      />
                    ),
                  )}
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-3">
                <MiniBarChart
                  data={trends}
                  valueKey="requests"
                  label="AI requests"
                  formatter={
                    formatNumber
                  }
                />

                <MiniBarChart
                  data={trends}
                  valueKey="average_latency_ms"
                  label="Average latency"
                  formatter={
                    formatMilliseconds
                  }
                />

                <MiniBarChart
                  data={trends}
                  valueKey="total_tokens"
                  label="Token usage"
                  formatter={
                    formatCompactNumber
                  }
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        Document pipeline
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Processing and indexing status.
                      </p>
                    </div>

                    <Workflow className="h-5 w-5 text-violet-700" />
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-500" />

                        <span className="text-sm text-slate-600">
                          Total documents
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {formatNumber(
                          metrics.total_documents,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileCheck2 className="h-4 w-4 text-emerald-700" />

                        <span className="text-sm text-emerald-700">
                          Indexed
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-emerald-800">
                        {formatNumber(
                          metrics.indexed_documents,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <LoaderCircle className="h-4 w-4 text-blue-700" />

                        <span className="text-sm text-blue-700">
                          Processing
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-blue-800">
                        {formatNumber(
                          metrics.processing_documents,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-700" />

                        <span className="text-sm text-red-700">
                          Failed
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-red-800">
                        {formatNumber(
                          metrics.failed_documents,
                        )}
                      </span>
                    </div>
                  </div>
                </article>

                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        Recent activity
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Latest platform and AI events.
                      </p>
                    </div>

                    <Clock3 className="h-5 w-5 text-violet-700" />
                  </div>

                  {activities.length ===
                  0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                      <Activity className="h-10 w-10 text-slate-300" />

                      <p className="mt-4 text-sm font-semibold text-slate-700">
                        No recent activity
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Upload documents or ask AI questions to generate events.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {activities.map(
                        (activity) => (
                          <div
                            key={`${activity.activity_type}-${activity.id}`}
                            className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                              <ActivityIcon
                                activity={
                                  activity
                                }
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {
                                    activity.title
                                  }
                                </p>

                                <ActivityStatusBadge
                                  status={
                                    activity.status
                                  }
                                />
                              </div>

                              {activity.description && (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {
                                    activity.description
                                  }
                                </p>
                              )}

                              <p className="mt-2 text-[11px] text-slate-400">
                                {formatDateTime(
                                  activity.created_at,
                                )}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </article>
              </section>
            </>
          )}
      </div>
    </AppShell>
  );
}