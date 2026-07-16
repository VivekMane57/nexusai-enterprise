export type AgentType =
  | "financial_analyst"
  | "risk_analyst"
  | "compliance_reviewer"
  | "document_researcher"
  | "executive_summary";

export type AgentRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type AgentStepType =
  | "planning"
  | "retrieval"
  | "analysis"
  | "generation"
  | "citation"
  | "validation";

export interface AgentDefinition {
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  recommended_tasks: string[];
}

export interface AgentRunRequest {
  knowledge_base_id: string;
  agent_type: AgentType;
  task: string;

  dense_top_k?: number;
  sparse_top_k?: number;
  retrieval_top_k?: number;
  final_context_top_k?: number;

  enable_reranking?: boolean;

  temperature?: number;
  max_tokens?: number;
}

export interface AgentStep {
  id: string;
  agent_run_id: string;

  step_index: number;
  step_type: AgentStepType;
  status: AgentStepStatus;

  title: string;
  description: string | null;
  output: string | null;

  tool_name: string | null;

  tool_input: Record<
    string,
    unknown
  >;

  tool_output: Record<
    string,
    unknown
  >;

  latency_ms: number | null;

  started_at: string | null;
  completed_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;

  knowledge_base_id: string;
  created_by: string;

  agent_type: AgentType;
  status: AgentRunStatus;

  task: string;
  result: string | null;
  error_message: string | null;

  model_name: string | null;
  confidence_score: number | null;

  citations: Array<
    Record<string, unknown>
  >;

  execution_metadata: Record<
    string,
    unknown
  >;

  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;

  retrieval_latency_ms: number | null;
  generation_latency_ms: number | null;
  total_latency_ms: number | null;

  started_at: string | null;
  completed_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface AgentRunDetail
  extends AgentRun {
  steps: AgentStep[];
}

export interface AgentRunListResponse {
  items: AgentRun[];
  total: number;
}

export interface AgentDashboardSummary {
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  running_runs: number;

  success_rate: number;
  average_latency_ms: number;
  average_confidence: number;

  total_tokens: number;
}

export interface AgentDashboard {
  generated_at: string;

  summary: AgentDashboardSummary;

  available_agents: AgentDefinition[];

  recent_runs: AgentRun[];
}