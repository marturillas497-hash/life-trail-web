import { useEffect } from "react";

/*
Runs `save` when Ctrl+Enter (Cmd+Enter on a Mac) is pressed anywhere on the page.
In the entry editor the same keys open a link first, and only save when the cursor is not on one.
*/
export function useSaveShortcut(save: () => void, extraKeys: string[] = []) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.defaultPrevented) return;
      const key = event.key.toLowerCase();
      if (key === "enter" || extraKeys.includes(key)) {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save, extraKeys.join()]);
}
