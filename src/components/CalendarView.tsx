"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  groupByDate,
  monthLayout,
  monthTitle,
  shiftMonth,
  topTagIds,
  weekdayLabels,
  type MonthCursor,
} from "@/lib/calendar";
import { formatFullDate, makeKey, todayKey } from "@/lib/dates";
import { useMonthEntries, useTagMap } from "@/lib/hooks";
import type { Entry, Tag } from "@/lib/types";
import { TagChip } from "./TagChip";
import { btnPrimary, btnSecondary } from "./ui";

const MAX_EMOJIS = 3;

export function CalendarView() {
  const [today] = useState(() => todayKey());
  const [cursor, setCursor] = useState<MonthCursor>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  const entries = useMonthEntries(cursor.year, cursor.month);
  const tagMap = useTagMap();
  const byDay = useMemo(() => groupByDate(entries ?? []), [entries]);
  const weekdays = useMemo(() => weekdayLabels(), []);

  const { leading, daysInMonth } = monthLayout(cursor);
  const monthCount = entries?.length ?? 0;
  const selectedEntries = (byDay.get(selected) ?? [])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);
  const canWrite = selected <= today;

  function goTo(next: MonthCursor) {
    setCursor(next);
    const isCurrentMonth = makeKey(next.year, next.month, 1) === `${today.slice(0, 8)}01`;
    setSelected(isCurrentMonth ? today : makeKey(next.year, next.month, 1));
  }

  function emojisFor(dayEntries: Entry[]): string[] {
    if (!tagMap) return [];
    return topTagIds(dayEntries)
      .map((id) => tagMap.get(id))
      .filter((tag): tag is Tag => tag !== undefined)
      .map((tag) => tag.emoji);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:flex-row lg:p-8">
        <section className="min-w-0 flex-1">
          <header className="flex items-center gap-2">
            <h1 className="mr-auto text-xl font-semibold">{monthTitle(cursor)}</h1>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => goTo(shiftMonth(cursor, -1))}
              aria-label="Previous month"
            >
              &larr;
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                const now = new Date();
                setCursor({ year: now.getFullYear(), month: now.getMonth() });
                setSelected(today);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => goTo(shiftMonth(cursor, 1))}
              aria-label="Next month"
            >
              &rarr;
            </button>
          </header>

          <p className="mt-1 text-sm text-zinc-500">
            {entries === undefined
              ? "Loading..."
              : monthCount === 1
                ? "1 entry this month"
                : `${monthCount} entries this month`}
          </p>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
            {weekdays.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: leading }, (_, i) => (
              <div key={`blank-${i}`} aria-hidden="true" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = makeKey(cursor.year, cursor.month, day);
              const dayEntries = byDay.get(key) ?? [];
              const emojis = emojisFor(dayEntries);
              const isSelected = key === selected;
              const isToday = key === today;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={isSelected}
                  aria-label={`${formatFullDate(key)}, ${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"}`}
                  className={`flex min-h-16 flex-col items-center gap-1 rounded-lg border p-1 pt-1.5 text-sm transition-colors lg:min-h-24 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday ? "bg-indigo-600 text-white" : ""
                    }`}
                  >
                    {day}
                  </span>
                  {emojis.length > 0 && (
                    <span className="flex flex-wrap justify-center text-sm leading-tight lg:text-lg">
                      {emojis.slice(0, MAX_EMOJIS).map((emoji, index) => (
                        <span key={index}>{emoji}</span>
                      ))}
                      {emojis.length > MAX_EMOJIS && (
                        <span className="self-center text-[10px] text-zinc-500">
                          +{emojis.length - MAX_EMOJIS}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="lg:w-96 lg:shrink-0">
          <h2 className="font-semibold">{formatFullDate(selected)}</h2>

          {canWrite && (
            <Link href={`/journal/new?date=${selected}`} className={`${btnPrimary} mt-3`}>
              {selected === today ? "Write today's entry" : "Write an entry for this day"}
            </Link>
          )}

          <ul className="mt-4 space-y-3">
            {entries === undefined || !tagMap ? (
              <li className="text-sm text-zinc-500">Loading...</li>
            ) : selectedEntries.length === 0 ? (
              <li className="text-sm text-zinc-500">No entries on this day.</li>
            ) : (
              selectedEntries.map((entry) => {
                const tags = entry.tagIds
                  .map((id) => tagMap.get(id))
                  .filter((tag): tag is Tag => tag !== undefined);
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/journal/${entry.id}`}
                      className="block rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      {entry.title && <div className="font-medium">{entry.title}</div>}
                      {entry.body && (
                        <p className="mt-0.5 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
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
              })
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
