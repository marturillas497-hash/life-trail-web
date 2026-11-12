"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { formatFullDate, todayKey } from "@/lib/dates";
import { useEntries, useMovieLogs, useTagMap } from "@/lib/hooks";
import { previewText } from "@/lib/markdown";
import { entryPath, newEntryPath } from "@/lib/paths";
import { buildRecap, recapYears, type Recap, type Watched } from "@/lib/recap";
import type { Entry, Tag } from "@/lib/types";
import { BackLink } from "../BackLink";
import { EnlargeablePoster } from "../movies/EnlargeablePoster";
import { StarDisplay } from "../movies/StarRating";
import { btnPrimary, btnSecondary, inputClass } from "../ui";
import { CountUp } from "./CountUp";
import { MiniPixels } from "./MiniPixels";
import { THEMES, type SlideTheme } from "./theme";

type Slide = { key: string; label: string; render: (theme: SlideTheme) => ReactNode };

const monthName = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: "long" });
const monthShort = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: "short" });
const weekdayName = (weekday: number) =>
  new Date(2024, 0, 7 + weekday).toLocaleDateString(undefined, { weekday: "long" });
const dayShort = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const plural = (count: number, one: string, many: string) => `${count.toLocaleString()} ${count === 1 ? one : many}`;

function Body({ children }: { children: ReactNode }) {
  return <div className="stagger flex flex-1 flex-col items-center justify-center gap-3 px-6 py-14 text-center">{children}</div>;
}

function Big({ children }: { children: ReactNode }) {
  return <p className="animate-big-pop font-display text-7xl font-bold leading-none sm:text-8xl">{children}</p>;
}

