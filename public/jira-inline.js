(() => {
  function asBool(v, d) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") return /^(true|1|on|yes)$/i.test(v);
    return d;
  }
  function asNum(v, d) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  function asStr(v, d) {
    return v == null ? d : String(v);
  }

  const api =
    typeof browser !== "undefined" && browser.storage
      ? browser
      : typeof chrome !== "undefined" && chrome.storage
      ? chrome
      : null;
  console.log("[J2C] storage.local available:", !!api?.storage);

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== "J2C_GET_ISSUE") return;

    (async () => {
      const k = issueKey(); // oder msg.key falls übergeben
      if (!k) return sendResponse({ ok: false });
      const issue = (await fetchIssueREST(k)) || (await fetchIssueXML(k));
      sendResponse({ ok: !!issue, issue }); // {key, summary, type, parentkey, link}
    })();

    return true; // async response
  });

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "J2C_FETCH_ISSUE") {
      (async () => {
        const k = issueKey();
        const issue = k
          ? (await fetchIssueREST(k)) || (await fetchIssueXML(k))
          : null;
        sendResponse({ ok: true, issue });
      })();
      return true; // async response offen halten
    }
  });

  // === Legacy-Keys (aus configs.js) ===
  const K = {
    story: "prefix_story",
    subtask: "prefix_subtask",
    bug: "prefix_bug",
    pattern: "pattern",
    convertUml: "config_convertUmlaute",
    convertSpec: "config_convertSpecialCharacters",
    replSpec: "config_specialCharactersReplacementChar",
    lower: "config_makeLowerCase",
    convertWS: "config_convertWhitespaces", // <— wichtig: exakt so
    replWS: "config_whitespaceReplacementChar",
    maxLen: "config_maxBranchnameLength",
  };

  const DEF = {
    [K.story]: "Story",
    [K.subtask]: "feature",
    [K.bug]: "bugfix",
    [K.pattern]: "$type/$key/$summary",
    [K.convertUml]: true,
    [K.convertSpec]: true,
    [K.replSpec]: "",
    [K.lower]: false,
    [K.convertWS]: true,
    [K.replWS]: "-",
    [K.maxLen]: 100,
  };

  // storage.local robust (Promise ODER Callback)
  function getLocal(keys) {
    return new Promise((resolve) => {
      if (!api || !api.storage || !api.storage.local) {
        console.log("[J2C] storage.local missing (no API)");
        return resolve({});
      }
      const s = api.storage.local;
      try {
        const maybe = s.get(keys);
        if (maybe && typeof maybe.then === "function") {
          maybe.then((items) => resolve(items || {})).catch(() => resolve({}));
          return;
        }
      } catch {}
      try {
        s.get(keys, (items) => resolve(items || {}));
      } catch {
        resolve({});
      }
    });
  }

  // Issue-Key robust
  function issueKey() {
    const meta = document.querySelector('meta[name="ajs-issue-key"]')?.content;
    if (meta) return meta;
    const patterns = [
      /[?&]selectedIssue=([A-Z][A-Z0-9]+-\d+)/i,
      /\/browse\/([A-Z][A-Z0-9]+-\d+)(?:[/?#]|$)/i,
      /\/issues\/([A-Z][A-Z0-9]+-\d+)(?:[/?#]|$)/i,
      /\/projects\/[A-Z][A-Z0-9]+\/issues\/([A-Z][A-Z0-9]+-\d+)(?:[/?#]|$)/i,
    ];
    for (const re of patterns) {
      const m = location.href.match(re);
      if (m) return m[1];
    }
    return (
      document
        .querySelector("[data-issue-key]")
        ?.getAttribute("data-issue-key") || null
    );
  }

  async function fetchIssueREST(key) {
    const fields = "summary,issuetype,parent,self";
    for (const u of [
      `${location.origin}/rest/api/2/issue/${key}?fields=${fields}`,
      `${location.origin}/rest/api/latest/issue/${key}?fields=${fields}`,
    ]) {
      try {
        const r = await fetch(u, { credentials: "include" });
        if (!r.ok) continue;
        const j = await r.json();
        return {
          key,
          summary: j?.fields?.summary ?? "",
          type: String(j?.fields?.issuetype?.name ?? ""),
          parentkey: j?.fields?.parent?.key ?? "",
          link: j?.self ?? "",
        };
      } catch {}
    }
    return null;
  }

  async function fetchIssueXML(key) {
    try {
      const url = `${location.origin}/si/jira.issueviews:issue-xml/${key}/jira.xml`;
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) return null;
      const doc = new DOMParser().parseFromString(await r.text(), "text/xml");
      const x = (tag) => doc.getElementsByTagName(tag)[0]?.textContent ?? "";
      return {
        key: x("key"),
        summary: x("summary"),
        type: x("type"),
        parentkey: x("parent") || "",
        link: doc.getElementsByTagName("link")[1]?.textContent ?? "",
      };
    } catch {
      return null;
    }
  }

  function shortenLegacy(txt, limit) {
    return txt.length > limit ? txt.substr(0, limit - 5) : txt;
  }

  async function typeToPrefix(typeRaw, cfg) {
    const t = (typeRaw || "").toLowerCase();
    const bug = asStr(cfg[K.bug], DEF[K.bug]);
    const sto = asStr(cfg[K.story], DEF[K.story]);
    const sub = asStr(cfg[K.subtask], DEF[K.subtask]);
    if (["bug", "fehler", "error", "defect"].includes(t)) return bug;
    if (t === "story") return sto;
    if (t === "sub-task" || t === "subtask") return sub;
    return sub;
  }

  async function buildBranch(cfg) {
    const k = issueKey();
    if (!k) return "";
    const issue = (await fetchIssueREST(k)) || (await fetchIssueXML(k));
    if (!issue) return "";

    const type = await typeToPrefix(issue.type, cfg);
    const key = issue.key || "";
    let summary = issue.summary || "";
    const parentkey = issue.parentkey || "";
    const link = issue.link || "";

    // === Konfigurationen exakt typisieren
    const convertUml = asBool(cfg[K.convertUml], DEF[K.convertUml]);
    const convertSpec = asBool(cfg[K.convertSpec], DEF[K.convertSpec]);
    const replSpec = asStr(cfg[K.replSpec], DEF[K.replSpec]);
    const convertWS = asBool(cfg[K.convertWS], DEF[K.convertWS]);
    const replWS = asStr(cfg[K.replWS], DEF[K.replWS]);
    const lower = asBool(cfg[K.lower], DEF[K.lower]);
    const maxLen = asNum(cfg[K.maxLen], DEF[K.maxLen]);
    const pattern = asStr(cfg[K.pattern], DEF[K.pattern]);

    // --- robuste, saubere Reihenfolge ---
    const esc = (x) => (x ? x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "");
    let s = summary ?? "";

    // 1) Romanize optional
    if (convertUml) {
      s = s
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/Ä/g, "Ae")
        .replace(/Ö/g, "Oe")
        .replace(/Ü/g, "Ue")
        .replace(/ß/g, "ss");
    }

    // 2) Special-Chars NUR ersetzen, niemals löschen, wenn aktiviert
    if (convertSpec) {
      // Erlaubt: ASCII a-z0-9, _, -, /, Whitespaces
      // Umlaute nur erlauben, wenn NICHT romanisiert wurde
      const uml = convertUml ? "" : "äöüÄÖÜß";
      const re = new RegExp(`[^A-Za-z0-9_/${uml}\\-\\s]`, "g");
      s = s.replace(re, replSpec); // "" => löschen, sonst ersetzen
    }

    // 3) Whitespaces
    if (convertWS) {
      s = s.replace(/\s+/g, replWS); // alles an Whitespace → replWS
    } else {
      s = s.replace(/\s+/g, " ").trim(); // konservativ normalisieren
    }

    // 4) Aufräumen
    if (replSpec)
      s = s.replace(new RegExp(`${esc(replSpec)}{2,}`, "g"), replSpec);
    if (convertWS && replWS)
      s = s.replace(new RegExp(`${esc(replWS)}{2,}`, "g"), replWS);
    s = s.replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
    s = s.replace(/-{2,}/g, "-").replace(/_{2,}/g, "_");

    summary = s;

    const values = {
      type,
      key,
      summary,
      parentkey: parentkey || "Parent",
      link,
    };

    // Platzhalter ersetzen wie Legacy  :contentReference[oaicite:2]{index=2}
    let out = pattern.replace(/\$(\w+)/g, (_, ph) => values[ph] ?? "");

    // Länge begrenzen + optional lowercase wie Legacy  :contentReference[oaicite:3]{index=3}
    out = shortenLegacy(out, maxLen);
    if (lower) out = out.toLowerCase();

    return out;
  }

  // Shadow DOM → keine Jira-Dirtiness
  function mountInline() {
    const host = document.querySelector(".issue-main-column");
    if (!host || document.getElementById("j2c-branch-inline-host")) return;

    const shell = document.createElement("div");
    shell.id = "j2c-branch-inline-host";
    host.insertBefore(shell, host.firstChild);

    const root = shell.attachShadow({ mode: "open" });
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <style>
        .wrapper{display:flex;flex-direction:column;gap:6px}
        .j2c-label{color:#5e6c84}
        .row{display:flex;gap:8px;align-items:center}
        .inp{flex:1;height:30px;border:1px solid #dfe1e5;border-radius:3.01px;padding:0 12px;font-size:13px;background:transparent;color:#5e6c84;opacity:.8;font-family:inherit}
        .btn{width:78px;height:30px;border-radius:3.01px;padding:0 12px;background:#6468f0;color:#fff;border:0;cursor:pointer;font-weight:600;font-family:inherit}
      </style>
      <div class="wrapper">
        <span class="j2c-label">Branch Name:</span>
        <div class="row">
          <input id="j2c-input" class="inp" type="text" disabled readonly autocomplete="off" />
          <button id="j2c-copy" class="btn" type="button" title="Kopieren">Kopieren</button>
        </div>
      </div>
    `;
    root.appendChild(wrap);

    const input = root.getElementById("j2c-input");
    const btnCopy = root.getElementById("j2c-copy");
    let copiedT = null;

    async function refresh() {
      const cfg = await getLocal(Object.values(K));
      input.value = await buildBranch(cfg);
    }

    btnCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(input.value || "");
        const prev = btnCopy.textContent;
        btnCopy.textContent = "✓";
        if (copiedT) clearTimeout(copiedT);
        copiedT = setTimeout(() => (btnCopy.textContent = prev), 1200);
      } catch {}
    });

    // initial
    refresh();

    // URL-Wechsel (SPA)
    let lastHref = location.href;
    const iv = setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        refresh();
      }
    }, 800);

    // Storage-Änderungen
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (Object.keys(changes).some((k) => Object.values(K).includes(k)))
        refresh();
    });

    // Cleanup
    const mo = new MutationObserver(() => {
      if (!document.body.contains(shell)) {
        clearInterval(iv);
        mo.disconnect();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  function boot() {
    const host = document.querySelector(".issue-main-column");
    if (host) mountInline();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  new MutationObserver(boot).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
