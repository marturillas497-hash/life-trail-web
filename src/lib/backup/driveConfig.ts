/*
The app's own Google client ID, made once by whoever hosts Life Trail (see the guide at
/backup/drive/). With this filled in, people only press Connect Google Drive and sign in
with their own Google account. The ID is public by design: it tells Google which app is
asking, it does not give anyone access to anything. Leave it empty to make every person
paste their own client ID instead.
*/
/* The cast keeps TypeScript from treating this as the literal empty string, so filling it in never breaks the build. */
export const BUILT_IN_GOOGLE_CLIENT_ID = "" as string;
