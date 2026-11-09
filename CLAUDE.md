# CLAUDE.md

Context file for continuing this project in a new chat. Read it fully before doing anything, and read `PRD.md` next to it (the product requirements). The project is in the uploaded `life-trail-web.zip`. The old `PLAN.md` belongs to the abandoned Flutter version and is out of date.

Last refreshed: November 2026, at the end of the chat that added the Android app (Capacitor, APK built in the cloud by GitHub Actions). Before that: the year recap, the daily note, Markdown, pictures, the warm design, shows and the Home page. The Android app was written and checked in a browser simulation but NEVER built or run on a phone, see "Android app (Capacitor)" under Architecture decisions and Next steps.

## Project

Life Trail (final name, brand kit with logo, navy, gold and green): a personal journal that runs in the browser, installs as an app (PWA) and keeps all data on the device.

- GitHub: https://github.com/marturillas497-hash/life-trail-web (private, branch `main`).
- Hosted on Vercel (free Hobby plan) at https://life-trail-web.vercel.app, auto-deploys on every push to `main`.
- Local-first. Everything works offline except TMDB search of movies and shows, and the sharper poster in the poster viewer.
- Emotion tags only, no separate mood score. Users can create their own tags and pick an emoji for each.
- The earlier Flutter/Android version (repo `life-trail`) is paused. The person chose to build the web version first and make a mobile version later. The web version is now feature complete enough, and the person wants an APK next.

### What exists

- **Year recap** (`/recap/?year=2026`): a story of the year in ten slides (intro, writing, rhythm, feelings, month by month, Year in Pixels, a moment, watching, top picks, summary) with count-up numbers, four color themes, Back/Next, arrow keys, a progress bar that jumps, a year picker (years that have data) and a "nothing to look back on" state. Slides with no data are skipped. Linked from Home (card in November and December, and in January for the year before), and from Insights in the Year view. No sharing or export, on purpose.
- **Daily note**: "Open today's note" on Home and Alt+T anywhere. No entry yet today: opens a new entry prefilled from a template (Settings, Daily note) with the cursor in the text and the prompt of the day (60 rotating questions) shown above it. Entry exists: "Continue today's note" opens the first entry of the day for editing. Empty past days on the Home strip and the calendar's write button open the template for that day. Nothing is saved until the person writes, picks a feeling and saves, so there are no empty auto-created entries and streaks stay honest.
- **Home** (`/`): greeting, today's prompt and quick actions, streak and month counts, the last 7 days with each day's feeling (tap to read or backfill), On this day (same date in earlier years), recent entries, recently watched. The site opens here, not on the journal.
- **Journal**: entry list and detail side by side on PC, single pane on phone. Create, edit, delete. Feelings first, then text. Write for a past day from the calendar or the Home strip. Search box over titles, text and tag names.
- **Markdown entries** (Obsidian style live preview with CodeMirror 6): headings, bold, italic, strikethrough, inline code, bullet and numbered lists with auto continue, task checkboxes, quotes, rules, links, pictures. Read/Edit toggle, toolbar, Ctrl+B/I/K/E. Ctrl+Enter opens the link under the cursor, otherwise saves.
- **Pictures** in entries: upload button, paste, drag and drop, shrunk to 1600 px WebP, stored in IndexedDB, included in backup files.
- **Tags**: create, edit, archive and restore, emoji picker, color (used by Year in Pixels, mood calendar and charts).
- **Calendar**: month grid with top emojis per day, day panel, Sunday first.
- **Movies/Shows** (`/movies/`): TMDB search over movies and TV shows, manual entry with a Movie or Show choice, rating in half stars, date watched, opinion, rewatches, list with All/Movies/Shows filter, search, sort, Week/Month/Year/All watched period with arrows, equal size cards, poster viewer (press the poster), posters copied into the journal.
- **Insights**: streaks, writing stats, mood calendar (month), Year in Pixels (year), How you felt (shares that add up to 100% with change against the previous period), Days of the week. Month, Year, All time with arrows.
- **Backups**: one press Back up now (sidebar and Backup page), daily snapshots, optional automatic folder backups (Chromium File System Access API), reminder banner, download and share, restore from snapshot or file with preview and undo, Pictures card with Remove unused.
- **App lock**: PIN, recovery code, auto-lock options, lockout, erase fallback.
- **PWA**: manifest (starts at `/`), icons from the brand kit, install card, offline service worker, update bar.
- **Design**: warm palette, serif headings, light/dark/match device toggle, collapsible desktop sidebar, motion rules (see Design system).
- **Guide** (`/guide/`): the in-app How to use page, linked from the sidebar bottom and Settings. `/help/` is the separate backup explainer.
- **Settings**: How to use, Tags link, Daily note template, Daily reminder (Android app only), Appearance, Install (hidden in the Android app), App lock, TMDB key, link to backups.
- **Android app** (`android/`, `capacitor.config.ts`, `.github/workflows/android-apk.yml`): Capacitor 8 wrapper around the static export, with a daily reminder (local notification), backups through the Android share sheet, links opening in the phone browser. Written, not yet built or run on a phone.

