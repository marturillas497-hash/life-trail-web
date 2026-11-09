"use client";

import { useEffect, useState, type RefObject } from "react";

const HIDE_AFTER = 28;
const SHOW_AFTER = 12;
const NEAR_TOP = 48;
const SETTLE_MS = 450;

/*
True while the phone tab bar should be tucked away: it hides after scrolling
down and comes back on scrolling up, near the top of a page, or on a new page.
Scrolling happens inside each page, so scroll events are caught on the way
down to the container. The short settle time after a change stops the bar
from flickering when the page area grows or shrinks beneath the finger.
*/
export function useHideOnScroll(containerRef: RefObject<HTMLElement | null>, pageKey: string): boolean {
  const [state, setState] = useState({ hidden: false, pageKey });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lastTop = new WeakMap<EventTarget, number>();
    let run = 0;
    let lockUntil = 0;
    let hidden = false;

    const change = (next: boolean) => {
      hidden = next;
      run = 0;
      lockUntil = performance.now() + SETTLE_MS;
      setState({ hidden: next, pageKey });
    };

    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const top = target.scrollTop;
      const previous = lastTop.get(target) ?? top;
      lastTop.set(target, top);
      if (performance.now() < lockUntil) return;

      if (top <= NEAR_TOP) {
        if (hidden) change(false);
        run = 0;
        return;
      }
      const delta = top - previous;
      run = Math.sign(run) === Math.sign(delta) ? run + delta : delta;
      if (!hidden && run > HIDE_AFTER) change(true);
      else if (hidden && run < -SHOW_AFTER) change(false);
    };

    container.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => container.removeEventListener("scroll", onScroll, { capture: true });
  }, [containerRef, pageKey]);

  return state.pageKey === pageKey && state.hidden;
}
