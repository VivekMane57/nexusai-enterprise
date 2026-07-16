"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createConversation,
} from "@/services/chat";

interface CreateConversationInput {
  knowledgeBaseId: string;
  title?: string;
}

export function useCreateConversation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      knowledgeBaseId,
      title,
    }: CreateConversationInput) =>
      createConversation(
        knowledgeBaseId,
        {
          title:
            title?.trim() ||
            "New conversation",
        },
      ),

    onSuccess: async (
      _conversation,
      variables,
    ) => {
      await queryClient.invalidateQueries(
        {
          queryKey: [
            "knowledge-base-conversations",
            variables.knowledgeBaseId,
          ],
        },
      );
    },
  });
}