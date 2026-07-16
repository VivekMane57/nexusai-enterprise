export interface MonitoringMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;

  average_latency_ms: number;
  average_retrieval_latency_ms: number;
  average_generation_latency_ms: number;

  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;

  total_documents: number;
  indexed_documents: number;
  processing_documents: number;
  failed_documents: number;
  indexed_chunks: number;
}

export interface ServiceHealth {
  name: string;
  status: string;
  latency_ms: number | null;
  message: string | null;
}

export interface MonitoringTrendPoint {
  timestamp: string;

  requests: number;
  successful_requests: number;
  failed_requests: number;

  average_latency_ms: number;
  total_tokens: number;
}

export interface MonitoringActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

export interface MonitoringDashboard {
  generated_at: string;
  metrics: MonitoringMetrics;
  services: ServiceHealth[];
  trends: MonitoringTrendPoint[];
  recent_activity: MonitoringActivity[];
}