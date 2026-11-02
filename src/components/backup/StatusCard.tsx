"use client";

import { useState } from "react";
import { describeAge, useJournalInfo, useSetting, useSnapshots } from "@/lib/backup/hooks";
import { formatDateTime } from "@/lib/dates";
import { cardClass } from "../ui";

export function StatusCard() {
  const info = useJournalInfo();
  const snapshots = useSnapshots();
  const lastFile = useSetting<number>("lastFileBackupAt");
  const persisted = useSetting<boolean>("storagePersisted");
  const folderError = useSetting<string>("folderError");
  const [now] = useState(() => Date.now());

  const lastAuto = snapshots?.find((snapshot) => snapshot.kind === "auto");
  const lastFileAt = lastFile?.value;
  const noFileYet = lastFile !== undefined && lastFileAt === undefined;

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Status</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-sand-500">Journal</dt>
        <dd>
          {info === undefined
            ? "Loading..."
            : `${info.entryCount} ${info.entryCount === 1 ? "entry" : "entries"}${
                info.movieLogCount > 0
                  ? `, ${info.movieLogCount} movie ${info.movieLogCount === 1 ? "viewing" : "viewings"}`
                  : ""
              }`}
        </dd>

        <dt className="text-sand-500">Last snapshot</dt>
        <dd>
          {snapshots === undefined
            ? "Loading..."
            : lastAuto
              ? formatDateTime(lastAuto.createdAt)
              : "None yet (the first one is saved once you have an entry or a movie)"}
        </dd>

        <dt className="text-sand-500">Last file backup</dt>
        <dd>
          {lastFile === undefined
            ? "Loading..."
            : lastFileAt === undefined
              ? "Never"
              : `${describeAge(lastFileAt, now)} (${formatDateTime(lastFileAt)})`}
        </dd>

        <dt className="text-sand-500">Browser storage</dt>
        <dd>
          {persisted === undefined || persisted.value === undefined
            ? "Not checked yet"
            : persisted.value
              ? "Protected: the browser will not clear it when space runs low"
              : "Not guaranteed: the browser may clear it if the device runs low on space"}
        </dd>
      </dl>

      {folderError?.value && (
        <p className="mt-3 text-sm text-red-600">
          The last backup to your folder failed: {folderError.value}
        </p>
      )}

      {noFileYet && info && info.entryCount + info.movieLogCount > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          You have no backup file yet. Snapshots live inside this browser, so they cannot help if
          the browser data is cleared. Download a backup file below, or set up a backup folder.
        </p>
      )}
    </section>
  );
}
