"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatFullDate, formatShortDate, makeKey, todayKey } from "@/lib/dates";
import { useEntries, useMovieLogs, useTagMap } from "@/lib/hooks";
import { dayTopTag, streaks } from "@/lib/insights";
import { previewText } from "@/lib/markdown";
import { promptFor } from "@/lib/dailyNote";
import { addMoviePath, dailyNotePath, editEntryPath, entryPath, movieLogPath, newEntryPath, recapPath } from "@/lib/paths";
import { buildRecap } from "@/lib/recap";
import type { Entry } from "@/lib/types";
import { Poster } from "../movies/Poster";
import { StarDisplay } from "../movies/StarRating";
import { btnPrimary, btnSecondary, cardClass } from "../ui";

function greeting(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* The last seven days, oldest first, ending with the given day. */
function lastDays(today: string, count: number): string[] {
  const [year, month, day] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month - 1, day - (count - 1 - i));
    return makeKey(date.getFullYear(), date.getMonth(), date.getDate());
  });
}

function weekdayShort(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "short" });
}

function preview(entry: Entry): string {
  return entry.title || previewText(entry.body).slice(0, 90) || "Untitled";
}

function SectionHeader({ title, href, label }: { title: string; href?: string; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-semibold">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
          {label ?? "See all"}
        </Link>
      )}
    </div>
  );
}

