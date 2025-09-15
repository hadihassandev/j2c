import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { getItem, setItem } from "./storage";

export function useStorageBool(key: string, def: boolean) {
  const [val, setVal] = useState(def);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const v = await getItem<boolean>(key);
      if (!alive) return;
      setVal(v ?? def);
      setReady(true);
    })();
    const onChange = (
      c: Record<string, browser.Storage.StorageChange>,
      a: string
    ) => {
      if (a === "local" && key in c)
        setVal((c[key].newValue as boolean) ?? def);
    };
    browser.storage.onChanged.addListener(onChange);
    return () => {
      alive = false;
      browser.storage.onChanged.removeListener(onChange);
    };
  }, [key, def]);

  const update = async (v: boolean) => {
    setVal(v);
    await setItem(key, v);
  };
  return { value: val, setValue: update, ready };
}

export function useStorageNumber(key: string, def: number) {
  const [val, setVal] = useState(def);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const v = await getItem<number>(key);
      if (!alive) return;
      setVal(typeof v === "number" ? v : def);
      setReady(true);
    })();
    const onChange = (
      c: Record<string, browser.Storage.StorageChange>,
      a: string
    ) => {
      if (a === "local" && key in c) {
        const n = c[key].newValue;
        setVal(typeof n === "number" ? (n as number) : def);
      }
    };
    browser.storage.onChanged.addListener(onChange);
    return () => {
      alive = false;
      browser.storage.onChanged.removeListener(onChange);
    };
  }, [key, def]);

  const update = async (v: number) => {
    setVal(v);
    await setItem(key, v);
  };
  return { value: val, setValue: update, ready };
}

export function useStorageString(key: string, def: string) {
  const [val, setVal] = useState<string>(def);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const v = await getItem<string>(key);
      if (!alive) return;
      setVal(v ?? def);
      setReady(true);
    })();
    const onChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      area: string
    ) => {
      if (area !== "local" || !(key in changes)) return;
      const nv = changes[key].newValue as string | undefined;
      setVal(nv ?? def);
    };
    browser.storage.onChanged.addListener(onChange);
    return () => {
      alive = false;
      browser.storage.onChanged.removeListener(onChange);
    };
  }, [key, def]);

  const update = async (v: string) => {
    setVal(v);
    await setItem(key, v);
  };

  return { value: val, setValue: update, ready };
}
