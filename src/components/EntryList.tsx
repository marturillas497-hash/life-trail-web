"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatShortDate } from "@/lib/dates";
import { useEntries, useTagMap } from "@/lib/hooks";
import type { Tag } from "@/lib/types";
import { TagChip } from "./TagChip";
import { btnPrimary } from "./ui";

export function EntryList() {
  const entries = useEntries();
  const tagMap = useTagMap();
  const pathname = usePathname();

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-xl font-semibold">Journal</h1>
        <Link href="/journal/new" className={btnPrimary} title="New entry (Alt+N)">
          New entry
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!entries || !tagMap ? (
          <p className="p-6 text-sm text-zinc-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-500">
            No entries yet.
            <br />
            Tap New entry to write your first one.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {entries.map((entry) => {
              const href = `/journal/${entry.id}`;
              const selected = pathname === href || pathname.startsWith(`${href}/`);
              const tags = entry.tagIds
                .map((id) => tagMap.get(id))
                .filter((tag): tag is Tag => tag !== undefined);

              return (
                <li key={entry.id}>
                  <Link
                    href={href}
                    aria-current={selected ? "page" : undefined}
                    className={`block px-4 py-3 transition-colors ${
                      selected
                        ? "bg-indigo-50 dark:bg-indigo-950/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-500">
                      {formatShortDate(entry.date)}
                    </div>
                    {entry.title && (
                      <div className="mt-0.5 font-medium">{entry.title}</div>
                    )}
                    {entry.body && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
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
