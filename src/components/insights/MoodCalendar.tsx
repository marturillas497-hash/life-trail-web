import { WEEK_START } from "@/lib/calendar";
import { makeKey } from "@/lib/dates";
import { yearPixels } from "@/lib/insights";
import type { Entry, Tag } from "@/lib/types";
import { cardClass } from "../ui";

type Props = {
  year: number;
  /* 0 to 11 */
  month: number;
  entries: Entry[];
  tagMap: Map<number, Tag>;
  today: string;
};

/* One month, one square per day, showing the feeling that day. */
export function MoodCalendar({ year, month, entries, tagMap, today }: Props) {
  const pixels = yearPixels(entries, year);
  const offset = (new Date(year, month, 1).getDay() - WEEK_START + 7) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const headers = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 7 + ((WEEK_START + i) % 7)).toLocaleDateString(undefined, { weekday: "narrow" }),
  );

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Mood calendar</h2>
      <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">
        Each day shows the feeling you used most that day.
      </p>
      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {headers.map((header, i) => (
          <div key={i} className="text-center text-xs text-sand-500">
            {header}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const date = makeKey(year, month, day);
          const pixel = pixels.get(date);
          const tag = pixel?.topTagId != null ? tagMap.get(pixel.topTagId) : undefined;
          const future = date > today;
          return (
            <div
              key={day}
              title={tag ? `${date}: ${tag.emoji} ${tag.name}` : date}
              className={`relative flex aspect-square items-center justify-center rounded-lg border text-lg ${
                tag ? "" : "border-sand-200 dark:border-sand-800"
              } ${future ? "opacity-40" : ""}`}
              style={tag ? { backgroundColor: `${tag.color}33`, borderColor: `${tag.color}88` } : undefined}
            >
              <span className="absolute left-1 top-0.5 text-[10px] text-sand-600 dark:text-sand-400">{day}</span>
              {tag ? tag.emoji : pixel ? "•" : ""}
            </div>
          );
        })}
      </div>
    </section>
  );
}
