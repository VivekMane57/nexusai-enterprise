import type {
  LucideIcon,
} from "lucide-react";
import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  change,
  trend = "up",
  icon: Icon,
  className,
}: MetricCardProps) {
  const TrendIcon =
    trend === "up"
      ? ArrowUpRight
      : ArrowDownRight;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-100/70 blur-2xl transition group-hover:bg-violet-200/70" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3">
        <p className="truncate text-xs text-slate-500">
          {description}
        </p>

        {change && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 text-xs font-semibold",
              trend === "up"
                ? "text-emerald-600"
                : "text-red-600",
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {change}
          </span>
        )}
      </div>
    </article>
  );
}