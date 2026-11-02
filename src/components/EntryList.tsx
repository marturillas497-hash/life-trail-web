"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { formatShortDate } from "@/lib/dates";
import { matchesQuery } from "@/lib/insights";
import { entryPath, newEntryPath, normalizePath, parseId } from "@/lib/paths";
import { useEntries, useTagMap } from "@/lib/hooks";
import type { Tag } from "@/lib/types";
import { TagChip } from "./TagChip";
import { btnPrimary, inputClass } from "./ui";

export function EntryList() {
  const entries = useEntries();
  const tagMap = useTagMap();
  const pathname = normalizePath(usePathname());
  const openId = parseId(useSearchParams().get("id"));
  const viewingEntry = pathname.startsWith("/journal/entry");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    if (!entries || !tagMap) return undefined;
    return entries.filter((entry) =>
      matchesQuery(
        entry,
        query,
        entry.tagIds.map((id) => tagMap.get(id)?.name ?? ""),
      ),
    );
  }, [entries, tagMap, query]);
  const searching = query.trim() !== "";

  return (
    <>
      <header className="flex items-center justify-between border-b border-sand-200 px-4 py-3 dark:border-sand-800">
        <h1 className="text-xl font-semibold">Journal</h1>
        <Link href={newEntryPath()} className={btnPrimary} title="New entry (Alt+N)">
          New entry
        </Link>
      </header>

      {entries && entries.length > 0 && (
        <div className="border-b border-sand-200 px-4 py-2 dark:border-sand-800">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search entries and tags"
            aria-label="Search entries"
            className={inputClass}
          />
          {searching && visible && (
            <p className="mt-1 text-xs text-sand-500" aria-live="polite">
              {visible.length} {visible.length === 1 ? "match" : "matches"}
            </p>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!visible || !entries || !tagMap ? (
          <p className="p-6 text-sm text-sand-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center text-sm text-sand-500">
            Your trail starts here.
            <br />
            Tap New entry to write your first page.
          </p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-sand-500">No entries match your search.</p>
        ) : (
          <ul className="divide-y divide-sand-200 dark:divide-sand-800">
            {visible.map((entry) => {
              const selected = viewingEntry && openId === entry.id;
              const tags = entry.tagIds
                .map((id) => tagMap.get(id))
                .filter((tag): tag is Tag => tag !== undefined);

              return (
                <li key={entry.id}>
                  <Link
                    href={entryPath(entry.id)}
                    aria-current={selected ? "page" : undefined}
                    className={`block px-4 py-3 transition-colors ${
                      selected
                        ? "bg-brand-50 dark:bg-brand-950/40"
                        : "hover:bg-sand-50 dark:hover:bg-sand-900"
                    }`}
                  >
                    <div className="text-xs font-medium text-sand-500">
                      {formatShortDate(entry.date)}
                    </div>
                    {entry.title && (
                      <div className="mt-0.5 font-medium">{entry.title}</div>
                    )}
                    {entry.body && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-sand-600 dark:text-sand-400">
                        {entry.body}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <TagChip key={tag.id} tag={tag} size="sm" />
                      ))}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
