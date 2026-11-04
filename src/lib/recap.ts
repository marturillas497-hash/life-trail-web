import { tagCounts, tagShares, weekdayMoods, wordCount, type TagShare, type WeekdayMood } from "./insights";
import { plainText, referencedImageIds } from "./markdown";
import type { Entry, Movie, MovieLog } from "./types";

export type Watched = { log: MovieLog; movie: Movie };

const DAY_MS = 86_400_000;

function dayNumber(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

function keyOf(dayNum: number): string {
  const date = new Date(dayNum * DAY_MS);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export type Run = { length: number; start: string; end: string };

/* The longest stretch of days in a row among the given dates. */
export function longestRun(dates: string[]): Run | null {
  const days = [...new Set(dates.map(dayNumber))].sort((a, b) => a - b);
  if (days.length === 0) return null;
  let best: Run = { length: 1, start: keyOf(days[0]), end: keyOf(days[0]) };
  let startIndex = 0;
  for (let i = 1; i <= days.length; i++) {
    if (i === days.length || days[i] - days[i - 1] !== 1) {
      const length = i - startIndex;
      if (length > best.length) best = { length, start: keyOf(days[startIndex]), end: keyOf(days[i - 1]) };
      startIndex = i;
    }
  }
  return best;
}

export function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/* How many days of the year count: all of them for past years, up to today for the current one. */
export function daysCovered(year: number, today: string): number {
  const currentYear = Number(today.slice(0, 4));
  if (year > currentYear) return 0;
  if (year < currentYear) return daysInYear(year);
  return dayNumber(today) - dayNumber(`${year}-01-01`) + 1;
}

export type MonthSummary = { month: number; entries: number; topTagId: number | null };

export type Recap = {
  year: number;
  writing: {
    entries: number;
    activeDays: number;
    daysCovered: number;
    words: number;
    averageWords: number;
    pictures: number;
    longestEntry: { entry: Entry; words: number } | null;
    firstEntry: Entry | null;
    longestStreak: Run | null;
    busiestMonth: MonthSummary | null;
    busiestWeekday: WeekdayMood | null;
  };
  months: MonthSummary[];
  weekdays: WeekdayMood[];
  feelings: TagShare[];
  watched: {
    logs: number;
    titles: number;
    movies: number;
    shows: number;
    rewatches: number;
    averageRating: number;
    top: Watched[];
    mostRewatched: { movie: Movie; count: number } | null;
    busiestMonth: { month: number; count: number } | null;
  };
  hasData: boolean;
};

function busiest<T extends { entries: number }>(list: T[]): T | null {
  let best: T | null = null;
  for (const item of list) if (item.entries > 0 && (!best || item.entries > best.entries)) best = item;
  return best;
}

export function buildRecap(year: number, entries: Entry[], watched: Watched[], today: string): Recap {
  const prefix = `${year}-`;
  const yearEntries = entries.filter((entry) => entry.date.startsWith(prefix));
  const yearWatched = watched.filter((item) => item.log.watchedDate.startsWith(prefix));

  const words = yearEntries.map((entry) => wordCount(plainText(entry.body)));
  const totalWords = words.reduce((sum, count) => sum + count, 0);
  let longest: Recap["writing"]["longestEntry"] = null;
  yearEntries.forEach((entry, i) => {
    if (words[i] > 0 && (!longest || words[i] > longest.words)) longest = { entry, words: words[i] };
  });
  const first = [...yearEntries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)[0] ?? null;

  const months: MonthSummary[] = Array.from({ length: 12 }, (_, month) => {
    const list = yearEntries.filter((entry) => Number(entry.date.slice(5, 7)) === month + 1);
    return { month, entries: list.length, topTagId: tagCounts(list)[0]?.tagId ?? null };
  });
  const weekdays = weekdayMoods(yearEntries, 0);

  /* Watching */
  const byMovie = new Map<number, Watched[]>();
  for (const item of yearWatched) {
    const list = byMovie.get(item.movie.id);
    if (list) list.push(item);
    else byMovie.set(item.movie.id, [item]);
  }
  const titles = [...byMovie.values()];
  const best = titles
    .map((list) => [...list].sort((a, b) => b.log.rating - a.log.rating || b.log.watchedDate.localeCompare(a.log.watchedDate))[0])
    .sort((a, b) => b.log.rating - a.log.rating || b.log.watchedDate.localeCompare(a.log.watchedDate));
  let rewatched: Recap["watched"]["mostRewatched"] = null;
  for (const list of titles) {
    if (list.length >= 2 && (!rewatched || list.length > rewatched.count)) rewatched = { movie: list[0].movie, count: list.length };
  }
  const watchMonths = Array.from({ length: 12 }, (_, month) => ({
    month,
    entries: yearWatched.filter((item) => Number(item.log.watchedDate.slice(5, 7)) === month + 1).length,
  }));
  const watchBusiest = busiest(watchMonths);

  return {
    year,
    writing: {
      entries: yearEntries.length,
      activeDays: new Set(yearEntries.map((entry) => entry.date)).size,
      daysCovered: daysCovered(year, today),
      words: totalWords,
      averageWords: yearEntries.length ? Math.round(totalWords / yearEntries.length) : 0,
      pictures: referencedImageIds(yearEntries.map((entry) => entry.body)).size,
      longestEntry: longest,
      firstEntry: first,
      longestStreak: longestRun(yearEntries.map((entry) => entry.date)),
      busiestMonth: busiest(months),
      busiestWeekday: busiest(weekdays),
    },
    months,
    weekdays,
    feelings: tagShares(yearEntries, null),
    watched: {
      logs: yearWatched.length,
      titles: titles.length,
      movies: titles.filter((list) => list[0].movie.kind === "movie").length,
      shows: titles.filter((list) => list[0].movie.kind === "tv").length,
      rewatches: yearWatched.length - titles.length,
      averageRating: yearWatched.length ? yearWatched.reduce((sum, item) => sum + item.log.rating, 0) / yearWatched.length : 0,
      top: best.slice(0, 5),
      mostRewatched: rewatched,
      busiestMonth: watchBusiest ? { month: watchBusiest.month, count: watchBusiest.entries } : null,
    },
    hasData: yearEntries.length > 0 || yearWatched.length > 0,
  };
}

/* Years that have entries or viewings, newest first. */
export function recapYears(entries: Entry[], watched: Watched[]): number[] {
  const years = new Set<number>();
  for (const entry of entries) years.add(Number(entry.date.slice(0, 4)));
  for (const item of watched) years.add(Number(item.log.watchedDate.slice(0, 4)));
  return [...years].sort((a, b) => b - a);
}
