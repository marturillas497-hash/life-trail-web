"use client";

import Link from "next/link";
import { AppLockCard } from "@/components/lock/AppLockCard";
import { TmdbKeyCard } from "@/components/movies/TmdbKeyCard";
import { InstallCard } from "@/components/pwa/InstallCard";
import { cardClass } from "@/components/ui";
import { useIsClient } from "@/lib/hooks";

export default function SettingsPage() {
  /* Several checks here depend on the browser, so wait until it is running. */
  const isClient = useIsClient();
  if (!isClient) return <p className="p-6 text-sm text-zinc-500">Loading...</p>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
        <h1 className="text-xl font-semibold">Settings</h1>
        <InstallCard />
        <AppLockCard />
        <TmdbKeyCard />
        <section className={cardClass}>
          <h2 className="font-semibold">Backups</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Snapshots, backup files, the backup folder and restoring live on their own page.
          </p>
          <Link href="/backup/" className="mt-3 inline-block text-sm text-indigo-600 underline">
            Open Backup and restore
          </Link>
        </section>
      </div>
    </div>
  );
}
