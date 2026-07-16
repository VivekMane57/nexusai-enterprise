export type KnowledgeBaseStatus =
  | "active"
  | "inactive"
  | "processing"
  | "failed";

export type ChunkingStrategy =
  | "recursive"
  | "semantic"
  | "fixed";

export interface KnowledgeBase {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string | null;
  embedding_model: string;
  chunking_strategy: ChunkingStrategy;
  chunk_size: number;
  chunk_overlap: number;
  status: KnowledgeBaseStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
  chunk_count?: number;
  conversation_count?: number;
}

export interface KnowledgeBaseListResponse {
  items: KnowledgeBase[];
  total: number;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  chunking_strategy: ChunkingStrategy;
  chunk_size: number;
  chunk_overlap: number;
}
