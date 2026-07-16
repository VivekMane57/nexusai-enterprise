"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Database,
  FileStack,
  FolderKanban,
  LoaderCircle,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import {
  CreateKnowledgeBaseDialog,
  type CreateKnowledgeBaseFormValues,
} from "@/components/knowledge-bases/create-knowledge-base-dialog";
import { AppShell } from "@/components/layout/app-shell";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  createKnowledgeBase,
  getProjectKnowledgeBases,
} from "@/services/knowledge-bases";
import {
  getProject,
} from "@/services/projects";
import type {
  KnowledgeBase,
} from "@/types/knowledge-base";

function formatDate(
  value: string,
): string {
  const date = new Date(value);

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
    },
  ).format(date);
}

function KnowledgeBaseSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="h-7 w-20 rounded-full bg-slate-100" />
      </div>

      <div className="mt-5 h-5 w-44 rounded bg-slate-200" />

      <div className="mt-3 h-4 w-full rounded bg-slate-100" />

      <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
    </article>
  );
}

function KnowledgeBaseStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus =
    status.toLowerCase();

  if (
    normalizedStatus ===
      "failed"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <CircleAlert className="h-3.5 w-3.5" />
        Failed
      </span>
    );
  }

  if (
    normalizedStatus ===
      "processing"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        Processing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Active
    </span>
  );
}

