"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { normalizePath } from "@/lib/paths";
import { useSyncExternalStore, type ReactNode } from "react";
import { isCollapsed, setCollapsed, subscribeSidebar } from "@/lib/sidebar";
import { BackupBanner } from "./backup/BackupBanner";
import { BackupRunner } from "./backup/BackupRunner";
import { LockOverlay } from "./lock/LockOverlay";
import { ServiceWorkerRegister } from "./pwa/ServiceWorkerRegister";
import { LockProvider, useLock } from "@/lib/lock/context";
import { useQuickBackup } from "./backup/useQuickBackup";

/* Add an item here and it shows up in the sidebar and the phone tab bar. */
const NAV: { href: string; label: string; icon: string; mobile?: boolean }[] = [
  { href: "/journal/", label: "Journal", icon: "📓" },
  { href: "/calendar/", label: "Calendar", icon: "🗓️" },
  { href: "/movies/", label: "Movies", icon: "🎬" },
  { href: "/insights/", label: "Insights", icon: "📊" },
  { href: "/tags/", label: "Tags", icon: "🏷️" },
  { href: "/backup/", label: "Backup", icon: "🛡️", mobile: false },
  { href: "/settings/", label: "Settings", icon: "⚙️" },
];

function Shell({ children }: { children: ReactNode }) {
  const { status } = useLock();
  const collapsed = useSyncExternalStore(subscribeSidebar, isCollapsed, () => false);
  const quickBackup = useQuickBackup();
  const pathname = normalizePath(usePathname());
  const isActive = (href: string) => {
    const base = normalizePath(href);
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  return (
    <div className="flex h-dvh" inert={status === "loading" || status === "locked"}>
      <aside className="hidden w-60 shrink-0 flex-col overflow-hidden border-r border-sand-200 bg-sand-50 p-3 transition-[width] duration-300 ease-in-out motion-reduce:transition-none lg:flex collapsed:w-[4.5rem] dark:border-sand-800 dark:bg-sand-900">
        <div className="flex items-center gap-2.5 whitespace-nowrap px-1.5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
          <span className="font-display text-xl font-semibold tracking-tight transition-opacity duration-200 collapsed:opacity-0">
            Life Trail
          </span>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
                isActive(item.href)
                  ? "bg-gold-100 text-sand-900 dark:bg-gold-400/15 dark:text-gold-200"
                  : "text-sand-700 hover:bg-sand-200 dark:text-sand-300 dark:hover:bg-sand-800"
              }`}
            >
              <span aria-hidden="true" className="w-6 shrink-0 text-center">
                {item.icon}
              </span>
              <span className="ml-3 transition-opacity duration-200 collapsed:opacity-0">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={quickBackup.run}
          disabled={quickBackup.busy}
          title={quickBackup.feedback?.long ?? "Back up now"}
          aria-label="Back up now"
          className={`mt-auto flex items-center overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-400 disabled:opacity-70 ${
            quickBackup.feedback?.failed ? "bg-red-600 hover:bg-red-500" : "bg-brand-600 hover:bg-brand-500 active:bg-brand-700"
          }`}
        >
          <span aria-hidden="true" className="w-6 shrink-0 text-center">
            💾
          </span>
          <span className="ml-3 transition-opacity duration-200 collapsed:opacity-0">
            {quickBackup.busy ? "Backing up..." : (quickBackup.feedback?.short ?? "Back up now")}
          </span>
        </button>
        <span role="status" className="sr-only">
          {quickBackup.feedback?.long}
        </span>
        <Link
          href="/guide/"
          title={collapsed ? "How to use" : undefined}
          aria-current={isActive("/guide/") ? "page" : undefined}
          className={`mt-1 flex items-center overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
            isActive("/guide/")
              ? "bg-gold-100 text-sand-900 dark:bg-gold-400/15 dark:text-gold-200"
              : "text-sand-700 hover:bg-sand-200 dark:text-sand-300 dark:hover:bg-sand-800"
          }`}
        >
          <span aria-hidden="true" className="w-6 shrink-0 text-center">
            ❓
          </span>
          <span className="ml-3 transition-opacity duration-200 collapsed:opacity-0">How to use</span>
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-1 flex items-center overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-sand-600 hover:bg-sand-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 dark:text-sand-400 dark:hover:bg-sand-800"
        >
          <span
            aria-hidden="true"
            className={`w-6 shrink-0 text-center text-base transition-transform duration-300 motion-reduce:transition-none ${collapsed ? "rotate-180" : ""}`}
          >
            «
          </span>
          <span className="ml-3 transition-opacity duration-200 collapsed:opacity-0">Collapse</span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ServiceWorkerRegister />
        <BackupBanner />
        <main className="min-h-0 flex-1">{children}</main>

        {NAV.length > 1 && (
          <nav className="flex border-t border-sand-200 bg-sand-50 lg:hidden dark:border-sand-800 dark:bg-sand-950">
            {NAV.filter((item) => item.mobile !== false).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive(item.href)
                    ? "font-semibold text-brand-600 dark:text-brand-400"
                    : "text-sand-500"
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
