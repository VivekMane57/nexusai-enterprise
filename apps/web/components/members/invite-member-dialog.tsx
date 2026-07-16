"use client";

import {
  LoaderCircle,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import {
  FormEvent,
  useState,
} from "react";

import type {
  OrganizationMemberCreateRequest,
  OrganizationRole,
} from "@/types/member";

interface InviteMemberDialogProps {
  open: boolean;
  isSubmitting?: boolean;

  onClose: () => void;

  onSubmit: (
    payload: OrganizationMemberCreateRequest,
  ) => Promise<void>;
}

const roleOptions: Array<{
  value: OrganizationRole;
  label: string;
  description: string;
}> = [
  {
    value: "admin",
    label: "Admin",
    description:
      "Manage workspace members, projects and AI resources.",
  },
  {
    value: "ai_engineer",
    label: "AI Engineer",
    description:
      "Build and manage knowledge bases, agents and evaluations.",
  },
  {
    value: "reviewer",
    label: "Reviewer",
    description:
      "Review AI outputs, evaluations and document results.",
  },
  {
    value: "viewer",
    label: "Viewer",
    description:
      "Read-only access to available workspace resources.",
  },
];

export function InviteMemberDialog({
  open,
  isSubmitting = false,
  onClose,
  onSubmit,
}: InviteMemberDialogProps) {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    role,
    setRole,
  ] =
    useState<OrganizationRole>(
      "viewer",
    );

  const [
    validationError,
    setValidationError,
  ] =
    useState<string | null>(
      null,
    );

  if (!open) {
    return null;
  }

  function closeDialog(): void {
    if (isSubmitting) {
      return;
    }

    setEmail("");
    setRole("viewer");
    setValidationError(null);

    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setValidationError(
        "Enter the member email address.",
      );

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setValidationError(
        "Enter a valid email address.",
      );

      return;
    }

    setValidationError(null);

    await onSubmit({
      email: normalizedEmail,
      role,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <UserPlus className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                Workspace access
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Add organization member
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                The user must already have a NexusAI account registered with this email.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            disabled={isSubmitting}
            onClick={closeDialog}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-5 px-6 py-6"
        >
          <div>
            <label
              htmlFor="member-email"
              className="text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="member-email"
                type="email"
                autoFocus
                value={email}
                disabled={isSubmitting}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="member@example.com"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="member-role"
              className="text-sm font-medium text-slate-700"
            >
              Organization role
            </label>

            <select
              id="member-role"
              value={role}
              disabled={isSubmitting}
              onChange={(event) =>
                setRole(
                  event.target
                    .value as OrganizationRole,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            >
              {roleOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-3">
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />

                <p className="text-xs leading-5 text-violet-700">
                  {
                    roleOptions.find(
                      (option) =>
                        option.value ===
                        role,
                    )?.description
                  }
                </p>
              </div>
            </div>
          </div>

          {validationError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={closeDialog}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}

              {isSubmitting
                ? "Adding..."
                : "Add member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}