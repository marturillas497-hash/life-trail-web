# CLAUDE.md

Context file for continuing this project in a new chat. Read it fully before doing anything. The project itself is in the uploaded `life-trail-web.zip`. The old `PLAN.md` is from the abandoned Flutter version and is out of date, so it is not needed. The roadmap you need is in this file.

## Project

Life Trail (working name, repo `life-trail-web`): a personal journal that runs in the browser, installs as an app (PWA), and keeps all data on the device.

- GitHub: https://github.com/marturillas497-hash/life-trail-web (private, branch `main`)
- Hosted on Vercel (free Hobby plan), auto-deploys on every push to `main`. The person confirmed the deployment works.
- Local-first. Journaling, tags, calendar, movies, backups and the app lock all work offline. The only online feature is TMDB movie search.
- Emotion tags only, no separate mood score. Users can create their own tags and pick an emoji for each.
- The earlier Flutter/Android version (repo `life-trail`, Documents\life-trail) is paused at Phase 1 step 5 and has uncommitted step 6 files. The person chose to build the web version first and make a mobile version later, once satisfied.

### What exists

- Journal: entry list and detail side by side on PC (two panes), single pane on phone. Create, edit, delete. Pick emotion tags first, then write. Write for a past day from the calendar.
- Tags: create, edit, archive and restore, emoji picker (emoji-picker-react, native emoji, lazy loaded), color swatches (color is reserved for Year in Pixels). "+ New tag" inside the entry form.
- Calendar: month grid with top emojis per day, day panel, Sunday-first (`WEEK_START` in `src/lib/calendar.ts`).
- Movies: TMDB search, rating in half stars (0.5 to 5), date watched, own opinion, rewatches (several logs per movie), manual entry without internet, list with filter and sort, posters copied into the journal as data URLs so they work offline.
- Backups: daily snapshots in the browser, optional automatic file backups to a chosen folder (Chromium File System Access API), a reminder banner, download and share, restore from snapshot or file with preview, undo via "before a restore" snapshot, Help page with instructions.
- PWA: manifest, icons, install card, offline service worker that caches every file, update bar ("Reload to update").
- App lock: PIN, recovery code, auto-lock options, lockout after wrong tries, erase fallback.
- Settings page: install, app lock, TMDB key, link to backups.

### Not built yet

- Daily note auto-created each day, and the daily reminder (postponed on purpose, see Next steps).
- Insights: monthly and yearly emotion stats, Year in Pixels, streaks and writing stats (entry and word counts).
- Search across journal entries (the Movies page has its own title filter).
- Year-end recap (Spotify Wrapped style), which should now include movies (count, top rated).
- Export to PDF or CSV (backup files are JSON only).
- Fingerprint or device unlock for the app lock (PIN only for now).
- Optional prompts and templates, On This Day, dark mode toggle and themes (dark mode follows the system setting), final app name.
- The official TMDB logo (see Gotchas).

## About the user

- Beginner programmer. This is a learning project, so explain what each file and command does, briefly.
- Windows PC, VS Code, PowerShell (not cmd). Project folder: `C:\Users\twili\Documents\life-trail-web`. Zips are saved in `Desktop\life-trail-web-plan`.
- Uses only Brave as a browser. Important consequences, see Gotchas.
- Low disk space (under 5 GB free) and 4 GB RAM. Avoid big installs and emulators.
- Wants to see the full feature first and test later. Often says "continue", which means do the next planned item. Phone testing was explicitly set aside for now.
- Has not yet thoroughly tested most parts by hand. Real browser tests were done by Claude in its sandbox (see Testing).

## Working style

- Never use em dashes.
- Keep code comments minimal and straight to the point. Use a block comment when more than one line is needed, not many inline comments.
- When code is needed, deliver a zip laid out in the project's file paths (extract into the project root), named `life-trail-web-partN.zip` (parts 1 to 7 exist so far), plus the PowerShell commands:
  ```powershell
  Expand-Archive -Path "$HOME\Desktop\life-trail-web-plan\life-trail-web-partN.zip" -DestinationPath . -Force
  ```
  and the `git add .`, `git commit -m "..."`, `git push` commands. Tell the person to stop the dev server first and to run `pnpm dev:clean` afterwards.
- A zip cannot delete files. When a part removes or moves files, give the explicit delete command. In PowerShell, paths with brackets need `-LiteralPath`.
- Give a numbered list of things to test with each part.
- Ask at most one question at a time. Ask for pasted errors instead of guessing.
- Check current package docs and versions with web search when they matter. Packages here are very new (see Versions).
- Be honest about what was and was not tested. Never claim something works that could not be run.
- Before delivering code: run `tsc --noEmit`, `eslint src`, a real `build`, and the relevant tests, then fix what they show.
- This chat was run with Claude able to run a real headless Chromium. See Testing for the recipe, because the sandbox does not carry over between chats.

