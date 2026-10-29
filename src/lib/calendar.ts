import type { Entry } from "./types";

/* 0 = Sunday first, 1 = Monday first. */
export const WEEK_START = 0;

/* `month` is 0 to 11, like Date. */
export type MonthCursor = { year: number; month: number };

export function shiftMonth(cursor: MonthCursor, delta: number): MonthCursor {
  const date = new Date(cursor.year, cursor.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/* `leading` is how many empty cells come before the 1st. */
export function monthLayout(cursor: MonthCursor, weekStart: number = WEEK_START) {
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  return {
    leading: (firstWeekday - weekStart + 7) % 7,
    daysInMonth: new Date(cursor.year, cursor.month + 1, 0).getDate(),
  };
}

export function monthTitle(cursor: MonthCursor): string {
  return new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function weekdayLabels(weekStart: number = WEEK_START): string[] {
  /* January 7, 2024 was a Sunday. */
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 7 + ((i + weekStart) % 7)).toLocaleDateString(undefined, {
      weekday: "short",
    }),
  );
}

/* Tag ids used on a day, most used first, ties broken by oldest tag. */
export function topTagIds(entries: Entry[]): number[] {
  const counts = new Map<number, number>();
  for (const entry of entries) {
    for (const id of entry.tagIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([id]) => id);
}

export function groupByDate(entries: Entry[]): Map<string, Entry[]> {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.date);
    if (list) list.push(entry);
    else groups.set(entry.date, [entry]);
  }
  return groups;
}
