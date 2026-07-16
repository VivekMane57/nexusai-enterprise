"use client";

import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CircleAlert,
  Database,
  FileStack,
  FolderKanban,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import { AppShell } from "@/components/layout/app-shell";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  getProjectKnowledgeBases,
} from "@/services/knowledge-bases";
import {
  getOrganizations,
} from "@/services/organizations";
import {
  getOrganizationProjects,
} from "@/services/projects";
import type {
  KnowledgeBase,
} from "@/types/knowledge-base";
import type {
  Organization,
} from "@/types/organization";
import type {
  Project,
} from "@/types/project";

interface ProjectWithOrganization
  extends Project {
  organization_name: string;
}

interface KnowledgeBaseWithContext
  extends KnowledgeBase {
  project_name: string;
  organization_id: string;
  organization_name: string;
}

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

function getInitials(
  value: string,
): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) =>
      word
        .charAt(0)
        .toUpperCase(),
    )
    .join("");
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

      <div className="mt-5 h-10 rounded-xl bg-slate-100" />
    </article>
  );
}

function KnowledgeBaseCard({
  knowledgeBase,
}: {
  knowledgeBase:
    KnowledgeBaseWithContext;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-100/80 blur-3xl transition group-hover:bg-violet-200/80" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-700/20">
          {getInitials(
            knowledgeBase.name,
          ) || "KB"}
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />

          {knowledgeBase.status ??
            "active"}
        </span>
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

      <div className="relative mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            Organization
          </span>

          <span className="truncate font-medium text-slate-700">
            {
              knowledgeBase.organization_name
            }
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            Project
          </span>

          <span className="truncate font-medium text-slate-700">
            {
              knowledgeBase.project_name
            }
          </span>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
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

export default function KnowledgeBasesPage() {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState("all");

  const organizationsQuery =
    useQuery({
      queryKey: [
        "organizations",
      ],
      queryFn:
        getOrganizations,
    });

  const organizations =
    useMemo(
      () =>
        organizationsQuery.data
          ?.items ?? [],
      [
        organizationsQuery.data
          ?.items,
      ],
    );

  const projectQueries =
    useQueries({
      queries:
        organizations.map(
          (
            organization:
              Organization,
          ) => ({
            queryKey: [
              "organization-projects",
              organization.id,
            ],
            queryFn: () =>
              getOrganizationProjects(
                organization.id,
              ),
            enabled:
              Boolean(
                organization.id,
              ),
          }),
        ),
    });

  const projects =
    useMemo(() => {
      const result:
        ProjectWithOrganization[] =
        [];

      projectQueries.forEach(
        (
          query,
          index,
        ) => {
          const organization =
            organizations[index];

          if (!organization) {
            return;
          }

          const items =
            query.data?.items ??
            [];

          items.forEach(
            (
              project:
                Project,
            ) => {
              result.push({
                ...project,
                organization_name:
                  organization.name,
              });
            },
          );
        },
      );

      return result;
    }, [
      organizations,
      projectQueries,
    ]);

  const knowledgeBaseQueries =
    useQueries({
      queries:
        projects.map(
          (project) => ({
            queryKey: [
              "project-knowledge-bases",
              project.id,
            ],
            queryFn: () =>
              getProjectKnowledgeBases(
                project.id,
              ),
            enabled:
              Boolean(
                project.id,
              ),
          }),
        ),
    });

  const knowledgeBases =
    useMemo(() => {
      const result:
        KnowledgeBaseWithContext[] =
        [];

      knowledgeBaseQueries.forEach(
        (
          query,
          index,
        ) => {
          const project =
            projects[index];

          if (!project) {
            return;
          }

          const items =
            query.data?.items ??
            [];

          items.forEach(
            (
              knowledgeBase:
                KnowledgeBase,
            ) => {
              result.push({
                ...knowledgeBase,
                project_name:
                  project.name,
                organization_id:
                  project.organization_id,
                organization_name:
                  project.organization_name,
              });
            },
          );
        },
      );

      return result;
    }, [
      knowledgeBaseQueries,
      projects,
    ]);

  const filteredKnowledgeBases =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      return knowledgeBases.filter(
        (
          knowledgeBase,
        ) => {
          const matchesProject =
            selectedProjectId ===
              "all" ||
            knowledgeBase.project_id ===
              selectedProjectId;

          const matchesSearch =
            !normalizedQuery ||
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
              ) ||
            knowledgeBase.project_name
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            knowledgeBase.organization_name
              .toLowerCase()
              .includes(
                normalizedQuery,
              );

          return (
            matchesProject &&
            matchesSearch
          );
        },
      );
    }, [
      knowledgeBases,
      searchQuery,
      selectedProjectId,
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

  const projectQueriesLoading =
    projectQueries.some(
      (query) =>
        query.isLoading,
    );

  const knowledgeBaseQueriesLoading =
    knowledgeBaseQueries.some(
      (query) =>
        query.isLoading,
    );

  const isLoading =
    organizationsQuery.isLoading ||
    projectQueriesLoading ||
    knowledgeBaseQueriesLoading;

  const projectError =
    projectQueries.find(
      (query) =>
        query.isError,
    )?.error;

  const knowledgeBaseError =
    knowledgeBaseQueries.find(
      (query) =>
        query.isError,
    )?.error;

  const error =
    organizationsQuery.error ??
    projectError ??
    knowledgeBaseError;

  const hasError =
    organizationsQuery.isError ||
    projectQueries.some(
      (query) =>
        query.isError,
    ) ||
    knowledgeBaseQueries.some(
      (query) =>
        query.isError,
    );

  const isFetching =
    organizationsQuery.isFetching ||
    projectQueries.some(
      (query) =>
        query.isFetching,
    ) ||
    knowledgeBaseQueries.some(
      (query) =>
        query.isFetching,
    );

  async function refreshAll(): Promise<void> {
    await organizationsQuery.refetch();

    await Promise.all(
      projectQueries.map(
        (query) =>
          query.refetch(),
      ),
    );

    await Promise.all(
      knowledgeBaseQueries.map(
        (query) =>
          query.refetch(),
      ),
    );
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Enterprise RAG sources
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Knowledge Bases
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage retrieval-ready document
              collections across organizations
              and AI projects.
            </p>
          </div>

          {projects.length > 0 ? (
            <Link
              href={`/projects/${projects[0].id}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800"
            >
              <Plus className="h-4 w-4" />
              Create knowledge base
            </Link>
          ) : (
            <Link
              href="/organizations"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800"
            >
              <FolderKanban className="h-4 w-4" />
              Create project first
            </Link>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Knowledge bases
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {knowledgeBases.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Across all projects
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Projects
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {projects.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              AI project workspaces
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
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
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
              placeholder="Search knowledge bases, projects or organizations..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={
                selectedProjectId
              }
              onChange={(event) =>
                setSelectedProjectId(
                  event.target.value,
                )
              }
              className="h-11 min-w-52 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            >
              <option value="all">
                All projects
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={project.id}
                    value={
                      project.id
                    }
                  >
                    {
                      project.name
                    }
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              disabled={isFetching}
              onClick={() =>
                void refreshAll()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetching ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>
          </div>
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
              Knowledge bases could not be loaded
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
          organizations.length ===
            0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Database className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                Create an organization first
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Knowledge bases belong to
                projects, and projects belong to
                organizations.
              </p>

              <Link
                href="/organizations"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                Open organizations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          organizations.length >
            0 &&
          projects.length === 0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <FolderKanban className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                Create your first project
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Open your organization and
                create an AI project before
                adding a knowledge base.
              </p>

              <Link
                href={`/organizations/${organizations[0].id}`}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                Open organization
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          projects.length > 0 &&
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
                Open a project and create a
                retrieval-ready workspace for
                documents, embeddings and
                grounded AI chat.
              </p>

              <Link
                href={`/projects/${projects[0].id}`}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                Open project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          knowledgeBases.length > 0 &&
          filteredKnowledgeBases.length ===
            0 && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <Search className="h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No matching knowledge bases
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Change your search text or
                project filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedProjectId(
                    "all",
                  );
                }}
                className="mt-4 text-sm font-semibold text-violet-700"
              >
                Clear filters
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
    </AppShell>
  );
}