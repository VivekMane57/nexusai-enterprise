import { api } from "@/lib/api";

import type {
  CreateKnowledgeBaseRequest,
  KnowledgeBase,
  KnowledgeBaseListResponse,
} from "@/types/knowledge-base";

function normalizeKnowledgeBaseList(
  data:
    | KnowledgeBase[]
    | KnowledgeBaseListResponse,
): KnowledgeBaseListResponse {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
    };
  }

  const items = data.items ?? [];

  return {
    items,
    total: data.total ?? items.length,
  };
}

export async function getProjectKnowledgeBases(
  projectId: string,
): Promise<KnowledgeBaseListResponse> {
  const response = await api.get<
    KnowledgeBase[] | KnowledgeBaseListResponse
  >(`/projects/${projectId}/knowledge-bases`);

  return normalizeKnowledgeBaseList(
    response.data,
  );
}

export async function createKnowledgeBase(
  projectId: string,
  payload: CreateKnowledgeBaseRequest,
): Promise<KnowledgeBase> {
  const response =
    await api.post<KnowledgeBase>(
      `/projects/${projectId}/knowledge-bases`,
      payload,
    );

  return response.data;
}

export async function getKnowledgeBase(
  knowledgeBaseId: string,
): Promise<KnowledgeBase> {
  const response =
    await api.get<KnowledgeBase>(
      `/knowledge-bases/${knowledgeBaseId}`,
    );

  return response.data;
}
