"use client";

import Link from "next/link";
import { useState } from "react";
import { FolderBackupCard } from "@/components/backup/FolderBackupCard";
import { ImagesCard } from "@/components/backup/ImagesCard";
import { QuickBackupCard } from "@/components/backup/QuickBackupCard";
import { ManualBackupCard } from "@/components/backup/ManualBackupCard";
import { RestoreFileCard } from "@/components/backup/RestoreFileCard";
import { SnapshotsCard } from "@/components/backup/SnapshotsCard";
import { StatusCard } from "@/components/backup/StatusCard";
import { useIsClient } from "@/lib/hooks";

export default function BackupPage() {
  /* Several checks here depend on the browser, so wait until it is running. */
  const isClient = useIsClient();
  const [notice, setNotice] = useState<string | null>(null);

  if (!isClient) return <p className="p-6 text-sm text-sand-500">Loading...</p>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Backup and restore</h1>
          <Link href="/help/" className="text-sm text-brand-600 underline">
            How it works
          </Link>
        </header>

        {notice && (
          <p
            role="status"
            className="rounded-lg bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100"
          >
            {notice}
          </p>
        )}

        <QuickBackupCard />
        <StatusCard />
        <ManualBackupCard />
        <ImagesCard />
        <FolderBackupCard />
        <SnapshotsCard onRestored={setNotice} />
        <RestoreFileCard onRestored={setNotice} />
      </div>
    </div>
  );
}
