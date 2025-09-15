import { defaultConfigs as D } from "./defaults";
import { getItem, setItem } from "./storage";
import { configKeys as K } from "./storage-keys";

export type Configs = typeof D;

export async function getConfigs(): Promise<Configs> {
  const entries = await Promise.all(
    (Object.keys(K) as (keyof typeof K)[]).map(async (k) => {
      const key = K[k];
      const v = await getItem<any>(key);
      if (v === undefined) {
        await setItem(key, D[k]);
        return [k, D[k]] as const;
      }
      return [k, v] as const;
    })
  );
  return Object.fromEntries(entries) as Configs;
}

export async function setConfig<K extends keyof Configs>(k: K, v: Configs[K]) {
  await setItem((K as any)[k] ?? K[k], v);
}
