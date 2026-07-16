export interface EvaluationMetric {
  name: string;
  score: number;
  percentage: number;
  passed: boolean;
  explanation: string;
}

export interface EvaluationRunRequest {
  question: string;
  answer: string;

  expected_answer?: string | null;

  contexts?: string[];
  citations?: Array<
    Record<string, unknown>
  >;

  retrieval_latency_ms?:
    | number
    | null;

  generation_latency_ms?:
    | number
    | null;

  total_latency_ms?:
    | number
    | null;

  prompt_tokens?:
    | number
    | null;

  completion_tokens?:
    | number
    | null;

  total_tokens?:
    | number
    | null;
}

export interface EvaluationRunResponse {
  id: string;

  question: string;
  answer_preview: string;

  overall_score: number;
  overall_percentage: number;

  passed: boolean;
  grade: string;

  metrics: EvaluationMetric[];

  hallucination_risk: number;
  citation_count: number;
  context_count: number;

  retrieval_latency_ms:
    | number
    | null;

  generation_latency_ms:
    | number
    | null;

  total_latency_ms:
    | number
    | null;

  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;

  created_at: string;
}

export interface EvaluationSummary {
  total_evaluations: number;
  passed_evaluations: number;
  failed_evaluations: number;

  pass_rate: number;

  average_score: number;
  average_groundedness: number;
  average_relevancy: number;
  average_citation_coverage: number;
  average_context_utilization: number;

  average_hallucination_risk: number;
  average_latency_ms: number;

  total_tokens: number;
}

export interface EvaluationTrendPoint {
  timestamp: string;

  evaluations: number;
  passed: number;
  failed: number;

  average_score: number;
  average_groundedness: number;
  average_relevancy: number;
}

export interface EvaluationHistoryItem {
  id: string;

  conversation_id?:
    | string
    | null;

  message_id?:
    | string
    | null;

  question: string;
  answer_preview: string;

  overall_score: number;
  passed: boolean;
  grade: string;

  groundedness: number;
  answer_relevancy: number;
  citation_coverage: number;
  context_utilization: number;
  hallucination_risk: number;

  citation_count: number;

  total_latency_ms:
    | number
    | null;

  total_tokens: number;

  created_at: string;
}

export interface EvaluationDashboard {
  generated_at: string;

  summary: EvaluationSummary;

  trends: EvaluationTrendPoint[];

  recent_evaluations:
    EvaluationHistoryItem[];
}