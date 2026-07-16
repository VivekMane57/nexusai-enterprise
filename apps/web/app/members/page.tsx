"use client";

import {
  CheckCircle2,
  CircleAlert,
  Crown,
  LoaderCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
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
  EditMemberDialog,
} from "@/components/members/edit-member-dialog";
import {
  InviteMemberDialog,
} from "@/components/members/invite-member-dialog";
import {
  RemoveMemberDialog,
} from "@/components/members/remove-member-dialog";
import {
  AppShell,
} from "@/components/layout/app-shell";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  addOrganizationMember,
  getMemberOrganizations,
  getOrganizationMembers,
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/services/members";
import type {
  MembershipStatus,
  OrganizationMember,
  OrganizationMemberCreateRequest,
  OrganizationMemberUpdateRequest,
  OrganizationRole,
} from "@/types/member";

type RoleFilter =
  | "all"
  | OrganizationRole;

type StatusFilter =
  | "all"
  | MembershipStatus;

function formatDate(
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
    },
  ).format(date);
}

function getInitials(
  fullName: string,
): string {
  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase(),
    )
    .join("");
}

function getRoleLabel(
  role: OrganizationRole,
): string {
  const labels: Record<
    OrganizationRole,
    string
  > = {
    owner: "Owner",
    admin: "Admin",
    ai_engineer: "AI Engineer",
    reviewer: "Reviewer",
    viewer: "Viewer",
  };

  return labels[role];
}