function buildSlides(
  recap: Recap,
  yearEntries: Entry[],
  tagMap: Map<number, Tag>,
  today: string,
  onRestart: () => void,
): Slide[] {
  const { year, writing, watched, feelings } = recap;
  const isCurrent = year === Number(today.slice(0, 4)) && Number(today.slice(5, 7)) < 12;
  const topFeeling = feelings.find((item) => tagMap.has(item.tagId));
  const topTag = topFeeling ? tagMap.get(topFeeling.tagId) : undefined;
  const slides: Slide[] = [];

  slides.push({
    key: "intro",
    label: "Introduction",
    render: (t) => (
      <Body>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={112} height={112} className="size-28 animate-logo-in" />
        <p className={`text-sm uppercase tracking-widest ${t.muted}`}>Life Trail</p>
        <h2 className="font-display text-5xl font-bold leading-tight sm:text-6xl">
          Your {year}
          {isCurrent && <span className={`block text-2xl font-normal ${t.accent}`}>so far</span>}
        </h2>
        <p className={`max-w-xs ${t.muted}`}>A look back at what you wrote, felt and watched. Ready?</p>
      </Body>
    ),
  });

  if (writing.entries > 0) {
    const percent = writing.daysCovered > 0 ? Math.round((writing.activeDays / writing.daysCovered) * 100) : 0;
    const pages = Math.max(1, Math.round(writing.words / 300));
    slides.push({
      key: "writing",
      label: "Writing",
      render: (t) => (
        <Body>
          <p className={t.muted}>This year you wrote</p>
          <Big>
            <CountUp value={writing.entries} />
          </Big>
          <p className="text-2xl font-medium">{writing.entries === 1 ? "entry" : "entries"}</p>
          <div className={`mt-3 w-full max-w-sm space-y-1.5 rounded-2xl p-4 text-sm ${t.panel}`}>
            <p>
              on <strong>{writing.activeDays}</strong> different {writing.activeDays === 1 ? "day" : "days"}, that is{" "}
              <strong>{percent}%</strong> of the year{isCurrent ? " so far" : ""}
            </p>
            {writing.words > 0 && (
              <p>
                <strong>{writing.words.toLocaleString()}</strong> words, about {plural(pages, "page", "pages")}
              </p>
            )}
            {writing.pictures > 0 && <p>and {plural(writing.pictures, "picture", "pictures")} you kept</p>}
          </div>
        </Body>
      ),
    });

    const streak = writing.longestStreak;
    slides.push({
      key: "rhythm",
      label: "Your rhythm",
      render: (t) => (
        <Body>
          <p className={t.muted}>Your longest streak</p>
          <Big>
            <CountUp value={streak?.length ?? 0} />
          </Big>
          <p className="text-2xl font-medium">{streak?.length === 1 ? "day" : "days in a row"}</p>
          {streak && streak.length > 1 && (
            <p className={t.muted}>
              {dayShort(streak.start)} to {dayShort(streak.end)}
            </p>
          )}
          <div className={`mt-3 w-full max-w-sm space-y-1.5 rounded-2xl p-4 text-sm ${t.panel}`}>
            {writing.busiestMonth && (
              <p>
                <strong>{monthName(year, writing.busiestMonth.month)}</strong> was your busiest month, with{" "}
                {plural(writing.busiestMonth.entries, "entry", "entries")}
              </p>
            )}
            {writing.busiestWeekday && (
              <p>
                You wrote most on <strong>{weekdayName(writing.busiestWeekday.weekday)}s</strong>
              </p>
            )}
          </div>
        </Body>
      ),
    });
  }

  if (topFeeling && topTag) {
    const list = feelings.filter((item) => tagMap.has(item.tagId)).slice(0, 5);
    slides.push({
      key: "feelings",
      label: "Feelings",
      render: (t) => (
        <Body>
          <p className={t.muted}>Your feeling of the year</p>
          <p className="animate-emoji-pop text-8xl leading-none" aria-hidden="true">
            {topTag.emoji}
          </p>
          <h2 className="font-display text-4xl font-bold">{topTag.name}</h2>
          <p className={t.muted}>{Math.round(topFeeling.share * 100)}% of the feelings you wrote down</p>
          <ul className="mt-3 w-full max-w-sm space-y-2 text-left text-sm">
            {list.map((item, rank) => {
              const tag = tagMap.get(item.tagId)!;
              return (
                <li key={item.tagId} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate">
                    {tag.emoji} {tag.name}
                  </span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-current/15">
                    <span
                      className="block h-full animate-bar-grow rounded-full"
                      style={{ width: `${item.share * 100}%`, backgroundColor: tag.color, animationDelay: `${700 + rank * 130}ms` }}
                    />
                  </span>
                  <span className="w-9 text-right font-medium">{Math.round(item.share * 100)}%</span>
                </li>
              );
            })}
          </ul>
        </Body>
      ),
    });
  }

  if (recap.months.filter((m) => m.entries > 0).length >= 2) {
    slides.push({
      key: "months",
      label: "Month by month",
      render: (t) => (
        <Body>
          <h2 className="font-display text-3xl font-bold">Month by month</h2>
          <p className={t.muted}>The feeling that led each month</p>
          <ul className="mt-2 grid w-full max-w-sm grid-cols-4 gap-2">
            {recap.months.map((m, i) => {
              const tag = m.topTagId !== null ? tagMap.get(m.topTagId) : undefined;
              return (
                <li
                  key={m.month}
                  title={tag ? `${monthName(year, m.month)}: ${tag.name}` : monthName(year, m.month)}
                  className={`animate-tile-flip flex flex-col items-center rounded-xl py-2 ${t.panel} ${m.entries === 0 ? "opacity-40" : ""}`}
                  style={{ animationDelay: `${450 + i * 45}ms` }}
                >
                  <span className={`text-xs ${t.muted}`}>{monthShort(year, m.month)}</span>
                  <span className="my-1 text-2xl leading-none">{tag ? tag.emoji : "·"}</span>
                  <span className="text-[11px]">{m.entries}</span>
                </li>
              );
            })}
          </ul>
        </Body>
      ),
    });
  }

  if (writing.entries > 0) {
    slides.push({
      key: "pixels",
      label: "Year in Pixels",
      render: (t) => (
        <Body>
          <h2 className="font-display text-3xl font-bold">Your year in pixels</h2>
          <p className={t.muted}>Every square is a day, colored by how it felt</p>
          <div className="mt-3 w-full">
            <MiniPixels year={year} entries={yearEntries} tagMap={tagMap} />
          </div>
        </Body>
      ),
    });

    const moment = writing.longestEntry?.entry ?? writing.firstEntry;
    if (moment) {
      const excerpt = previewText(moment.body).slice(0, 240);
      slides.push({
        key: "moment",
        label: "A moment",
        render: (t) => (
          <Body>
            <p className={t.muted}>{writing.longestEntry ? "Your longest entry" : "Your first entry"}</p>
            <p className={`text-sm ${t.accent}`}>{formatFullDate(moment.date)}</p>
            {moment.title && <h2 className="font-display text-3xl font-bold">{moment.title}</h2>}
            {excerpt && (
              <p className={`max-w-sm rounded-2xl p-4 text-left text-sm italic leading-relaxed ${t.panel}`}>
                {excerpt}
                {previewText(moment.body).length > 240 ? "..." : ""}
              </p>
            )}
            <Link href={entryPath(moment.id)} className={`mt-2 rounded-full px-5 py-2 text-sm font-medium ${t.panel} hover:opacity-80`}>
              Read the whole entry
            </Link>
          </Body>
        ),
      });
    }
  }

  if (watched.logs > 0) {
    const parts = [
      watched.movies > 0 && plural(watched.movies, "movie", "movies"),
      watched.shows > 0 && plural(watched.shows, "show", "shows"),
    ].filter(Boolean);
    const rounded = Math.round(watched.averageRating * 2) / 2;
    slides.push({
      key: "watching",
      label: "Watching",
      render: (t) => (
        <Body>
          <p className={t.muted}>You watched</p>
          <Big>
            <CountUp value={watched.titles} />
          </Big>
          <p className="text-2xl font-medium">{watched.titles === 1 ? "title" : "titles"}</p>
          <p className={t.muted}>{parts.join(" and ")}</p>
          <div className={`mt-3 w-full max-w-sm space-y-2 rounded-2xl p-4 text-sm ${t.panel}`}>
            <p className="flex items-center justify-center gap-2">
              <StarDisplay value={rounded} className="text-xl" />
              <span>average {watched.averageRating.toFixed(1)}</span>
            </p>
            {watched.rewatches > 0 && <p>{plural(watched.rewatches, "rewatch", "rewatches")}</p>}
            {watched.busiestMonth && (
              <p>
                <strong>{monthName(year, watched.busiestMonth.month)}</strong> was your busiest month for watching
              </p>
            )}
          </div>
        </Body>
      ),
    });

    slides.push({
      key: "picks",
      label: "Top picks",
      render: (t) => (
        <Body>
          <h2 className="font-display text-3xl font-bold">Your top picks</h2>
          <ol className="mt-2 flex flex-wrap items-start justify-center gap-4">
            {watched.top.map(({ log, movie }, index) => (
              <li
                key={movie.id}
                className={`animate-poster-in flex flex-col items-center text-center ${index === 0 ? "w-32" : "w-24"}`}
                style={{ animationDelay: `${500 + index * 150}ms`, ["--tilt" as string]: `${[-4, 5, -5, 4, -3][index % 5]}deg` } as CSSProperties}
              >
                <span className={`mb-1 text-xs font-medium ${t.accent}`}>#{index + 1}</span>
                <EnlargeablePoster
                  title={movie.title}
                  posterData={movie.posterData}
                  posterPath={movie.posterPath}
                  size="w185"
                  className="w-full"
                />
                <span className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight">{movie.title}</span>
                <StarDisplay value={log.rating} className="text-xs" />
              </li>
            ))}
          </ol>
          {watched.mostRewatched && (
            <p className={`mt-3 text-sm ${t.muted}`}>
              Most rewatched: <strong className="text-current">{watched.mostRewatched.movie.title}</strong>, {watched.mostRewatched.count} times
            </p>
          )}
        </Body>
      ),
    });
  }

  const tiles: [string, ReactNode][] = [];
  if (writing.entries > 0) {
    tiles.push(["Entries", writing.entries.toLocaleString()]);
    tiles.push(["Words", writing.words.toLocaleString()]);
    if (writing.longestStreak) tiles.push(["Longest streak", plural(writing.longestStreak.length, "day", "days")]);
  }
  if (topTag) tiles.push(["Feeling of the year", `${topTag.emoji} ${topTag.name}`]);
  if (watched.logs > 0) {
    tiles.push(["Watched", plural(watched.titles, "title", "titles")]);
    if (watched.top[0]) tiles.push(["Top pick", watched.top[0].movie.title]);
  }
  slides.push({
    key: "summary",
    label: "Summary",
    render: (t) => (
      <Body>
        <h2 className="font-display text-3xl font-bold">{year} in numbers</h2>
        <ul className="mt-2 grid w-full max-w-sm grid-cols-2 gap-2.5">
          {tiles.map(([label, value], i) => (
            <li key={label} className={`animate-tile-flip rounded-2xl p-3 ${t.panel}`} style={{ animationDelay: `${400 + i * 70}ms` }}>
              <div className={`text-xs ${t.muted}`}>{label}</div>
              <div className="mt-0.5 line-clamp-2 font-display text-lg font-bold leading-tight">{value}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRestart} className={`rounded-full px-5 py-2 text-sm font-medium ${t.panel} hover:opacity-80`}>
            Watch again
          </button>
          <Link href="/" className={`rounded-full px-5 py-2 text-sm font-medium ${t.panel} hover:opacity-80`}>
            Back to Home
          </Link>
        </div>
      </Body>
    ),
  });

  return slides;
}

type Motion = { leaving: number | null; dir: 1 | -1; x: number; y: number };

export function RecapView({ requestedYear }: { requestedYear: number | null }) {
  const [today] = useState(() => todayKey());
  const entries = useEntries();
  const logs = useMovieLogs();
  const tagMap = useTagMap();
  const [chosen, setChosen] = useState<number | null>(requestedYear);
  const [index, setIndex] = useState(0);
  const [motion, setMotion] = useState<Motion>({ leaving: null, dir: 1, x: 50, y: 50 });
  const [hover, setHover] = useState<"left" | "right" | null>(null);
  const [restart, setRestart] = useState(0);
  const onRestart = useCallback(() => setRestart((n) => n + 1), []);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const api = useRef<{ go: (next: number, origin?: { x: number; y: number }) => void; at: number; last: number }>({
    go: () => {},
    at: 0,
    last: 0,
  });

  const watched: Watched[] = useMemo(() => logs ?? [], [logs]);
  const years = useMemo(() => (entries ? recapYears(entries, watched) : []), [entries, watched]);
  const currentYear = Number(today.slice(0, 4));
  const year = chosen ?? (years.includes(currentYear) ? currentYear : (years[0] ?? currentYear));

  const recap = useMemo(() => (entries ? buildRecap(year, entries, watched, today) : null), [entries, watched, year, today]);
  const yearEntries = useMemo(() => (entries ?? []).filter((entry) => entry.date.startsWith(`${year}-`)), [entries, year]);
  const slides = useMemo(
    () =>
      recap && tagMap && recap.hasData
        ? buildSlides(recap, yearEntries, tagMap, today, onRestart)
        : [],
    [recap, yearEntries, tagMap, today, onRestart],
  );
  const last = slides.length - 1;
  const safeIndex = Math.min(index, Math.max(last, 0));

  /*
  Moves to another slide. The slide being left stays on screen for a moment so it
  can drift away while the new one opens from the tapped spot.
  */
  function go(next: number, origin?: { x: number; y: number }) {
    const target = Math.max(0, Math.min(next, last));
    if (target === safeIndex) return;
    const dir = target > safeIndex ? 1 : -1;
    setMotion({ leaving: safeIndex, dir, x: origin?.x ?? (dir === 1 ? 100 : 0), y: origin?.y ?? 50 });
    setIndex(target);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMotion((m) => ({ ...m, leaving: null })), 900);
  }

  useEffect(() => {
    api.current = { go, at: safeIndex, last };
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  /* "Watch again" asks for a restart, which is done here once the latest render is in place. */
  useEffect(() => {
    if (restart > 0) api.current.go(0);
  }, [restart]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["SELECT", "INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (document.querySelector("[aria-modal='true']")) return;
      if (event.key === "ArrowRight") api.current.go(api.current.at + 1);
      if (event.key === "ArrowLeft") api.current.go(api.current.at - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!entries || !logs || !tagMap || !recap) return <p className="p-6 text-sm text-sand-500">Loading...</p>;

  const slide = slides[safeIndex];
  const zone = (event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return { side: x < 0.3 ? ("left" as const) : ("right" as const), x: x * 100, y: y * 100 };
  };

  /* Like Instagram stories: the left third goes back, the rest goes forward. Links and buttons keep working. */
  function onTap(event: MouseEvent<HTMLElement>) {
    /* Clicks inside the enlarged poster viewer bubble up through React, but are not taps on the card. */
    if (!event.currentTarget.contains(event.target as Node)) return;
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea, label")) return;
    if (window.getSelection()?.toString()) return;
    const { side, x, y } = zone(event);
    go(side === "left" ? safeIndex - 1 : safeIndex + 1, { x, y });
  }

  const layers =
    slide && motion.leaving !== null && motion.leaving !== safeIndex && slides[motion.leaving]
      ? [motion.leaving, safeIndex]
      : [safeIndex];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl space-y-4 p-4 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <BackLink href="/">Home</BackLink>
          {years.length > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-sand-600 dark:text-sand-400">Year</span>
              <select
                value={year}
                onChange={(event) => {
                  setChosen(Number(event.target.value));
                  setIndex(0);
                  setMotion((m) => ({ ...m, leaving: null }));
                }}
                className={`${inputClass} !w-auto`}
              >
                {(years.includes(year) ? years : [year, ...years]).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!recap.hasData || !slide ? (
          <div className="rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-sm dark:border-sand-800 dark:bg-sand-900">
            <h1 className="font-display text-2xl font-semibold">Nothing to look back on in {year}</h1>
            <p className="mt-2 text-sm text-sand-600 dark:text-sand-400">
              Write an entry or log a movie or show and your recap will appear here.
            </p>
            <Link href={newEntryPath()} className={`${btnPrimary} mt-4`}>
              Write an entry
            </Link>
          </div>
        ) : (
          <>
            <h1 className="sr-only">Your {year} recap</h1>
            <section
              aria-roledescription="carousel"
              aria-label={`Your ${year} recap`}
              onClick={onTap}
              onPointerMove={(event) => {
                if (event.pointerType === "mouse") setHover(zone(event).side);
              }}
              onPointerLeave={() => setHover(null)}
              className="relative isolate flex min-h-[34rem] cursor-pointer touch-manipulation select-none flex-col overflow-hidden rounded-3xl bg-sand-950 shadow-xl sm:min-h-[36rem]"
            >
              {layers.map((layerIndex) => {
                const layer = slides[layerIndex];
                const layerTheme = THEMES[layerIndex % THEMES.length];
                const leaving = layerIndex !== safeIndex;
                return (
                  <div
                    key={layer.key}
                    aria-hidden={leaving || undefined}
                    aria-live={leaving ? undefined : "polite"}
                    data-slide={layer.key}
                    data-leaving={leaving || undefined}
                    className={`flex flex-col ${layerTheme.background} ${
                      leaving ? "pointer-events-none absolute inset-0 z-[1] animate-story-out" : "relative z-[2] flex-1 animate-story-in"
                    }`}
                    style={{ "--ox": `${motion.x}%`, "--oy": `${motion.y}%`, "--dir": motion.dir } as CSSProperties}
                  >
                    {layer.render(layerTheme)}
                  </div>
                );
              })}

              <ol className="absolute inset-x-4 top-3 z-10 flex gap-1.5">
                {slides.map((item, i) => (
                  <li key={item.key} className="flex-1">
                    <button
                      type="button"
                      aria-label={`Go to ${item.label}`}
                      aria-current={i === safeIndex ? "step" : undefined}
                      onClick={() => go(i)}
                      className="flex h-4 w-full items-center"
                    >
                      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-current/25">
                        <span
                          key={i === safeIndex ? `now-${safeIndex}` : "still"}
                          className={`block h-full rounded-full bg-current ${i === safeIndex ? "animate-progress-fill" : ""}`}
                          style={{ width: i <= safeIndex ? "100%" : "0%" }}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-3 top-1/2 z-[3] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-2xl text-white transition-opacity ${
                  hover === "left" && safeIndex > 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                &#8249;
              </span>
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute right-3 top-1/2 z-[3] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-2xl text-white transition-opacity ${
                  hover === "right" && safeIndex < last ? "opacity-100" : "opacity-0"
                }`}
              >
                &#8250;
              </span>
            </section>

            <div className="flex items-center justify-between gap-3">
              <button type="button" className={btnSecondary} disabled={safeIndex === 0} onClick={() => go(safeIndex - 1)}>
                Back
              </button>
              <span className="text-sm text-sand-500" aria-hidden="true">
                {safeIndex + 1} / {slides.length}
              </span>
              <button type="button" className={btnPrimary} disabled={safeIndex === last} onClick={() => go(safeIndex + 1)}>
                Next
              </button>
            </div>
            <p className="text-center text-xs text-sand-500">
              Tap the right side of the card to go forward and the left side to go back. Arrow keys work too.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
