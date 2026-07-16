"use client";

import {
  BarChart3,
  FileSearch,
  ListChecks,
  ShieldAlert,
} from "lucide-react";

interface SuggestedQuestionsProps {
  disabled?: boolean;
  onSelect: (question: string) => void;
}

const suggestions = [
  {
    icon: ListChecks,
    label: "Executive summary",
    question:
      "Provide an executive summary of this knowledge base.",
  },
  {
    icon: BarChart3,
    label: "Compare financials",
    question:
      "Compare the major financial metrics across the available periods in a table.",
  },
  {
    icon: ShieldAlert,
    label: "Identify risks",
    question:
      "Identify the major business, financial and operational risks with supporting citations.",
  },
  {
    icon: FileSearch,
    label: "Extract key facts",
    question:
      "Extract the most important facts, figures and decisions from the documents.",
  },
];

export default function SuggestedQuestions({
  disabled = false,
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        Suggested questions
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map(
          ({
            icon: Icon,
            label,
            question,
          }) => (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() =>
                onSelect(question)
              }
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Icon className="h-4 w-4" />
              </span>

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {label}
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {question}
                </span>
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}