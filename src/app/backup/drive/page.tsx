"use client";

import type { ReactNode } from "react";
import { BackLink } from "@/components/BackLink";
import { ExternalLink } from "@/components/ExternalLink";
import { cardClass } from "@/components/ui";

type Step = { title: string; body: ReactNode };

const LINK = "text-brand-600 underline";
const CODE = "rounded bg-sand-100 px-1.5 py-0.5 text-sm dark:bg-sand-800";

/*
Written from Google's current console layout (Google Auth Platform with the pages
Branding, Audience, Data Access and Clients). Google renames things now and then, so
the steps name what to look for rather than exact button positions.
*/
const STEPS: Step[] = [
  {
    title: "Open Google Cloud and make a project",
    body: (
      <>
        Go to{" "}
        <ExternalLink href="https://console.cloud.google.com/" className={LINK}>
          console.cloud.google.com
        </ExternalLink>{" "}
        and sign in with the Google account whose Drive should hold the backups. Accept the terms if asked. Use the
        project picker at the top, choose New project, name it Life Trail and create it. It is free and needs no
        payment details.
      </>
    ),
  },
  {
    title: "Turn on the Google Drive API",
    body: (
      <>
        With the new project selected, open the menu, then APIs and services, then Library. Search for{" "}
        <strong>Google Drive API</strong>, open it and press Enable.
      </>
    ),
  },
  {
    title: "Set up the consent screen",
    body: (
      <>
        Open the menu and find <strong>Google Auth Platform</strong>. If it says Get started, press it. Enter Life Trail
        as the app name and your own email as the support email. For Audience choose <strong>External</strong>, add your
        email as the contact, accept the policy and create.
      </>
    ),
  },
  {
    title: "Allow only the Drive file permission",
    body: (
      <>
        In Google Auth Platform, open <strong>Data Access</strong> and press Add or remove scopes. Tick only{" "}
        <code className={CODE}>.../auth/drive.file</code> (&quot;See, edit, create and delete only the specific Google
        Drive files you use with this app&quot;) and save. This permission is the narrow one: Life Trail can only see
        files it made itself, never the rest of your Drive.
      </>
    ),
  },
  {
    title: "Add yourself as a test user",
    body: (
      <>
        Open <strong>Audience</strong>. While the app is in Testing, only the email addresses listed under Test users can
        sign in, and that is fine for a private journal. Press Add users and add your own Google email. To let other people use it, press Publish app there instead. For this one narrow permission Google should not need a full security review, though it may ask for basic app details.
      </>
    ),
  },
  {
    title: "Create the client ID",
    body: (
      <>
        Open <strong>Clients</strong>, press Create client and choose <strong>Web application</strong>. Under Authorized
        JavaScript origins add each address you open Life Trail from:
        <span className="mt-2 block space-y-1">
          <code className={CODE}>https://life-trail-web.vercel.app</code>
          <br />
          <code className={CODE}>http://localhost:3000</code> (only if you run it on your computer)
        </span>
        <span className="mt-2 block">
          Leave Authorized redirect URIs empty. Press Create. Copy the <strong>Client ID</strong>, the long text ending in{" "}
          <code className={CODE}>.apps.googleusercontent.com</code>. You do not need the client secret, so ignore it.
        </span>
      </>
    ),
  },
  {
    title: "Put the client ID into the app",
    body: (
      <>
        To build it into the app, open <code className={CODE}>src/lib/backup/driveConfig.ts</code>, paste the client ID
        between the quotes, then commit and push as usual. Everyone who opens the site then gets a Connect Google Drive
        button on the Backup page. To try it first without changing any code, paste it into the box on the Backup page
        instead. It then applies on this device only.
      </>
    ),
  },
  {
    title: "Connect and back up",
    body: (
      <>
        On the Backup page press Connect Google Drive. Google opens a small window: choose your account and allow the
        permission. A message may say the app is not verified. That is expected for your own test app. Press Continue.
        Your first backup is saved right away, and from then on the Back up now button in the sidebar saves to Drive too.
      </>
    ),
  },
];

export default function DriveSetupPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-4 lg:p-8">
        <BackLink href="/backup/">Backup and restore</BackLink>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Set up Google Drive backup</h1>
        <p className="mt-2 text-sm text-sand-600 dark:text-sand-300">
          Life Trail has no server, so it cannot sign you in to Google for you. Instead, whoever hosts the app makes one small
          free Google Cloud project, once, and puts its client ID into the app. After that, every person only presses
          Connect Google Drive, signs in with their own Google account, and their backups go straight from their device to
          their own Drive. If your copy of the app already says Connect Google Drive on the Backup page, you do not need this
          page. The client ID is not a secret.
        </p>

        <ol className="mt-6 space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className={cardClass}>
              <h2 className="font-semibold">
                <span className="mr-2 text-brand-600">{index + 1}.</span>
                {step.title}
              </h2>
              <div className="mt-2 text-sm text-sand-700 dark:text-sand-200">{step.body}</div>
            </li>
          ))}
        </ol>

        <section className={`${cardClass} mt-6`}>
          <h2 className="font-semibold">Good to know</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-sand-700 dark:text-sand-200">
            <li>
              Each backup needs a press of the button and an internet connection. Google&apos;s sign-in lasts about an
              hour and cannot be renewed in the background by a site with no server.
            </li>
            <li>
              The backups are plain files. Anyone who can open your Google Drive can read them, so keep that account
              secure.
            </li>
            <li>
              If the sign-in window does not open in Brave, allow pop-ups for this site, and lower Brave Shields for it if
              the Google script cannot load.
            </li>
            <li>
              The client ID belongs to one web address. If you move Life Trail to another address, add that address under
              Authorized JavaScript origins, and remember your journal does not move on its own either.
            </li>
            <li>
              Backups are stored in a folder called Life Trail Backups. The newest 30 are kept, older ones go to the Drive
              trash.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