## Versions in use (November 2026)

Next.js 16.4.3 (Turbopack, App Router), React 19.3.0, TypeScript 5.9, Tailwind CSS 4.3.3 through `@tailwindcss/turbopack`, Dexie 4.4.7, dexie-react-hooks 4.4.0, emoji-picker-react 5.1.4, serve 14.2.6 (dev dependency, for `pnpm preview`), pnpm 12.15.0 (`packageManager` in package.json), Node 24.x (`engines`; local 24.13.1).

Things that bit us:
- `cacheComponents` and `partialPrefetching` cannot be used with `output: "export"` ("PPR cannot be enabled in export mode"). They were removed.
- pnpm 12 fails an install when dependencies have unreviewed build scripts. `pnpm-workspace.yaml` (`allowBuilds: sharp: false, unrs-resolver: false`) handles it. Do not add dev tools with install scripts (such as `tsx`) to `package.json`.
- The lint rule `react-hooks/set-state-in-effect` rejects calling `setState` synchronously inside `useEffect`. Set state inside async callbacks, or derive values instead.
- `AGENTS.md` in the repo (from create-next-app) tells agents to read `node_modules/next/dist/docs/` before writing Next.js code. Do that after `pnpm install` when unsure about a Next 16 API.
- The root `.gitignore` already ignores `/out/` and `/.next/`.

## Architecture decisions

**Static site.** `next.config.ts` has `output: "export"` and `trailingSlash: true`. Every page is static HTML. There is no server and no API route. Entry pages use query strings instead of path segments (a dynamic `[id]` route cannot be exported): `/journal/entry/?id=5`. Helpers are in `src/lib/paths.ts` (`entryPath`, `editEntryPath`, `newEntryPath`, `movieLogPath`, `addMoviePath`, `parseId`, `normalizePath`). Always link with trailing slashes. The home page redirects on the client. `useSearchParams` and `usePathname` need a Suspense boundary, provided once around the whole app in `src/app/layout.tsx`.

**Hydration safety.** Pages are prerendered at build time, so anything that depends on today's date, locale, `window` or `navigator` must wait for the browser. Use the `useIsClient()` hook in `src/lib/hooks.ts` or compute inside state initializers that only run on the client.

**Data lives in IndexedDB through Dexie.** Two separate databases, so a problem in one cannot damage the other:
- `life-trail` (version 2): `tags` (`++id, name, isArchived`), `entries` (`++id, date, *tagIds, createdAt`), `movies` (`++id, &tmdbId, title`), `movieLogs` (`++id, movieId, watchedDate, createdAt`).
- `life-trail-backups`: `snapshots` (`++id, createdAt, day, kind`) and `settings` (`key`).
- Settings keys: `lastFileBackupAt`, `lastFileBackupHash`, `remindAfter`, `folderHandle`, `folderError`, `storagePersisted`, `appLock`, `tmdbKey`.
- Types are in `src/lib/types.ts`. Entry and viewing dates are local-day strings `YYYY-MM-DD` (so they never shift with time zones). Timestamps are epoch milliseconds (UTC). Tags are archived, never deleted, so old entries stay correct. The emoji is stored on the tag. Tag `isArchived` is 0 or 1 because IndexedDB cannot index booleans.
- Dexie gotcha: define the db with `new Dexie(...) as Dexie & {...}` (not a class with typed fields), otherwise TypeScript class fields can overwrite the tables.
- When the schema changes: add a new `db.version(n)`, and the upgrade hook in `src/lib/db.ts` keeps a copy of the old data in memory. The backup runner saves it as a "before an app update" snapshot. Keep doing this for future upgrades.

**Backups (src/lib/backup/).**
- Backup file format: `{ app: "life-trail", version: 2, exportedAt, tags, entries, movies, movieLogs }`. Version 1 files (no movies) are still accepted. Validation is hand written in `format.ts` and strict: it rejects bad dates, unknown tag or movie references, duplicate ids, bad ratings. Every new data type must be added to the format, the hash, snapshots, restore, erase and the validator.
- `hashData` uses a fixed field order, so the same data always gives the same fingerprint.
- Snapshot kinds and retention (`retention.ts`): `auto` (one per day, refreshed in place; keep newest 7 plus the newest of each of the last 4 weeks), `manual` (10), `pre-restore` (5), `pre-upgrade` (3).
- A journal is empty only when it has no entries and no movie logs (`hasContent`). Empty journals never produce snapshots or files, so a wipe cannot push good backups out.
- Restore replaces everything and never merges. It always saves a "before a restore" snapshot first.
- Folder backups write `life-trail-backup-YYYY-MM-DD.json` (newest 30 kept) using the File System Access API. The permission must be re-granted by a click in new sessions, handled by a banner.
- The TMDB key and the app lock settings are deliberately not in backups.
- `BackupRunner` (mounted in `AppShell`) runs the automatic steps on open and when the tab is hidden.

