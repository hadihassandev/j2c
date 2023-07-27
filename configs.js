const typePrefixeStorageKeys = {
	storyKey: "prefix_story",
	subTaskKey: "prefix_subtask",
	bugKey: "prefix_bug",
	patternKey: "pattern",
};

const defaultTypePrefixes = {
	storyDefaultPrefix: "Story",
	subTaskDefaultPrefix: "feature",
	bugDefaultPrefix: "bugfix",
};
const defaultPattern = "$type/$key/$summary";

// ----------------------------------------------------------------

const configurationsStorageKeys = {
	convertUmlaute: "config_convertUmlaute",
	convertSpecialCharacters: "config_convertSpecialCharacters",
	specialCharactersReplacementChar: "config_specialCharactersReplacementChar",
	makeLowerCase: "config_makeLowerCase",
	convertWhitespaces: "config_convertWhitespaces",
	whitespaceReplacementChar: "config_whitespaceReplacementChar",
	maxBranchnameLength: "config_maxBranchnameLength",
};

const defaultConfigurations = {
	convertUmlaute: true,
	convertSpecialCharacters: true,
	specialCharactersReplacementChar: "-",
	makeLowerCase: false,
	convertWhitespaces: true,
	whitespaceReplacementChar: "-",
	maxBranchnameLength: 100,
};
