"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 w-fit">

      <div className="h-2 w-2 animate-bounce rounded-full bg-violet-600" />

      <div
        className="h-2 w-2 animate-bounce rounded-full bg-violet-600"
        style={{
          animationDelay:
            "0.15s",
        }}
      />

      <div
        className="h-2 w-2 animate-bounce rounded-full bg-violet-600"
        style={{
          animationDelay:
            "0.30s",
        }}
      />

    </div>
  );
}