export function HomeView() {
  const [today] = useState(() => todayKey());
  const [hour] = useState(() => new Date().getHours());
  const entries = useEntries();
  const logs = useMovieLogs();
  const tagMap = useTagMap();

  const byDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries ?? []) {
      const list = map.get(entry.date);
      if (list) list.push(entry);
      else map.set(entry.date, [entry]);
    }
    return map;
  }, [entries]);

  if (!entries || !logs || !tagMap) return <p className="p-6 text-sm text-sand-500">Loading...</p>;

  const month = today.slice(0, 7);
  const todays = [...(byDate.get(today) ?? [])].sort((a, b) => a.createdAt - b.createdAt);
  const streak = streaks(entries, today).current;
  const monthEntries = entries.filter((entry) => entry.date.startsWith(month)).length;
  const monthWatched = logs.filter((item) => item.log.watchedDate.startsWith(month)).length;
  const days = lastDays(today, 7);

  const onThisDay = entries.filter((entry) => entry.date.slice(5) === today.slice(5) && entry.date < today);
  const recent = entries.slice(0, 3);
  const watched = [...logs]
    .sort((a, b) => b.log.watchedDate.localeCompare(a.log.watchedDate) || b.log.createdAt - a.log.createdAt)
    .slice(0, 3);
  const firstTime = entries.length === 0 && logs.length === 0;

  /* The recap shows up for the last two months of the year, and in January for the year that just ended. */
  const monthNumber = Number(today.slice(5, 7));
  const recapYear = monthNumber >= 11 ? Number(today.slice(0, 4)) : monthNumber === 1 ? Number(today.slice(0, 4)) - 1 : null;
  const recap = recapYear !== null ? buildRecap(recapYear, entries, logs, today) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        <section className="relative overflow-hidden rounded-3xl border border-sand-200 bg-gradient-to-br from-gold-100 via-sand-50 to-brand-50 p-6 shadow-sm dark:border-sand-800 dark:from-brand-900/70 dark:via-sand-900 dark:to-sand-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.png"
            alt=""
            width={160}
            height={160}
            className="pointer-events-none absolute -right-4 -top-4 size-36 opacity-20 sm:size-40"
          />
          <p className="text-sm text-sand-600 dark:text-sand-300">{formatFullDate(today)}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{greeting(hour)}</h1>
          {firstTime ? (
            <p className="mt-2 max-w-md text-sm text-sand-700 dark:text-sand-200">
              Welcome to Life Trail. Write your first entry to start your trail, or read the guide to see what you can do.
            </p>
          ) : todays.length === 0 ? (
            <>
              <p className="mt-2 text-sand-700 dark:text-sand-200">Where did today take you?</p>
              <p className="mt-1 max-w-md text-sm italic text-sand-600 dark:text-sand-300">{promptFor(today)}</p>
            </>
          ) : (
            <p className="mt-2 text-sand-700 dark:text-sand-200">
              You have written {todays.length} {todays.length === 1 ? "entry" : "entries"} today. Nice.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {todays.length === 0 ? (
              <Link href={dailyNotePath()} className={btnPrimary} title="Today's note (Alt+T)">
                Open today&apos;s note
              </Link>
            ) : (
              <>
                <Link href={editEntryPath(todays[0].id)} className={btnPrimary} title="Today's note (Alt+T)">
                  Continue today&apos;s note
                </Link>
                <Link href={entryPath(todays[0].id)} className={btnSecondary}>
                  Read it
                </Link>
                <Link href={newEntryPath()} className={btnSecondary}>
                  Write another
                </Link>
              </>
            )}
            <Link href={addMoviePath()} className={btnSecondary}>
              Log a movie or show
            </Link>
            {firstTime && (
              <Link href="/guide/" className={btnSecondary}>
                How to use
              </Link>
            )}
          </div>
        </section>

        {recap && recap.hasData && recapYear !== null && (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gold-300 bg-gradient-to-r from-gold-100 to-brand-50 p-5 shadow-sm dark:border-gold-400/40 dark:from-gold-400/15 dark:to-brand-500/15">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold">
                ✨ Your {recapYear} recap{recapYear === Number(today.slice(0, 4)) ? " is ready" : ""}
              </h2>
              <p className="mt-1 text-sm text-sand-700 dark:text-sand-300">
                {[
                  recap.writing.entries > 0 && `${recap.writing.entries} ${recap.writing.entries === 1 ? "entry" : "entries"}`,
                  recap.watched.titles > 0 && `${recap.watched.titles} ${recap.watched.titles === 1 ? "title" : "titles"} watched`,
                ]
                  .filter(Boolean)
                  .join(" and ")}
                . See how your year went.
              </p>
            </div>
            <Link href={recapPath(recapYear)} className={btnPrimary}>
              Watch your recap
            </Link>
          </section>
        )}

        <section aria-label="This month" className="grid grid-cols-3 gap-3">
          <div className={cardClass}>
            <div className="text-2xl font-semibold">{streak}</div>
            <div className="mt-0.5 text-xs text-sand-500">Day streak</div>
          </div>
          <div className={cardClass}>
            <div className="text-2xl font-semibold">{monthEntries}</div>
            <div className="mt-0.5 text-xs text-sand-500">Entries this month</div>
          </div>
          <div className={cardClass}>
            <div className="text-2xl font-semibold">{monthWatched}</div>
            <div className="mt-0.5 text-xs text-sand-500">Watched this month</div>
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader title="Your last 7 days" href="/calendar/" label="Calendar" />
          <ul className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((date) => {
              const list = byDate.get(date) ?? [];
              const top = list.length > 0 ? dayTopTag(list) : null;
              const tag = top !== null ? tagMap.get(top) : undefined;
              const isToday = date === today;
              const href = list.length > 0 ? entryPath(list[0].id) : dailyNotePath(date);
              return (
                <li key={date}>
                  <Link
                    href={href}
                    title={list.length > 0 ? formatFullDate(date) : `Write an entry for ${formatFullDate(date)}`}
                    className={`flex flex-col items-center rounded-xl border px-1 py-2 text-center hover:bg-sand-50 dark:hover:bg-sand-800 ${
                      isToday ? "border-gold-500 ring-1 ring-gold-500" : "border-sand-200 dark:border-sand-800"
                    }`}
                    style={tag ? { backgroundColor: `${tag.color}26` } : undefined}
                  >
                    <span className="text-xs text-sand-600 dark:text-sand-400">{weekdayShort(date)}</span>
                    <span className="mt-1 text-xl leading-none">{tag ? tag.emoji : list.length > 0 ? "•" : "+"}</span>
                    <span className="mt-1 text-[10px] text-sand-500">{Number(date.slice(8))}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {onThisDay.length > 0 && (
          <section className={cardClass}>
            <SectionHeader title="On this day" />
            <ul className="mt-2 divide-y divide-sand-100 dark:divide-sand-800">
              {onThisDay.slice(0, 3).map((entry) => {
                const years = Number(today.slice(0, 4)) - Number(entry.date.slice(0, 4));
                return (
                  <li key={entry.id}>
                    <Link href={entryPath(entry.id)} className="block py-2 hover:bg-sand-50 dark:hover:bg-sand-800">
                      <span className="text-xs text-sand-500">
                        {years} {years === 1 ? "year" : "years"} ago
                      </span>
                      <span className="block truncate text-sm font-medium">{preview(entry)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className={cardClass}>
          <SectionHeader title="Recent entries" href="/journal/" />
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-sand-500">Nothing here yet. Your entries will show up as you write them.</p>
          ) : (
            <ul className="mt-2 divide-y divide-sand-100 dark:divide-sand-800">
              {recent.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entryPath(entry.id)}
                    className="flex items-center gap-3 py-2.5 hover:bg-sand-50 dark:hover:bg-sand-800"
                  >
                    <span className="w-24 shrink-0 text-xs text-sand-500">{formatShortDate(entry.date)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{preview(entry)}</span>
                    <span className="shrink-0 text-base" aria-hidden="true">
                      {entry.tagIds
                        .slice(0, 3)
                        .map((id) => tagMap.get(id)?.emoji)
                        .join("")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cardClass}>
          <SectionHeader title="Recently watched" href="/movies/" />
          {watched.length === 0 ? (
            <p className="mt-2 text-sm text-sand-500">
              Log a movie or show you watched and it will appear here.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {watched.map(({ log, movie }) => (
                <li key={log.id}>
                  <Link
                    href={movieLogPath(log.id)}
                    className="flex gap-3 rounded-xl border border-sand-200 p-2 hover:border-brand-300 hover:bg-brand-50 dark:border-sand-800 dark:hover:border-brand-500 dark:hover:bg-sand-800"
                  >
                    <Poster
                      title={movie.title}
                      posterData={movie.posterData}
                      posterPath={movie.posterPath}
                      size="w92"
                      className="w-12"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm font-medium leading-snug">{movie.title}</span>
                      <StarDisplay value={log.rating} className="text-sm" />
                      <span className="block text-xs text-sand-500">
                        {movie.kind === "tv" ? "Show · " : ""}
                        {formatShortDate(log.watchedDate)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
