import { getItem, setItem } from "@/lib/storage";
import { defaultConfigs, defaultTypePrefixes } from "./defaults";
import { fetchIssueFromActiveTab } from "./jira";

const K = {
  story: "prefix_story",
  subtask: "prefix_subtask",
  bug: "prefix_bug",
  pattern: "pattern",
  convertUml: "config_convertUmlaute",
  convertSpec: "config_convertSpecialCharacters",
  replSpec: "config_specialCharactersReplacementChar",
  convertWS: "config_convertWhitespaces",
  replWS: "config_whitespaceReplacementChar",
  lower: "config_makeLowerCase",
  maxLen: "config_maxBranchnameLength",
} as const;

function escRe(s: string) {
  return s ? s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
}
function collapseRuns(s: string, token: string) {
  if (!token) return s;
  const re = new RegExp(`${escRe(token)}{2,}`, "g");
  return s.replace(re, token);
}
function sanitizeSummary(
  summary: string,
  opts: {
    convertUml: boolean;
    convertSpec: boolean;
    replSpec: string;
    convertWS: boolean;
    replWS: string;
  }
) {
  let s = summary ?? "";

  // 1) Romanize optional
  if (opts.convertUml) {
    s = s
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/Ä/g, "Ae")
      .replace(/Ö/g, "Oe")
      .replace(/Ü/g, "Ue")
      .replace(/ß/g, "ss");
  }

  // 2) Special-Chars: ersetzen oder löschen (wenn replSpec === "")
  if (opts.convertSpec) {
    const uml = opts.convertUml ? "" : "äöüÄÖÜß";
    const re = new RegExp(`[^A-Za-z0-9_${uml}/\\-\\s]`, "g");
    s = s.replace(re, opts.replSpec); // "" => löschen
  }

  // 3) Whitespaces
  if (opts.convertWS) s = s.replace(/\s+/g, opts.replWS);
  else s = s.replace(/\s+/g, " ").trim();

  // 4) Aufräumen
  if (opts.replSpec) s = collapseRuns(s, opts.replSpec);
  if (opts.convertWS && opts.replWS) s = collapseRuns(s, opts.replWS);
  s = s.replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
  s = s.replace(/-{2,}/g, "-").replace(/_{2,}/g, "_");

  return s;
}

function getXmlText(doc: Document, tag: string): string {
  const n = doc.getElementsByTagName(tag);
  return n && n[0]?.childNodes[0]?.nodeValue
    ? String(n[0].childNodes[0].nodeValue)
    : "";
}

async function mapTypeToPrefix(doc: Document): Promise<string> {
  const n = doc.getElementsByTagName("type");
  const t =
    n && n[0]?.childNodes[0]?.nodeValue
      ? String(n[0].childNodes[0].nodeValue).toLowerCase()
      : "";
  if (["bug", "fehler", "error", "defect"].includes(t))
    return (await getItem<string>(K.bug)) ?? defaultTypePrefixes.bug;
  if (t === "story")
    return (await getItem<string>(K.story)) ?? defaultTypePrefixes.story;
  if (t === "sub-task")
    return (await getItem<string>(K.subtask)) ?? defaultTypePrefixes.subtask;
  return "feature";
}

function trimSlashes(s: string) {
  return s.replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
}

export async function buildBranchFromActiveTicket(): Promise<string | null> {
  const issue = await fetchIssueFromActiveTab();
  if (!issue) return null;

  // Präferenzen und Prefixes laden
  const [
    convertUml,
    convertSpec,
    replSpec,
    convertWS,
    replWS,
    lower,
    maxLen,
    pattern,
    storyPrefix,
    subtaskPrefix,
    bugPrefix,
  ] = await Promise.all([
    getItem<boolean>(K.convertUml).then(
      (v) => v ?? defaultConfigs.convertUmlaute
    ),
    getItem<boolean>(K.convertSpec).then(
      (v) => v ?? defaultConfigs.convertSpecialCharacters
    ),
    getItem<string>(K.replSpec).then(
      (v) => v ?? defaultConfigs.specialCharactersReplacementChar
    ),
    getItem<boolean>(K.convertWS).then(
      (v) => v ?? defaultConfigs.convertWhitespaces
    ),
    getItem<string>(K.replWS).then(
      (v) => v ?? defaultConfigs.whitespaceReplacementChar
    ),
    getItem<boolean>(K.lower).then((v) => v ?? defaultConfigs.makeLowerCase),
    getItem<number>(K.maxLen).then(
      (v) => v ?? defaultConfigs.maxBranchnameLength
    ),
    getItem<string>(K.pattern).then(async (v) => {
      if (v === undefined) {
        await setItem(K.pattern, defaultTypePrefixes.pattern);
        return defaultTypePrefixes.pattern;
      }
      return v;
    }),
    getItem<string>(K.story).then((v) => v ?? defaultTypePrefixes.story),
    getItem<string>(K.subtask).then((v) => v ?? defaultTypePrefixes.subtask),
    getItem<string>(K.bug).then((v) => v ?? defaultTypePrefixes.bug),
  ]);

  // Issue-Felder
  const key = issue.key ?? "";
  const parentkey = issue.parentkey || "Parent";
  const link = issue.link ?? "";
  const rawSummary = issue.summary ?? "";

  // Typ → Prefix
  const t = String(issue.type ?? "").toLowerCase();
  const type = ["bug", "fehler", "error", "defect"].includes(t)
    ? bugPrefix
    : t === "story"
    ? storyPrefix
    : t === "sub-task" || t === "subtask"
    ? subtaskPrefix
    : subtaskPrefix;

  // Summary normalisieren (nutzt deine bestehende Helper-Funktion)
  const summary = sanitizeSummary(rawSummary, {
    convertUml,
    convertSpec,
    replSpec, // "" => löschen
    convertWS,
    replWS, // "" => löschen
  });

  // Platzhalter einsetzen
  const values: Record<string, string> = {
    type,
    key,
    summary,
    parentkey,
    link,
  };
  let branch = pattern.replace(
    /\$(type|key|summary|parentkey|link)/g,
    (_m, p) => values[p] ?? ""
  );

  // Begrenzen + säubern
  branch = branch.length > maxLen ? branch.slice(0, maxLen - 5) : branch;
  branch = trimSlashes(branch);
  if (lower) branch = branch.toLowerCase();

  return branch;
}
