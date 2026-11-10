import { registerPlugin } from "@capacitor/core";

/* The Android side lives in android/app/src/main/java/com/lifetrail/app/FolderBackupPlugin.java */
type FolderBackupPlugin = {
  pickFolder(): Promise<{ cancelled: boolean; uri?: string; name?: string }>;
  checkFolder(options: { uri: string }): Promise<{ granted: boolean }>;
  writeFile(options: { uri: string; name: string; data: string }): Promise<void>;
  pruneFiles(options: { uri: string; pattern: string; keep: number }): Promise<void>;
  releaseFolder(options: { uri: string }): Promise<void>;
};

export const FolderBackup = registerPlugin<FolderBackupPlugin>("FolderBackup");

/* What is stored in the folderHandle setting in the Android app. */
export type NativeFolder = { native: true; uri: string; name: string };

export const isNativeFolder = (value: unknown): value is NativeFolder =>
  typeof value === "object" && value !== null && (value as { native?: unknown }).native === true;
