"use client";

import { useEffect, useState } from "react";
import { applyTheme, readTheme, saveTheme, type ThemeChoice } from "@/lib/theme";
import { cardClass } from "./ui";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "oled", label: "OLED black" },
];

export function ThemeCard() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readTheme());

  /* Follow the device live while "Match device" is selected. */
  useEffect(() => {
    if (choice !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [choice]);

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Appearance</h2>
      <p className="mt-1 text-sm text-sand-500">
        Saved on this device only, so it is not part of backups. OLED black uses true black, which
        saves battery on OLED phone screens.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Theme">
        {OPTIONS.map((option) => {
          const selected = choice === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setChoice(option.value);
                saveTheme(option.value);
              }}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-200"
                  : "border-sand-300 text-sand-700 hover:bg-sand-50 dark:border-sand-700 dark:text-sand-300 dark:hover:bg-sand-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
