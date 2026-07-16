"use client";

import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";

interface DeleteDocumentDialogProps {
  open: boolean;
  filename?: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteDocumentDialog({
  open,
  filename,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteDocumentDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close delete dialog"
        disabled={isDeleting}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-document-title"
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <button
            type="button"
            aria-label="Close"
            disabled={isDeleting}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2
          id="delete-document-title"
          className="mt-5 text-xl font-semibold tracking-tight text-slate-950"
        >
          Delete document?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This will permanently remove{" "}
          <span className="font-semibold text-slate-700">
            {filename ?? "this document"}
          </span>
          , its indexed chunks, vector data and stored file.
        </p>

        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-900">
            This action cannot be undone.
          </p>

          <p className="mt-1 text-xs leading-5 text-red-700">
            Questions that depend on this document may no longer
            return the same answers.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void onConfirm()}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            {isDeleting ? "Deleting..." : "Delete document"}
          </button>
        </div>
      </div>
    </div>
  );
}
