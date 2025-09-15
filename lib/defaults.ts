export const defaultTypePrefixes = {
  story: "Story",
  subtask: "feature",
  bug: "bugfix",
  pattern: "$type/$key/$summary",
} as const;

export const defaultConfigs = {
  convertUmlaute: true,
  convertSpecialCharacters: true,
  specialCharactersReplacementChar: "",
  makeLowerCase: false,
  convertWhitespaces: true,
  whitespaceReplacementChar: "-",
  maxBranchnameLength: 100,
} as const;