### Not built yet

- A daily reminder on the website (browsers cannot fire scheduled notifications when closed). The Android app has one, untested on a device.
- Google Drive backup. Shelved: the person said to forget it for now (November 2026). The research is kept at the end of Next steps. Do not bring it up unless asked.
- Export to PDF or CSV. The person decided against it (November 2026), do not suggest it again unless asked.
- Fingerprint or device unlock for the app lock (PIN only).
- Several templates or per-day-of-week templates (there is one daily note template and one prompt of the day).
- Season level logging for shows (a show is logged as one title with its own viewings).
- Tables render as plain text in the editor, not as real tables.
- The official TMDB logo file (the person is adding `public/tmdb-logo.svg` themselves, see Gotchas).
- Proof that the Android app builds and runs. Nothing native has been tested on a real phone. Play Store release (needs a real upload key and a store listing) is not planned.

## About the user

- Beginner programmer. This is a learning project, so explain what each file and command does, briefly.
- Windows PC, VS Code, PowerShell (not cmd). Project folder: `C:\Users\twili\Documents\life-trail-web`. Zips are saved in `Desktop\life-trail-web-plan`.
- Uses only Brave as a browser. Important consequences, see Gotchas.
- Low disk space (under 5 GB free) and 4 GB RAM. Avoid big installs and emulators.
- Wants to see the full feature first and test later. Often says "continue", which means do the next planned item. Phone testing was explicitly set aside for now.
- Cares about how the app feels: wanted it warmer and more approachable ("black and bland" was the complaint), smooth animations, hover effects that only change colors and never make buttons rise, back buttons that look like buttons, a homepage, and an Obsidian like writing experience.
- Has not tested most parts by hand. Real browser tests are done by Claude in its sandbox (see Testing).

## Working style

- Never use em dashes.
- Keep code comments minimal and straight to the point. Use a block comment when more than one line is needed, not many inline comments.
- When code is needed, deliver a zip laid out in the project's file paths (extract into the project root), named `life-trail-web-partN.zip` (parts 1 to 11 exist so far, part 8 bundled everything from after part 7 up to the Home page, part 9 added the daily note, part 10 added the year recap, part 11 added the Android app, the next is part 12), plus the PowerShell commands:
  ```powershell
  Expand-Archive -Path "$HOME\Desktop\life-trail-web-plan\life-trail-web-partN.zip" -DestinationPath . -Force
  ```
  and the `git add -A`, `git commit -m "..."`, `git push` commands. Tell the person to stop the dev server first and to run `pnpm dev:clean` afterwards. When the zip needs new packages, give the exact `pnpm add` line, and remind that `pnpm-lock.yaml` must be committed.
- A zip cannot delete files. When a part removes or moves files, give the explicit delete command. In PowerShell, paths with brackets need `-LiteralPath`.
- Give a numbered list of things to test with each part.
- Ask at most one question at a time. Ask for pasted errors instead of guessing.
- Check current package docs and versions with web search when they matter. Packages here are very new (see Versions).
- Be honest about what was and was not tested. Never claim something works that could not be run.
- Before delivering code: run `tsc --noEmit`, `eslint src`, a real `build`, and the relevant tests, then fix what they show.
- Keep `CLAUDE.md` and `PRD.md` current. Refresh both at the end of any chat that changes features.

## Versions in use (November 2026)

Capacitor 8.6.0 (`@capacitor/core`, `android`, `cli`), plugins local-notifications 8.3.1, filesystem 8.1.5, share 8.0.3, browser 8.0.5 (Capacitor 8 needs Node 22+, JDK 21, AGP 8.13, Gradle 8.14.3, compileSdk and targetSdk 36, minSdk 24), Next.js 16.4.3 (Turbopack, App Router), React 19.3.0, TypeScript 5.9, Tailwind CSS 4.3.3 through `@tailwindcss/turbopack`, Dexie 4.4.7, dexie-react-hooks 4.4.0, emoji-picker-react 5.1.4, serve 14.2.6 (dev dependency, for `pnpm preview`), pnpm 12.15.0 (`packageManager` in package.json), Node 24.x (`engines`; local 24.13.1).

