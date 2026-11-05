const BACKUP_NAME = /^life-trail-backup-.*\.json$/;

/*
Saves the text to a temporary file and opens the Android share sheet, so the
person can send it to Google Drive, Files, email and so on. Returns false if
the share sheet was closed without choosing anything.
*/
export async function shareJsonFile(name: string, json: string): Promise<boolean> {
  const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");

  /* Older temporary backups are removed so copies of the journal do not pile up. */
  try {
    const { files } = await Filesystem.readdir({ path: "", directory: Directory.Cache });
    for (const file of files) {
      if (BACKUP_NAME.test(file.name)) {
        await Filesystem.deleteFile({ path: file.name, directory: Directory.Cache }).catch(() => {});
      }
    }
  } catch {
    /* A failed cleanup must not stop the backup. */
  }

  const written = await Filesystem.writeFile({
    path: name,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  try {
    await Share.share({ title: "Life Trail backup", files: [written.uri], dialogTitle: "Save your backup" });
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) return false;
    throw error;
  }
  return true;
}
