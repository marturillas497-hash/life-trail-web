import Link from "next/link";
import { btnPrimary } from "@/components/ui";
import { newEntryPath } from "@/lib/paths";

export default function JournalIndex() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={112} height={112} className="h-28 w-28 opacity-90" />
      <h2 className="font-display text-2xl font-semibold">Where did today take you?</h2>
      <p className="max-w-xs text-sm text-sand-600 dark:text-sand-400">
        Pick an entry on the left to read it again, or add a new page to your trail.
      </p>
      <Link href={newEntryPath()} className={btnPrimary}>
        Write today&apos;s entry
      </Link>
    </div>
  );
}