**App lock (src/lib/lock/).** PIN of 4 to 8 digits hashed with PBKDF2 (SHA-256, 200,000 rounds, random salt) through WebCrypto. A recovery code (16 characters, shown once) is hashed the same way. After every 5 wrong tries the lockout is 30 seconds, doubling up to 10 minutes. Auto-lock options: immediately when leaving, 1, 5 or 15 minutes (default 1), or only on open. The app always starts locked after a reload. The lock screen is an overlay and the app underneath gets `inert`, so unsaved drafts survive. Last resort "erase everything" requires typing ERASE. It is a privacy screen, not encryption: data in IndexedDB is not encrypted, and the Settings page says so. WebCrypto needs https or localhost.

**PWA and offline.**
- `scripts/generate-sw.mjs` runs after `next build` (the `build` script is `next build && node scripts/generate-sw.mjs`). It lists every file in `out/` and writes `out/sw.js` with a content-based version. The service worker precaches everything, answers cache-first ignoring query strings, and falls back to the cached `/journal/` for navigations.
- A new version waits until the person presses "Reload to update" (`ServiceWorkerRegister`). It never reloads on its own, so drafts are safe.
- The service worker only registers in production builds. `pnpm preview` serves `out/` on port 4000, a different origin from the dev server on 3000, so the service worker never interferes with development. Do not preview on port 3000.
- Cross-origin requests (TMDB) are not cached by the service worker.

**Movies and TMDB.** The site has no server, so each user pastes their own free TMDB key in Settings (stored in the `life-trail-backups` settings). Accepts a v3 API key (32 hex characters, sent as `api_key`) or a v4 Read Access Token (starts with `eyJ`, sent as a bearer header). Search uses `/3/search/movie` with no slash before the `?` (TMDB rejects cross-origin calls to the slashed form). Posters are fetched once and stored as data URLs (`fetchPosterData`, w185, max 400 KB), with the TMDB path kept as a fallback. TMDB's terms: free for personal, non-commercial use, show the notice "This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB." plus their logo. `TmdbAttribution` shows the notice and shows the logo if `public/tmdb-logo.svg` exists. That file has not been added yet (the person should download the official logo from themoviedb.org/about/logos-attribution). The `fetchedAt` field exists so TMDB data can be refreshed later (their terms reportedly limit caching of their data, which was not verified in the primary terms).

**Deployment (Vercel).** `vercel.json` sets `"framework": null` (plain static site), `outputDirectory: "out"`, `trailingSlash: true`, install and build commands pinned to `npx --yes pnpm@12.15.0 ...` (Vercel only documents pnpm up to 10), a no-cache header for `/sw.js`, immutable caching for `/_next/static/`, and basic security headers. Setting the framework to Next.js together with `outputDirectory: "out"` fails with NEXT_NO_ROUTES_MANIFEST, which is why the framework is null. Keep Vercel "Deployment Protection" off for production, or the manifest and service worker get a login redirect and install breaks. `robots.txt` and a meta tag keep the site out of search engines.

**Origin-bound data.** The journal belongs to one exact web address. localhost:3000, localhost:4000 and the Vercel address each have their own journal. Renaming the project, changing the domain or adding a custom domain starts an empty journal there. Move data with a backup file (download there, restore here), then re-enter the TMDB key and set the app lock again.

## Project structure

