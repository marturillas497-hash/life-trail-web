"use client";

import { useMemo, useState } from "react";
import { todayKey } from "@/lib/dates";
import { useEntries, useTagMap } from "@/lib/hooks";
import {
  entriesInPeriod,
  periodTitle,
  shiftPeriod,
  streaks,
  tagCounts,
  writingStats,
  type Period,
} from "@/lib/insights";
import { btnSecondary, cardClass } from "./ui";
import { Segmented } from "./Segmented";
import { YearInPixels } from "./YearInPixels";

type Kind = Period["kind"];

const KINDS: { value: Kind; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All time" },
];

function toPeriod(kind: Kind, year: number, month: number): Period {
  if (kind === "all") return { kind };
  return kind === "year" ? { kind, year } : { kind, year, month };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={cardClass}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-0.5 text-xs text-sand-500">{label}</div>
    </div>
  );
}

export function InsightsView() {
  const [today] = useState(() => todayKey());
  const [kind, setKind] = useState<Kind>("month");
  const [cursor, setCursor] = useState(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  }));

  const entries = useEntries();
  const tagMap = useTagMap();

  const period = toPeriod(kind, cursor.year, cursor.month);
  const title = periodTitle(period);
  const nowPeriod = toPeriod(kind, Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1);
  const atLatest = kind === "all" || periodTitle(period) === periodTitle(nowPeriod);

  const inPeriod = useMemo(() => entriesInPeriod(entries ?? [], period), [entries, period]);
  const stats = useMemo(() => writingStats(inPeriod), [inPeriod]);
  const emotions = useMemo(() => tagCounts(inPeriod), [inPeriod]);
  const streak = useMemo(() => streaks(entries ?? [], today), [entries, today]);

  const tagged = inPeriod.filter((entry) => entry.tagIds.length > 0).length;
  const top = emotions[0];
  const topTag = top ? tagMap?.get(top.tagId) : undefined;

  function step(by: number) {
    const next = shiftPeriod(period, by);
    if (next.kind === "all") return;
    setCursor({ year: next.year, month: next.kind === "month" ? next.month : cursor.month });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
        <h1 className="text-xl font-semibold">Insights</h1>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label="Period" value={kind} options={KINDS} onChange={setKind} />
          {kind !== "all" && (
            <div className="flex items-center gap-2">
              <button type="button" className={btnSecondary} onClick={() => step(-1)} aria-label="Previous">
                &larr;
              </button>
              <span className="min-w-32 text-center text-sm font-medium">{title}</span>
              <button type="button" className={btnSecondary} onClick={() => step(1)} disabled={atLatest} aria-label="Next">
                &rarr;
              </button>
            </div>
          )}
        </div>

        {!entries || !tagMap ? (
          <p className="text-sm text-sand-500">Loading...</p>
        ) : (
          <>
            <section aria-label="Streaks" className="grid grid-cols-2 gap-3">
              <Stat label="Current streak (days)" value={streak.current} />
              <Stat label="Longest streak (days, all time)" value={streak.longest} />
            </section>

            <section aria-label="Writing" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Entries" value={stats.entries} />
              <Stat label="Days written" value={stats.activeDays} />
              <Stat label="Words" value={stats.words.toLocaleString()} />
              <Stat label="Words per entry" value={stats.averageWords} />
            </section>

            {period.kind === "year" && (
              <YearInPixels year={period.year} entries={entries} tagMap={tagMap} today={today} />
            )}

            <section className={cardClass}>
              <h2 className="font-semibold">Emotions</h2>
              {emotions.length === 0 ? (
                <p className="mt-2 text-sm text-sand-500">
                  {inPeriod.length === 0
                    ? `No entries in ${title}.`
                    : "None of these entries have a tag yet."}
                </p>
              ) : (
                <>
                  {topTag && (
                    <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">
                      Your most common feeling is {topTag.emoji} {topTag.name}.
                    </p>
                  )}
                  <ul className="mt-4 space-y-3">
                    {emotions.map(({ tagId, count }) => {
                      const tag = tagMap.get(tagId);
                      if (!tag) return null;
                      return (
                        <li key={tagId}>
                          <div className="flex justify-between text-sm">
                            <span>
                              {tag.emoji} {tag.name}
                            </span>
                            <span className="text-sand-500">
                              {count} {count === 1 ? "entry" : "entries"} ({Math.round((count / tagged) * 100)}%)
                            </span>
                          </div>
                          <div className="mt-1 h-2.5 rounded-full bg-sand-100 dark:bg-sand-800">
                            <div
                              className="h-full animate-bar-grow rounded-full"
                              style={{ width: `${(count / top.count) * 100}%`, backgroundColor: tag.color }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-4 text-xs text-sand-500">
                    Percentages are out of the {tagged} {tagged === 1 ? "entry" : "entries"} with a tag, and an entry with several tags counts for each.
                  </p>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
