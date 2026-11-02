"use client";

import { useEffect, useRef, useState } from "react";
import { startInstallListener } from "@/lib/install";
import { btnPrimary } from "../ui";

/*
Registers the offline service worker (production builds only) and shows a
bar when a newer version of the app is waiting. The new version only takes
over when you press Reload, so it never interrupts what you are writing.
*/
export function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const applying = useRef(false);

  useEffect(() => {
    startInstallListener();

    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      if (applying.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;

    const checkForUpdate = () => {
      if (document.visibilityState === "visible") void registration?.update().catch(() => {});
    };

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        if (cancelled) return;
        registration = reg;

        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(worker);
            }
          });
        });

        document.addEventListener("visibilitychange", checkForUpdate);
      })
      .catch((error) => console.error("Service worker registration failed", error));

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-brand-300 bg-brand-50 px-4 py-2 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-100"
    >
      <span className="mr-auto">A new version of Life Trail is ready.</span>
      <button
        type="button"
        className={btnPrimary}
        onClick={() => {
          applying.current = true;
          waiting.postMessage("SKIP_WAITING");
        }}
      >
        Reload to update
      </button>
    </div>
  );
}
