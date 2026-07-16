"use client";

import {
  LoaderCircle,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import type {
  OrganizationMember,
} from "@/types/member";

interface RemoveMemberDialogProps {
  open: boolean;
  member: OrganizationMember | null;
  isDeleting?: boolean;

  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function RemoveMemberDialog({
  open,
  member,
  isDeleting = false,
  onClose,
  onConfirm,
}: RemoveMemberDialogProps) {
  if (!open || !member) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <TriangleAlert className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Remove member
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                This action removes their organization access.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-950">
              {member.user.full_name}
            </p>

            <p className="mt-1 text-sm text-red-700">
              {member.user.email}
            </p>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-600">
            The member will lose access to organization projects, knowledge bases, documents, conversations and AI resources.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                void onConfirm();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {isDeleting
                ? "Removing..."
                : "Remove member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}