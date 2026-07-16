"use client";

import {
  LoaderCircle,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import type {
  MembershipStatus,
  OrganizationMember,
  OrganizationMemberUpdateRequest,
  OrganizationRole,
} from "@/types/member";

interface EditMemberDialogProps {
  open: boolean;
  member: OrganizationMember | null;
  isSubmitting?: boolean;

  onClose: () => void;

  onSubmit: (
    payload: OrganizationMemberUpdateRequest,
  ) => Promise<void>;
}

const editableRoles: Array<{
  value: OrganizationRole;
  label: string;
}> = [
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "ai_engineer",
    label: "AI Engineer",
  },
  {
    value: "reviewer",
    label: "Reviewer",
  },
  {
    value: "viewer",
    label: "Viewer",
  },
];

interface EditMemberDialogContentProps {
  member: OrganizationMember;
  isSubmitting: boolean;

  onClose: () => void;

  onSubmit: (
    payload: OrganizationMemberUpdateRequest,
  ) => Promise<void>;
}

function EditMemberDialogContent({
  member,
  isSubmitting,
  onClose,
  onSubmit,
}: EditMemberDialogContentProps) {
  const [
    role,
    setRole,
  ] =
    useState<OrganizationRole>(
      member.role,
    );

  const [
    membershipStatus,
    setMembershipStatus,
  ] =
    useState<MembershipStatus>(
      member.status,
    );

  const isOwner =
    member.role === "owner";

  const hasChanges =
    role !== member.role ||
    membershipStatus !==
      member.status;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      isOwner ||
      !hasChanges ||
      isSubmitting
    ) {
      return;
    }

    await onSubmit({
      role,
      status:
        membershipStatus,
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
      aria-labelledby="edit-member-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
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
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <UserCog className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="edit-member-dialog-title"
                className="text-xl font-semibold text-slate-950"
              >
                Manage member
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {
                  member.user
                    .full_name
                }
                {" · "}
                {
                  member.user
                    .email
                }
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="space-y-5 px-6 py-6"
        >
          {isOwner && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                <p className="text-sm leading-6 text-amber-800">
                  The organization owner role cannot be changed or suspended from this screen.
                </p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="edit-member-role"
              className="text-sm font-medium text-slate-700"
            >
              Role
            </label>

            <select
              id="edit-member-role"
              value={role}
              disabled={
                isSubmitting ||
                isOwner
              }
              onChange={(
                event,
              ) =>
                setRole(
                  event.target
                    .value as OrganizationRole,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {isOwner && (
                <option value="owner">
                  Owner
                </option>
              )}

              {editableRoles.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-member-status"
              className="text-sm font-medium text-slate-700"
            >
              Membership status
            </label>

            <select
              id="edit-member-status"
              value={
                membershipStatus
              }
              disabled={
                isSubmitting ||
                isOwner
              }
              onChange={(
                event,
              ) =>
                setMembershipStatus(
                  event.target
                    .value as MembershipStatus,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="active">
                Active
              </option>

              <option value="suspended">
                Suspended
              </option>
            </select>
          </div>

          {!isOwner &&
            !hasChanges && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No changes selected.
              </p>
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
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isOwner ||
                !hasChanges
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}

              {isSubmitting
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditMemberDialog({
  open,
  member,
  isSubmitting = false,
  onClose,
  onSubmit,
}: EditMemberDialogProps) {
  if (!open || !member) {
    return null;
  }

  return (
    <EditMemberDialogContent
      key={member.id}
      member={member}
      isSubmitting={
        isSubmitting
      }
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}