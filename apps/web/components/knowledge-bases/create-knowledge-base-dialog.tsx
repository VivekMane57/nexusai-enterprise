"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BrainCircuit,
  Database,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createKnowledgeBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Knowledge base name must contain at least 2 characters.",
      )
      .max(
        120,
        "Knowledge base name cannot exceed 120 characters.",
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description cannot exceed 500 characters.",
      )
      .optional(),

    chunking_strategy: z.enum([
      "recursive",
      "semantic",
      "fixed",
    ]),

    chunk_size: z
      .number()
      .int()
      .min(
        200,
        "Chunk size must be at least 200.",
      )
      .max(
        4000,
        "Chunk size cannot exceed 4000.",
      ),

    chunk_overlap: z
      .number()
      .int()
      .min(
        0,
        "Chunk overlap cannot be negative.",
      )
      .max(
        1000,
        "Chunk overlap cannot exceed 1000.",
      ),
  })
  .refine(
    (values) =>
      values.chunk_overlap <
      values.chunk_size,
    {
      message:
        "Chunk overlap must be smaller than chunk size.",
      path: [
        "chunk_overlap",
      ],
    },
  );

export type CreateKnowledgeBaseFormValues =
  z.infer<
    typeof createKnowledgeBaseSchema
  >;

interface CreateKnowledgeBaseDialogProps {
  open: boolean;
  isSubmitting: boolean;
  projectName?: string;

  onClose: () => void;

  onSubmit: (
    values: CreateKnowledgeBaseFormValues,
  ) => Promise<void>;
}

export function CreateKnowledgeBaseDialog({
  open,
  isSubmitting,
  projectName,
  onClose,
  onSubmit,
}: CreateKnowledgeBaseDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } =
    useForm<CreateKnowledgeBaseFormValues>({
      resolver: zodResolver(
        createKnowledgeBaseSchema,
      ),

      defaultValues: {
        name: "",
        description: "",
        chunking_strategy:
          "recursive",
        chunk_size: 800,
        chunk_overlap: 120,
      },
    });

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ): void {
      if (
        event.key === "Escape" &&
        open &&
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
    open,
    isSubmitting,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  async function submitForm(
    values: CreateKnowledgeBaseFormValues,
  ): Promise<void> {
    await onSubmit(values);

    reset({
      name: "",
      description: "",
      chunking_strategy:
        "recursive",
      chunk_size: 800,
      chunk_overlap: 120,
    });
  }

  function handleClose(): void {
    if (isSubmitting) {
      return;
    }

    reset({
      name: "",
      description: "",
      chunking_strategy:
        "recursive",
      chunk_size: 800,
      chunk_overlap: 120,
    });

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-knowledge-base-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        disabled={isSubmitting}
        onClick={handleClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="relative overflow-hidden border-b border-slate-200 px-6 py-6">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-100 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <BrainCircuit className="h-6 w-6" />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  RAG workspace
                </div>

                <h2
                  id="create-knowledge-base-title"
                  className="text-xl font-semibold tracking-tight text-slate-950"
                >
                  Create knowledge base
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Add a retrieval-ready source inside{" "}
                  <span className="font-medium text-slate-700">
                    {projectName ??
                      "this project"}
                  </span>
                  .
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close"
              disabled={isSubmitting}
              onClick={handleClose}
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
              htmlFor="knowledge-base-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Knowledge base name
            </label>

            <input
              id="knowledge-base-name"
              type="text"
              autoFocus
              placeholder="Example: Financial Reports"
              {...register(
                "name",
              )}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            {errors.name && (
              <p className="mt-2 text-sm text-red-600">
                {
                  errors.name
                    .message
                }
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="knowledge-base-description"
                className="text-sm font-medium text-slate-700"
              >
                Description
              </label>

              <span className="text-xs text-slate-400">
                Optional
              </span>
            </div>

            <textarea
              id="knowledge-base-description"
              rows={3}
              placeholder="Describe the documents and intended AI use case..."
              {...register(
                "description",
              )}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            {errors.description && (
              <p className="mt-2 text-sm text-red-600">
                {
                  errors
                    .description
                    .message
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="chunking-strategy"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Chunking strategy
            </label>

            <select
              id="chunking-strategy"
              {...register(
                "chunking_strategy",
              )}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            >
              <option value="recursive">
                Recursive
              </option>

              <option value="semantic">
                Semantic
              </option>

              <option value="fixed">
                Fixed size
              </option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="chunk-size"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Chunk size
              </label>

              <input
                id="chunk-size"
                type="number"
                min={200}
                max={4000}
                {...register(
                  "chunk_size",
                  {
                    valueAsNumber:
                      true,
                  },
                )}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />

              {errors.chunk_size && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    errors
                      .chunk_size
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="chunk-overlap"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Chunk overlap
              </label>

              <input
                id="chunk-overlap"
                type="number"
                min={0}
                max={1000}
                {...register(
                  "chunk_overlap",
                  {
                    valueAsNumber:
                      true,
                  },
                )}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />

              {errors.chunk_overlap && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    errors
                      .chunk_overlap
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
            <div className="flex gap-3">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />

              <div>
                <p className="text-sm font-medium text-violet-950">
                  Recommended configuration
                </p>

                <p className="mt-1 text-xs leading-5 text-violet-700">
                  Recursive chunking with size
                  800 and overlap 120 works well
                  for most PDF, DOCX and TXT
                  documents.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
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
                : "Create knowledge base"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}