Things that bit us:
- `cacheComponents` and `partialPrefetching` cannot be used with `output: "export"` ("PPR cannot be enabled in export mode"). They were removed.
- pnpm 12 fails an install when dependencies have unreviewed build scripts. `pnpm-workspace.yaml` (`allowBuilds: sharp: false, unrs-resolver: false`) handles it. Do not add dev tools with install scripts (such as `tsx`) to `package.json`.
- The lint rule `react-hooks/set-state-in-effect` rejects calling `setState` synchronously inside `useEffect`. Set state inside async callbacks, or derive values instead.
- `AGENTS.md` in the repo (from create-next-app) tells agents to read `node_modules/next/dist/docs/` before writing Next.js code. Do that after `pnpm install` when unsure about a Next 16 API.
- The root `.gitignore` already ignores `/out/` and `/.next/`.
- Added in this period: CodeMirror 6 (`@codemirror/state`, `view`, `commands`, `language`, `lang-markdown`, installed by the person with `pnpm add`). Vercel installs with `--frozen-lockfile`, so the updated `pnpm-lock.yaml` must be committed. Import only these direct packages. `@lezer/common` is not exposed by pnpm.

## Architecture decisions

**Static site.** `next.config.ts` has `output: "export"` and `trailingSlash: true`. Every page is static HTML. There is no server and no API route. Entry pages use query strings instead of path segments (a dynamic `[id]` route cannot be exported): `/journal/entry/?id=5`. Helpers are in `src/lib/paths.ts` (`entryPath`, `editEntryPath`, `newEntryPath`, `movieLogPath`, `addMoviePath`, `parseId`, `normalizePath`). Always link with trailing slashes. The home page redirects on the client. `useSearchParams` and `usePathname` need a Suspense boundary, provided once around the whole app in `src/app/layout.tsx`.

**Hydration safety.** Pages are prerendered at build time, so anything that depends on today's date, locale, `window` or `navigator` must wait for the browser. Use the `useIsClient()` hook in `src/lib/hooks.ts` or compute inside state initializers that only run on the client.

**Data lives in IndexedDB through Dexie.** Two separate databases, so a problem in one cannot damage the other:
- `life-trail` (Dexie version 4): `tags` (`++id, name, isArchived`), `entries` (`++id, date, *tagIds, createdAt`), `movies` (`++id, &[kind+tmdbId], title`), `movieLogs` (`++id, movieId, watchedDate, createdAt`), `images` (`++id, createdAt`).
  - Version 2 added movies. Its upgrade hook keeps a copy of the old data in memory so the backup runner can save a "before an update" snapshot (`takePendingUpgrade`).
  - Version 3 added `images` (no data change).
  - Version 4 added TV shows: every old movie gets `kind: "movie"`, and the unique index moved from `tmdbId` to `[kind+tmdbId]`, because TMDB numbers films and shows separately and one id can be both. Versions 3 and 4 have no pre-upgrade snapshot, because they change nothing that can be lost.
- `life-trail-backups`: `snapshots` (`++id, createdAt, day, kind`) and `settings` (`key`).
- Settings keys: `lastFileBackupAt`, `lastFileBackupHash`, `remindAfter`, `folderHandle`, `folderError`, `storagePersisted`, `appLock`, `tmdbKey`, `dailyTemplate` (a string, missing means the default, an empty string means blank notes; like the other settings it is not part of backups).
- Types are in `src/lib/types.ts`. Entry and viewing dates are local-day strings `YYYY-MM-DD` (so they never shift with time zones). Timestamps are epoch milliseconds (UTC). Tags are archived, never deleted. `Movie.kind` is `"movie"` or `"tv"`. Tag `isArchived` is 0 or 1 because IndexedDB cannot index booleans.
- Pictures are `ArrayBuffer` rows (not Blob, so they clone cleanly everywhere). Entry text refers to them as `![name](image:ID)`. Nothing deletes a picture automatically. The Backup page has Remove unused.
- Dexie gotcha: define the db with `new Dexie(...) as Dexie & {...}` (not a class with typed fields).
- When the schema changes: add a new `db.version(n)`.
- Small browser settings that must be known before first paint live in localStorage, not Dexie: `life-trail-theme` (light/dark, absent means match device) and `life-trail-sidebar` (`collapsed`). The head script in `layout.tsx` applies them (two IIFEs joined with `;`, without the `;` the second one never ran).