```
src/
  app/
    layout.tsx                  root layout, metadata (noindex), viewport, Suspense, AppShell
    page.tsx                    client redirect to /journal/
    manifest.ts                 web app manifest
    globals.css                 Tailwind import, system font
    favicon.ico, apple-icon.png
    journal/layout.tsx          two panes, Alt+N shortcut
    journal/page.tsx            empty right pane
    journal/new/page.tsx        new entry (?date=YYYY-MM-DD for a past day)
    journal/entry/page.tsx      entry detail (?id=)
    journal/entry/edit/page.tsx edit entry (?id=)
    calendar/  tags/  backup/  help/  settings/   one page.tsx each
    movies/page.tsx             list, filter, sort, stats
    movies/add/page.tsx         search or manual, rate (?movieId= logs another viewing)
    movies/log/page.tsx         one viewing: edit, delete, other viewings (?id=)
  components/
    AppShell.tsx                nav, lock overlay, backup runner and banner, update bar
    EntryList, EntryDetail, EntryForm, CalendarView, TagChip, TagEditorDialog,
    EmojiPickerPanel, ConfirmDialog, ui.ts (shared class strings)
    backup/   BackupRunner, BackupBanner, StatusCard, ManualBackupCard,
              FolderBackupCard, SnapshotsCard, RestoreFileCard
    lock/     LockOverlay, AppLockCard, PinField, RecoveryCodeBox
    movies/   Poster, StarRating, MovieLogForm, MovieCard, TmdbKeyCard, TmdbAttribution
    pwa/      ServiceWorkerRegister, InstallCard
  lib/
    db.ts, types.ts, defaultTags.ts, dates.ts, paths.ts, hooks.ts (live queries, useIsClient)
    entries.ts, tags.ts, tagColors.ts, calendar.ts, movies.ts, tmdb.ts, install.ts
    backup/   format, retention, store, snapshots, files, runner, hooks
    lock/     crypto, store, actions, context, erase
scripts/    generate-sw.mjs, clean.mjs, patch-package-json.mjs (already applied)
public/     icons/ (192, 512, maskable), robots.txt
            (file.svg, globe.svg, next.svg, vercel.svg, window.svg are unused leftovers)
```

Navigation items live in the `NAV` array in `AppShell.tsx` (Journal, Calendar, Movies, Tags, Backup, Settings). Items with `mobile: false` (Backup) are hidden from the phone tab bar. Keyboard shortcuts: Alt+N new entry, Ctrl+S save in the entry form. Ctrl+N cannot be used because browsers reserve it.

## Commands

```powershell
pnpm dev          # dev server, http://localhost:3000, no service worker
pnpm dev:clean    # delete .next, then dev (use after extracting a zip)
pnpm build        # static export to out/ plus out/sw.js
pnpm preview      # serve out/ at http://localhost:4000 (run pnpm build first)
pnpm lint
```

The `start` script (`next start`) does not work with a static export and can be ignored or removed.

## Gotchas and known issues

