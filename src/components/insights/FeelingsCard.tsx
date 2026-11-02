import { tagShares } from "@/lib/insights";
import type { Entry, Tag } from "@/lib/types";
import { cardClass } from "../ui";

type Props = {
  entries: Entry[];
  previous: Entry[] | null;
  previousTitle: string | null;
  title: string;
  tagMap: Map<number, Tag>;
};

function change(count: number, before: number | null): string | null {
  if (before === null) return null;
  if (before === 0) return "new";
  const diff = count - before;
  if (diff === 0) return "same";
  return diff > 0 ? `+${diff}` : `-${Math.abs(diff)}`;
}

/*
Shows how the period splits between feelings. The shares add up to 100%, so one wide
segment means that feeling really did take over the period.
*/
export function FeelingsCard({ entries, previous, previousTitle, title, tagMap }: Props) {
  const shares = tagShares(entries, previous).filter((item) => tagMap.has(item.tagId));
  const top = shares[0];
  const topTag = top ? tagMap.get(top.tagId) : undefined;

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">How you felt</h2>
      {!top || !topTag ? (
        <p className="mt-2 text-sm text-sand-500">
          {entries.length === 0 ? `No entries in ${title}.` : "None of these entries have a feeling tag yet."}
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">
            {title === "All time" ? "Overall" : `In ${title}`} you felt{" "}
            <strong className="text-sand-900 dark:text-sand-100">
              {topTag.emoji} {topTag.name}
            </strong>{" "}
            most often, {Math.round(top.share * 100)}% of the feelings you wrote down.
          </p>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-sand-100 dark:bg-sand-800" role="img" aria-label="Share of each feeling">
            <div className="flex h-full w-full animate-bar-grow gap-px">
              {shares.map((item) => {
                const tag = tagMap.get(item.tagId)!;
                return (
                  <div
                    key={item.tagId}
                    title={`${tag.emoji} ${tag.name}: ${item.count} (${Math.round(item.share * 100)}%)`}
                    style={{ flex: `${item.count} 1 0`, backgroundColor: tag.color }}
                  />
                );
              })}
            </div>
          </div>

          {previousTitle && (
            <p className="mt-4 text-right text-xs text-sand-500">Change compared with {previousTitle}</p>
          )}
          <ul className={`${previousTitle ? "mt-1" : "mt-4"} divide-y divide-sand-100 text-sm dark:divide-sand-800`}>
            {shares.map((item) => {
              const tag = tagMap.get(item.tagId)!;
              const delta = change(item.count, item.before);
              return (
                <li key={item.tagId} className="flex items-center gap-3 py-2">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="min-w-0 flex-1 truncate">
                    {tag.emoji} {tag.name}
                  </span>
                  <span className="text-sand-500">
                    {item.count} {item.count === 1 ? "entry" : "entries"}
                  </span>
                  <span className="w-10 text-right font-medium">{Math.round(item.share * 100)}%</span>
                  {delta && <span className="w-10 text-right text-xs text-sand-500">{delta}</span>}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-sand-500">
            An entry with several feelings counts toward each one.
          </p>
        </>
      )}
    </section>
  );
}
