"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getKnowledgeBaseConversations,
} from "@/services/chat";

export function useConversations(
  knowledgeBaseId?: string,
) {
  return useQuery({
    queryKey: [
      "knowledge-base-conversations",
      knowledgeBaseId,
    ],
    queryFn: () =>
      getKnowledgeBaseConversations(
        knowledgeBaseId as string,
      ),
    enabled: Boolean(
      knowledgeBaseId,
    ),
  });
}