import { todayKey } from "../dates";

export type SnapshotKind = "auto" | "manual" | "pre-restore" | "pre-upgrade";

type Row = { id: number; createdAt: number };

const KEEP_AUTO_RECENT = 7;
const KEEP_AUTO_WEEKS = 4;
const KEEP_MANUAL = 10;
const KEEP_PRE_RESTORE = 5;
const KEEP_PRE_UPGRADE = 3;

/* The Monday of the local week a timestamp falls in, as YYYY-MM-DD. */
export function weekKey(ms: number): string {
  const date = new Date(ms);
  const sinceMonday = (date.getDay() + 6) % 7;
  return todayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - sinceMonday));
}

/*
Which snapshots to keep. Pass rows newest first.
Automatic: the 7 newest, plus the newest one of each of the last 4 weeks.
Manual, before-restore and before-update snapshots just keep the newest few.
*/
export function selectIdsToKeep(rowsNewestFirst: Row[], kind: SnapshotKind): Set<number> {
  if (kind === "manual") {
    return new Set(rowsNewestFirst.slice(0, KEEP_MANUAL).map((row) => row.id));
  }
  if (kind === "pre-restore") {
    return new Set(rowsNewestFirst.slice(0, KEEP_PRE_RESTORE).map((row) => row.id));
  }
  if (kind === "pre-upgrade") {
    return new Set(rowsNewestFirst.slice(0, KEEP_PRE_UPGRADE).map((row) => row.id));
  }

  const keep = new Set(rowsNewestFirst.slice(0, KEEP_AUTO_RECENT).map((row) => row.id));
  const seenWeeks = new Set<string>();
  for (const row of rowsNewestFirst) {
    const week = weekKey(row.createdAt);
    if (seenWeeks.has(week)) continue;
    if (seenWeeks.size >= KEEP_AUTO_WEEKS) break;
    seenWeeks.add(week);
    keep.add(row.id);
  }
  return keep;
}
