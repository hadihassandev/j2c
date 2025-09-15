// src/lib/settings-store.ts
import { getItem, setItem } from "./storage";
import { settingsKeys } from "./storage-keys";
import { useStorageString } from "./use-storage";

export type Settings = {
  jiraBaseUrl: string;
};

export const defaultSettings: Settings = {
  jiraBaseUrl: "",
};

export async function getSettings(): Promise<Settings> {
  const v = await getItem<string>(settingsKeys.jiraBaseUrl);
  if (v === undefined) {
    await setItem(settingsKeys.jiraBaseUrl, defaultSettings.jiraBaseUrl);
    return { jiraBaseUrl: defaultSettings.jiraBaseUrl };
  }
  return { jiraBaseUrl: v ?? "" };
}

export async function setSetting<K extends keyof Settings>(
  k: K,
  v: Settings[K]
) {
  await setItem(settingsKeys[k], v);
}

// React-Hook für das Feld in Settings-UI
export function useJiraBaseUrl() {
  return useStorageString(
    settingsKeys.jiraBaseUrl,
    defaultSettings.jiraBaseUrl
  );
}
