import { Capacitor } from "@capacitor/core";

/* True only inside the Android app. The website and the installed PWA return false. */
export function isNative(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/* Opens a web link in the phone's browser. */
export async function openExternal(url: string): Promise<void> {
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url });
}
