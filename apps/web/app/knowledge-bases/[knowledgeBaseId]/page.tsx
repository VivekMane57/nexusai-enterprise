"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  File,
  FileCheck2,
  FileText,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  deleteDocument,
  getKnowledgeBaseDocuments,
  retryDocument,
  uploadDocument,
} from "@/services/documents";
import {
  getKnowledgeBase,
} from "@/services/knowledge-bases";
import type {
  DocumentItem,
  DocumentStatus,
} from "@/types/document";

type StatusFilter =
  | "all"
  | "ready"
  | "processing"
  | "failed";

const processingStatuses =
  new Set<DocumentStatus>([
    "uploaded",
    "queued",
    "processing",
    "extracting",
    "chunking",
    "embedding",
    "indexing",
  ]);

const readyStatuses =
  new Set<DocumentStatus>([
    "indexed",
    "completed",
    "ready",
  ]);

function formatBytes(
  bytes: number,
): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024),
    ),
    units.length - 1,
  );

  const value =
    bytes / 1024 ** index;

  return `${value.toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
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
      timeStyle: "short",
    },
  ).format(date);
}

function normalizeStatus(
  status: DocumentStatus,
): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase();
}

function isProcessing(
  status: DocumentStatus,
): boolean {
  return processingStatuses.has(
    status,
  );
}

function isReady(
  status: DocumentStatus,
): boolean {
  return readyStatuses.has(
    status,
  );
}

function getStatusLabel(
  status: DocumentStatus,
): string {
  if (isReady(status)) {
    return "Ready";
  }

  if (status === "failed") {
    return "Failed";
  }

  return normalizeStatus(
    status,
  ).replace(
    /\b\w/g,
    (letter) =>
      letter.toUpperCase(),
  );
}

function DocumentFileIcon({
  fileType,
}: {
  fileType: string;
}) {
  const normalizedFileType =
    fileType.toLowerCase();

  if (
    normalizedFileType.includes(
      "pdf",
    )
  ) {
    return (
      <FileText className="h-6 w-6" />
    );
  }

  if (
    normalizedFileType.includes(
      "doc",
    )
  ) {
    return (
      <FileCheck2 className="h-6 w-6" />
    );
  }

  return (
    <File className="h-6 w-6" />
  );
}

function DocumentStatusBadge({
  status,
}: {
  status: DocumentStatus;
}) {
  if (isReady(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <CircleAlert className="h-3.5 w-3.5" />
        Failed
      </span>
    );
  }

  if (isProcessing(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        {getStatusLabel(
          status,
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      <Clock3 className="h-3.5 w-3.5" />
      {getStatusLabel(
        status,
      )}
    </span>
  );
}

function DocumentSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="h-8 w-20 rounded-full bg-slate-100" />
      </div>

      <div className="mt-5 h-5 w-48 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-32 rounded bg-slate-100" />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="h-14 rounded-xl bg-slate-100" />
        <div className="h-14 rounded-xl bg-slate-100" />
        <div className="h-14 rounded-xl bg-slate-100" />
      </div>

      <div className="mt-5 h-10 rounded-xl bg-slate-100" />
    </article>
  );
}

interface DocumentCardProps {
  document: DocumentItem;
  isRetrying: boolean;
  onRetry: (
    document: DocumentItem,
  ) => void;
  onDelete: (
    document: DocumentItem,
  ) => void;
}

function DocumentCard({
  document,
  isRetrying,
  onRetry,
  onDelete,
}: DocumentCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-100/70 blur-3xl transition group-hover:bg-violet-200/70" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <DocumentFileIcon
            fileType={document.file_type}
          />
        </div>

        <div className="flex items-center gap-2">
          <DocumentStatusBadge
            status={
              document.status
            }
          />

          <button
            type="button"
            aria-label={`More options for ${document.original_filename}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <h2
          className="truncate text-base font-semibold text-slate-950"
          title={
            document.original_filename
          }
        >
          {
            document.original_filename
          }
        </h2>

        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
          {document.file_type} ·{" "}
          {formatBytes(
            document.file_size,
          )}
        </p>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Pages
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {document.page_count ??
              "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Chunks
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {document.chunk_count ??
              0}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Status
          </p>

          <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-700">
            {getStatusLabel(
              document.status,
            )}
          </p>
        </div>
      </div>

      {document.processing_error && (
        <div className="relative mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />

            <p className="line-clamp-3 text-xs leading-5 text-red-700">
              {
                document.processing_error
              }
            </p>
          </div>
        </div>
      )}

      {isProcessing(
        document.status,
      ) && (
        <div className="relative mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin text-blue-700" />

            <p className="text-xs font-medium text-blue-700">
              Background indexing in
              progress
            </p>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
          </div>
        </div>
      )}

      <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />

          <span className="truncate">
            {formatDate(
              document.created_at,
            )}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {(
            document.status ===
              "failed" ||
            isReady(
              document.status,
            )
          ) && (
            <button
              type="button"
              disabled={isRetrying}
              onClick={() =>
                onRetry(
                  document,
                )
              }
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRetrying ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}

              Retry
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onDelete(
                document,
              )
            }
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function KnowledgeBaseDocumentsPage() {
  const params = useParams<{
    knowledgeBaseId: string;
  }>();

  const knowledgeBaseId =
    params.knowledgeBaseId;

  const queryClient =
    useQueryClient();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    uploadDialogOpen,
    setUploadDialogOpen,
  ] = useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const [
    documentToDelete,
    setDocumentToDelete,
  ] =
    useState<DocumentItem | null>(
      null,
    );

  const [
    retryingDocumentId,
    setRetryingDocumentId,
  ] = useState<
    string | null
  >(null);

  const knowledgeBaseQuery =
    useQuery({
      queryKey: [
        "knowledge-base",
        knowledgeBaseId,
      ],

      queryFn: () =>
        getKnowledgeBase(
          knowledgeBaseId,
        ),

      enabled:
        Boolean(
          knowledgeBaseId,
        ),
    });

  const documentsQuery =
    useQuery({
      queryKey: [
        "knowledge-base-documents",
        knowledgeBaseId,
      ],

      queryFn: () =>
        getKnowledgeBaseDocuments(
          knowledgeBaseId,
        ),

      enabled:
        Boolean(
          knowledgeBaseId,
        ),

      refetchInterval: (
        query,
      ) => {
        const data =
          query.state.data;

        const hasProcessingDocument =
          data?.items.some(
            (document) =>
              isProcessing(
                document.status,
              ),
          );

        return hasProcessingDocument
          ? 2500
          : false;
      },

      refetchIntervalInBackground:
        true,
    });

  const uploadMutation =
    useMutation({
      mutationFn: (
        file: File,
      ) =>
        uploadDocument(
          knowledgeBaseId,
          file,
          setUploadProgress,
        ),

      onMutate: () => {
        setUploadProgress(0);
      },

      onSuccess:
        async (
          response,
        ) => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "knowledge-base-documents",
                knowledgeBaseId,
              ],
            },
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "knowledge-base",
                knowledgeBaseId,
              ],
            },
          );

          setUploadProgress(100);

          setUploadDialogOpen(
            false,
          );

          toast.success(
            response.message ||
              `${response.document.original_filename} was uploaded successfully.`,
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

      onSettled: () => {
        window.setTimeout(
          () =>
            setUploadProgress(
              0,
            ),
          500,
        );
      },
    });

  const retryMutation =
    useMutation({
      mutationFn: (
        documentId: string,
      ) =>
        retryDocument(
          documentId,
        ),

      onMutate: (
        documentId,
      ) => {
        setRetryingDocumentId(
          documentId,
        );
      },

      onSuccess:
        async (
          document,
        ) => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "knowledge-base-documents",
                knowledgeBaseId,
              ],
            },
          );

          toast.success(
            `${document.original_filename} was queued for processing.`,
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

      onSettled: () => {
        setRetryingDocumentId(
          null,
        );
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        documentId: string,
      ) =>
        deleteDocument(
          documentId,
        ),

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          {
            queryKey: [
              "knowledge-base-documents",
              knowledgeBaseId,
            ],
          },
        );

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "knowledge-base",
              knowledgeBaseId,
            ],
          },
        );

        setDocumentToDelete(
          null,
        );

        toast.success(
          "Document deleted successfully.",
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

  const knowledgeBase =
    knowledgeBaseQuery.data;

  const documents = useMemo(
    () =>
      documentsQuery.data
        ?.items ?? [],
    [
      documentsQuery.data
        ?.items,
    ],
  );

  const readyDocuments =
    documents.filter(
      (document) =>
        isReady(
          document.status,
        ),
    ).length;

  const processingDocuments =
    documents.filter(
      (document) =>
        isProcessing(
          document.status,
        ),
    ).length;

  const failedDocuments =
    documents.filter(
      (document) =>
        document.status ===
        "failed",
    ).length;

  const totalChunks =
    documents.reduce(
      (
        total,
        document,
      ) =>
        total +
        (
          document.chunk_count ??
          0
        ),
      0,
    );

  const filteredDocuments =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      return documents.filter(
        (document) => {
          const matchesSearch =
            !normalizedQuery ||
            document.original_filename
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            document.file_type
              .toLowerCase()
              .includes(
                normalizedQuery,
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            (
              statusFilter ===
                "ready" &&
              isReady(
                document.status,
              )
            ) ||
            (
              statusFilter ===
                "processing" &&
              isProcessing(
                document.status,
              )
            ) ||
            (
              statusFilter ===
                "failed" &&
              document.status ===
                "failed"
            );

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      documents,
      searchQuery,
      statusFilter,
    ]);

  const isLoading =
    knowledgeBaseQuery.isLoading ||
    documentsQuery.isLoading;

  const hasError =
    knowledgeBaseQuery.isError ||
    documentsQuery.isError;

  const error =
    knowledgeBaseQuery.error ??
    documentsQuery.error;

  const isFetching =
    knowledgeBaseQuery.isFetching ||
    documentsQuery.isFetching;

  async function refreshAll(): Promise<void> {
    await Promise.all([
      knowledgeBaseQuery.refetch(),
      documentsQuery.refetch(),
    ]);
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section>
          <Link
            href={
              knowledgeBase
                ? `/projects/${knowledgeBase.project_id}`
                : "/projects"
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to project
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-700/20">
                <BrainCircuit className="h-7 w-7" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Knowledge workspace
                </div>

                <h1 className="truncate text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {knowledgeBase?.name ??
                    "Knowledge Base"}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {knowledgeBase?.description ||
                    "Upload, process and manage documents for grounded enterprise AI retrieval."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setUploadDialogOpen(
                  true,
                )
              }
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800"
            >
              <UploadCloud className="h-4 w-4" />
              Upload document
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total documents
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {documentsQuery.data
                ?.total ?? 0}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Uploaded knowledge files
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Ready
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {readyDocuments}
            </p>

            <p className="mt-2 text-xs text-emerald-600">
              Available for retrieval
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Processing
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {
                processingDocuments
              }
            </p>

            <p className="mt-2 text-xs text-blue-600">
              Background tasks active
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

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Database className="h-6 w-6 text-violet-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              Retrieval configuration
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Strategy
                </span>

                <span className="font-semibold capitalize text-slate-700">
                  {knowledgeBase?.chunking_strategy ??
                    "recursive"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Chunk size
                </span>

                <span className="font-semibold text-slate-700">
                  {knowledgeBase?.chunk_size ??
                    800}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Overlap
                </span>

                <span className="font-semibold text-slate-700">
                  {knowledgeBase?.chunk_overlap ??
                    120}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <FileCheck2 className="h-6 w-6 text-emerald-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              Processing health
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {
                failedDocuments ===
                0
                  ? "All uploaded documents are healthy or currently processing."
                  : `${failedDocuments} document task${failedDocuments === 1 ? "" : "s"} require attention.`
              }
            </p>

            <div className="mt-4">
              {failedDocuments ===
              0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Healthy
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  <CircleAlert className="h-3.5 w-3.5" />
                  Attention required
                </span>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <UploadCloud className="h-6 w-6 text-blue-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              Supported formats
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Upload PDF, DOCX and plain-text
              documents up to 20 MB.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "PDF",
                "DOCX",
                "TXT",
              ].map(
                (format) => (
                  <span
                    key={format}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  >
                    {format}
                  </span>
                ),
              )}
            </div>
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
              placeholder="Search documents..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
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

              <option value="ready">
                Ready
              </option>

              <option value="processing">
                Processing
              </option>

              <option value="failed">
                Failed
              </option>
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
                <DocumentSkeleton
                  key={index}
                />
              ),
            )}
          </section>
        )}

        {hasError && (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center">
            <CircleAlert className="h-10 w-10 text-red-700" />

            <h2 className="mt-5 text-lg font-semibold text-red-950">
              Documents could not be loaded
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
          documents.length ===
            0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <UploadCloud className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                Upload your first document
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Add PDF, DOCX or TXT files to
                extract content, generate embeddings
                and power grounded AI answers.
              </p>

              <button
                type="button"
                onClick={() =>
                  setUploadDialogOpen(
                    true,
                  )
                }
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                <Plus className="h-4 w-4" />
                Upload document
              </button>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          documents.length >
            0 &&
          filteredDocuments.length ===
            0 && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <Search className="h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No matching documents
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Change your search or status
                filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(
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
          filteredDocuments.length >
            0 && (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredDocuments.map(
                (document) => (
                  <DocumentCard
                    key={document.id}
                    document={
                      document
                    }
                    isRetrying={
                      retryingDocumentId ===
                      document.id
                    }
                    onRetry={(
                      selectedDocument,
                    ) =>
                      retryMutation.mutate(
                        selectedDocument.id,
                      )
                    }
                    onDelete={(
                      selectedDocument,
                    ) =>
                      setDocumentToDelete(
                        selectedDocument,
                      )
                    }
                  />
                ),
              )}
            </section>
          )}
      </div>

      {uploadDialogOpen && (
      <UploadDocumentDialog
          open
          isUploading={
            uploadMutation.isPending
          }
          uploadProgress={
            uploadProgress
          }
          onClose={() => {
            if (
              !uploadMutation.isPending
            ) {
              setUploadDialogOpen(
                false,
              );
            }
          }}
          onUpload={async (
            file,
          ) => {
            await uploadMutation.mutateAsync(
              file,
            );
          }}
        />
      )}


      <DeleteDocumentDialog
        open={
          documentToDelete !==
          null
        }
        filename={
          documentToDelete
            ?.original_filename
        }
        isDeleting={
          deleteMutation.isPending
        }
        onClose={() => {
          if (
            !deleteMutation.isPending
          ) {
            setDocumentToDelete(
              null,
            );
          }
        }}
        onConfirm={async () => {
          if (
            !documentToDelete
          ) {
            return;
          }

          await deleteMutation.mutateAsync(
            documentToDelete.id,
          );
        }}
      />
    </AppShell>
  );
}