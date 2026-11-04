import type { ReactNode } from "react";
import Link from "next/link";
import { BackLink } from "@/components/BackLink";

export const metadata = { title: "How to use | Life Trail" };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-sand-700 dark:text-sand-300">{children}</div>
    </section>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-sand-300 bg-white px-1.5 py-0.5 font-mono text-xs text-sand-800 shadow-sm dark:border-sand-700 dark:bg-sand-800 dark:text-sand-100">
      {children}
    </kbd>
  );
}

function Table({ head, rows }: { head: [string, string]; rows: [ReactNode, ReactNode][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white dark:border-sand-800 dark:bg-sand-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-sand-200 text-xs uppercase tracking-wide text-sand-500 dark:border-sand-800">
            <th className="px-3 py-2 font-medium">{head[0]}</th>
            <th className="px-3 py-2 font-medium">{head[1]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-100 dark:divide-sand-800">
          {rows.map(([left, right], i) => (
            <tr key={i}>
              <td className="px-3 py-2 align-top">{left}</td>
              <td className="px-3 py-2 align-top">{right}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CONTENTS = [
  ["start", "Getting started"],
  ["daily", "Daily note"],
  ["writing", "Writing with Markdown"],
  ["links", "Links and pictures"],
  ["reading", "Reading view"],
  ["find", "Tags, search and calendar"],
  ["movies", "Movies"],
  ["insights", "Insights"],
  ["recap", "Year recap"],
  ["backup", "Backups"],
  ["look", "Look, lock and install"],
  ["keys", "Keyboard shortcuts"],
] as const;

export default function GuidePage() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl p-4 pb-16 lg:p-8">
        <BackLink href="/journal/">Journal</BackLink>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">How to use Life Trail</h1>
        <p className="mt-2 text-sm text-sand-600 dark:text-sand-400">
          A private journal that lives in your browser. No account, no server, nobody else can read it.
        </p>

        <nav aria-label="Contents" className="mt-5 flex flex-wrap gap-2">
          {CONTENTS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-sand-300 bg-white px-3 py-1 text-xs font-medium text-sand-700 hover:border-brand-300 hover:bg-brand-50 dark:border-sand-700 dark:bg-sand-800 dark:text-sand-200 dark:hover:bg-sand-700"
            >
              {label}
            </a>
          ))}
        </nav>

        <Section id="start" title="Getting started">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Press Open today&apos;s note on Home. Or open Journal and press New entry for a blank one.</li>
            <li>Pick how you are feeling. You need at least one.</li>
            <li>Write whatever you like. A title is optional.</li>
            <li>
              Press Save, or <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>. On a Mac use <Kbd>Cmd</Kbd> instead of <Kbd>Ctrl</Kbd>.
            </li>
          </ol>
          <p>
            Everything is saved inside this browser on this device. Because of that, make a backup now and then (see
            Backups below).
          </p>
        </Section>

        <Section id="daily" title="Daily note">
          <p>
            The fastest way to write is today&apos;s note. Press <strong>Open today&apos;s note</strong> on Home, or{" "}
            <Kbd>Alt</Kbd> + <Kbd>T</Kbd> from anywhere in the app.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              If you have not written today, a fresh note opens from your template, with the cursor already in the text.
              A question of the day is shown above it as a gentle nudge.
            </li>
            <li>
              If you already wrote today, the same button says Continue today&apos;s note and opens that entry for
              editing. Write another starts a separate blank entry.
            </li>
            <li>
              Nothing is saved until you write something, pick a feeling and press Save. An unused note leaves no empty
              entry behind, and your streak only counts days you really wrote.
            </li>
            <li>
              Empty days in the last 7 days on Home, and the Write button in the calendar, open a note for that day from
              the same template.
            </li>
            <li>
              Change the template in Settings, under Daily note. You can use <code>{"{{date}}"}</code>,{" "}
              <code>{"{{weekday}}"}</code> and <code>{"{{prompt}}"}</code>, or leave it empty for blank notes.
            </li>
          </ul>
        </Section>

        <Section id="writing" title="Writing with Markdown">
          <p>
            Entries understand Markdown, the same way Obsidian does. You see the result while you type, and the symbols
            come back on the line you are editing so you can change them.
          </p>
          <Table
            head={["You type", "You get"]}
            rows={[
              [<code key="a"># Title</code>, "A big heading. Use ## and ### for smaller ones."],
              [<code key="b">**bold**</code>, <strong key="b2">bold</strong>],
              [<code key="c">*italic*</code>, <em key="c2">italic</em>],
              [<code key="d">~~crossed out~~</code>, <s key="d2">crossed out</s>],
              [<code key="e">`code`</code>, "Highlighted code"],
              [<code key="f">- item</code>, "A bullet. Press Enter to continue the list."],
              [<code key="g">- [ ] task</code>, "A checkbox. Click it to tick it."],
              [<code key="h">&gt; quote</code>, "An indented quote with a gold bar."],
              [<code key="i">---</code>, "A dividing line"],
            ]}
          />
          <p>
            The toolbar above the text has buttons for bold, italic, headings, links, lists, checklists and quotes. Tables
            are kept as plain text.
          </p>
        </Section>

        <Section id="links" title="Links and pictures">
          <p>
            Write a link as <code>[words](https://example.com)</code> or just paste an address. Put the cursor on the link
            and press <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> to open it in a new tab. <Kbd>Ctrl</Kbd> + click works too. In a
            saved entry a normal click is enough. If the cursor is not on a link, <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>{" "}
            saves the entry instead.
          </p>
          <p>
            To add a picture, press the Picture button, paste one, or drag a file into the text. Pictures are shrunk to a
            sensible size and stored in this browser. Click a picture in a saved entry to open it bigger. Pictures that no
            entry uses any more can be removed from the Backup page.
          </p>
        </Section>

        <Section id="reading" title="Reading view">
          <p>
            The Read button above the text turns the editor into a plain reader, so nothing changes by accident and every
            symbol stays hidden. Press Edit or <Kbd>Ctrl</Kbd> + <Kbd>E</Kbd> to go back to writing. Saved entries always
            open in the reader. Press Edit on the entry to change it.
          </p>
        </Section>

        <Section id="find" title="Tags, search and calendar">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Tags</strong> are your feelings. Add your own, change their emoji and color, or hide ones you do not
              use from the Tags page.
            </li>
            <li>
              <strong>Search</strong> sits above the entry list. It looks at titles, text and tag names, and every word you
              type has to match.
            </li>
            <li>
              <strong>Calendar</strong> shows your month. Pick a day to read its entries or write a new one for it.
            </li>
          </ul>
        </Section>

        <Section id="movies" title="Movies">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Searching for films needs a free TMDB key. Add it once in Settings and the Movies page walks you through
              getting one.
            </li>
            <li>Press Log a movie, find the film, then give it stars, a date and what you thought.</li>
            <li>Press a poster to see it bigger. Press anywhere else on the card to open that viewing.</li>
            <li>The Week, Month, Year and All buttons filter by the date you watched. Use the arrows to move around.</li>
            <li>You can log the same film again later. Each viewing keeps its own rating and date.</li>
          </ul>
        </Section>

        <Section id="insights" title="Insights">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Streaks</strong> count days in a row with at least one entry. Yours stays alive if you wrote today or
              yesterday.
            </li>
            <li>
              <strong>Mood calendar</strong> (month view) and <strong>Year in Pixels</strong> (year view) color each day
              with the feeling you used most that day. Press a day to read it.
            </li>
            <li>
              <strong>How you felt</strong> splits the period between your feelings, so the pieces add up to 100%. The
              small numbers on the right show the change since the last month or year.
            </li>
            <li>
              <strong>Days of the week</strong> shows which feeling shows up on which weekday, once you have a handful of
              entries.
            </li>
          </ul>
        </Section>

        <Section id="recap" title="Year recap">
          <p>
            A story of your year, a bit like a streaming service&apos;s year in review. It is made only from what is
            already in your journal, and nothing leaves your device.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              In November and December a card on Home says the recap is ready, and in January it points to the year that
              just ended. You can open it any time from Insights, in the Year view.
            </li>
            <li>
              Move through the slides with Next and Back, the arrow keys, or the bar at the top. The year picker switches
              between years that have entries or viewings.
            </li>
            <li>
              It shows how much you wrote, your longest streak, your busiest month and weekday, your feeling of the year,
              month by month feelings, your year in pixels, one memorable entry, and what you watched with your top picks.
            </li>
            <li>Slides that have nothing to show are skipped, so a year without movies simply has no movie slides.</li>
          </ul>
        </Section>

        <Section id="backup" title="Backups">
          <p>
            Press <strong>Back up now</strong> at the bottom of the sidebar, or on the Backup page. The first time, choose
            a folder, for example one called Life Trail Backups. After that, one press saves a fresh backup file in it,
            including your pictures.
          </p>
          <p>
            In Brave the folder option has to be switched on first. The Backup page shows how. Until then the button
            downloads the file to your Downloads folder, which also works. Keep a copy somewhere else too, such as a cloud
            folder or a USB stick.
          </p>
          <p>
            The Backup page also restores from a file or a daily snapshot. More details are in{" "}
            <Link href="/help/" className="font-medium text-brand-600 underline dark:text-brand-300">
              how your backups work
            </Link>
            .
          </p>
        </Section>

        <Section id="look" title="Look, lock and install">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Settings has an Appearance card with Match device, Light and Dark.</li>
            <li>The « Collapse button at the bottom of the sidebar shrinks it to icons. It remembers your choice.</li>
            <li>Settings can lock the app with a PIN. Write down the recovery code it gives you.</li>
            <li>Settings also has Install, so Life Trail opens like an app and works without internet.</li>
          </ul>
        </Section>

        <Section id="keys" title="Keyboard shortcuts">
          <p>On a Mac, use Cmd in place of Ctrl.</p>
          <Table
            head={["Keys", "What it does"]}
            rows={[
              [
                <span key="1">
                  <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
                </span>,
                "Save the entry, viewing or tag you are editing. On a link in the editor, open the link.",
              ],
              [
                <span key="2">
                  <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
                </span>,
                "Save the entry",
              ],
              [
                <span key="2b">
                  <Kbd>Alt</Kbd> + <Kbd>T</Kbd>
                </span>,
                "Open today's note from anywhere",
              ],
              [
                <span key="2c">
                  <Kbd>Alt</Kbd> + <Kbd>N</Kbd>
                </span>,
                "Start a new blank entry (in the Journal)",
              ],
              [
                <span key="3">
                  <Kbd>Ctrl</Kbd> + <Kbd>E</Kbd>
                </span>,
                "Switch between writing and reading",
              ],
              [
                <span key="4">
                  <Kbd>Ctrl</Kbd> + <Kbd>B</Kbd> / <Kbd>I</Kbd> / <Kbd>K</Kbd>
                </span>,
                "Bold, italic, or turn the selection into a link",
              ],
              [
                <span key="5">
                  <Kbd>Ctrl</Kbd> + click
                </span>,
                "Open a link in the editor",
              ],
              [<Kbd key="6">Esc</Kbd>, "Close a bigger poster or a dialog"],
            ]}
          />
        </Section>
      </article>
    </div>
  );
}
