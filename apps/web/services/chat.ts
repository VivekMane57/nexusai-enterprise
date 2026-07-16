import { api } from "@/lib/api";

import type {
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationCreateRequest,
  ConversationDetail,
  ConversationListResponse,
  ConversationMessageRequest,
  ConversationMessageResponse,
} from "@/types/chat";

function normalizeConversationList(
  data:
    | Conversation[]
    | ConversationListResponse,
): ConversationListResponse {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
    };
  }

  const items =
    data.items ?? [];

  return {
    items,
    total:
      data.total ??
      items.length,
  };
}

export async function askKnowledgeBase(
  knowledgeBaseId: string,
  payload: ChatRequest,
): Promise<ChatResponse> {
  const response =
    await api.post<ChatResponse>(
      `/knowledge-bases/${knowledgeBaseId}/chat`,
      payload,
    );

  return response.data;
}

export async function createConversation(
  knowledgeBaseId: string,
  payload: ConversationCreateRequest,
): Promise<Conversation> {
  const response =
    await api.post<Conversation>(
      `/knowledge-bases/${knowledgeBaseId}/conversations`,
      payload,
    );

  return response.data;
}

export async function getKnowledgeBaseConversations(
  knowledgeBaseId: string,
): Promise<ConversationListResponse> {
  const response = await api.get<
    | Conversation[]
    | ConversationListResponse
  >(
    `/knowledge-bases/${knowledgeBaseId}/conversations`,
  );

  return normalizeConversationList(
    response.data,
  );
}

export async function getConversation(
  conversationId: string,
): Promise<ConversationDetail> {
  const response =
    await api.get<ConversationDetail>(
      `/conversations/${conversationId}`,
    );

  return response.data;
}

export async function sendConversationMessage(
  conversationId: string,
  payload: ConversationMessageRequest,
): Promise<ConversationMessageResponse> {
  const response =
    await api.post<ConversationMessageResponse>(
      `/conversations/${conversationId}/messages`,
      payload,
    );

  return response.data;
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  await api.delete(
    `/conversations/${conversationId}`,
  );
}