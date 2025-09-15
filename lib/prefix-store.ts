import { defaultTypePrefixes as D } from "./defaults";
import { getItem, setItem } from "./storage";
import { typePrefixKeys } from "./storage-keys";

export async function getStoryPrefix(): Promise<string> {
  const v = await getItem<string>(typePrefixKeys.story);
  if (v === undefined) {
    await setItem(typePrefixKeys.story, D.story);
    return D.story;
  }
  return v;
}
export async function getSubtaskPrefix(): Promise<string> {
  const v = await getItem<string>(typePrefixKeys.subtask);
  if (v === undefined) {
    await setItem(typePrefixKeys.subtask, D.subtask);
    return D.subtask;
  }
  return v;
}
export async function getBugPrefix(): Promise<string> {
  const v = await getItem<string>(typePrefixKeys.bug);
  if (v === undefined) {
    await setItem(typePrefixKeys.bug, D.bug);
    return D.bug;
  }
  return v;
}
export async function getPattern(): Promise<string> {
  const v = await getItem<string>(typePrefixKeys.pattern);
  if (v === undefined) {
    await setItem(typePrefixKeys.pattern, D.pattern);
    return D.pattern;
  }
  return v;
}
export async function setPattern(value: string) {
  await setItem(typePrefixKeys.pattern, value);
}