**Backups (src/lib/backup/).**
- File format: `{ app: "life-trail", version: 4, exportedAt, tags, entries, movies, movieLogs, images }`. Versions 1 to 3 still load (no movies, no pictures, no kinds). Validation is hand written in `format.ts` and strict: bad dates, unknown references, duplicate ids, bad ratings, bad picture data, unknown kind, duplicate `kind+tmdbId`. Every new data type must be added to the format, the hash, snapshots, restore, erase and the validator.
- `BackupData.images` is optional. Missing means "leave the pictures alone" on restore, present means replace. Daily and manual snapshots leave pictures out to stay small. The "before a restore" snapshot includes them so a restore can be undone completely. Backup files and folder backups include them as base64.
- `hashData` uses a fixed field order. Pictures and shows only add fields when they exist, so older journals keep their fingerprint.
- Snapshot kinds and retention (`retention.ts`): `auto` (one per day, refreshed in place; keep newest 7 plus the newest of each of the last 4 weeks), `manual` (10), `pre-restore` (5), `pre-upgrade` (3).
- A journal is empty only when it has no entries and no movie logs (`hasContent`). Empty journals never produce snapshots or files.
- Restore replaces everything and never merges, and always saves a "before a restore" snapshot first.
- One press backup (`quickBackup` in `files.ts`): saved folder with permission handling, picker on first use, plain download when the browser has no folder access (Brave until the flag is on).
- Folder backups write `life-trail-backup-YYYY-MM-DD.json` (newest 30 kept). The permission must be re-granted by a click in new sessions.
- The TMDB key and the app lock settings are deliberately not in backups.
- `BackupRunner` (mounted in `AppShell`) runs the automatic steps on open and when the tab is hidden.

**App lock (src/lib/lock/).** PIN of 4 to 8 digits hashed with PBKDF2 (SHA-256, 200,000 rounds, random salt) through WebCrypto. A recovery code (16 characters, shown once) is hashed the same way. After every 5 wrong tries the lockout is 30 seconds, doubling up to 10 minutes. Auto-lock options: immediately when leaving, 1, 5 or 15 minutes (default 1), or only on open. The app always starts locked after a reload. The lock screen is an overlay and the app underneath gets `inert`, so unsaved drafts survive. Last resort "erase everything" requires typing ERASE. It is a privacy screen, not encryption: data in IndexedDB is not encrypted, and the Settings page says so. WebCrypto needs https or localhost.

**PWA and offline.**
- `scripts/generate-sw.mjs` runs after `next build` (the `build` script is `next build && node scripts/generate-sw.mjs`). It lists every file in `out/` and writes `out/sw.js` with a content-based version. The service worker precaches everything, answers cache-first ignoring query strings, and falls back to the cached `/journal/` for navigations.
- A new version waits until the person presses "Reload to update" (`ServiceWorkerRegister`). It never reloads on its own, so drafts are safe.
- The service worker only registers in production builds. `pnpm preview` serves `out/` on port 4000, a different origin from the dev server on 3000, so the service worker never interferes with development. Do not preview on port 3000.
- Cross-origin requests (TMDB) are not cached by the service worker.

**Movies, shows and TMDB.** The site has no server, so each user pastes their own free TMDB key in Settings (stored in `life-trail-backups` settings). A v3 API key (32 hex characters, sent as `api_key`) or a v4 Read Access Token (starts with `eyJ`, sent as a bearer header) both work. Search uses `/3/search/multi` (films and TV shows, people are skipped) with no slash before the `?`, because TMDB rejects cross origin calls to that form. A result is `{ kind, tmdbId, title, year, overview, posterPath }` where a show's title comes from `name` and its year from `first_air_date`. Posters are copied as data URLs so they work offline. The poster viewer loads a sharper `w780` copy from TMDB when online. Real TMDB responses are untested (the sandbox cannot reach TMDB), the browser tests use request interception.

**Markdown editor (src/components/markdown/).** CodeMirror 6 with `markdown({ base: markdownLanguage })`. The default base is plain CommonMark and has no tasks, strikethrough or bare links. `livePreview.ts` walks the syntax tree and hides markers except on the line or element the cursor touches (replace decorations are also provided as `atomicRanges` so arrow keys skip them). Widgets: bullets, checkboxes (click toggles `[ ]`/`[x]`), pictures, rules. The facet `readingMode` switches the same editor between writing and reading (Read/Edit button, Ctrl+E). `MarkdownView` is the same thing locked to reading and is used on the entry page. Keys: Ctrl+Enter opens the link under the cursor and returns false off a link, so `useSaveShortcut` saves. The default Mod-Enter blank line binding is filtered out on purpose. Only http, https, mailto and bare domains open (`safeUrl`). Previews and word counts use `plainText()` from `src/lib/markdown.ts`.

