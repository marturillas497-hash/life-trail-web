"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { EntryList } from "@/components/EntryList";

/*
Two panes on wide screens: entry list on the left, the open entry on the right.
On phones only one pane shows at a time, the list at /journal and the entry elsewhere.
*/
export default function JournalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isIndex = pathname === "/journal";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        router.push("/journal/new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div className="flex h-full">
      <section
        className={`${isIndex ? "flex" : "hidden"} w-full flex-col border-r border-zinc-200 lg:flex lg:w-96 lg:shrink-0 dark:border-zinc-800`}
      >
        <EntryList />
      </section>
      <section
        className={`${isIndex ? "hidden" : "block"} min-w-0 flex-1 overflow-y-auto lg:block`}
      >
        {children}
      </section>
    </div>
  );
}
