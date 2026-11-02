"use client";

import { useEffect, useState } from "react";
import { applyTheme, readTheme, saveTheme, type ThemeChoice } from "@/lib/theme";
import { cardClass } from "./ui";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
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
      <p className="mt-1 text-sm text-zinc-500">
        Saved on this device only, so it is not part of backups.
      </p>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Theme">
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
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
