"use client";

import { useMemo, useState } from "react";
import { todayKey } from "@/lib/dates";
import { useEntries, useTagMap } from "@/lib/hooks";
import {
  entriesInPeriod,
  periodTitle,
  shiftPeriod,
  streaks,
  writingStats,
  type Period,
} from "@/lib/insights";
import { btnSecondary, cardClass } from "./ui";
import { FeelingsCard } from "./insights/FeelingsCard";
import { MoodCalendar } from "./insights/MoodCalendar";
import { WeekCard } from "./insights/WeekCard";
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

  const period = useMemo(() => toPeriod(kind, cursor.year, cursor.month), [kind, cursor]);
  const title = periodTitle(period);
  const nowPeriod = toPeriod(kind, Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1);
  const atLatest = kind === "all" || periodTitle(period) === periodTitle(nowPeriod);

  const inPeriod = useMemo(() => entriesInPeriod(entries ?? [], period), [entries, period]);
  const stats = useMemo(() => writingStats(inPeriod), [inPeriod]);
  const before = useMemo(() => (period.kind === "all" ? null : shiftPeriod(period, -1)), [period]);
  const previous = useMemo(
    () => (before ? entriesInPeriod(entries ?? [], before) : null),
    [entries, before],
  );
  const streak = useMemo(() => streaks(entries ?? [], today), [entries, today]);

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

            {period.kind === "month" && (
              <MoodCalendar
                year={period.year}
                month={period.month}
                entries={inPeriod}
                tagMap={tagMap}
                today={today}
              />
            )}

            <FeelingsCard
              entries={inPeriod}
              previous={previous}
              previousTitle={before ? periodTitle(before) : null}
              title={title}
              tagMap={tagMap}
            />

            <WeekCard entries={inPeriod} tagMap={tagMap} />
          </>
        )}
      </div>
    </div>
  );
}
