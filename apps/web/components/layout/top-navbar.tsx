"use client";

import {
  Bell,
  ChevronDown,
  Command,
  Menu,
  Plus,
  Search,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

export function TopNavbar({
  onOpenSidebar,
}: TopNavbarProps) {
  const user = useAuthStore(
    (state) => state.user,
  );

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold text-slate-950">
            Enterprise Workspace
          </p>
          <p className="truncate text-xs text-slate-500">
            Monitor and manage your AI platform
          </p>
        </div>
      </div>

      <div className="hidden max-w-xl flex-1 md:block">
        <button
          type="button"
          className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">
            Search projects, documents and conversations
          </span>

          <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500">
            <Command className="h-3 w-3" /> K
          </span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="hidden h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 sm:flex"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          <Bell className="h-4 w-4" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-violet-600" />
        </button>

        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 transition hover:bg-slate-50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-semibold text-white">
            {user?.full_name
              ?.charAt(0)
              .toUpperCase() ?? "V"}
          </div>

          <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  );
}