"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CircleAlert,
  Database,
  FileStack,
  FolderKanban,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
} from "next/navigation";
import {
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import {
  CreateProjectDialog,
  type CreateProjectFormValues,
} from "@/components/projects/create-project-dialog";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  getOrganization,
} from "@/services/organizations";
import {
  createProject,
  getOrganizationProjects,
} from "@/services/projects";
import type {
  Project,
} from "@/types/project";

function formatDate(
  dateValue: string,
): string {
  const date = new Date(
    dateValue,
  );

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
      word.charAt(0).toUpperCase(),
    )
    .join("");
}

function ProjectSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="h-9 w-9 rounded-xl bg-slate-100" />
      </div>

      <div className="mt-5 h-5 w-44 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
    </article>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({
  project,
}: ProjectCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-100/80 blur-3xl transition group-hover:bg-violet-200/80" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-700/20">
          {getInitials(
            project.name,
          ) || "PR"}
        </div>

        <button
          type="button"
          aria-label={`More options for ${project.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mt-5">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
            {project.name}
          </h2>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium capitalize text-emerald-700">
            <ShieldCheck className="h-3 w-3" />

            {project.status ??
              "active"}
          </span>
        </div>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
          {project.description ||
            "Enterprise AI project with isolated knowledge bases, documents and conversations."}
        </p>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Knowledge bases
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Database className="h-4 w-4 text-violet-600" />

            {project.knowledge_base_count ??
              0}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Documents
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <FileStack className="h-4 w-4 text-violet-600" />

            {project.document_count ??
              0}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />

          Created{" "}
          {formatDate(
            project.created_at,
          )}
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
        >
          Open project

          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export default function OrganizationDetailsPage() {
  const params = useParams<{
    organizationId: string;
  }>();

  const organizationId =
    params.organizationId;

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

  const organizationQuery =
    useQuery({
      queryKey: [
        "organization",
        organizationId,
      ],

      queryFn: () =>
        getOrganization(
          organizationId,
        ),

      enabled:
        Boolean(
          organizationId,
        ),
    });

  const projectsQuery =
    useQuery({
      queryKey: [
        "organization-projects",
        organizationId,
      ],

      queryFn: () =>
        getOrganizationProjects(
          organizationId,
        ),

      enabled:
        Boolean(
          organizationId,
        ),
    });

  const createMutation =
    useMutation({
      mutationFn: (
        values: CreateProjectFormValues,
      ) =>
        createProject(
          organizationId,
          {
            name: values.name.trim(),
            description:
              values.description
                ?.trim() ||
              undefined,
          },
        ),

      onSuccess:
        async (
          project,
        ) => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "organization-projects",
                organizationId,
              ],
            },
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "organizations",
              ],
            },
          );

          setCreateDialogOpen(
            false,
          );

          toast.success(
            `${project.name} was created successfully.`,
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

  const organization =
    organizationQuery.data;

  const projects = useMemo(
  () =>
    projectsQuery.data
      ?.items ?? [],
  [
    projectsQuery.data
      ?.items,
  ],
);

  const filteredProjects =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      if (!normalizedQuery) {
        return projects;
      }

      return projects.filter(
        (project) =>
          project.name
            .toLowerCase()
            .includes(
              normalizedQuery,
            ) ||
          (
            project.description ??
            ""
          )
            .toLowerCase()
            .includes(
              normalizedQuery,
            ),
      );
    }, [
      projects,
      searchQuery,
    ]);

  const hasError =
    organizationQuery.isError ||
    projectsQuery.isError;

  const error =
    organizationQuery.error ??
    projectsQuery.error;

  const isLoading =
    organizationQuery.isLoading ||
    projectsQuery.isLoading;

  const isFetching =
    organizationQuery.isFetching ||
    projectsQuery.isFetching;

  async function handleRefresh(): Promise<void> {
    await Promise.all([
      organizationQuery.refetch(),
      projectsQuery.refetch(),
    ]);
  }

  async function handleCreateProject(
    values: CreateProjectFormValues,
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
            href="/organizations"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organizations
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-violet-700/20">
                {organization
                  ? getInitials(
                      organization.name,
                    )
                  : "OR"}
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Organization workspace
                </div>

                <h1 className="truncate text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {organization?.name ??
                    "Organization"}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {organization?.description ||
                    "Manage projects, members and enterprise AI resources inside this organization."}
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
              Create project
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Projects
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {projectsQuery.data
                ?.total ?? 0}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Active AI initiatives
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Knowledge bases
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {projects.reduce(
                (
                  total,
                  project,
                ) =>
                  total +
                  (
                    project.knowledge_base_count ??
                    0
                  ),
                0,
              )}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Across all projects
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Members
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {organization?.member_count ??
                1}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Workspace collaborators
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Status
            </p>

            <p className="mt-2 text-3xl font-semibold capitalize tracking-tight text-slate-950">
              {organization?.status ??
                "Active"}
            </p>

            <p className="mt-2 text-xs text-emerald-600">
              Ready for AI workloads
            </p>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.55fr_0.75fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Organization details
                </h2>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Slug
                    </p>

                    <p className="mt-1 font-medium text-slate-700">
                      {organization?.slug ??
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Created
                    </p>

                    <p className="mt-1 font-medium text-slate-700">
                      {organization
                        ? formatDate(
                            organization.created_at,
                          )
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Organization ID
                    </p>

                    <p className="mt-1 truncate font-mono text-xs text-slate-600">
                      {organization?.id ??
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Your role
                    </p>

                    <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Owner
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Collaboration
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Invite developers, admins and viewers to work
                  across projects.
                </p>

                <button
                  type="button"
                  className="mt-4 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
                >
                  Manage members
                </button>
              </div>
            </div>
          </article>
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
              placeholder="Search projects..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <button
            type="button"
            disabled={isFetching}
            onClick={() =>
              void handleRefresh()
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
                <ProjectSkeleton
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
              Organization data could not be loaded
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-red-700">
              {getApiErrorMessage(
                error,
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                void handleRefresh()
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
          projects.length === 0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <FolderKanban className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                Create your first project
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Projects organize knowledge bases,
                documents and AI conversations into
                isolated business use cases.
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
                Create project
              </button>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          projects.length > 0 &&
          filteredProjects.length ===
            0 && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <Search className="h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No matching projects
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try another project name or
                description.
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
          filteredProjects.length >
            0 && (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map(
                (project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                  />
                ),
              )}
            </section>
          )}
      </div>

      <CreateProjectDialog
        open={createDialogOpen}
        isSubmitting={
          createMutation.isPending
        }
        organizationName={
          organization?.name
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
          handleCreateProject
        }
      />
    </AppShell>
  );
}