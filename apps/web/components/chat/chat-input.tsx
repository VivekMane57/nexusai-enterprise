"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";

interface ChatInputProps {
  loading?: boolean;
  onSend: (message: string) => void;
}

export default function ChatInput({
  loading,
  onSend,
}: ChatInputProps) {
  const [message, setMessage] =
    useState("");

  function handleSubmit() {
    const value = message.trim();

    if (!value) return;

    onSend(value);

    setMessage("");
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-3">

        <textarea
          rows={2}
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Ask anything..."
          className="flex-1 resize-none rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="rounded-xl bg-violet-600 p-3 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <SendHorizonal
            size={20}
          />
        </button>

      </div>
    </div>
  );
}