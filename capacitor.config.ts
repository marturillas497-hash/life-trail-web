import type { CapacitorConfig } from "@capacitor/cli";

/*
The Android app wraps the static export in out/. The id below is the app's
permanent identity on a phone, so do not change it after the first install.
*/
const config: CapacitorConfig = {
  appId: "com.lifetrail.app",
  appName: "Life Trail",
  webDir: "out",
  android: { backgroundColor: "#102e46" },
  plugins: {
    LocalNotifications: { smallIcon: "ic_stat_life_trail" },
  },
};

export default config;
