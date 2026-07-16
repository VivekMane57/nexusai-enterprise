"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createOrganizationSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Organization name must contain at least 2 characters.",
      )
      .max(
        120,
        "Organization name is too long.",
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description cannot exceed 500 characters.",
      )
      .optional(),
  });

export type CreateOrganizationFormValues =
  z.infer<
    typeof createOrganizationSchema
  >;

interface CreateOrganizationDialogProps {
  open: boolean;
  isSubmitting: boolean;

  onClose: () => void;

  onSubmit: (
    values: CreateOrganizationFormValues,
  ) => Promise<void>;
}

export function CreateOrganizationDialog({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateOrganizationDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } =
    useForm<CreateOrganizationFormValues>(
      {
        resolver: zodResolver(
          createOrganizationSchema,
        ),
        defaultValues: {
          name: "",
          description: "",
        },
      },
    );

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ): void {
      if (
        event.key === "Escape" &&
        !isSubmitting
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    isSubmitting,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  async function submitForm(
    values: CreateOrganizationFormValues,
  ): Promise<void> {
    await onSubmit(values);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-organization-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        disabled={isSubmitting}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="relative overflow-hidden border-b border-slate-200 px-6 py-6">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-100 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Building2 className="h-6 w-6" />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  New workspace
                </div>

                <h2
                  id="create-organization-title"
                  className="text-xl font-semibold tracking-tight text-slate-950"
                >
                  Create organization
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Create a secure workspace for
                  projects, members and AI knowledge
                  bases.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(
            submitForm,
          )}
          className="space-y-5 px-6 py-6"
        >
          <div>
            <label
              htmlFor="organization-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Organization name
            </label>

            <input
              id="organization-name"
              type="text"
              autoFocus
              placeholder="Example: NexusAI Labs"
              {...register("name")}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            {errors.name && (
              <p className="mt-2 text-sm text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="organization-description"
                className="text-sm font-medium text-slate-700"
              >
                Description
              </label>

              <span className="text-xs text-slate-400">
                Optional
              </span>
            </div>

            <textarea
              id="organization-description"
              rows={4}
              placeholder="Describe the purpose of this workspace..."
              {...register(
                "description",
              )}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            {errors.description && (
              <p className="mt-2 text-sm text-red-600">
                {
                  errors.description
                    .message
                }
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <p className="text-sm font-medium text-violet-950">
              You will become the organization owner.
            </p>

            <p className="mt-1 text-xs leading-5 text-violet-700">
              Owners can create projects, invite
              members and manage organization-level
              settings.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}

              {isSubmitting
                ? "Creating..."
                : "Create organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}