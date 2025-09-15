import browser from "webextension-polyfill";

export async function fetchIssueXmlFromActiveTab(): Promise<Document | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ?? "";
  if (!url) return null;

  const m = /(browse\/|selectedIssue=|issues\/)(.*)+/g.exec(url);
  if (!m) return null;

  let issue = m[m.length - 1];
  const split = issue.split(/\?filter=/g);
  if (split.length > 1) issue = split[0];
  if (issue.endsWith("#")) issue = issue.slice(0, -1);

  const origin = new URL(url).origin;
  const xmlUrl = `${origin}/si/jira.issueviews:issue-xml/${issue}/jira.xml`;

  const res = await fetch(xmlUrl);
  if (!res.ok) return null;
  const text = await res.text();
  return new DOMParser().parseFromString(text, "text/xml");
}

export type Issue = {
  key: string;
  summary: string;
  type: string;
  parentkey: string;
  link: string;
};

export type JiraIssue = {
  key: string;
  summary: string;
  type: string;
  parentkey?: string;
  link?: string;
} | null;

export async function fetchIssueFromActiveTab(): Promise<JiraIssue> {
  const api: any = (globalThis as any).browser ?? (globalThis as any).chrome;

  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;

  const send = () =>
    new Promise<JiraIssue>((resolve, reject) => {
      api.tabs.sendMessage(tab.id, { type: "J2C_FETCH_ISSUE" }, (resp: any) => {
        if (api.runtime?.lastError) return reject(api.runtime.lastError);
        resolve(resp?.issue ?? null);
      });
    });

  try {
    return await send();
  } catch {
    // Content Script nachladen und erneut versuchen
    try {
      if (api.scripting?.executeScript) {
        await api.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["jira-inline.js"],
        });
      } else if (api.tabs?.executeScript) {
        await api.tabs.executeScript(tab.id, { file: "jira-inline.js" });
      }
    } catch {
      // Ignorieren, Retry folgt
    }
    return await send();
  }
}