**Design system.**
- Tokens in `globals.css` `@theme`: `sand` (cream to the logo navy, replaced zinc), `brand` (forest green, the main accent, replaced indigo), `gold` (the sun, used for the active nav item and highlights), `--font-display` (a system serif stack for headings, no web fonts).
- Dark mode is class based: `@custom-variant dark (&:where(.dark, .dark *))`, with `html.dark` and `html.light` set before paint. Settings has Match device, Light, Dark.
- Collapsible sidebar through `@custom-variant collapsed` on `html[data-sidebar="collapsed"]`.
- Motion rules: all interactive elements ease colors only (`@layer base` transition on a, button, inputs). Buttons never rise, scale or move on hover. Allowed animations: page fade (`template.tsx`), dialog fade and pop, bars growing, sidebar width. `prefers-reduced-motion` turns everything off.
- Shared pieces: `ui.ts` class strings (`btnPrimary`, `btnSecondary`, `btnBack`, `cardClass`, `inputClass`), `BackLink` (back and cancel look like buttons), `Segmented`, `Lightbox`.

**Navigation.** The `NAV` array in `AppShell.tsx` (Home, Journal, Calendar, Movies/Shows, Insights, Tags, Backup, Settings). `mobile: false` hides an item from the phone tab bar (Tags and Backup, both reachable from Settings). Sidebar bottom: Back up now, How to use, Collapse. The logo links home. The manifest `start_url` is `/` (its `id` stays `/journal/` so installed copies are not treated as a new app).

**Year recap (src/lib/recap.ts, src/components/recap/).** `buildRecap(year, entries, watched, today)` is pure and tested: writing counts, words (Markdown stripped), pictures used, longest streak with dates (`longestRun`), busiest month and weekday, month by month top feeling, feeling shares, and the watching summary (titles by kind, rewatches, average rating, top picks by best viewing, most rewatched, busiest month). Days covered are the days so far for the current year. `RecapView` builds the slide list from the data and skips empty slides. Slides use `data-slide` attributes (the browser tests rely on them). `CountUp` honours reduced motion. The feeling bars use real shares, never normalised to the top one (that was the flaw in the old Insights Emotions block).

**Daily note (src/lib/dailyNote.ts, todayNote.ts, DailyNoteCard).** `DEFAULT_TEMPLATE` is three sections (Highlights, On my mind, Grateful for). `renderTemplate` fills `{{date}}`, `{{weekday}}`, `{{prompt}}` (case and spaces ignored, unknown placeholders stay). `promptFor(date)` picks one of 60 prompts by day number. The route is `/journal/new/?daily=1` (add `&date=` for a past day). The new entry page waits for the template setting to load before mounting the form, because `EntryForm` reads its initial body once. `todayNotePath()` decides between the edit page of the first entry today and a fresh note. List previews use `previewText()` which skips heading lines, so template sections do not become the preview.

**Keyboard shortcuts.** Ctrl+Enter saves entry, edit, viewing and tag (opens a link when on one in the editor), Ctrl+S saves an entry, Ctrl+B/I/K and Ctrl+E in the editor, Alt+T opens today's note (Alt+D was avoided because it focuses the address bar), Alt+N new blank entry in the journal, Esc closes dialogs and the poster viewer. Ctrl+N cannot be used because browsers reserve it.

**Deployment (Vercel).** `vercel.json` sets `"framework": null` (plain static site), `outputDirectory: "out"`, `trailingSlash: true`, install and build commands pinned to `npx --yes pnpm@12.15.0 ...` (Vercel only documents pnpm up to 10), a no-cache header for `/sw.js`, immutable caching for `/_next/static/`, and basic security headers. Setting the framework to Next.js together with `outputDirectory: "out"` fails with NEXT_NO_ROUTES_MANIFEST, which is why the framework is null. Keep Vercel "Deployment Protection" off for production, or the manifest and service worker get a login redirect and install breaks. `robots.txt` and a meta tag keep the site out of search engines.

**Origin-bound data.** The journal belongs to one exact web address. localhost:3000, localhost:4000 and the Vercel address each have their own journal. Renaming the project, changing the domain or adding a custom domain starts an empty journal there. Move data with a backup file (download there, restore here), then re-enter the TMDB key and set the app lock again.

