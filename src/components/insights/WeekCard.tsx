import { WEEK_START } from "@/lib/calendar";
import { weekdayMoods } from "@/lib/insights";
import type { Entry, Tag } from "@/lib/types";
import { cardClass } from "../ui";

const MIN_ENTRIES = 7;

export function WeekCard({ entries, tagMap }: { entries: Entry[]; tagMap: Map<number, Tag> }) {
  const days = weekdayMoods(entries, WEEK_START);

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Days of the week</h2>
      {entries.length < MIN_ENTRIES ? (
        <p className="mt-2 text-sm text-sand-500">
          Write at least {MIN_ENTRIES} entries in this period to see which feeling shows up on which day.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">
            The feeling you wrote down most on each day of the week.
          </p>
          <ul className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day) => {
              const tag = day.topTagId !== null ? tagMap.get(day.topTagId) : undefined;
              const name = new Date(2024, 0, 7 + day.weekday).toLocaleDateString(undefined, { weekday: "short" });
              return (
                <li
                  key={day.weekday}
                  title={tag ? `${name}: ${tag.emoji} ${tag.name} (${day.entries} ${day.entries === 1 ? "entry" : "entries"})` : `${name}: no entries`}
                  className="flex flex-col items-center rounded-xl border px-1 py-2 text-center"
                  style={tag ? { backgroundColor: `${tag.color}26`, borderColor: `${tag.color}66` } : undefined}
                >
                  <span className="text-xs text-sand-600 dark:text-sand-400">{name}</span>
                  <span className="mt-1 text-xl leading-none">{tag ? tag.emoji : "·"}</span>
                  <span className="mt-1 text-[10px] text-sand-500">{day.entries}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
