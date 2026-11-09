import { useJournalInfo, useSetting } from "./backup/hooks";

/*
True on a first visit: the welcome screen has not been finished or skipped and
the journal is empty. A journal that already has entries never sees it.
*/
export function useWelcomeNeeded(): boolean {
  const done = useSetting<boolean>("welcomeDone");
  const info = useJournalInfo();
  if (!done || !info) return false;
  return !done.value && info.entryCount + info.movieLogCount === 0;
}