**Android app (Capacitor).** The APK is the static export in `out/` inside a native shell. Route C was chosen: the APK is built in the cloud, no Android Studio on the PC.
- Files: `capacitor.config.ts` (appId `com.lifetrail.app`, never change it after the first install, appName Life Trail, webDir `out`), `android/` (generated by `cap add android`, committed, with the launcher icons and splash made by `@capacitor/assets` from `assets/`, a notification icon `ic_stat_life_trail`, `allowBackup="false"` so Android never copies the journal to Google), `.github/workflows/android-apk.yml`.
- Build: GitHub, Actions tab, Android APK, Run workflow (manual only). It installs with pnpm 12.15.0, runs `pnpm build`, `cap sync android`, `./gradlew assembleDebug --stacktrace` (a workflow step first replaces the number after `versionCode` in `android/app/build.gradle` with the run number using sed, so keep that line as `versionCode <number>`; a Groovy expression there failed with "Value is null"), and uploads `life-trail.apk` as an artifact (kept 30 days).
- Signing: `android/app/debug.keystore` is committed on purpose (password `android`, alias `androiddebugkey`) and `build.gradle` signs with it. A fixed key is required: with a random key per run, an update would not install over the old app, and uninstalling deletes the journal. Fine for personal sideloading in a private repo. A Play Store release needs a real upload key kept in GitHub Secrets.
- Native layer: `src/lib/native/` (`platform.ts` has `isNative()` and `openExternal()`, `share.ts` writes a backup to the cache folder and opens the share sheet, `reminder.ts` schedules one repeating daily local notification), `src/components/native/NativeBridge.tsx` (mounted in `AppShell`, re-applies the reminder on open and sends a notification tap to `todayNotePath()`), `ReminderCard.tsx` (Settings, Android only). Plugins are imported dynamically inside native branches so the website bundle stays small.
- Behaviour changes in the app: `downloadBackup()` now returns a boolean and in the app opens the share sheet (false when closed without choosing); `shareBackup` and `quickBackup` follow; `isFolderBackupSupported()` is false; `FolderBackupCard` and `InstallCard` render nothing; `ServiceWorkerRegister` does nothing (the files ship inside the APK, and a service worker would keep old files after an APK update); `openLink` uses the Browser plugin; clicking a picture does nothing (a blob URL cannot open in the browser).
- Reminder: a repeating notification (`schedule.on` hour and minute, `allowWhileIdle`, inexact, so no exact alarm permission is needed) on channel `daily-note`, id 1001. Stored in the `reminder` setting (`{ enabled, time }`), per device, not in backups. Asks for the notification permission when switched on. If permission is later removed, `syncReminder` switches the setting off.
- Data is separate per origin: the app has its own empty journal. Move data with a backup file (version 4 includes pictures) and Restore. Uninstalling the app deletes its journal.
- Android 16 / targetSdk 36 forces edge to edge. The viewport has no `viewport-fit=cover`, so Capacitor should pad the WebView natively and the existing layout needs no safe area CSS. Unverified. If the status bar or gesture bar overlaps the app, add `viewport-fit=cover` and use `env(safe-area-inset-*)` or the `--safe-area-inset-*` variables from the SystemBars plugin.
- Routing risk: Capacitor's Android server answers any path without a dot (such as `/journal/`) with the root `index.html`. In app navigation is client side (`.txt` payloads have dots, so they load as files) and nothing calls `location.reload`, so it should work, but a hard load of a deep route would show the wrong page. First thing to check on the phone: tap every tab, open an entry, press back.
- The simulated native test (see Testing) sets `window.androidBridge` before load so `Capacitor.isNativePlatform()` is true.

## Project structure

```
src/
  app/
    layout.tsx, template.tsx, manifest.ts, globals.css, favicon.ico, apple-icon.png
    page.tsx                    Home
    journal/ (layout, page, new/, entry/, entry/edit/)
    calendar/  tags/  insights/  recap/  backup/  help/  guide/  settings/
    movies/page.tsx            list, filters, period view
    movies/add/page.tsx        search or manual, rate (?movieId= logs another viewing)
    movies/log/page.tsx        one viewing (?id=)
  components/
    AppShell, BackLink, ConfirmDialog, DailyNoteCard, Lightbox, Segmented, ThemeCard, ui.ts
    EntryList, EntryDetail, EntryForm, CalendarView, TagChip, TagEditorDialog, EmojiPickerPanel
    InsightsView, YearInPixels, insights/ (FeelingsCard, MoodCalendar, WeekCard)
    recap/    RecapView, CountUp, MiniPixels, theme
    home/HomeView
    markdown/ (MarkdownEditor, MarkdownView, livePreview)
    backup/   BackupRunner, BackupBanner, StatusCard, QuickBackupCard, useQuickBackup, ManualBackupCard,
              FolderBackupCard, SnapshotsCard, RestoreFileCard, ImagesCard
    lock/     LockOverlay, AppLockCard, PinField, RecoveryCodeBox
    movies/   Poster, EnlargeablePoster, KindBadge, StarRating, MovieLogForm, MovieCard, TmdbKeyCard, TmdbAttribution
    pwa/      ServiceWorkerRegister, InstallCard
  lib/
    db, types, defaultTags, dates, paths, hooks, entries, tags, tagColors, calendar, movies, tmdb, install
    markdown, images, insights, watchPeriod, theme, sidebar, useSaveShortcut, dailyNote, todayNote, recap
    backup/   format, retention, store, snapshots, files, runner, hooks
    lock/     crypto, store, actions, context, erase
scripts/    generate-sw.mjs, clean.mjs, patch-package-json.mjs (already applied)
public/     icons/, logo-mark.png, robots.txt, tmdb-logo.svg (added by the person)
```

