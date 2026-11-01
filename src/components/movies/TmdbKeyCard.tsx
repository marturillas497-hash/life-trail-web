"use client";

import { useState } from "react";
import { useSetting } from "@/lib/backup/hooks";
import { deleteSetting, setSetting } from "@/lib/backup/store";
import { checkCredential, parseCredential, TmdbError } from "@/lib/tmdb";
import { TmdbAttribution } from "./TmdbAttribution";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "../ui";

export function TmdbKeyCard() {
  const saved = useSetting<string>("tmdbKey");
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const savedKey = saved?.value;
  const credential = parseCredential(savedKey);

  async function save() {
    const parsed = parseCredential(draft);
    if (!parsed) {
      setMessage({
        text: "That does not look like a TMDB key. A v3 API Key has 32 letters and numbers. An API Read Access Token is much longer and starts with eyJ.",
        good: false,
      });
      return;
    }
    await setSetting("tmdbKey", draft.trim());
    setDraft("");
    setMessage({ text: "Key saved on this device.", good: true });
  }

  async function test() {
    if (!credential) return;
    setBusy(true);
    setMessage(null);
    try {
      await checkCredential(credential);
      setMessage({ text: "TMDB accepted the key. Movie search is ready.", good: true });
    } catch (error) {
      setMessage({
        text: error instanceof TmdbError ? error.message : "Something went wrong.",
        good: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Movie search (TMDB)</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Searching for movies uses TMDB&apos;s free database. You need your own free key. It stays on
        this device only and is not included in backup files. Without a key you can still log
        movies by typing their title.
      </p>

      {saved && (
        <p className="mt-3 text-sm">
          {credential
            ? `A key is saved (ending in ${credential.value.slice(-4)}).`
            : "No key saved yet."}
        </p>
      )}

      <form
        className="mt-3 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <input
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={credential ? "Paste a new key to replace it" : "Paste your TMDB key or token"}
          aria-label="TMDB key or token"
          autoComplete="off"
          spellCheck={false}
          className={`${inputClass} font-mono`}
        />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary} disabled={!draft.trim()}>
            Save key
          </button>
          {credential && (
            <>
              <button type="button" className={btnSecondary} disabled={busy} onClick={() => void test()}>
                Test connection
              </button>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  void deleteSetting("tmdbKey");
                  setMessage({ text: "Key removed.", good: true });
                }}
              >
                Remove key
              </button>
            </>
          )}
        </div>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm ${message.good ? "text-green-700 dark:text-green-400" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400">
          How do I get a key?
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
          <li>Make a free account at themoviedb.org and confirm your email.</li>
          <li>
            Open your account settings and find the API section. Request a key for personal,
            non-commercial use. The form is short. Menu names may differ a little.
          </li>
          <li>
            Copy the <strong>API Read Access Token</strong> (long, starts with eyJ) or the{" "}
            <strong>API Key</strong> (32 letters and numbers) and paste it above.
          </li>
        </ol>
        <p className="mt-2 text-zinc-500">
          TMDB&apos;s free API is for personal, non-commercial use only.
        </p>
      </details>

      <TmdbAttribution className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800" />
    </section>
  );
}
