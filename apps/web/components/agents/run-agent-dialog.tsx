"use client";

import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import type {
  AgentDefinition,
  AgentRunRequest,
  AgentType,
} from "@/types/agent";

interface RunAgentDialogProps {
  open: boolean;
  agents: AgentDefinition[];
  selectedAgentType?: AgentType | null;
  isSubmitting?: boolean;

  onClose: () => void;

  onSubmit: (
    payload: AgentRunRequest,
  ) => Promise<void>;
}

interface RunAgentFormProps {
  agents: AgentDefinition[];
  initialAgentType?: AgentType | null;
  isSubmitting: boolean;

  onClose: () => void;

  onSubmit: (
    payload: AgentRunRequest,
  ) => Promise<void>;
}

function RunAgentForm({
  agents,
  initialAgentType,
  isSubmitting,
  onClose,
  onSubmit,
}: RunAgentFormProps) {
  const [
    knowledgeBaseId,
    setKnowledgeBaseId,
  ] = useState("");

  const [
    agentType,
    setAgentType,
  ] = useState<AgentType>(
    initialAgentType ??
      agents[0]?.type ??
      "financial_analyst",
  );

  const [task, setTask] =
    useState("");

  const [
    enableReranking,
    setEnableReranking,
  ] = useState(true);

  const [
    temperature,
    setTemperature,
  ] = useState(0.2);

  const [
    maxTokens,
    setMaxTokens,
  ] = useState(1800);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const selectedAgent =
    agents.find(
      (agent) =>
        agent.type === agentType,
    );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedKnowledgeBaseId =
      knowledgeBaseId.trim();

    const normalizedTask =
      task.trim();

    if (
      !normalizedKnowledgeBaseId
    ) {
      setError(
        "Enter a knowledge base UUID.",
      );
      return;
    }

    if (
      normalizedTask.length < 3
    ) {
      setError(
        "Enter a valid agent task.",
      );
      return;
    }

    setError(null);

    await onSubmit({
      knowledge_base_id:
        normalizedKnowledgeBaseId,
      agent_type: agentType,
      task: normalizedTask,
      dense_top_k: 20,
      sparse_top_k: 20,
      retrieval_top_k: 20,
      final_context_top_k: 8,
      enable_reranking:
        enableReranking,
      temperature,
      max_tokens: maxTokens,
    });
  }

  function handleClose(): void {
    if (!isSubmitting) {
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-agent-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                Agentic RAG
              </p>

              <h2
                id="run-agent-title"
                className="mt-1 text-xl font-semibold text-slate-950"
              >
                Run AI agent
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Execute a specialist agent with hybrid retrieval, reranking, citations and execution tracing.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            disabled={isSubmitting}
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-6 px-6 py-6"
        >
          <div>
            <label
              htmlFor="agent-type"
              className="text-sm font-medium text-slate-700"
            >
              Specialist agent
            </label>

            <select
              id="agent-type"
              value={agentType}
              disabled={isSubmitting}
              onChange={(event) =>
                setAgentType(
                  event.target
                    .value as AgentType,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            >
              {agents.map((agent) => (
                <option
                  key={agent.type}
                  value={agent.type}
                >
                  {agent.name}
                </option>
              ))}
            </select>

            {selectedAgent && (
              <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex gap-3">
                  <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />

                  <div>
                    <p className="text-sm font-semibold text-violet-950">
                      {selectedAgent.name}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-violet-700">
                      {
                        selectedAgent.description
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="agent-knowledge-base"
              className="text-sm font-medium text-slate-700"
            >
              Knowledge Base UUID
            </label>

            <div className="relative mt-2">
              <Database className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="agent-knowledge-base"
                type="text"
                value={knowledgeBaseId}
                disabled={isSubmitting}
                onChange={(event) =>
                  setKnowledgeBaseId(
                    event.target.value,
                  )
                }
                placeholder="df191b3a-88c7-48ac-96ed-fecc9a0fddbf"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Copy this UUID from the Knowledge Base details page or API response.
            </p>
          </div>

          <div>
            <label
              htmlFor="agent-task"
              className="text-sm font-medium text-slate-700"
            >
              Agent task
            </label>

            <textarea
              id="agent-task"
              rows={6}
              value={task}
              disabled={isSubmitting}
              onChange={(event) =>
                setTask(
                  event.target.value,
                )
              }
              placeholder={
                selectedAgent
                  ?.recommended_tasks[0] ??
                "Describe the task the agent should complete."
              }
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            />
          </div>

          {selectedAgent &&
            selectedAgent
              .recommended_tasks
              .length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Suggested tasks
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedAgent.recommended_tasks.map(
                    (
                      recommendedTask,
                    ) => (
                      <button
                        key={
                          recommendedTask
                        }
                        type="button"
                        disabled={
                          isSubmitting
                        }
                        onClick={() =>
                          setTask(
                            recommendedTask,
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
                      >
                        {
                          recommendedTask
                        }
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="agent-temperature"
                className="text-sm font-medium text-slate-700"
              >
                Temperature
              </label>

              <input
                id="agent-temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                disabled={isSubmitting}
                onChange={(event) =>
                  setTemperature(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="agent-max-tokens"
                className="text-sm font-medium text-slate-700"
              >
                Maximum tokens
              </label>

              <input
                id="agent-max-tokens"
                type="number"
                min={100}
                max={8000}
                step={100}
                value={maxTokens}
                disabled={isSubmitting}
                onChange={(event) =>
                  setMaxTokens(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-violet-700" />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Cross-encoder reranking
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Improve evidence quality before agent generation.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={enableReranking}
              disabled={isSubmitting}
              onChange={(event) =>
                setEnableReranking(
                  event.target.checked,
                )
              }
              className="h-4 w-4 accent-violet-700"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !knowledgeBaseId.trim()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}

              {isSubmitting
                ? "Running agent..."
                : "Run agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RunAgentDialog({
  open,
  agents,
  selectedAgentType,
  isSubmitting = false,
  onClose,
  onSubmit,
}: RunAgentDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <RunAgentForm
      key={
        selectedAgentType ??
        "default-agent"
      }
      agents={agents}
      initialAgentType={
        selectedAgentType
      }
      isSubmitting={
        isSubmitting
      }
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}