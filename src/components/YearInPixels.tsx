"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatFullDate, makeKey } from "@/lib/dates";
import { yearPixels } from "@/lib/insights";
import { plainText } from "@/lib/markdown";
import { entryPath, newEntryPath } from "@/lib/paths";
import type { Entry, Tag } from "@/lib/types";
import { cardClass } from "./ui";

type Props = {
  year: number;
  entries: Entry[];
  tagMap: Map<number, Tag>;
  today: string;
};

const NO_TAG_COLOR = "#a1a1aa";
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function YearInPixels({ year, entries, tagMap, today }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const pixels = useMemo(() => yearPixels(entries, year), [entries, year]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) => ({
        month,
        label: new Date(year, month, 1).toLocaleDateString(undefined, { month: "narrow" }),
        full: new Date(year, month, 1).toLocaleDateString(undefined, { month: "long" }),
        days: new Date(year, month + 1, 0).getDate(),
      })),
    [year],
  );

  const legend = useMemo(() => {
    const days = new Map<number, number>();
    for (const pixel of pixels.values()) {
      if (pixel.topTagId !== null) days.set(pixel.topTagId, (days.get(pixel.topTagId) ?? 0) + 1);
    }
    return [...days.entries()].sort((a, b) => b[1] - a[1]);
  }, [pixels]);

  function describe(date: string): string {
    const pixel = pixels.get(date);
    const tag = pixel?.topTagId != null ? tagMap.get(pixel.topTagId) : undefined;
    return tag ? `${formatFullDate(date)}: ${tag.emoji} ${tag.name}` : formatFullDate(date);
  }

  const selectedPixel = selected ? pixels.get(selected) : undefined;

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Year in Pixels</h2>
      <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">
        Each day takes the color of the tag you used most that day.
      </p>

      <div
        className="mt-4 grid gap-1"
        style={{ gridTemplateColumns: "1.25rem repeat(12, minmax(0, 1fr))" }}
        role="group"
        aria-label={`Year in Pixels for ${year}`}
      >
        <div />
        {months.map((m) => (
          <div key={m.month} className="text-center text-xs text-sand-500" title={m.full}>
            {m.label}
          </div>
        ))}

        {DAYS.map((day) => (
          <div key={day} className="contents">
            <div className="flex items-center justify-end pr-1 text-[10px] text-sand-500">{day}</div>
            {months.map((m) => {
              if (day > m.days) return <div key={m.month} />;
              const date = makeKey(year, m.month, day);
              const pixel = pixels.get(date);
              const tag = pixel?.topTagId != null ? tagMap.get(pixel.topTagId) : undefined;
              const future = date > today;
              const isSelected = selected === date;

              return (
                <button
                  key={m.month}
                  type="button"
                  title={describe(date)}
                  aria-label={describe(date)}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={`aspect-square w-full rounded-[3px] border ${
                    pixel
                      ? "border-transparent"
                      : "border-sand-200 dark:border-sand-800"
                  } ${future ? "opacity-40" : ""} hover:outline-2 hover:outline-offset-1 hover:outline-sand-400 dark:hover:outline-sand-500 ${
                    isSelected ? "outline-2 outline-offset-1 outline-brand-600 dark:outline-brand-400" : ""
                  }`}
                  style={pixel ? { backgroundColor: tag?.color ?? NO_TAG_COLOR } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>

      {legend.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-sand-600 dark:text-sand-400">
          {legend.map(([tagId, days]) => {
            const tag = tagMap.get(tagId);
            if (!tag) return null;
            return (
              <li key={tagId} className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-[3px]" style={{ backgroundColor: tag.color }} />
                {tag.emoji} {tag.name} ({days} {days === 1 ? "day" : "days"})
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <div className="mt-4 rounded-lg border border-sand-200 p-3 text-sm dark:border-sand-800">
          <div className="font-medium">{formatFullDate(selected)}</div>
          {selectedPixel ? (
            <ul className="mt-2 space-y-1">
              {selectedPixel.entries
                .slice()
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((entry) => (
                  <li key={entry.id}>
                    <Link href={entryPath(entry.id)} className="text-brand-600 hover:underline dark:text-brand-400">
                      {entry.title || plainText(entry.body).slice(0, 60) || "Untitled"}
                    </Link>
                  </li>
                ))}
            </ul>
          ) : selected <= today ? (
            <p className="mt-1 text-sand-500">
              No entry this day.{" "}
              <Link href={newEntryPath(selected)} className="text-brand-600 hover:underline dark:text-brand-400">
                Write one
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-sand-500">This day has not happened yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
