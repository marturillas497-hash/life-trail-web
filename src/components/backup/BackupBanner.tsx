"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { downloadBackup, grantFolderAccess } from "@/lib/backup/files";
import { useBackupDue, useFolderState } from "@/lib/backup/hooks";
import { setSetting } from "@/lib/backup/store";
import { isNative } from "@/lib/native/platform";
import { normalizePath } from "@/lib/paths";
import { btnPrimary, btnSecondary } from "../ui";

const DAY_MS = 24 * 60 * 60 * 1000;

export function BackupBanner() {
  const pathname = normalizePath(usePathname());
  const due = useBackupDue();
  const { state, refresh } = useFolderState();
  const [busy, setBusy] = useState(false);

  if (pathname === "/backup" || pathname === "/help") return null;

  const bar =
    "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100";

  if (state === "needs-permission") {
    return (
      <div className={bar} role="status">
        <span className="mr-auto">
          Allow access to your backup folder so automatic backups can continue.
        </span>
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await grantFolderAccess();
            } finally {
              refresh();
              setBusy(false);
            }
          }}
        >
          Allow
        </button>
      </div>
    );
  }

  if (due && state !== "ready") {
    return (
      <div className={bar} role="status">
        <span className="mr-auto">Your journal has not been backed up to a file for a while.</span>
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await downloadBackup();
            } finally {
              setBusy(false);
            }
          }}
        >
          {isNative() ? "Back up now" : "Download backup"}
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => void setSetting("remindAfter", Date.now() + DAY_MS)}
        >
          Remind me tomorrow
        </button>
        <Link href="/backup/" className="underline">
          More options
        </Link>
      </div>
    );
  }

  return null;
}