function KnowledgeBaseCard({
  knowledgeBase,
}: {
  knowledgeBase: KnowledgeBase;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-100/80 blur-3xl transition group-hover:bg-violet-200/80" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <BrainCircuit className="h-6 w-6" />
        </div>

        <div className="flex items-center gap-2">
          <KnowledgeBaseStatusBadge
            status={
              knowledgeBase.status ??
              "active"
            }
          />

          <button
            type="button"
            aria-label={`More options for ${knowledgeBase.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
          {knowledgeBase.name}
        </h2>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
          {knowledgeBase.description ||
            "Retrieval-ready knowledge base for grounded enterprise AI conversations."}
        </p>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Documents
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <FileStack className="h-3.5 w-3.5 text-violet-600" />

            {knowledgeBase.document_count ??
              0}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Chunks
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Database className="h-3.5 w-3.5 text-violet-600" />

            {knowledgeBase.chunk_count ??
              0}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Strategy
          </p>

          <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-700">
            {knowledgeBase.chunking_strategy ??
              "recursive"}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />

          {formatDate(
            knowledgeBase.created_at,
          )}
        </div>

        <Link
          href={`/knowledge-bases/${knowledgeBase.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
        >
          Open

          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export default function ProjectDetailsPage() {
  const params =
    useParams<{
      projectId: string;
    }>();

  const projectId =
    params.projectId;

  const queryClient =
    useQueryClient();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    createDialogOpen,
    setCreateDialogOpen,
  ] = useState(false);

  const projectQuery =
    useQuery({
      queryKey: [
        "project",
        projectId,
      ],

      queryFn: () =>
        getProject(
          projectId,
        ),

      enabled:
        Boolean(
          projectId,
        ),
    });

  const knowledgeBasesQuery =
    useQuery({
      queryKey: [
        "project-knowledge-bases",
        projectId,
      ],

      queryFn: () =>
        getProjectKnowledgeBases(
          projectId,
        ),

      enabled:
        Boolean(
          projectId,
        ),
    });

  const createMutation =
    useMutation({
      mutationFn: (
        values: CreateKnowledgeBaseFormValues,
      ) =>
        createKnowledgeBase(
          projectId,
          {
            name:
              values.name.trim(),

            description:
              values.description
                ?.trim() ||
              undefined,

            chunking_strategy:
              values.chunking_strategy,

            chunk_size:
              values.chunk_size,

            chunk_overlap:
              values.chunk_overlap,
          },
        ),

      onSuccess:
        async (
          knowledgeBase,
        ) => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "project-knowledge-bases",
                projectId,
              ],
            },
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "project",
                projectId,
              ],
            },
          );

          setCreateDialogOpen(
            false,
          );

          toast.success(
            `${knowledgeBase.name} was created successfully.`,
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

  const project =
    projectQuery.data;

  const knowledgeBases =
    useMemo(
      () =>
        knowledgeBasesQuery.data
          ?.items ?? [],
      [
        knowledgeBasesQuery.data
          ?.items,
      ],
    );

  const filteredKnowledgeBases =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      if (!normalizedQuery) {
        return knowledgeBases;
      }

      return knowledgeBases.filter(
        (knowledgeBase) =>
          knowledgeBase.name
            .toLowerCase()
            .includes(
              normalizedQuery,
            ) ||
          (
            knowledgeBase.description ??
            ""
          )
            .toLowerCase()
            .includes(
              normalizedQuery,
            ),
      );
    }, [
      knowledgeBases,
      searchQuery,
    ]);

  const totalDocuments =
    knowledgeBases.reduce(
      (
        total,
        knowledgeBase,
      ) =>
        total +
        (
          knowledgeBase.document_count ??
          0
        ),
      0,
    );

  const totalChunks =
    knowledgeBases.reduce(
      (
        total,
        knowledgeBase,
      ) =>
        total +
        (
          knowledgeBase.chunk_count ??
          0
        ),
      0,
    );

  const isLoading =
    projectQuery.isLoading ||
    knowledgeBasesQuery.isLoading;

  const hasError =
    projectQuery.isError ||
    knowledgeBasesQuery.isError;

  const error =
    projectQuery.error ??
    knowledgeBasesQuery.error;

  const isFetching =
    projectQuery.isFetching ||
    knowledgeBasesQuery.isFetching;

  async function refreshAll(): Promise<void> {
    await Promise.all([
      projectQuery.refetch(),
      knowledgeBasesQuery.refetch(),
    ]);
  }

  async function handleCreateKnowledgeBase(
    values: CreateKnowledgeBaseFormValues,
  ): Promise<void> {
    await createMutation.mutateAsync(
      values,
    );
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section>
          <Link
            href={
              project
                ? `/organizations/${project.organization_id}`
                : "/organizations"
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organization
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-700/20">
                <FolderKanban className="h-7 w-7" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Enterprise AI project
                </div>

                <h1 className="truncate text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {project?.name ??
                    "Project"}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {project?.description ||
                    "Manage retrieval sources, documents and grounded AI conversations."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setCreateDialogOpen(
                  true,
                )
              }
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800"
            >
              <Plus className="h-4 w-4" />
              Create knowledge base
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Knowledge bases
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {knowledgeBasesQuery.data
                ?.total ?? 0}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Retrieval workspaces
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Documents
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {totalDocuments}
            </p>

            <p className="mt-2 text-xs text-emerald-600">
              Uploaded knowledge files
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Indexed chunks
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {totalChunks}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Searchable retrieval units
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Project status
            </p>

            <p className="mt-2 text-3xl font-semibold capitalize tracking-tight text-slate-950">
              {project?.status ??
                "active"}
            </p>

            <p className="mt-2 text-xs text-emerald-600">
              Ready for AI workloads
            </p>
          </article>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BrainCircuit className="h-6 w-6 text-violet-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              Knowledge bases
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Organize documents into isolated
              retrieval-ready collections.
            </p>
          </article>

          <Link
            href="/documents"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <FileStack className="h-6 w-6 text-violet-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              Documents
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Upload and monitor document indexing
              and chunk generation.
            </p>
          </Link>

          <Link
            href="/chat"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <MessageSquareText className="h-6 w-6 text-violet-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              AI Chat
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Ask grounded questions with citations
              and retrieval context.
            </p>
          </Link>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search knowledge bases..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <button
            type="button"
            disabled={isFetching}
            onClick={() =>
              void refreshAll()
            }
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>
        </section>

        {isLoading && (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <KnowledgeBaseSkeleton
                  key={index}
                />
              ),
            )}
          </section>
        )}

        {hasError && (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <CircleAlert className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-red-950">
              Project data could not be loaded
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-red-700">
              {getApiErrorMessage(
                error,
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                void refreshAll()
              }
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        )}

        {!isLoading &&
          !hasError &&
          knowledgeBases.length ===
            0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <BrainCircuit className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                Create your first knowledge base
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Add a retrieval-ready workspace,
                upload documents and power grounded
                enterprise AI conversations.
              </p>

              <button
                type="button"
                onClick={() =>
                  setCreateDialogOpen(
                    true,
                  )
                }
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                <Plus className="h-4 w-4" />
                Create knowledge base
              </button>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          knowledgeBases.length >
            0 &&
          filteredKnowledgeBases.length ===
            0 && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <Search className="h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No matching knowledge bases
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try another name or description.
              </p>

              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                className="mt-4 text-sm font-semibold text-violet-700"
              >
                Clear search
              </button>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          filteredKnowledgeBases.length >
            0 && (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredKnowledgeBases.map(
                (
                  knowledgeBase,
                ) => (
                  <KnowledgeBaseCard
                    key={
                      knowledgeBase.id
                    }
                    knowledgeBase={
                      knowledgeBase
                    }
                  />
                ),
              )}
            </section>
          )}
      </div>

      <CreateKnowledgeBaseDialog
        open={createDialogOpen}
        isSubmitting={
          createMutation.isPending
        }
        projectName={
          project?.name
        }
        onClose={() => {
          if (
            !createMutation.isPending
          ) {
            setCreateDialogOpen(
              false,
            );
          }
        }}
        onSubmit={
          handleCreateKnowledgeBase
        }
      />
    </AppShell>
  );
}