export type ChatMessageRole =
  | "user"
  | "assistant"
  | "system";

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface Citation {
  id?: string;

  citation_number?: number;

  document_id?: string;
  document_name?: string;
  filename?: string;

  chunk_id?: string;
  chunk_index?: number;

  page_number?: number | null;

  content?: string;
  content_preview?: string;
  excerpt?: string;
  text?: string;

  score?: number | null;
  reranker_score?: number | null;
  rerank_score?: number | null;
  dense_score?: number | null;
  sparse_score?: number | null;
  fusion_score?: number | null;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface ChatRequest {
  question: string;

  dense_top_k?: number;
  sparse_top_k?: number;
  retrieval_top_k?: number;
  final_context_top_k?: number;

  enable_reranking?: boolean;
  reranker_batch_size?: number;

  dense_score_threshold?:
    | number
    | null;

  sparse_minimum_score?: number;

  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  question: string;
  answer: string;

  knowledge_base_id: string;

  retrieval_method: string;

  model:
    | string
    | null;

  finish_reason:
    | string
    | null;

  citations: Citation[];
  total_citations: number;

  token_usage: TokenUsage;

  retrieval_latency_ms: number;
  generation_latency_ms: number;
  total_latency_ms: number;
}

export interface ConversationCreateRequest {
  title?: string;
}

export interface Conversation {
  id: string;

  knowledge_base_id: string;

  title: string;

  created_by?: string;

  created_at: string;
  updated_at: string;

  message_count?: number;

  last_message_at?:
    | string
    | null;
}

export interface ConversationListResponse {
  items: Conversation[];
  total: number;
}

export interface ConversationMessage {
  id: string;

  conversation_id: string;

  role: ChatMessageRole;

  content: string;

  citations?: Citation[];

  token_usage?:
    | TokenUsage
    | null;

  model?:
    | string
    | null;

  retrieval_method?:
    | string
    | null;

  retrieval_latency_ms?:
    | number
    | null;

  generation_latency_ms?:
    | number
    | null;

  total_latency_ms?:
    | number
    | null;

  created_at: string;
}

export interface ConversationDetail
  extends Conversation {
  messages: ConversationMessage[];
}

export type ConversationMessageRequest =
  ChatRequest;

export interface ConversationMessageResponse {
  conversation:
    | Conversation
    | null;

  user_message:
    | ConversationMessage
    | null;

  assistant_message:
    | ConversationMessage
    | null;

  answer?: string;

  citations?: Citation[];

  token_usage?: TokenUsage;

  retrieval_latency_ms?: number;
  generation_latency_ms?: number;
  total_latency_ms?: number;
}

export interface StreamingTokenEvent {
  type:
    | "start"
    | "sources"
    | "token"
    | "done"
    | "error";

  token?: string;
  content?: string;
  answer?: string;

  citation?: Citation;
  citations?: Citation[];

  message_id?: string;
  user_message_id?: string;
  assistant_message_id?: string;
  conversation_id?: string;

  model?: string | null;
  finish_reason?: string | null;

  token_usage?: TokenUsage;

  latency?: {
    retrieval_ms?: number | null;
    generation_ms?: number | null;
    total_ms?: number | null;
  };

  retrieval_latency_ms?: number;
  generation_latency_ms?: number;
  total_latency_ms?: number;

  total?: number;

  error?: string;
  message?: string;
}