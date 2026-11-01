"use client";

import { useState } from "react";
import {
  isAppleTouchDevice,
  isRunningInstalled,
  promptInstall,
  useInstallInfo,
} from "@/lib/install";
import { btnPrimary, cardClass } from "../ui";

export function InstallCard() {
  const { canPrompt, justInstalled } = useInstallInfo();
  const [installed] = useState(() => isRunningInstalled());
  const [apple] = useState(() => isAppleTouchDevice());
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Install the app</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Installing gives Life Trail its own icon and window, and it opens and works with no
        internet. Your journal stays on this device either way.
      </p>

      {installed || justInstalled ? (
        <p className="mt-3 text-sm font-medium text-green-700 dark:text-green-400">
          {installed ? "You are using the installed app." : "Installed. You can open it from your apps."}
        </p>
      ) : canPrompt ? (
        <div className="mt-4">
          <button
            type="button"
            className={btnPrimary}
            onClick={async () => {
              const outcome = await promptInstall();
              if (outcome === "dismissed") setMessage("No problem. You can install it later from here.");
            }}
          >
            Install Life Trail
          </button>
        </div>
      ) : apple ? (
        <p className="mt-3 text-sm">
          On iPhone and iPad: open this page in Safari, tap the Share button, then choose{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="mt-3 text-sm">
          Look for the install icon at the right end of the address bar in Chrome or Edge, or open
          the browser menu and choose <strong>Install app</strong> (on Android: Add to Home screen).
          The option appears once the app has been opened from its https address.
        </p>
      )}

      {message && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
    </section>
  );
}
