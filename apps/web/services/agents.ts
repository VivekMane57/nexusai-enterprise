import { api } from "@/lib/api";

import type {
  AgentDashboard,
  AgentDefinition,
  AgentRunDetail,
  AgentRunListResponse,
  AgentRunRequest,
} from "@/types/agent";

export async function getAvailableAgents(): Promise<
  AgentDefinition[]
> {
  const response =
    await api.get<AgentDefinition[]>(
      "/agents",
    );

  return response.data;
}

export async function getAgentDashboard(
  limit = 20,
): Promise<AgentDashboard> {
  const response =
    await api.get<AgentDashboard>(
      "/agents/dashboard",
      {
        params: {
          limit,
        },
      },
    );

  return response.data;
}

export async function runAgent(
  payload: AgentRunRequest,
): Promise<AgentRunDetail> {
  const response =
    await api.post<AgentRunDetail>(
      "/agents/run",
      payload,
    );

  return response.data;
}

export async function getAgentRuns(
  limit = 50,
): Promise<AgentRunListResponse> {
  const response =
    await api.get<AgentRunListResponse>(
      "/agents/runs",
      {
        params: {
          limit,
        },
      },
    );

  return response.data;
}

export async function getAgentRun(
  runId: string,
): Promise<AgentRunDetail> {
  const response =
    await api.get<AgentRunDetail>(
      `/agents/runs/${runId}`,
    );

  return response.data;
}

export async function deleteAgentRun(
  runId: string,
): Promise<void> {
  await api.delete(
    `/agents/runs/${runId}`,
  );
}