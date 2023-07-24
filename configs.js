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
	makeLowerCase: "config_makeLowerCase",
	convertWhitespaces: "config_convertWhitespaces",
	whitespaceReplacementChar: "config_whitespaceReplacementChar",
};

const defaultConfigurations = {
	convertUmlaute: true,
	makeLowerCase: false,
	convertWhitespaces: true,
	whitespaceReplacementChar: "-",
};