## Commands

```powershell
pnpm dev          # dev server, http://localhost:3000, no service worker
pnpm dev:clean    # delete .next, then dev (use after extracting a zip)
pnpm build        # static export to out/ plus out/sw.js
pnpm preview      # serve out/ at http://localhost:4000 (run pnpm build first)
pnpm lint
```

Android (normally done by the GitHub workflow, not locally): `pnpm build`, then `npx cap sync android` copies `out/` and the plugins into `android/`. Building the APK needs JDK 21 and the Android SDK, so it is done in the cloud. Do not run `cap add android` again, `android/` already exists.

The `start` script (`next start`) does not work with a static export and can be ignored.

## Gotchas and known issues

- **Stale CSS in dev.** The calendar once rendered without its grid styles because the dev server kept CSS generated before the file existed. It could not be reproduced in the sandbox. Fix: stop the server, `pnpm dev:clean`, hard refresh (Ctrl+Shift+R).
- **Brave.** The File System Access API is off by default in Brave, so automatic folder backups show "not supported" until the person enables `brave://flags/#file-system-access-api` and restarts. Download backup, Share and the reminder banner work without it. The install icon may not show in Brave's address bar, so use the menu. If Brave is set to clear site data on exit, the journal would be wiped each time.
- **Insecure addresses.** Install, offline and the app lock need https or localhost. They will not work on a PC's network address such as http://192.168.x.x.
- **Offline console noise.** While offline, `HEAD` requests for link prefetching fail in the console. Harmless.
- **Cruft in the zip.** The uploaded zip contains `out/` (build output, ignore it) and default `README.md`. The unused starter SVGs are in `public/`.
- **Untested by Claude, Android:** the Gradle build (the sandbox cannot reach Gradle or Google's Maven), the workflow, installing and running the APK, the reminder and its permission prompt, a notification tap opening today's note, the share sheet backup, restoring from a file picked in the app, TMDB search from the app's origin (`https://localhost`, TMDB should allow it), the app lock in the WebView, edge to edge layout, back button behaviour, the phone layout in general.
- **Untested by Claude** (could not run in the sandbox): real TMDB responses and the real key flow, the Vercel build and its routing (the person's build log showed install and build working, and they reported the deployment working after the output directory fix), the real folder picker, real devices, Brave itself.
- **TMDB logo.** TMDB requires its approved logo. It could not be fetched from the sandbox. The person saves the official file as `public/tmdb-logo.svg` (from themoviedb.org/about/logos-attribution) and the notice component shows it next to the text. Do not use third party copies.
- **Mobile bar.** The phone tab bar has six items (Home, Journal, Calendar, Movies/Shows, Insights, Settings). Adding a seventh needs a different layout.
- **Scratch tests and the build.** Keep the `scratch/` test folder out of the project while running `next build`, it breaks the type check.
- **Untested by Claude** (could not run in the sandbox): real TMDB responses (movies and shows), the real folder picker, Brave itself, real phones, the Vercel build and routing after the latest changes.

## Testing (how Claude verified things)

The sandbox resets between chats, so recreate what is needed. `life-trail-tests.zip` holds the scripts below (updated this chat).

- **Install and build.** Unzip the project, `npm install` works in the sandbox (npm registry is reachable), `npm run build` produces `out/`, then `node scripts/generate-sw.mjs`. Exact pnpm behaviour can be checked with `npm i -g pnpm@12.15.0` and `pnpm install --frozen-lockfile`.
- **Real browser.** In this chat a Chrome was already installed at `/opt/google/chrome/chrome`. Use `npm i puppeteer-core` and launch with `executablePath: "/opt/google/chrome/chrome"`, `headless: "new"`, `args: ["--no-sandbox", "--disable-gpu"]`. If it is missing, the older recipe was `@sparticuz/chromium`. Serve `out/` with `python3 -m http.server 3300` started with `setsid nohup`, from inside `out/`.
- **Servers in the sandbox.** Start them in the same command as the test or with `setsid nohup`. Never use `pkill -f "next dev"` inside a command containing that text, use `fuser -k PORT/tcp`.
- **Unit tests.** `fake-indexeddb/auto` plus `tsx`, importing the app's modules from a `scratch/` folder: `formattest`, `movietest`, `upgradetest`, `locktest`, `imagetest`, `showtest`. Install `tsx`, `fake-indexeddb`, `jsdom` only in the sandbox and restore `package.json` afterwards (do not deliver them).
- **Simulated native check.** `puppeteer-core` against `out/` served on port 3300, with `window.androidBridge = { postMessage() {} }` injected through `evaluateOnNewDocument` so Capacitor reports Android. It confirmed the Reminder card appears, the Install and Backup folder cards disappear and the backup wording changes, and that the website view is unchanged. Plugin calls fail there by design, so it proves the UI branches only.
- **Browser suites** (`browser/`): `editor.mjs` (Markdown, links, Ctrl+Enter, pictures, reader, sidebar), `features.mjs` (reading view, Ctrl+Enter save, poster viewer, insights, guide), `shows.mjs` (shows, Home, phone bar), `daily.mjs` (daily note, template settings, Alt+T, previews), `recap.mjs` (Home card, all ten slides, keyboard, year picker, empty year, phone width). Unit tests also include `dailytest.ts` and `recaptest.ts`. They seed IndexedDB directly and intercept TMDB.
- **TMDB.** The sandbox cannot reach TMDB. Tests intercept `api.themoviedb.org` and `image.tmdb.org` with puppeteer request interception.
- **Helper gotchas.** Triple-click does not select text in password inputs, so focus then call `el.select()`. Typing an empty string does not clear a field, press Backspace. Simulate leaving the tab by overriding `document.visibilityState`. When a test clicks a card with an offset, mind the card width.
- **What a browser test caught that tsc and lint did not:** the guide lacking the daily note; a test that matched the editor placeholder as real text; two start-up scripts joined without a `;` (the sidebar state never loaded); the Markdown parser lacking GitHub features; the same TMDB id existing for a film and a show.

## Next steps

1. **Get the first APK built and onto the phone.** The person must: run the `pnpm add` line from part 11, extract the zip, commit and push, then run the workflow on GitHub and download `life-trail.apk` from the run's Artifacts, copy it to the phone and install it (allow installs from the source). If the workflow fails, ask for the red log text and fix it, the Gradle build has never run. Gotchas to expect: action versions, an SDK package missing, a plugin needing a newer compileSdk.
2. **Test on the phone** (first time ever): every tab and back button (see the routing risk), status bar and gesture bar overlap, the Daily reminder (permission prompt, time, tap opens today's note), Back up now share sheet, restoring a backup file into the app, TMDB key and search, app lock, keyboard covering the editor, the toolbar and tab bar at phone width. Fix what shows.
3. Move the journal from the website to the app with a backup file when the person is ready, and remind them that uninstalling the app deletes its journal.
4. Google Drive backup is shelved. The research is at the end of this file in case they return to it.
5. Smaller ideas, only if asked: season level logging for shows, more daily note templates, a name for the Home greeting, fingerprint unlock (WebAuthn on the website, a biometric plugin in the app). Export to PDF or CSV was rejected.
6. Remind the person to commit and push after each part, and to test the Vercel deployment at its address. The website must keep working: Vercel only builds the Next.js site, the `android/` folder does not affect it.

### Google account and Drive (researched November 2026, nothing built, SHELVED by the person)

- Free. No paywall. The costs are the person's own Google Drive space (15 GB shared across Google services) and a few setup steps.
- Plan: an opt in "Back up to Google Drive" button that uploads the same JSON backup file. Use only the scope `drive.file` (or `drive.appdata` for a hidden app folder). Both are classed non-sensitive by Google, which avoids the restricted scope verification and the annual security assessment that full Drive access needs. Never request the full `drive` scope.
- A site with no server can only use the Google Identity Services token flow. That gives an access token that lasts about an hour and no refresh token, and getting a new token needs a user gesture (a button press). So Drive backup works as a one press button, and cannot run silently in the background.
- The person must create a Google Cloud project, enable the Drive API, configure the consent screen, add themselves as a test user (Testing mode is capped at 100 users and is enough for one person, or publish the consent screen, which for non-sensitive scopes needs no review), and create a web OAuth client ID with authorized origins `https://life-trail-web.vercel.app` and `http://localhost:3000`. The client ID is public and goes in the code or in Settings.
- Cannot be tested in the sandbox (needs a real Google sign in). Brave's shields might interfere with the popup.
- Not planned: real sync between devices (conflict handling, much larger work) and "sign in with Google" as an app login (pointless without a server).
- Current console layout (November 2026): Google Auth Platform with the pages Branding, Audience, Data Access and Clients. Audience holds the user type (External) and the publishing status: in Testing, at most 100 test users can sign in (their own addresses must be added), and refresh style authorizations expire after seven days, which does not matter for the one hour browser tokens. "Publish app" moves it to In production, where an unverified app can show a "Needs verification" notice only when sensitive scopes are requested.
- Privacy note for the PRD principle "data never leaves the device": Drive backup is opt in and goes to the person's own Drive. Consider encrypting the file with a passphrase before upload.

## Open questions

- What to do about the paused Flutter repo (keep as is, archive).
- Whether shows need seasons.
- Whether to add a name setting for the Home greeting.
