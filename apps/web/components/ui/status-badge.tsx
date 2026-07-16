import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Status =
  | "healthy"
  | "processing"
  | "warning"
  | "queued";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusConfig = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  processing: {
    label: "Processing",
    icon: LoaderCircle,
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  },
  warning: {
    label: "Warning",
    icon: CircleAlert,
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  },
  queued: {
    label: "Queued",
    icon: Clock3,
    className:
      "border-slate-200 bg-slate-50 text-slate-600",
  },
} satisfies Record<
  Status,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
>;

export function StatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          status === "processing" &&
            "animate-spin",
        )}
      />

      {label ?? config.label}
    </span>
  );
}