import browser from "webextension-polyfill";

export async function setItem<T>(key: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

export async function getItem<T>(key: string): Promise<T | undefined> {
  const out = await browser.storage.local.get(key);
  return out[key] as T | undefined;
}

export async function getAll(): Promise<Record<string, unknown>> {
  return browser.storage.local.get(null);
}

export async function clearAll(): Promise<void> {
  await browser.storage.local.clear();
}

export function onStorageChanged(
  cb: (changes: Record<string, browser.Storage.StorageChange>) => void
): () => void {
  const listener = (
    changes: Record<string, browser.Storage.StorageChange>,
    area: string
  ) => {
    if (area === "local") cb(changes);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
