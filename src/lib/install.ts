"use client";

import { useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;
let started = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/*
Chrome and Edge fire "beforeinstallprompt" once, early. Starting this in the
app shell keeps the event so the Install button can use it later.
*/
export function startInstallListener(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const snapshot = () => `${deferred ? "1" : "0"}${installed ? "1" : "0"}`;

export type InstallInfo = {
  /* The browser is ready to show its install prompt. */
  canPrompt: boolean;
  /* Installed during this visit. */
  justInstalled: boolean;
};

export function useInstallInfo(): InstallInfo {
  const state = useSyncExternalStore(subscribe, snapshot, () => "00");
  return { canPrompt: state[0] === "1", justInstalled: state[1] === "1" };
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const event = deferred;
  await event.prompt();
  const choice = await event.userChoice;
  deferred = null;
  emit();
  return choice.outcome;
}

export function isRunningInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function isAppleTouchDevice(): boolean {
  return typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
}
