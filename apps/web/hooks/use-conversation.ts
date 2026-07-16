"use client";

import { useQuery } from "@tanstack/react-query";

import { getConversation } from "@/services/chat";

export function useConversation(
  conversationId?: string,
) {
  return useQuery({
    queryKey: [
      "conversation",
      conversationId,
    ],
    queryFn: () =>
      getConversation(
        conversationId as string,
      ),
    enabled: Boolean(
      conversationId,
    ),
  });
}