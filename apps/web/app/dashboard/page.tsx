import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  Clock3,
  Database,
  FileStack,
  FolderKanban,
  MessageSquareText,
  MoreHorizontal,
  Server,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";

const recentKnowledgeBases = [
  {
    name: "Zensar Recruitment",
    project: "Talent Intelligence",
    documents: 14,
    chunks: "1,268",
    status: "healthy" as const,
    updated: "6 minutes ago",
  },
  {
    name: "Financial Reports",
    project: "FinSight AI",
    documents: 36,
    chunks: "8,420",
    status: "processing" as const,
    updated: "18 minutes ago",
  },
  {
    name: "Clinical Knowledge",
    project: "Healthcare Copilot",
    documents: 21,
    chunks: "4,882",
    status: "healthy" as const,
    updated: "2 hours ago",
  },
];

const activities = [
  {
    title: "Document indexing completed",
    description:
      "Zensar.pdf generated 42 searchable chunks.",
    time: "6 min ago",
    icon: FileStack,
    iconClassName:
      "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Knowledge base queried",
    description:
      "A grounded answer used 5 citations.",
    time: "19 min ago",
    icon: MessageSquareText,
    iconClassName:
      "bg-violet-50 text-violet-700",
  },
  {
    title: "New project created",
    description:
      "Healthcare Copilot was added to the workspace.",
    time: "3 hr ago",
    icon: FolderKanban,
    iconClassName:
      "bg-blue-50 text-blue-700",
  },
  {
    title: "Organization member joined",
    description:
      "A new developer was added to NexusAI Workspace.",
    time: "Yesterday",
    icon: Users,
    iconClassName:
      "bg-amber-50 text-amber-700",
  },
];

const infrastructure = [
  {
    name: "PostgreSQL",
    description: "Primary metadata database",
    value: "18 ms",
    status: "healthy" as const,
  },
  {
    name: "Redis",
    description: "Broker and result backend",
    value: "4 ms",
    status: "healthy" as const,
  },
  {
    name: "Qdrant",
    description: "Vector search database",
    value: "26 ms",
    status: "healthy" as const,
  },
  {
    name: "Celery Worker",
    description: "Document processing queue",
    value: "2 queued",
    status: "processing" as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            Enterprise AI workspace
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Good morning, Vivek
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Here is what is happening across your
            organizations, knowledge bases and AI workloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/knowledge-bases"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Database className="h-4 w-4" />
            Open knowledge bases
          </Link>

          <Link
            href="/chat"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-700/15 transition hover:bg-violet-800"
          >
            <Bot className="h-4 w-4" />
            Start AI conversation
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Knowledge bases"
          value="12"
          description="Across 5 active projects"
          change="18.2%"
          trend="up"
          icon={Database}
        />

        <MetricCard
          title="Indexed documents"
          value="126"
          description="4 documents processing"
          change="12.5%"
          trend="up"
          icon={FileStack}
        />

        <MetricCard
          title="AI conversations"
          value="1,284"
          description="During the last 30 days"
          change="24.8%"
          trend="up"
          icon={MessageSquareText}
        />

        <MetricCard
          title="Avg. response latency"
          value="1.86s"
          description="Retrieval and generation"
          change="8.4%"
          trend="down"
          icon={Activity}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">
                Recent knowledge bases
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Retrieval-ready sources across your workspace
              </p>
            </div>

            <Link
              href="/knowledge-bases"
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentKnowledgeBases.map(
              (knowledgeBase) => (
                <div
                  key={knowledgeBase.name}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                      <BrainCircuit className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {knowledgeBase.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {knowledgeBase.project}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 sm:flex sm:items-center">
                    <div>
                      <p className="text-xs text-slate-400">
                        Documents
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {knowledgeBase.documents}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Chunks
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {knowledgeBase.chunks}
                      </p>
                    </div>

                    <div className="col-span-2 sm:min-w-24">
                      <StatusBadge
                        status={
                          knowledgeBase.status
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:flex"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <h2 className="font-semibold text-slate-950">
              Platform health
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Live infrastructure status
            </p>
          </div>

          <div className="space-y-1 p-3">
            {infrastructure.map(
              (service) => (
                <div
                  key={service.name}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Server className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {service.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {service.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <StatusBadge
                      status={service.status}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      {service.value}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                AI request volume
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Requests processed over the last seven days
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
              Last 7 days
            </div>
          </div>

          <div className="mt-8 flex h-56 items-end gap-3">
            {[42, 58, 45, 72, 63, 88, 76].map(
              (height, index) => (
                <div
                  key={`${height}-${index}`}
                  className="flex flex-1 flex-col items-center gap-3"
                >
                  <div className="flex h-44 w-full items-end rounded-xl bg-slate-50 px-1.5 pt-2">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-violet-700 to-violet-400 transition hover:from-violet-800 hover:to-violet-500"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {
                      [
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun",
                      ][index]
                    }
                  </span>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
            <div>
              <h2 className="font-semibold text-slate-950">
                Recent activity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest workspace events
              </p>
            </div>

            <Clock3 className="h-5 w-5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 px-5">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.title}
                  className="flex gap-3 py-4"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activity.iconClassName}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {activity.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {activity.description}
                    </p>
                  </div>

                  <p className="shrink-0 text-[11px] text-slate-400">
                    {activity.time}
                  </p>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}