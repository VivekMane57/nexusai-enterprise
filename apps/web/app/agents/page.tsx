"use client";

import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Eye,
  Gauge,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import {
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
  AgentRunDetailsDialog,
} from "@/components/agents/agent-run-details-dialog";
import {
  RunAgentDialog,
} from "@/components/agents/run-agent-dialog";
import {
  AppShell,
} from "@/components/layout/app-shell";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  getAgentDashboard,
  getAgentRun,
  runAgent,
  deleteAgentRun,
} from "@/services/agents";
import type {
  AgentRun,
  AgentRunDetail,
  AgentRunRequest,
  AgentType,
} from "@/types/agent";

function formatMilliseconds(
  value: number,
): string {
  if (value >= 1000) {
    return `${(
      value / 1000
    ).toFixed(2)} s`;
  }

  return `${Math.round(
    value,
  )} ms`;
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

function getAgentName(
  type: AgentType,
): string {
  const names: Record<
    AgentType,
    string
  > = {
    financial_analyst:
      "Financial Analyst",
    risk_analyst:
      "Risk Analyst",
    compliance_reviewer:
      "Compliance Reviewer",
    document_researcher:
      "Document Researcher",
    executive_summary:
      "Executive Summary",
  };

  return names[type];
}

function StatusBadge({
  status,
}: {
  status: AgentRun["status"];
}) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <CircleAlert className="h-3.5 w-3.5" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      {status}
    </span>
  );
}

