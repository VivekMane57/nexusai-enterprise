"use client";

import {
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  File,
  FileCheck2,
  FileText,
  FolderKanban,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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

import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import { AppShell } from "@/components/layout/app-shell";
import {
  useAllKnowledgeBases,
} from "@/hooks/use-all-knowledge-bases";
import {
  getApiErrorMessage,
} from "@/lib/api";
import {
  deleteDocument,
  getKnowledgeBaseDocuments,
  retryDocument,
} from "@/services/documents";
import type {
  DocumentItem,
  DocumentStatus,
} from "@/types/document";

type StatusFilter =
  | "all"
  | "ready"
  | "processing"
  | "failed";

interface GlobalDocument
  extends DocumentItem {
  knowledge_base_name: string;
  project_name: string;
  organization_name: string;
}

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

function formatBytes(
  bytes: number,
): string {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const unitIndex =
    Math.min(
      Math.floor(
        Math.log(bytes) /
          Math.log(1024),
      ),
      units.length - 1,
    );

  const value =
    bytes /
    1024 ** unitIndex;

  return `${value.toFixed(
    unitIndex === 0
      ? 0
      : 1,
  )} ${units[unitIndex]}`;
}

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
      timeStyle: "short",
    },
  ).format(date);
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

  return status
    .replaceAll("_", " ")
    .replace(
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
  const normalized =
    fileType.toLowerCase();

  if (
    normalized.includes(
      "pdf",
    )
  ) {
    return (
      <FileText className="h-6 w-6" />
    );
  }

  if (
    normalized.includes(
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
      {getStatusLabel(status)}
    </span>
  );
}

function DocumentSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="h-7 w-20 rounded-full bg-slate-100" />
      </div>

      <div className="mt-5 h-5 w-48 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-32 rounded bg-slate-100" />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="h-14 rounded-xl bg-slate-100" />
        <div className="h-14 rounded-xl bg-slate-100" />
        <div className="h-14 rounded-xl bg-slate-100" />
      </div>

      <div className="mt-5 h-14 rounded-xl bg-slate-100" />
    </article>
  );
}

interface DocumentCardProps {
  document: GlobalDocument;
  isRetrying: boolean;

  onRetry: (
    document: GlobalDocument,
  ) => void;

