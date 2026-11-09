import type { ReactNode } from "react";
import { BackLink } from "@/components/BackLink";

export const metadata = { title: "Backup help | Life Trail" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-sand-700 dark:text-sand-300">
        {children}
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-2xl p-4 lg:p-8">
        <BackLink href="/backup/">Backup and restore</BackLink>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">How your backups work</h1>

        <Section title="Where your journal lives">
          <p>
            Life Trail has no server and no account. Your journal is stored inside this browser, on
            this device only. That keeps it private, but it also means nobody else has a copy. If
            this browser&apos;s data is deleted, the journal goes with it unless you have a backup.
          </p>
        </Section>

        <Section title="What protects it">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Daily snapshots.</strong> Once a day, when you use the app, a copy of your
              journal is saved in a separate store in this browser. The last 7 days and the last 4
              weeks are kept. These protect you from mistakes, such as deleting an entry you
              wanted. They live in the same browser, so they do not help if all browser data is
              cleared.
            </li>
            <li>
              <strong>Backup folder (Chrome or Edge on a computer).</strong> In Brave, first turn on
              File System Access API at brave://flags/#file-system-access-api and restart Brave. You
              choose a folder once. Life Trail then saves a file named like{" "}
              <code>life-trail-backup-2026-10-28.json</code> there each day you use it, and keeps
              the newest 30. If that folder syncs to OneDrive or Google Drive, you also have a copy
              off the computer.
            </li>
            <li>
              <strong>Backup reminder.</strong> If you have no folder set up and 7 days pass without
              a backup file, a banner offers a one-tap download. On phones, Share backup can send the
              file straight to a drive or chat app.
            </li>
            <li>
              <strong>Storage protection.</strong> The app asks the browser not to clear its data
              when the device runs low on space. The Backup page shows whether the browser agreed.
            </li>
          </ol>
          <p>
            Snapshots and folder files are skipped while the journal is empty, so an accidental wipe
            cannot overwrite your good copies.
          </p>
        </Section>

        <Section title="Everyday use">
          <p>
            You do not need to do anything. Open the Backup page now and then to check the status,
            and click Allow if a banner says the backup folder needs permission. Browsers sometimes
            ask again after you reopen them.
          </p>
        </Section>

        <Section title="How to restore from a snapshot">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open Backup in the menu.</li>
            <li>
              In <em>Snapshots in this browser</em>, find the date you want. Each line shows how
              many entries it holds.
            </li>
            <li>Click Restore, then confirm.</li>
          </ol>
          <p>
            Before any restore, your current journal is saved as a snapshot labeled{" "}
            <em>Before a restore</em>. If the result is not what you wanted, restore that one to
            undo it.
          </p>
        </Section>

        <Section title="How to restore from a backup file">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Find the file. In your backup folder, pick the newest one, or any date you want. Or
              use a file you downloaded earlier.
            </li>
            <li>Open Backup, then go to <em>Restore from a backup file</em> and choose the file.</li>
            <li>
              Check the preview: the number of entries, the date range, and when the file was
              saved.
            </li>
            <li>Click Replace my journal with this backup, then confirm.</li>
          </ol>
          <p>
            Restoring replaces your whole journal with the file&apos;s contents. It does not merge
            the two. The preview warns you if the file has fewer entries than your journal has now.
          </p>
        </Section>

        <Section title="Moving to a new browser or device">
          <ol className="list-decimal space-y-2 pl-5">
            <li>On the old one, open Backup and click Download backup file.</li>
            <li>Move the file to the new device (cloud drive, email, USB, or Share).</li>
            <li>
              Open Life Trail on the new device and restore from that file, as described above.
            </li>
          </ol>
        </Section>

        <Section title="If everything seems to be gone">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Do not write new entries yet, and do not clear browser data. First check that you are
              on the same browser, the same profile and the same address as before. Each one has its
              own separate journal.
            </li>
            <li>
              Open Backup and look at <em>Snapshots in this browser</em>. If you see recent ones,
              restore the newest.
            </li>
            <li>
              If there are none, restore from a backup file: first the newest file in your backup
              folder, then any download you made.
            </li>
            <li>
              If you have no file, check the cloud drive that your backup folder syncs to, your
              email and your Downloads folder for files named{" "}
              <code>life-trail-backup-...json</code>.
            </li>
          </ol>
        </Section>

        <Section title="Movies and your backups">
          <p>
            Your movies, ratings, opinions and saved posters are part of every snapshot and backup
            file, and restoring brings them back with the entries. Your TMDB key is not included on
            purpose, because a backup file should be safe to put in a cloud drive. After restoring
            on a new device, paste the key into Settings again.
          </p>
        </Section>

        <Section title="Good to know">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Clearing &quot;cookies and site data&quot; in your browser deletes the journal and
              its snapshots together. Backup files are the only protection against that.
            </li>
            <li>Private or incognito windows do not keep anything after they close.</li>
            <li>
              Backup files are plain text and anyone who has one can read your journal. Keep them
              somewhere private.
            </li>
            <li>
              Once in a while, try a restore from a file to be sure your backups work. Because a
              snapshot is saved first, it is safe to try.
            </li>
          </ul>
        </Section>
      </article>
    </div>
  );
}