export default function AgentsPage() {
  const queryClient =
    useQueryClient();

  const [
    runDialogOpen,
    setRunDialogOpen,
  ] = useState(false);

  const [
    selectedAgentType,
    setSelectedAgentType,
  ] = useState<
    AgentType | null
  >(null);

  const [
    selectedRunId,
    setSelectedRunId,
  ] = useState<
    string | null
  >(null);

  const [
    selectedRun,
    setSelectedRun,
  ] =
    useState<AgentRunDetail | null>(
      null,
    );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const dashboardQuery =
    useQuery({
      queryKey: [
        "agent-dashboard",
      ],

      queryFn: () =>
        getAgentDashboard(50),

      refetchInterval: 20000,
    });

  const runMutation =
    useMutation({
      mutationFn:
        runAgent,

      onSuccess:
        async (
          result,
        ) => {
          setRunDialogOpen(
            false,
          );

          setSelectedAgentType(
            null,
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "agent-dashboard",
              ],
            },
          );

          setSelectedRun(
            result,
          );

          setSelectedRunId(
            result.id,
          );

          toast.success(
            "Agent execution completed.",
          );
        },

      onError: (
        error,
      ) => {
        toast.error(
          getApiErrorMessage(
            error,
          ),
        );
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn:
        deleteAgentRun,

      onSuccess:
        async () => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "agent-dashboard",
              ],
            },
          );

          toast.success(
            "Agent run deleted.",
          );
        },

      onError: (
        error,
      ) => {
        toast.error(
          getApiErrorMessage(
            error,
          ),
        );
      },
    });

  const dashboard =
    dashboardQuery.data;

  const summary =
    dashboard?.summary;

  const agents =
    dashboard?.available_agents ??
    [];

  const runs = useMemo(
    () =>
      dashboard?.recent_runs ??
      [],
    [dashboard?.recent_runs],
  );

  const filteredRuns =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return runs;
      }

      return runs.filter(
        (run) =>
          run.task
            .toLowerCase()
            .includes(query) ||
          getAgentName(
            run.agent_type,
          )
            .toLowerCase()
            .includes(query),
      );
    }, [
      runs,
      searchQuery,
    ]);

  async function openRunDetails(
    runId: string,
  ): Promise<void> {
    setSelectedRunId(
      runId,
    );

    setSelectedRun(null);

    try {
      const run =
        await getAgentRun(
          runId,
        );

      setSelectedRun(run);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
        ),
      );
    }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <Workflow className="h-3.5 w-3.5" />
              Agentic AI orchestration
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              AI Agents
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Run specialist enterprise agents with hybrid retrieval, Azure OpenAI, citations and execution traces.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={
                dashboardQuery.isFetching
              }
              onClick={() => {
                void dashboardQuery.refetch();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
              onClick={() => {
                setSelectedAgentType(
                  null,
                );

                setRunDialogOpen(
                  true,
                );
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800"
            >
              <Play className="h-4 w-4" />
              Run agent
            </button>
          </div>
        </section>

        {dashboardQuery.isLoading && (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle className="h-9 w-9 animate-spin text-violet-700" />
          </div>
        )}

        {dashboardQuery.isError && (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <CircleAlert className="mx-auto h-10 w-10 text-red-700" />

            <p className="mt-4 text-sm text-red-700">
              {getApiErrorMessage(
                dashboardQuery.error,
              )}
            </p>
          </section>
        )}

        {dashboard &&
          summary && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Bot className="h-5 w-5 text-violet-700" />

                  <p className="mt-4 text-sm text-slate-500">
                    Total runs
                  </p>

                  <p className="mt-1 text-3xl font-semibold text-slate-950">
                    {
                      summary.total_runs
                    }
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />

                  <p className="mt-4 text-sm text-slate-500">
                    Success rate
                  </p>

                  <p className="mt-1 text-3xl font-semibold text-slate-950">
                    {summary.success_rate.toFixed(
                      1,
                    )}
                    %
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Gauge className="h-5 w-5 text-blue-700" />

                  <p className="mt-4 text-sm text-slate-500">
                    Average latency
                  </p>

                  <p className="mt-1 text-3xl font-semibold text-slate-950">
                    {formatMilliseconds(
                      summary.average_latency_ms,
                    )}
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Zap className="h-5 w-5 text-amber-700" />

                  <p className="mt-4 text-sm text-slate-500">
                    Total tokens
                  </p>

                  <p className="mt-1 text-3xl font-semibold text-slate-950">
                    {
                      summary.total_tokens
                    }
                  </p>
                </article>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Specialist agents
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Select an enterprise agent for a document-grounded task.
                    </p>
                  </div>

                  <BrainCircuit className="h-5 w-5 text-violet-700" />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {agents.map(
                    (agent) => (
                      <article
                        key={
                          agent.type
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                          <Sparkles className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-slate-950">
                          {
                            agent.name
                          }
                        </h3>

                        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                          {
                            agent.description
                          }
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {agent.capabilities
                            .slice(0, 3)
                            .map(
                              (
                                capability,
                              ) => (
                                <span
                                  key={
                                    capability
                                  }
                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
                                >
                                  {
                                    capability
                                  }
                                </span>
                              ),
                            )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgentType(
                              agent.type,
                            );

                            setRunDialogOpen(
                              true,
                            );
                          }}
                          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 text-sm font-semibold text-white hover:bg-violet-800"
                        >
                          <Play className="h-4 w-4" />
                          Run{" "}
                          {agent.name}
                        </button>
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative max-w-xl">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    value={
                      searchQuery
                    }
                    onChange={(event) =>
                      setSearchQuery(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search agent runs..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Recent agent runs
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Execution status, telemetry and trace access.
                    </p>
                  </div>

                  <TrendingUp className="h-5 w-5 text-violet-700" />
                </div>

                {filteredRuns.length ===
                0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center text-center">
                    <Bot className="h-10 w-10 text-slate-300" />

                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      No agent runs
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-4">
                            Agent
                          </th>
                          <th className="px-5 py-4">
                            Task
                          </th>
                          <th className="px-5 py-4">
                            Status
                          </th>
                          <th className="px-5 py-4">
                            Confidence
                          </th>
                          <th className="px-5 py-4">
                            Latency
                          </th>
                          <th className="px-5 py-4">
                            Created
                          </th>
                          <th className="px-5 py-4 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRuns.map(
                          (run) => (
                            <tr
                              key={run.id}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                            >
                              <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                {getAgentName(
                                  run.agent_type,
                                )}
                              </td>

                              <td className="max-w-md px-5 py-4">
                                <p className="line-clamp-2 text-sm text-slate-600">
                                  {
                                    run.task
                                  }
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <StatusBadge
                                  status={
                                    run.status
                                  }
                                />
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {run.confidence_score !=
                                null
                                  ? `${(
                                      run.confidence_score *
                                      100
                                    ).toFixed(
                                      1,
                                    )}%`
                                  : "—"}
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {formatMilliseconds(
                                  run.total_latency_ms ??
                                    0,
                                )}
                              </td>

                              <td className="px-5 py-4 text-xs text-slate-400">
                                {formatDateTime(
                                  run.created_at,
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void openRunDetails(
                                        run.id,
                                      );
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-violet-700 hover:bg-violet-50"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      deleteMutation.isPending
                                    }
                                    onClick={() => {
                                      const confirmed =
                                        window.confirm(
                                          "Delete this agent run?",
                                        );

                                      if (
                                        confirmed
                                      ) {
                                        deleteMutation.mutate(
                                          run.id,
                                        );
                                      }
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
      </div>

      <RunAgentDialog
        open={runDialogOpen}
        agents={agents}
        selectedAgentType={
          selectedAgentType
        }
        isSubmitting={
          runMutation.isPending
        }
        onClose={() => {
          if (
            !runMutation.isPending
          ) {
            setRunDialogOpen(
              false,
            );

            setSelectedAgentType(
              null,
            );
          }
        }}
        onSubmit={async (
          payload: AgentRunRequest,
        ) => {
          await runMutation.mutateAsync(
            payload,
          );
        }}
      />

      <AgentRunDetailsDialog
        open={
          selectedRunId !== null
        }
        run={selectedRun}
        isLoading={
          selectedRunId !== null &&
          selectedRun === null
        }
        onClose={() => {
          setSelectedRunId(null);
          setSelectedRun(null);
        }}
      />
    </AppShell>
  );
}