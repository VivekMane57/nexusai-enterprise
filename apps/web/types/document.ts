export type DocumentStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "extracting"
  | "chunking"
  | "embedding"
  | "indexing"
  | "indexed"
  | "completed"
  | "ready"
  | "failed";

export interface DocumentItem {
  id: string;
  knowledge_base_id: string;

  original_filename: string;
  stored_filename?: string;

  file_type: string;
  mime_type: string;
  file_size: number;

  checksum_sha256: string;
  status: DocumentStatus;

  processing_error: string | null;

  page_count: number | null;
  chunk_count: number;

  uploaded_by: string;

  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  total: number;
}

export interface DocumentUploadResponse {
  message: string;
  document: DocumentItem;
}