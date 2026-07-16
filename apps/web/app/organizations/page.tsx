"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CircleAlert,
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
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import {
  CreateOrganizationDialog,
  type CreateOrganizationFormValues,
} from "@/components/organizations/create-organization-dialog";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  createOrganization,
  getOrganizations,
} from "@/services/organizations";
import type {
  Organization,
} from "@/types/organization";

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

function getOrganizationInitials(
  name: string,
): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase(),
    )
    .join("");
}

function OrganizationSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="h-8 w-8 rounded-lg bg-slate-100" />
      </div>

      <div className="mt-5 h-5 w-40 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />

      <div className="mt-6 flex gap-5 border-t border-slate-100 pt-4">
        <div className="h-8 w-20 rounded bg-slate-100" />
        <div className="h-8 w-20 rounded bg-slate-100" />
      </div>
    </div>
  );
}

interface OrganizationCardProps {
  organization: Organization;
}

function OrganizationCard({
  organization,
}: OrganizationCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-100/80 blur-3xl transition group-hover:bg-violet-200/80" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-700/20">
          {getOrganizationInitials(
            organization.name,
          ) || "OR"}
        </div>

        <button
          type="button"
          aria-label={`More options for ${organization.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mt-5">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
            {organization.name}
          </h2>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium capitalize text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            {organization.status ??
              "active"}
          </span>
        </div>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
          {organization.description ||
            "Secure enterprise workspace for AI projects, knowledge bases and collaboration."}
        </p>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Projects
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <FolderKanban className="h-4 w-4 text-violet-600" />
            {organization.project_count ??
              0}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Members
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4 text-violet-600" />
            {organization.member_count ??
              1}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          Created{" "}
          {formatDate(
            organization.created_at,
          )}
        </div>

        <Link
          href={`/organizations/${organization.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
        >
          Open
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export default function OrganizationsPage() {
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

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "organizations",
    ],
    queryFn:
      getOrganizations,
  });

  const createMutation =
    useMutation({
      mutationFn:
        createOrganization,

      onSuccess:
        async (
          organization,
        ) => {
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
            `${organization.name} was created successfully.`,
          );
        },

      onError: (mutationError) => {
        toast.error(
          getApiErrorMessage(
            mutationError,
          ),
        );
      },
    });

 const organizations = useMemo(
  () => data?.items ?? [],
  [data?.items],
);

  const filteredOrganizations =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      if (!normalizedQuery) {
        return organizations;
      }

      return organizations.filter(
        (organization) =>
          organization.name
            .toLowerCase()
            .includes(
              normalizedQuery,
            ) ||
          (
            organization.description ??
            ""
          )
            .toLowerCase()
            .includes(
              normalizedQuery,
            ),
      );
    }, [
      organizations,
      searchQuery,
    ]);

  async function handleCreateOrganization(
    values: CreateOrganizationFormValues,
  ): Promise<void> {
    await createMutation.mutateAsync(
      {
        name: values.name.trim(),
        description:
          values.description
            ?.trim() ||
          undefined,
      },
    );
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-tenant workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Organizations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage isolated enterprise
              workspaces, members, projects and
              AI resources from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setCreateDialogOpen(
                true,
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800"
          >
            <Plus className="h-4 w-4" />
            Create organization
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total organizations
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {data?.total ?? 0}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Accessible to your account
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active workspaces
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {
                organizations.filter(
                  (organization) =>
                    organization.status !==
                    "inactive",
                ).length
              }
            </p>

            <p className="mt-2 text-xs text-emerald-600">
              Ready for AI workloads
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Your role
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Owner
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Full workspace management
            </p>
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
              placeholder="Search organizations..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <button
            type="button"
            disabled={isFetching}
            onClick={() =>
              void refetch()
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
                <OrganizationSkeleton
                  key={index}
                />
              ),
            )}
          </section>
        )}

        {isError && (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <CircleAlert className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-red-950">
              Organizations could not be loaded
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-red-700">
              {getApiErrorMessage(
                error,
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                void refetch()
              }
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        )}

        {!isLoading &&
          !isError &&
          organizations.length ===
            0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Building2 className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                Create your first organization
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Organizations isolate members,
                projects, knowledge bases and AI
                workloads into secure enterprise
                workspaces.
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
                Create organization
              </button>
            </section>
          )}

        {!isLoading &&
          !isError &&
          organizations.length >
            0 &&
          filteredOrganizations.length ===
            0 && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <Search className="h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No matching organizations
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try another organization
                name or description.
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
          !isError &&
          filteredOrganizations.length >
            0 && (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrganizations.map(
                (organization) => (
                  <OrganizationCard
                    key={
                      organization.id
                    }
                    organization={
                      organization
                    }
                  />
                ),
              )}
            </section>
          )}
      </div>

      <CreateOrganizationDialog
        open={createDialogOpen}
        isSubmitting={
          createMutation.isPending
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
          handleCreateOrganization
        }
      />
    </AppShell>
  );
}