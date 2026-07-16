"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteConversation,
} from "@/services/chat";

interface DeleteConversationInput {
  conversationId: string;
  knowledgeBaseId: string;
}

export function useDeleteConversation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
    }: DeleteConversationInput) =>
      deleteConversation(
        conversationId,
      ),

    onSuccess: async (
      _data,
      variables,
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "knowledge-base-conversations",
          variables.knowledgeBaseId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          "conversation",
          variables.conversationId,
        ],
      });
    },
  });
}