"use client";

import { useMutation } from "@tanstack/react-query";

import {
  sendConversationMessage,
} from "@/services/chat";

export function useSendMessage(
  conversationId: string,
) {
  return useMutation({
    mutationFn: (
      question: string,
    ) =>
      sendConversationMessage(
        conversationId,
        {
          question,
        },
      ),
  });
}