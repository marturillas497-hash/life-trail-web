"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { getFolderState, type FolderState } from "./files";
import { backupDb, type Snapshot } from "./store";

export type SnapshotSummary = Omit<Snapshot, "data">;

const DAY_MS = 24 * 60 * 60 * 1000;
export const BACKUP_DUE_AFTER_DAYS = 7;
const NEW_USER_GRACE_DAYS = 2;

/* Newest first, without the heavy journal data. */
export function useSnapshots() {
  return useLiveQuery(async (): Promise<SnapshotSummary[]> => {
    const rows = await backupDb.snapshots.orderBy("createdAt").reverse().toArray();
    return rows.map((row) => {
      const { data, ...summary } = row;
      void data;
      return summary;
    });
  });
}

/* undefined while loading, then { value } where value may itself be undefined. */
export function useSetting<T>(key: string) {
  return useLiveQuery(
    async () => ({ value: (await backupDb.settings.get(key))?.value as T | undefined }),
    [key],
  );
}

export function useFolderState() {
  const handle = useSetting<unknown>("folderHandle");
  const [state, setState] = useState<FolderState>("checking");
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getFolderState().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [handle, checks]);

  /* Call after something may have changed the folder permission. */
  const refresh = useCallback(() => setChecks((count) => count + 1), []);

  return { state, refresh };
}

export function useJournalInfo() {
  return useLiveQuery(async () => {
    const oldestEntry = (await db.entries.orderBy("createdAt").first())?.createdAt;
    const oldestMovie = (await db.movieLogs.orderBy("createdAt").first())?.createdAt;
    const oldest = [oldestEntry, oldestMovie].filter((value): value is number => value !== undefined);
    return {
      entryCount: await db.entries.count(),
      movieLogCount: await db.movieLogs.count(),
      oldestEntryAt: oldest.length > 0 ? Math.min(...oldest) : undefined,
    };
  });
}

/* True when a file backup is overdue and the person has not snoozed the reminder. */
export function useBackupDue(): boolean {
  const info = useJournalInfo();
  const lastBackup = useSetting<number>("lastFileBackupAt");
  const remindAfter = useSetting<number>("remindAfter");
  const [now] = useState(() => Date.now());

  return useMemo(() => {
    if (!info || !lastBackup || !remindAfter) return false;
    if (info.entryCount + info.movieLogCount === 0) return false;
    if (remindAfter.value !== undefined && now < remindAfter.value) return false;

    if (lastBackup.value === undefined) {
      const oldest = info.oldestEntryAt ?? now;
      return now - oldest > NEW_USER_GRACE_DAYS * DAY_MS;
    }
    return now - lastBackup.value > BACKUP_DUE_AFTER_DAYS * DAY_MS;
  }, [info, lastBackup, remindAfter, now]);
}

export function describeAge(ms: number, now: number): string {
  const days = Math.floor((now - ms) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
