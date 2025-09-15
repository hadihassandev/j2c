// storage-keys.ts
export const typePrefixKeys = {
  story: "prefix_story",
  subtask: "prefix_subtask",
  bug: "prefix_bug",
  pattern: "pattern",
} as const;

export const configKeys = {
  convertUmlaute: "config_convertUmlaute",
  convertSpecialCharacters: "config_convertSpecialCharacters",
  specialCharactersReplacementChar: "config_specialCharactersReplacementChar",
  makeLowerCase: "config_makeLowerCase",
  convertWhitespaces: "config_convertWhitespaces",
  whitespaceReplacementChar: "config_whitespaceReplacementChar",
  maxBranchnameLength: "config_maxBranchnameLength",
} as const;

// neu
export const settingsKeys = {
  jiraBaseUrl: "jira_base_url",
} as const;