- **Stale CSS in dev.** The calendar once rendered without its grid styles because the dev server kept CSS generated before the file existed. It could not be reproduced in the sandbox. Fix: stop the server, `pnpm dev:clean`, hard refresh (Ctrl+Shift+R).
- **Brave.** The File System Access API is off by default in Brave, so automatic folder backups show "not supported" until the person enables `brave://flags/#file-system-access-api` and restarts. Download backup, Share and the reminder banner work without it. The install icon may not show in Brave's address bar, so use the menu. If Brave is set to clear site data on exit, the journal would be wiped each time.
- **Insecure addresses.** Install, offline and the app lock need https or localhost. They will not work on a PC's network address such as http://192.168.x.x.
- **Offline console noise.** While offline, `HEAD` requests for link prefetching fail in the console. Harmless.
- **Cruft in the zip.** The uploaded zip contains `out/` (build output, ignore it) and default `README.md`. The unused starter SVGs are in `public/`.
- **Untested by Claude** (could not run in the sandbox): real TMDB responses and the real key flow, the Vercel build and its routing (the person's build log showed install and build working, and they reported the deployment working after the output directory fix), the real folder picker, real devices, Brave itself.

## Added since the plan above (Nov 2026)

Done and tested in a real browser: theme toggle (class based dark mode, `html.dark`/`html.light`, stored in localStorage `life-trail-theme`), collapsible desktop sidebar (`html[data-sidebar=collapsed]`, localStorage `life-trail-sidebar`), warm palette (`sand`, `brand` green, `gold`; renamed from zinc and indigo), insights and entry search, Year in Pixels (most used tag of the day, ties go to the tag selected first), movies filtered by watched week, month, year, one press backup (sidebar button and Backup page card, falls back to a download when the browser has no folder access, Brave needs its flag turned on), app name stays Life Trail with the brand kit logos.

**Markdown and pictures.**
- Entry text is Markdown, edited and shown with CodeMirror 6 (`src/components/markdown/`). `livePreview.ts` hides the markers except on the line or element the cursor touches, like Obsidian's live preview. `MarkdownEditor` has the toolbar, paste and drop of pictures, Ctrl+B, Ctrl+I, Ctrl+K. `MarkdownView` is the read only twin used on the entry page. Ctrl+Enter (or Cmd+Enter) opens the link under the cursor, Ctrl+Click too, a plain click in the reader. Only http, https, mailto and bare domains open (`safeUrl`).
- The parser must be `markdown({ base: markdownLanguage })`. The default base is plain CommonMark and has no tasks, strikethrough or bare links.
- Dependencies added by the person with `pnpm add`: @codemirror/state, view, commands, language, lang-markdown. Vercel installs with `--frozen-lockfile`, so `pnpm-lock.yaml` must be committed with them. Do not import `@lezer/common` directly, pnpm does not expose it.
- Pictures live in the Dexie table `images` (database version 3) as `ArrayBuffer`, shrunk to 1600 px and stored as WebP (GIFs untouched, max 4 MB). Entry text refers to them as `![name](image:ID)`. Nothing deletes a picture automatically. The Backup page has a Pictures card with Remove unused.
- Backup file version 3 adds `images` with base64 data. `BackupData.images` is optional: missing means "leave the pictures alone" on restore, present means replace. Daily and manual snapshots leave pictures out to stay small. The "before a restore" snapshot includes them so a restore can be undone completely. The hash only covers pictures when there are some. Erase clears them.
- Journal list, calendar and Year in Pixels previews and word counts use `plainText()` from `src/lib/markdown.ts`.
- The head script that sets the theme and sidebar is two IIFEs joined with `;`. Without the `;` the second one never ran (found by the browser test).

## Testing (how Claude verified things)

The sandbox resets between chats, so recreate what is needed. An optional `life-trail-tests.zip` holds the scripts below.

- **Install and build.** Unzip the project, `npm install` works in the sandbox (npm registry is reachable), `npm run build` produces `out/`. Exact pnpm behaviour can be checked with `npm i -g pnpm@12.15.0` and `pnpm install --frozen-lockfile`. The Vercel CLI cannot run (no network to Vercel).
- **Real browser.** `npm i puppeteer-core @sparticuz/chromium` (a Chromium 153 binary comes inside the npm package). Launch with `executablePath: await chromium.executablePath()`, `args: [...chromium.args, "--no-sandbox"]`, `headless: "shell"`. Serve the build with `npx serve out -l 3300`.
- **Servers in the sandbox.** Start them from a small script with `setsid nohup`, in the same command as the test. Background processes do not survive between tool calls. Never use `pkill -f "next dev"` inside a command that contains that text (it kills itself). Use `fuser -k PORT/tcp`.
- **Unit tests.** `fake-indexeddb/auto` plus `tsx`, importing the app's own modules from a `scratch/` folder in the project (Node has no `FileReader`, avoid it in app code). Do not leave `tsx` or `fake-indexeddb` in the delivered package.json.
- **TMDB.** The sandbox cannot reach TMDB. Tests intercept `api.themoviedb.org` and `image.tmdb.org` with puppeteer request interception (set a flag to abort them when testing offline, because `setOfflineMode` does not stop intercepted requests).
- **Helper gotchas.** Triple-click does not select text in password inputs, so focus then call `el.select()`. Typing an empty string does not clear a field, press Backspace. Simulate leaving the tab by overriding `document.visibilityState` and dispatching `visibilitychange`. Offline checks need the service worker to control the page first (wait for `navigator.serviceWorker.controller`).
- **Suites that passed against the final build:** journal, calendar, tags and backup tour; offline and install checks (including a real update flow); app lock (31 checks); movies (50 checks); unit tests for the backup format, the upgrade snapshot from a real version 1 database, TMDB parsing and movie rules.

## Next steps

1. Ask what the person wants next. Candidates, in the order they were planned:
   - Insights and search: monthly and yearly emotion stats (Recharts is the planned chart library), Year in Pixels (custom CSS grid, needs the color rule below), streaks and writing stats, search entries.
   - Daily note and reminder. Reality check already given: browsers cannot reliably fire scheduled notifications when the app is closed. A real reminder needs Web Push plus a server that sends it on a schedule (Vercel's free cron is daily only). The recommendation is to build the daily note now and do the reminder in the mobile phase with local notifications.
   - Year-end recap including movies.
   - Polish: final app name, dark mode toggle and themes, TMDB logo file, removing unused files, maybe fingerprint unlock through WebAuthn.
2. Later: a mobile version. The static export is already compatible with wrapping the site in Capacitor to get an Android app and native local notifications. Not started.
3. Remind the person: commit and push after each part, and after every new part test the Vercel deployment at its address.

## Open questions

- Final app name (candidates: Mosaic, Hue, Feelog, Tidal, Dayfold, Kept, Inkling). `life-trail` is the current name. Changing the web address later moves the data to an empty journal, so decide before relying on the production address, or plan a backup and restore.
- What to do about the paused Flutter repo (keep as is, archive).
