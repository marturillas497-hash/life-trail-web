/*
Set when the app is built. The Android workflow sets the version from the VERSION file and the build to its run number. The
website build leaves it empty, because the website always runs the latest code.
*/
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
export const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD ?? "";
