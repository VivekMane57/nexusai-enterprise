"use client";

import {
  useState,
} from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fb] lg:flex">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() =>
          setCollapsed(
            (current) => !current,
          )
        }
        onCloseMobile={() =>
          setMobileOpen(false)
        }
      />

      <div className="min-w-0 flex-1">
        <TopNavbar
          onOpenSidebar={() =>
            setMobileOpen(true)
          }
        />

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}