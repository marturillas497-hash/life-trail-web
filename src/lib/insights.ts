import type { Entry } from "./types";

export type Period =
  | { kind: "month"; year: number; month: number }
  | { kind: "year"; year: number }
  | { kind: "all" };

const DAY_MS = 86_400_000;

function dayNumber(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/* Month is 0 to 11. */
export function periodPrefix(period: Period): string {
  if (period.kind === "all") return "";
  if (period.kind === "year") return `${period.year}-`;
  return `${period.year}-${String(period.month + 1).padStart(2, "0")}-`;
}

export function entriesInPeriod(entries: Entry[], period: Period): Entry[] {
  const prefix = periodPrefix(period);
  return prefix ? entries.filter((entry) => entry.date.startsWith(prefix)) : entries;
}

export function shiftPeriod(period: Period, step: number): Period {
  if (period.kind === "all") return period;
  if (period.kind === "year") return { kind: "year", year: period.year + step };
  const index = period.year * 12 + period.month + step;
  return { kind: "month", year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

export function periodTitle(period: Period): string {
  if (period.kind === "all") return "All time";
  if (period.kind === "year") return String(period.year);
  return new Date(period.year, period.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export type WritingStats = {
  entries: number;
  activeDays: number;
  words: number;
  averageWords: number;
};

export function writingStats(entries: Entry[]): WritingStats {
  const words = entries.reduce((sum, entry) => sum + wordCount(entry.body), 0);
  return {
    entries: entries.length,
    activeDays: new Set(entries.map((entry) => entry.date)).size,
    words,
    averageWords: entries.length ? Math.round(words / entries.length) : 0,
  };
}

/*
A streak is a run of days that each have at least one entry.
The current streak stays alive if you have written today or yesterday.
*/
export function streaks(entries: Entry[], today: string): { current: number; longest: number } {
  const days = [...new Set(entries.map((entry) => dayNumber(entry.date)))].sort((a, b) => a - b);
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const have = new Set(days);
  const todayNumber = dayNumber(today);
  let cursor = have.has(todayNumber) ? todayNumber : todayNumber - 1;
  let current = 0;
  while (have.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, longest };
}

export type TagCount = { tagId: number; count: number };

/* How many entries used each tag, most used first. Ties keep the older tag first. */
export function tagCounts(entries: Entry[]): TagCount[] {
  const counts = new Map<number, number>();
  for (const entry of entries) {
    for (const id of new Set(entry.tagIds)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tagId, count]) => ({ tagId, count }))
    .sort((a, b) => b.count - a.count || a.tagId - b.tagId);
}

/* Every word in the query must appear in the title, body or a tag name. */
export function matchesQuery(entry: Entry, query: string, tagNames: string[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${entry.title}\n${entry.body}\n${tagNames.join(" ")}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}
