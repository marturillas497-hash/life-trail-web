import { WEEK_START } from "./calendar";
import { makeKey } from "./dates";

export type WatchView = "week" | "month" | "year" | "all";

/* Both ends are YYYY-MM-DD and inclusive. */
export type WatchRange = { start: string; end: string };

function parse(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toKey(date: Date): string {
  return makeKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(key: string, days: number): string {
  const date = parse(key);
  date.setDate(date.getDate() + days);
  return toKey(date);
}

/* The days covered by the view around `anchor`, or null for All time. */
export function rangeFor(view: WatchView, anchor: string): WatchRange | null {
  const date = parse(anchor);
  if (view === "all") return null;
  if (view === "week") {
    const start = addDays(anchor, -((date.getDay() - WEEK_START + 7) % 7));
    return { start, end: addDays(start, 6) };
  }
  if (view === "month") {
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return {
      start: makeKey(date.getFullYear(), date.getMonth(), 1),
      end: makeKey(date.getFullYear(), date.getMonth(), last),
    };
  }
  return { start: `${date.getFullYear()}-01-01`, end: `${date.getFullYear()}-12-31` };
}

/* Moves the anchor one week, month or year. Months and years land on the first day. */
export function shiftAnchor(view: WatchView, anchor: string, step: number): string {
  const date = parse(anchor);
  if (view === "week") return addDays(anchor, 7 * step);
  if (view === "month") return toKey(new Date(date.getFullYear(), date.getMonth() + step, 1));
  if (view === "year") return toKey(new Date(date.getFullYear() + step, 0, 1));
  return anchor;
}

export function rangeTitle(view: WatchView, anchor: string): string {
  const range = rangeFor(view, anchor);
  if (!range) return "All time";
  const start = parse(range.start);
  const end = parse(range.end);
  if (view === "year") return String(start.getFullYear());
  if (view === "month") {
    return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const from = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const to = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${from} to ${to}`;
}

export function inRange(date: string, range: WatchRange | null): boolean {
  return range === null || (date >= range.start && date <= range.end);
}
