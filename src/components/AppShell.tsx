"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { normalizePath } from "@/lib/paths";
import type { ReactNode } from "react";
import { BackupBanner } from "./backup/BackupBanner";
import { BackupRunner } from "./backup/BackupRunner";
import { LockOverlay } from "./lock/LockOverlay";
import { ServiceWorkerRegister } from "./pwa/ServiceWorkerRegister";
import { LockProvider, useLock } from "@/lib/lock/context";

/* Add an item here and it shows up in the sidebar and the phone tab bar. */
const NAV: { href: string; label: string; icon: string; mobile?: boolean }[] = [
  { href: "/journal/", label: "Journal", icon: "📓" },
  { href: "/calendar/", label: "Calendar", icon: "🗓️" },
  { href: "/movies/", label: "Movies", icon: "🎬" },
  { href: "/tags/", label: "Tags", icon: "🏷️" },
  { href: "/backup/", label: "Backup", icon: "🛡️", mobile: false },
  { href: "/settings/", label: "Settings", icon: "⚙️" },
];

function Shell({ children }: { children: ReactNode }) {
  const { status } = useLock();
  const pathname = normalizePath(usePathname());
  const isActive = (href: string) => {
    const base = normalizePath(href);
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  return (
    <div className="flex h-dvh" inert={status === "loading" || status === "locked"}>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 p-4 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5 px-2 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">Life Trail</span>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
                  : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ServiceWorkerRegister />
        <BackupBanner />
        <main className="min-h-0 flex-1">{children}</main>

        {NAV.length > 1 && (
          <nav className="flex border-t border-zinc-200 bg-white lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
            {NAV.filter((item) => item.mobile !== false).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive(item.href)
                    ? "font-semibold text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-500"
                }`}
              >
                <span aria-hidden="true" className="text-lg">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LockProvider>
      <BackupRunner />
      <Shell>{children}</Shell>
      <LockOverlay />
    </LockProvider>
  );
}