  onDelete: (
    document: GlobalDocument,
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
            fileType={
              document.file_type
            }
          />
        </div>

        <DocumentStatusBadge
          status={
            document.status
          }
        />
      </div>

      <div className="relative mt-5">
        <h2
          title={
            document.original_filename
          }
          className="truncate text-base font-semibold text-slate-950"
        >
          {
            document.original_filename
          }
        </h2>

        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
          {document.file_type}
          {" · "}
          {formatBytes(
            document.file_size,
          )}
        </p>
      </div>

      <Link
        href={`/knowledge-bases/${document.knowledge_base_id}`}
        className="relative mt-4 block rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-violet-200 hover:bg-violet-50"
      >
        <div className="flex items-start gap-2">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">
              {
                document.knowledge_base_name
              }
            </p>

            <p className="mt-1 truncate text-[11px] text-slate-400">
              {
                document.organization_name
              }
              {" / "}
              {
                document.project_name
              }
            </p>
          </div>
        </div>
      </Link>

      <div className="relative mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
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

          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
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
              Background indexing in progress
            </p>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
          </div>
        </div>
      )}

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="truncate text-xs text-slate-400">
          {formatDate(
            document.created_at,
          )}
        </p>

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
              disabled={
                isRetrying
              }
              onClick={() =>
                onRetry(document)
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              onDelete(document)
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DocumentsPage() {
  const queryClient =
    useQueryClient();

  const knowledgeBasesQuery =
    useAllKnowledgeBases();

  const knowledgeBases =
    knowledgeBasesQuery.knowledgeBases;

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
    knowledgeBaseFilter,
    setKnowledgeBaseFilter,
  ] = useState("all");

  const [
    retryingDocumentId,
    setRetryingDocumentId,
  ] = useState<
    string | null
  >(null);

  const [
    documentToDelete,
    setDocumentToDelete,
  ] =
    useState<GlobalDocument | null>(
      null,
    );

  const documentsQuery =
    useQuery({
      queryKey: [
        "global-documents",
        knowledgeBases.map(
          (knowledgeBase) =>
            knowledgeBase.id,
        ),
      ],

      enabled:
        knowledgeBases.length > 0,

      queryFn: async () => {
        const results =
          await Promise.all(
            knowledgeBases.map(
              async (
                knowledgeBase,
              ) => {
                const response =
                  await getKnowledgeBaseDocuments(
                    knowledgeBase.id,
                  );

                return response.items.map(
                  (
                    document,
                  ): GlobalDocument => ({
                    ...document,

                    knowledge_base_name:
                      knowledgeBase.name,

                    project_name:
                      knowledgeBase.project_name ??
                      "Unknown project",

                    organization_name:
                      knowledgeBase.organization_name ??
                      "Unknown organization",
                  }),
                );
              },
            ),
          );

        return results
          .flat()
          .sort(
            (
              firstDocument,
              secondDocument,
            ) =>
              new Date(
                secondDocument.created_at,
              ).getTime() -
              new Date(
                firstDocument.created_at,
              ).getTime(),
          );
      },

      refetchInterval: (
        query,
      ) => {
        const documents =
          query.state.data;

        const hasProcessing =
          documents?.some(
            (document) =>
              isProcessing(
                document.status,
              ),
          );

        return hasProcessing
          ? 2500
          : false;
      },

      refetchIntervalInBackground:
        true,
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
                "global-documents",
              ],
            },
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "knowledge-base-documents",
                document.knowledge_base_id,
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

      onSuccess:
        async () => {
          const deletedDocument =
            documentToDelete;

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "global-documents",
              ],
            },
          );

          if (deletedDocument) {
            await queryClient.invalidateQueries(
              {
                queryKey: [
                  "knowledge-base-documents",
                  deletedDocument.knowledge_base_id,
                ],
              },
            );
          }

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

  const documents =
    useMemo(
      () =>
        documentsQuery.data ??
        [],
      [
        documentsQuery.data,
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
        currentTotal,
        document,
      ) =>
        currentTotal +
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
              ) ||
            document.knowledge_base_name
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            document.project_name
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

          const matchesKnowledgeBase =
            knowledgeBaseFilter ===
              "all" ||
            document.knowledge_base_id ===
              knowledgeBaseFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesKnowledgeBase
          );
        },
      );
    }, [
      documents,
      searchQuery,
      statusFilter,
      knowledgeBaseFilter,
    ]);

  const isLoading =
    knowledgeBasesQuery.isLoading ||
    (
      knowledgeBases.length >
        0 &&
      documentsQuery.isLoading
    );

  const hasError =
    knowledgeBasesQuery.isError ||
    documentsQuery.isError;

  const error =
    knowledgeBasesQuery.error ??
    documentsQuery.error;

  const isFetching =
    knowledgeBasesQuery.isFetching ||
    documentsQuery.isFetching;

  async function refreshAll(): Promise<void> {
    try {
      await knowledgeBasesQuery.refetchAll();

      await documentsQuery.refetch();

      toast.success(
        "Documents refreshed.",
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
              <FolderKanban className="h-3.5 w-3.5" />
              Enterprise knowledge files
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Documents
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View and manage documents across all accessible knowledge bases, projects and organizations.
            </p>
          </div>

          <Link
            href="/knowledge-bases"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800"
          >
            <Database className="h-4 w-4" />
            Open knowledge bases
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total documents
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {documents.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Across all knowledge bases
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
              Available for AI retrieval
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Processing
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {processingDocuments}
            </p>

            <p className="mt-2 text-xs text-blue-600">
              Background workers active
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

        {failedDocuments > 0 && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

              <div>
                <p className="text-sm font-semibold text-red-900">
                  {failedDocuments} document
                  {failedDocuments === 1
                    ? ""
                    : "s"}{" "}
                  require attention
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  Review the processing errors and retry the affected document tasks.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={
                searchQuery
              }
              onChange={(
                event,
              ) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search filename, type, project or knowledge base..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={
                knowledgeBaseFilter
              }
              onChange={(
                event,
              ) =>
                setKnowledgeBaseFilter(
                  event.target.value,
                )
              }
              className="h-11 max-w-64 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            >
              <option value="all">
                All knowledge bases
              </option>

              {knowledgeBases.map(
                (
                  knowledgeBase,
                ) => (
                  <option
                    key={
                      knowledgeBase.id
                    }
                    value={
                      knowledgeBase.id
                    }
                  >
                    {
                      knowledgeBase.name
                    }
                  </option>
                ),
              )}
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) =>
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
              disabled={
                isFetching
              }
              onClick={() => {
                void refreshAll();
              }}
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
              (
                _,
                index,
              ) => (
                <DocumentSkeleton
                  key={index}
                />
              ),
            )}
          </section>
        )}

        {!isLoading &&
          hasError && (
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
                onClick={() => {
                  void refreshAll();
                }}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          knowledgeBases.length ===
            0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Database className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                No knowledge bases available
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create a project and knowledge base before uploading documents.
              </p>

              <Link
                href="/knowledge-bases"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                Open knowledge bases
              </Link>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          knowledgeBases.length >
            0 &&
          documents.length === 0 && (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <FileText className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                No documents uploaded
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Open a knowledge base and upload PDF, DOCX or TXT files to begin indexing.
              </p>

              <Link
                href="/knowledge-bases"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                Open knowledge bases
              </Link>
            </section>
          )}

        {!isLoading &&
          !hasError &&
          documents.length > 0 &&
          filteredDocuments.length ===
            0 && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <Search className="h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No matching documents
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Change the search query or filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(
                    "all",
                  );
                  setKnowledgeBaseFilter(
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
                (
                  document,
                ) => (
                  <DocumentCard
                    key={
                      document.id
                    }
                    document={
                      document
                    }
                    isRetrying={
                      retryingDocumentId ===
                      document.id
                    }
                    onRetry={(
                      selectedDocument,
                    ) => {
                      retryMutation.mutate(
                        selectedDocument.id,
                      );
                    }}
                    onDelete={(
                      selectedDocument,
                    ) => {
                      setDocumentToDelete(
                        selectedDocument,
                      );
                    }}
                  />
                ),
              )}
            </section>
          )}
      </div>

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