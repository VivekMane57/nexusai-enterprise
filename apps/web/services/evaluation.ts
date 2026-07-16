import { api } from "@/lib/api";

import type {
  EvaluationDashboard,
  EvaluationHistoryItem,
  EvaluationRunRequest,
  EvaluationRunResponse,
} from "@/types/evaluation";

export async function getEvaluationDashboard(
  days = 7,
  limit = 20,
): Promise<EvaluationDashboard> {
  const response =
    await api.get<EvaluationDashboard>(
      "/evaluations/dashboard",
      {
        params: {
          days,
          limit,
        },
      },
    );

  return response.data;
}

export async function getEvaluationHistory(
  limit = 50,
): Promise<EvaluationHistoryItem[]> {
  const response = await api.get<
    EvaluationHistoryItem[]
  >(
    "/evaluations/history",
    {
      params: {
        limit,
      },
    },
  );

  return response.data;
}

export async function runEvaluation(
  payload: EvaluationRunRequest,
): Promise<EvaluationRunResponse> {
  const response =
    await api.post<EvaluationRunResponse>(
      "/evaluations/run",
      payload,
    );

  return response.data;
}