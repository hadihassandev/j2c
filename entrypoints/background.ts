const api: any = (globalThis as any).browser ?? (globalThis as any).chrome;
const K_BASE = "jira_base_url";
const CS_ID = "jira-inline";
const FILES = ["jira-inline.js"];

function toOriginPattern(input: string): string | null {
  const t = (input ?? "").trim();
  if (!t) return null;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    return `${u.protocol}//${u.host}/*`;
  } catch {
    return null;
  }
}

async function ensureOriginPermission(origin: string) {
  const perms = { origins: [origin] };
  if (api.permissions?.contains && api.permissions?.request) {
    const has = await api.permissions.contains(perms);
    if (!has) await api.permissions.request(perms);
  }
}

async function unregisterAll() {
  if (api.scripting?.unregisterContentScripts) {
    try {
      await api.scripting.unregisterContentScripts({ ids: [CS_ID] });
    } catch {}
  }
  if ((globalThis as any).__j2c_unreg?.unregister) {
    try {
      await (globalThis as any).__j2c_unreg.unregister();
    } catch {}
    (globalThis as any).__j2c_unreg = null;
  }
}

async function registerContent(origin: string) {
  // Chrome MV3
  if (api.scripting?.registerContentScripts) {
    await unregisterAll();
    await api.scripting.registerContentScripts([
      { id: CS_ID, js: FILES, matches: [origin], runAt: "document_idle" },
    ]);
    return;
  }
  // Firefox
  if (api.contentScripts?.register) {
    await unregisterAll();
    (globalThis as any).__j2c_unreg = await api.contentScripts.register({
      js: FILES.map((f: string) => ({ file: f })),
      matches: [origin],
      runAt: "document_idle",
    });
    return;
  }
}

async function applyFromStorage() {
  const items = await api.storage.local.get([K_BASE]);
  const origin = toOriginPattern(items[K_BASE]);
  if (!origin) {
    await unregisterAll();
    return;
  }
  await ensureOriginPermission(origin);
  await registerContent(origin);
}

export default defineBackground({
  async main() {
    await applyFromStorage();

    api.runtime?.onInstalled?.addListener(applyFromStorage);
    api.runtime?.onStartup?.addListener(applyFromStorage);
    api.storage?.onChanged?.addListener((changes: any, area: string) => {
      if (area !== "local" || !("jira_base_url" in changes)) return;
      applyFromStorage();
    });
  },
});
