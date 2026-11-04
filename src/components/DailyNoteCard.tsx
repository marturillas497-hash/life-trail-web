"use client";

import { useState } from "react";
import { setSetting } from "@/lib/backup/store";
import { useSetting } from "@/lib/backup/hooks";
import { DEFAULT_TEMPLATE, TEMPLATE_KEY, renderTemplate } from "@/lib/dailyNote";
import { todayKey } from "@/lib/dates";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "./ui";

function TemplateEditor({ saved }: { saved: string }) {
  const [draft, setDraft] = useState(saved);
  const [current, setCurrent] = useState(saved);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = draft !== current;

  async function save() {
    await setSetting(TEMPLATE_KEY, draft);
    setCurrent(draft);
    setMessage("Saved. New daily notes will start from this.");
  }

  return (
    <>
      <label htmlFor="daily-template" className="mt-3 block text-sm font-medium">
        Template
      </label>
      <textarea
        id="daily-template"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setMessage(null);
        }}
        rows={7}
        spellCheck={false}
        className={`${inputClass} mt-1 font-mono text-sm`}
      />
      <p className="mt-1.5 text-xs text-sand-500">
        Markdown works. You can use <code>{"{{date}}"}</code>, <code>{"{{weekday}}"}</code> and{" "}
        <code>{"{{prompt}}"}</code> (the question of the day). Leave it empty for blank notes.
      </p>

      <div className="mt-3 rounded-xl border border-sand-200 p-3 dark:border-sand-800">
        <div className="text-xs font-medium uppercase tracking-wide text-sand-500">Today&apos;s note would start with</div>
        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-sm">
          {renderTemplate(draft, todayKey()).trim() || "(nothing, the note starts blank)"}
        </pre>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} disabled={!dirty} onClick={() => void save()}>
          Save template
        </button>
        <button
          type="button"
          className={btnSecondary}
          disabled={draft === DEFAULT_TEMPLATE}
          onClick={() => {
            setDraft(DEFAULT_TEMPLATE);
            setMessage(null);
          }}
        >
          Use the default
        </button>
        <p role="status" className="text-sm text-brand-700 dark:text-brand-300">
          {message}
        </p>
      </div>
    </>
  );
}

export function DailyNoteCard() {
  const stored = useSetting<string>(TEMPLATE_KEY);

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Daily note</h2>
      <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">
        &quot;Open today&apos;s note&quot; on Home, or Alt+T anywhere, opens today&apos;s note. If you have not written
        today, it starts from this template. Nothing is saved until you write something and press Save.
      </p>
      {stored ? (
        <TemplateEditor saved={stored.value ?? DEFAULT_TEMPLATE} />
      ) : (
        <p className="mt-3 text-sm text-sand-500">Loading...</p>
      )}
    </section>
  );
}
