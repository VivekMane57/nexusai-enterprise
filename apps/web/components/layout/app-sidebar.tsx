"use client";

import {
  Activity,
  Bot,
  Boxes,
  BrainCircuit,
  ChevronDown,
  Database,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Organizations",
        href: "/organizations",
        icon: Boxes,
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
      },
      {
        label: "Knowledge Bases",
        href: "/knowledge-bases",
        icon: Database,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: FileStack,
      },
      {
        label: "AI Chat",
        href: "/chat",
        icon: MessageSquareText,
      },
    ],
  },
  {
    label: "AI Operations",
    items: [
      {
        label: "Agents",
        href: "/agents",
        icon: BrainCircuit,
      },
      {
        label: "Evaluation",
        href: "/evaluation",
        icon: ShieldCheck,
      },
      {
        label: "Monitoring",
        href: "/monitoring",
        icon: Activity,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Members",
        href: "/members",
        icon: Users,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore(
    (state) => state.user,
  );

  const logout = useAuthStore(
    (state) => state.logout,
  );

  function handleLogout(): void {
    logout();
    router.replace("/login");
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex border-r border-white/10 bg-[#101828] text-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          collapsed
            ? "w-[84px]"
            : "w-[272px]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={cn(
              "flex h-20 items-center border-b border-white/10",
              collapsed
                ? "justify-center px-3"
                : "justify-between px-5",
            )}
          >
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-lg">
                <Bot className="h-5 w-5" />
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    NexusAI Enterprise
                  </p>
                  <p className="truncate text-[11px] text-white/45">
                    AI Control Plane
                  </p>
                </div>
              )}
            </Link>

            {!collapsed && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-2 text-white/55 hover:bg-white/10 hover:text-white lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {!collapsed && (
            <div className="px-4 pt-5">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-white/45">
                    Organization
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium">
                    NexusAI Workspace
                  </p>
                </div>

                <ChevronDown className="h-4 w-4 shrink-0 text-white/45" />
              </button>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <div className="space-y-6">
              {navigationGroups.map(
                (group) => (
                  <section key={group.label}>
                    {!collapsed && (
                      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                        {group.label}
                      </p>
                    )}

                    <div className="space-y-1">
                      {group.items.map(
                        (item) => {
                          const Icon =
                            item.icon;

                          const isActive =
                            item.href ===
                            "/dashboard"
                              ? pathname ===
                                item.href
                              : pathname.startsWith(
                                  item.href,
                                );

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              title={
                                collapsed
                                  ? item.label
                                  : undefined
                              }
                              onClick={
                                onCloseMobile
                              }
                              className={cn(
                                "group flex h-11 items-center rounded-xl text-sm font-medium transition",
                                collapsed
                                  ? "justify-center px-2"
                                  : "gap-3 px-3",
                                isActive
                                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                                  : "text-white/60 hover:bg-white/8 hover:text-white",
                              )}
                            >
                              <Icon className="h-5 w-5 shrink-0" />

                              {!collapsed && (
                                <span className="truncate">
                                  {item.label}
                                </span>
                              )}
                            </Link>
                          );
                        },
                      )}
                    </div>
                  </section>
                ),
              )}
            </div>
          </nav>

          <div className="border-t border-white/10 p-3">
            {!collapsed && (
              <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold">
                  {user?.full_name
                    ?.charAt(0)
                    .toUpperCase() ?? "V"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user?.full_name ??
                      "Vivek Mane"}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {user?.email ??
                      "Enterprise Admin"}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title={
                collapsed
                  ? "Sign out"
                  : undefined
              }
              className={cn(
                "flex h-10 w-full items-center rounded-xl text-sm text-white/55 transition hover:bg-red-500/10 hover:text-red-300",
                collapsed
                  ? "justify-center"
                  : "gap-3 px-3",
              )}
            >
              <LogOut className="h-4 w-4" />

              {!collapsed && (
                <span>Sign out</span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="mt-2 hidden h-10 w-full items-center justify-center rounded-xl text-white/45 transition hover:bg-white/10 hover:text-white lg:flex"
              aria-label={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}