import { makeKey } from "@/lib/dates";
import { yearPixels } from "@/lib/insights";
import type { Entry, Tag } from "@/lib/types";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/* A small, read only Year in Pixels for the recap. Each square is a day colored by its main feeling. */
export function MiniPixels({ year, entries, tagMap }: { year: number; entries: Entry[]; tagMap: Map<number, Tag> }) {
  const pixels = yearPixels(entries, year);
  return (
    <div
      className="mx-auto grid w-full max-w-sm gap-[3px]"
      style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
      role="img"
      aria-label={`Year in Pixels for ${year}`}
    >
      {DAYS.map((day) =>
        Array.from({ length: 12 }, (_, month) => {
          if (day > new Date(year, month + 1, 0).getDate()) return <div key={`${day}-${month}`} />;
          const pixel = pixels.get(makeKey(year, month, day));
          const tag = pixel?.topTagId != null ? tagMap.get(pixel.topTagId) : undefined;
          return (
            <div
              key={`${day}-${month}`}
              className={`animate-pixel-pop aspect-square rounded-[2px] ${pixel ? "" : "bg-current opacity-10"}`}
              style={{
                /* The squares pop in as a diagonal wave across the year. */
                animationDelay: `${520 + (month * 4 + day) * 9}ms`,
                ...(pixel ? { backgroundColor: tag?.color ?? "#a1a1aa" } : {}),
              }}
            />
          );
        }),
      )}
    </div>
  );
}
