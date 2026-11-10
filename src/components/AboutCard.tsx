"use client";

import { useState } from "react";
import { isNative } from "@/lib/native/platform";
import { APP_BUILD, APP_VERSION } from "@/lib/version";
import { cardClass } from "./ui";

export function AboutCard() {
  const [native] = useState(() => isNative());

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">About</h2>
      <p className="mt-1 text-sm text-sand-600 dark:text-sand-300">
        {native
          ? `Life Trail Android app, version ${APP_VERSION || "unknown"}${APP_BUILD ? ` (build ${APP_BUILD})` : ""}. A new version arrives as a new APK.`
          : "Life Trail on the web. It updates by itself, press Reload to update when it asks."}
      </p>
    </section>
  );
}
