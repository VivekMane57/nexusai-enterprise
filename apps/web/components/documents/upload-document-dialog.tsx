"use client";

import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  UploadCloud,
  X,
} from "lucide-react";
import {
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const allowedExtensions = [
  ".pdf",
  ".docx",
  ".txt",
];

interface UploadDocumentDialogProps {
  open: boolean;
  isUploading: boolean;
  uploadProgress: number;

  onClose: () => void;

  onUpload: (
    file: File,
  ) => Promise<void>;
}

function getFileExtension(
  filename: string,
): string {
  const lastDotIndex =
    filename.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return filename
    .slice(lastDotIndex)
    .toLowerCase();
}

function formatBytes(
  bytes: number,
): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const unitIndex =
    Math.floor(
      Math.log(bytes) /
        Math.log(1024),
    );

  const value =
    bytes /
    1024 ** unitIndex;

  return `${value.toFixed(
    unitIndex === 0 ? 0 : 1,
  )} ${units[unitIndex]}`;
}

export function UploadDocumentDialog({
  open,
  isUploading,
  uploadProgress,
  onClose,
  onUpload,
}: UploadDocumentDialogProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null,
  );

  const [
    validationError,
    setValidationError,
  ] = useState<
    string | null
  >(null);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ): void {
      if (
        event.key === "Escape" &&
        !isUploading
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
    isUploading,
    onClose,
  ]);

  function resetDialog(): void {
    setSelectedFile(null);
    setValidationError(null);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose(): void {
    if (isUploading) {
      return;
    }

    resetDialog();
    onClose();
  }

  if (!open) {
    return null;
  }

  function validateFile(
    file: File,
  ): boolean {
    const extension =
      getFileExtension(
        file.name,
      );

    if (
      !allowedExtensions.includes(
        extension,
      )
    ) {
      setValidationError(
        "Only PDF, DOCX and TXT files are supported.",
      );

      return false;
    }

    if (
      file.size === 0
    ) {
      setValidationError(
        "The selected file is empty.",
      );

      return false;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setValidationError(
        "The selected file exceeds the 20 MB limit.",
      );

      return false;
    }

    setValidationError(null);

    return true;
  }

  function selectFile(
    file: File,
  ): void {
    if (
      validateFile(file)
    ) {
      setSelectedFile(file);
    }
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files[0];

    if (file) {
      selectFile(file);
    }
  }

  async function handleUpload(): Promise<void> {
    if (!selectedFile) {
      setValidationError(
        "Select a document before uploading.",
      );

      return;
    }

    await onUpload(
      selectedFile,
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-document-title"
    >
      <button
        type="button"
        aria-label="Close upload dialog"
        disabled={isUploading}
        onClick={handleClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="relative overflow-hidden border-b border-slate-200 px-6 py-6">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-100 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <UploadCloud className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                  Document ingestion
                </p>

                <h2
                  id="upload-document-title"
                  className="mt-1 text-xl font-semibold tracking-tight text-slate-950"
                >
                  Upload document
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Upload a document for extraction,
                  chunking, embedding and vector indexing.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close"
              disabled={isUploading}
              onClick={handleClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            disabled={isUploading}
            className="hidden"
            onChange={(event) => {
              const file =
                event.target
                  .files?.[0];

              if (file) {
                selectFile(file);
              }
            }}
          />

          <div
            onDragEnter={(
              event,
            ) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(
              event,
            ) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() =>
              setIsDragging(false)
            }
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              isDragging
                ? "border-violet-500 bg-violet-50"
                : "border-slate-300 bg-slate-50/70"
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-slate-900">
              Drag and drop your document
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              PDF, DOCX or TXT up to 20 MB
            </p>

            <button
              type="button"
              disabled={isUploading}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Browse files
            </button>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatBytes(
                    selectedFile.size,
                  )}
                </p>
              </div>

              {!isUploading && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFile(
                      null,
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {validationError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </p>
          )}

          {isUploading && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-violet-950">
                  Uploading document
                </span>

                <span className="font-semibold text-violet-700">
                  {uploadProgress}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-violet-700 transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-violet-700">
                Do not close this window while the file
                is being uploaded.
              </p>
            </div>
          )}

          {!isUploading && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                <div>
                  <p className="text-sm font-medium text-emerald-950">
                    Secure document processing
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    The file will be queued for background
                    extraction, chunking and indexing.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClose}
              className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                !selectedFile ||
                isUploading
              }
              onClick={() =>
                void handleUpload()
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}

              {isUploading
                ? "Uploading..."
                : "Upload document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}