function RoleBadge({
  role,
}: {
  role: OrganizationRole;
}) {
  const classes: Record<
    OrganizationRole,
    string
  > = {
    owner:
      "border-amber-200 bg-amber-50 text-amber-700",
    admin:
      "border-violet-200 bg-violet-50 text-violet-700",
    ai_engineer:
      "border-blue-200 bg-blue-50 text-blue-700",
    reviewer:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    viewer:
      "border-slate-200 bg-slate-50 text-slate-600",
  };

  const Icon =
    role === "owner"
      ? Crown
      : role === "admin"
        ? ShieldCheck
        : Shield;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${classes[role]}`}
    >
      <Icon className="h-3.5 w-3.5" />

      {getRoleLabel(role)}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: MembershipStatus;
}) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
      <CircleAlert className="h-3.5 w-3.5" />
      Suspended
    </span>
  );
}

export default function MembersPage() {
  const queryClient =
    useQueryClient();

  const [
    selectedOrganizationId,
    setSelectedOrganizationId,
  ] = useState<
    string | undefined
  >();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState<RoleFilter>(
      "all",
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    inviteDialogOpen,
    setInviteDialogOpen,
  ] = useState(false);

  const [
    memberToEdit,
    setMemberToEdit,
  ] =
    useState<OrganizationMember | null>(
      null,
    );

  const [
    memberToRemove,
    setMemberToRemove,
  ] =
    useState<OrganizationMember | null>(
      null,
    );

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<
    string | null
  >(null);

  const organizationsQuery =
    useQuery({
      queryKey: [
        "member-organizations",
      ],

      queryFn:
        getMemberOrganizations,
    });

  const organizations =
    organizationsQuery.data ??
    [];

  const activeOrganizationId =
    selectedOrganizationId ??
    organizations[0]?.id;

  const activeOrganization =
    organizations.find(
      (organization) =>
        organization.id ===
        activeOrganizationId,
    );

  const membersQuery =
    useQuery({
      queryKey: [
        "organization-members",
        activeOrganizationId,
      ],

      queryFn: () =>
        getOrganizationMembers(
          activeOrganizationId!,
        ),

      enabled: Boolean(
        activeOrganizationId,
      ),
    });

  const members =
    useMemo(
      () =>
        membersQuery.data ??
        [],
      [membersQuery.data],
    );

  const inviteMutation =
    useMutation({
      mutationFn: (
        payload: OrganizationMemberCreateRequest,
      ) =>
        addOrganizationMember(
          activeOrganizationId!,
          payload,
        ),

      onSuccess:
        async (
          member,
        ) => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "organization-members",
                activeOrganizationId,
              ],
            },
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "member-organizations",
              ],
            },
          );

          setInviteDialogOpen(
            false,
          );

          toast.success(
            `${member.user.full_name} was added to the organization.`,
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

  const updateMutation =
    useMutation({
      mutationFn: ({
        membershipId,
        payload,
      }: {
        membershipId: string;
        payload: OrganizationMemberUpdateRequest;
      }) =>
        updateOrganizationMember(
          activeOrganizationId!,
          membershipId,
          payload,
        ),

      onSuccess:
        async (
          member,
        ) => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "organization-members",
                activeOrganizationId,
              ],
            },
          );

          setMemberToEdit(null);

          toast.success(
            `${member.user.full_name}'s access was updated.`,
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

  const removeMutation =
    useMutation({
      mutationFn: (
        membershipId: string,
      ) =>
        removeOrganizationMember(
          activeOrganizationId!,
          membershipId,
        ),

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          {
            queryKey: [
              "organization-members",
              activeOrganizationId,
            ],
          },
        );

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "member-organizations",
            ],
          },
        );

        setMemberToRemove(null);

        toast.success(
          "Member removed from organization.",
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

  const filteredMembers =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      return members.filter(
        (member) => {
          const matchesSearch =
            !normalizedQuery ||
            member.user.full_name
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            member.user.email
              .toLowerCase()
              .includes(
                normalizedQuery,
              );

          const matchesRole =
            roleFilter === "all" ||
            member.role ===
              roleFilter;

          const matchesStatus =
            statusFilter ===
              "all" ||
            member.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );
        },
      );
    }, [
      members,
      searchQuery,
      roleFilter,
      statusFilter,
    ]);

  const ownerCount =
    members.filter(
      (member) =>
        member.role === "owner",
    ).length;

  const adminCount =
    members.filter(
      (member) =>
        member.role === "admin",
    ).length;

  const activeCount =
    members.filter(
      (member) =>
        member.status ===
        "active",
    ).length;

  const suspendedCount =
    members.filter(
      (member) =>
        member.status ===
        "suspended",
    ).length;

  const isLoading =
    organizationsQuery.isLoading ||
    (
      Boolean(
        activeOrganizationId,
      ) &&
      membersQuery.isLoading
    );

  const hasError =
    organizationsQuery.isError ||
    membersQuery.isError;

  const error =
    organizationsQuery.error ??
    membersQuery.error;

  async function refreshAll(): Promise<void> {
    try {
      await Promise.all([
        organizationsQuery.refetch(),
        activeOrganizationId
          ? membersQuery.refetch()
          : Promise.resolve(),
      ]);

      toast.success(
        "Member data refreshed.",
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

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <Users className="h-3.5 w-3.5" />
              Organization access control
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Members
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Add users, assign enterprise roles and control access across organization AI resources.
            </p>
          </div>

          <button
            type="button"
            disabled={
              !activeOrganizationId
            }
            onClick={() =>
              setInviteDialogOpen(
                true,
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Add member
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label
            htmlFor="member-organization"
            className="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Active organization
          </label>

          <select
            id="member-organization"
            value={
              activeOrganizationId ??
              ""
            }
            disabled={
              organizationsQuery.isLoading ||
              organizations.length ===
                0
            }
            onChange={(event) => {
              setSelectedOrganizationId(
                event.target.value,
              );

              setSearchQuery("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
            className="mt-2 h-12 w-full max-w-xl rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
          >
            {organizations.length ===
            0 ? (
              <option value="">
                No organizations available
              </option>
            ) : (
              organizations.map(
                (
                  organization,
                ) => (
                  <option
                    key={
                      organization.id
                    }
                    value={
                      organization.id
                    }
                  >
                    {
                      organization.name
                    }
                  </option>
                ),
              )
            )}
          </select>

          {activeOrganization && (
            <p className="mt-2 text-xs text-slate-400">
              {activeOrganization.description ||
                "Manage members for this organization workspace."}
            </p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total members
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {members.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Organization users
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active members
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {activeCount}
            </p>

            <p className="mt-2 text-xs text-emerald-600">
              Enabled workspace access
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Owners & admins
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {ownerCount +
                adminCount}
            </p>

            <p className="mt-2 text-xs text-violet-600">
              Workspace managers
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Suspended
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {suspendedCount}
            </p>

            <p className="mt-2 text-xs text-red-500">
              Restricted accounts
            </p>
          </article>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
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
              placeholder="Search name or email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target
                    .value as RoleFilter,
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            >
              <option value="all">
                All roles
              </option>
              <option value="owner">
                Owner
              </option>
              <option value="admin">
                Admin
              </option>
              <option value="ai_engineer">
                AI Engineer
              </option>
              <option value="reviewer">
                Reviewer
              </option>
              <option value="viewer">
                Viewer
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            >
              <option value="all">
                All statuses
              </option>
              <option value="active">
                Active
              </option>
              <option value="suspended">
                Suspended
              </option>
            </select>

            <button
              type="button"
              disabled={
                organizationsQuery.isFetching ||
                membersQuery.isFetching
              }
              onClick={() => {
                void refreshAll();
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {organizationsQuery.isFetching ||
              membersQuery.isFetching ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>
          </div>
        </section>

        {isLoading && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-violet-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading organization members...
            </p>
          </section>
        )}

        {!isLoading &&
          hasError && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center">
              <CircleAlert className="h-10 w-10 text-red-700" />

              <h2 className="mt-4 text-lg font-semibold text-red-950">
                Members could not be loaded
              </h2>

              <p className="mt-2 max-w-md text-sm text-red-700">
                {getApiErrorMessage(
                  error,
                )}
              </p>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          organizations.length ===
            0 && (
            <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <Users className="h-12 w-12 text-violet-600" />

              <h2 className="mt-5 text-xl font-semibold text-slate-950">
                No organizations available
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create an organization before adding workspace members.
              </p>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          organizations.length >
            0 &&
          members.length === 0 && (
            <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <UserPlus className="h-12 w-12 text-violet-600" />

              <h2 className="mt-5 text-xl font-semibold text-slate-950">
                Add your first member
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Invite registered users to collaborate across enterprise AI projects.
              </p>

              <button
                type="button"
                onClick={() =>
                  setInviteDialogOpen(
                    true,
                  )
                }
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800"
              >
                <UserPlus className="h-4 w-4" />
                Add member
              </button>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          members.length > 0 &&
          filteredMembers.length ===
            0 && (
            <section className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <Search className="h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No matching members
              </h2>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-violet-700"
              >
                Clear filters
              </button>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          filteredMembers.length >
            0 && (
            <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-4 font-semibold">
                        Member
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Role
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Joined
                      </th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMembers.map(
                      (member) => {
                        const isOwner =
                          member.role ===
                          "owner";

                        const isMenuOpen =
                          openMenuId ===
                          member.id;

                        return (
                          <tr
                            key={
                              member.id
                            }
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700">
                                  {getInitials(
                                    member.user
                                      .full_name,
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {
                                      member.user
                                        .full_name
                                    }
                                  </p>

                                  <p className="mt-1 truncate text-xs text-slate-400">
                                    {
                                      member.user
                                        .email
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <RoleBadge
                                role={
                                  member.role
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge
                                status={
                                  member.status
                                }
                              />
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-500">
                              {formatDate(
                                member.joined_at,
                              )}
                            </td>

                            <td className="relative px-5 py-4 text-right">
                              {isOwner ? (
                                <span className="text-xs font-medium text-slate-400">
                                  Protected
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMenuId(
                                        isMenuOpen
                                          ? null
                                          : member.id,
                                      )
                                    }
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <MoreHorizontal className="h-5 w-5" />
                                  </button>

                                  {isMenuOpen && (
                                    <div className="absolute right-5 top-14 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(
                                            null,
                                          );

                                          setMemberToEdit(
                                            member,
                                          );
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                        <UserCog className="h-4 w-4" />
                                        Manage access
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(
                                            null,
                                          );

                                          setMemberToRemove(
                                            member,
                                          );
                                        }}
                                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Remove member
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
      </div>

      <InviteMemberDialog
        open={inviteDialogOpen}
        isSubmitting={
          inviteMutation.isPending
        }
        onClose={() => {
          if (
            !inviteMutation.isPending
          ) {
            setInviteDialogOpen(
              false,
            );
          }
        }}
        onSubmit={async (
          payload,
        ) => {
          await inviteMutation.mutateAsync(
            payload,
          );
        }}
      />

      <EditMemberDialog
        open={
          memberToEdit !== null
        }
        member={memberToEdit}
        isSubmitting={
          updateMutation.isPending
        }
        onClose={() => {
          if (
            !updateMutation.isPending
          ) {
            setMemberToEdit(null);
          }
        }}
        onSubmit={async (
          payload,
        ) => {
          if (!memberToEdit) {
            return;
          }

          await updateMutation.mutateAsync(
            {
              membershipId:
                memberToEdit.id,
              payload,
            },
          );
        }}
      />

      <RemoveMemberDialog
        open={
          memberToRemove !== null
        }
        member={memberToRemove}
        isDeleting={
          removeMutation.isPending
        }
        onClose={() => {
          if (
            !removeMutation.isPending
          ) {
            setMemberToRemove(null);
          }
        }}
        onConfirm={async () => {
          if (!memberToRemove) {
            return;
          }

          await removeMutation.mutateAsync(
            memberToRemove.id,
          );
        }}
      />
    </AppShell>
  );
}