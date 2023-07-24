const configStorageUtilFunctions = {
	getConfigurations: function () {
		let data = {
			convertUmlaute: undefined,
			makeLowerCase: undefined,
			convertWhitespaces: undefined,
			whitespaceReplacementChar: undefined,
			max_branchname_length: undefined,
		};

		let promises = [
			storageUtilFunctions.getData(configurationsStorageKeys.convertUmlaute).then((value) => {
				if (value === undefined) {
					value = defaultConfigurations.convertUmlaute;
					storageUtilFunctions.setData(configurationsStorageKeys.convertUmlaute, value);
				}
				return value;
			}),
			storageUtilFunctions.getData(configurationsStorageKeys.makeLowerCase).then((value) => {
				if (value === undefined) {
					value = defaultConfigurations.makeLowerCase;
					storageUtilFunctions.setData(configurationsStorageKeys.makeLowerCase, value);
				}
				return value;
			}),
			storageUtilFunctions.getData(configurationsStorageKeys.convertWhitespaces).then((value) => {
				if (value === undefined) {
					value = defaultConfigurations.convertWhitespaces;
					storageUtilFunctions.setData(configurationsStorageKeys.convertWhitespaces, value);
				}
				return value;
			}),
			storageUtilFunctions.getData(configurationsStorageKeys.whitespaceReplacementChar).then((value) => {
				if (value === undefined) {
					value = defaultConfigurations.whitespaceReplacementChar;
					storageUtilFunctions.setData(configurationsStorageKeys.whitespaceReplacementChar, value);
				}
				return value;
			}),
			storageUtilFunctions.getData(configurationsStorageKeys.maxBranchnameLength).then((value) => {
				if (value === undefined) {
					value = defaultConfigurations.maxBranchnameLength;
					storageUtilFunctions.setData(configurationsStorageKeys.maxBranchnameLength, value);
				}
				return value;
			}),
		];

		return Promise.all(promises).then(
			([convertUmlaute, makeLowerCase, convertWhitespaces, whitespaceReplacementChar, maxBranchnameLength]) => {
				data.convertUmlaute = convertUmlaute;
				data.makeLowerCase = makeLowerCase;
				data.convertWhitespaces = convertWhitespaces;
				data.whitespaceReplacementChar = whitespaceReplacementChar;
				data.maxBranchnameLength = maxBranchnameLength;
				return data;
			}
		);
	},
};

const typePrefixesStorageUtilFunctions = {
	getStoryPrefix: function () {
		return storageUtilFunctions.getData(typePrefixeStorageKeys.storyKey).then((value) => {
			if (value === undefined) {
				storageUtilFunctions.setData(typePrefixeStorageKeys.storyKey, defaultTypePrefixes.storyDefaultPrefix);
				return defaultTypePrefixes.storyDefaultPrefix;
			} else {
				return value;
			}
		});
	},
	getSubtaskPrefix: function () {
		return storageUtilFunctions.getData(typePrefixeStorageKeys.subTaskKey).then((value) => {
			if (value === undefined) {
				storageUtilFunctions.setData(
					typePrefixeStorageKeys.subTaskKey,
					defaultTypePrefixes.subTaskDefaultPrefix
				);
				return defaultTypePrefixes.subTaskDefaultPrefix;
			} else {
				return value;
			}
		});
	},
	getBugPrefix: function () {
		return storageUtilFunctions.getData(typePrefixeStorageKeys.bugKey).then((value) => {
			if (value === undefined) {
				storageUtilFunctions.setData(typePrefixeStorageKeys.bugKey, defaultTypePrefixes.bugDefaultPrefix);
				return defaultTypePrefixes.bugDefaultPrefix;
			} else {
				return value;
			}
		});
	},
	getPattern: function () {
		return storageUtilFunctions.getData(typePrefixeStorageKeys.patternKey).then((value) => {
			if (value === undefined) {
				storageUtilFunctions.setData(typePrefixeStorageKeys.patternKey, defaultPattern);
				return defaultPattern;
			} else {
				return value;
			}
		});
	},
};

const storageUtilFunctions = {
	setData: function (key, value) {
		chrome.storage.local.set({ [key]: value }, function () {
			console.log("Data stored -> " + "key: " + key + " | value: " + value);
		});
	},
	getData: function (key) {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get(key, function (data) {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve(data[key]);
				}
			});
		});
	},
	getAllData: function (callback) {
		chrome.storage.local.get(null, function (data) {
			callback(data);
		});
	},
	clearData: function () {
		chrome.storage.local.clear(function () {
			console.log("Data cleared!");
		});
	},
};

const issueUtilFunctions = {
	transformToBranch: async function transformToBranch(xmlResponse) {
		const type = await issueUtilFunctions.getTicketType(xmlResponse);
		const key = issueUtilFunctions.getTicketKey(xmlResponse);
		let summary = issueUtilFunctions.getTicketSummary(xmlResponse);
		const parentkey = issueUtilFunctions.getTicketParent(xmlResponse);
		const link = issueUtilFunctions.getTicketLink(xmlResponse);

		const configs = await configStorageUtilFunctions.getConfigurations();
		const MAX_LENGTH_OF_BRANCH_NAMES = configs.maxBranchnameLength;

		if (configs.convertUmlaute) {
			summary = summary.replace(/ä/g, "ae");
			summary = summary.replace(/ö/g, "oe");
			summary = summary.replace(/ü/g, "ue");
			summary = summary.replace(/Ä/g, "Ae");
			summary = summary.replace(/Ö/g, "Oe");
			summary = summary.replace(/Ü/g, "Ue");
			summary = summary.replace(/ß/g, "ss");
			summary = summary.replace(/[^ a-zA-Z0-9]/gi, "-");
		} else {
			summary = summary.replace(/[^ a-zA-Z0-9äöüÄÖÜß]/gi, "-");
		}

		if (configs.convertWhitespaces) {
			summary = summary.replace(/ /gi, configs.whitespaceReplacementChar);
		}

		summary = summary.replace(/--+/gi, "-");

		const values = {
			type: type,
			key: key,
			summary: summary,
			parentkey: parentkey,
			link: link,
		};

		if (!values.parentkey) {
			values.parentkey = "Parent";
		}

		return new Promise((resolve, reject) => {
			typePrefixesStorageUtilFunctions.getPattern().then((pattern) => {
				let branch = pattern;
				const regex = /\$(\w+)/g;

				branch = branch.replace(regex, (match, placeholder) => values[placeholder]);

				branch = issueUtilFunctions.shortenText(branch, MAX_LENGTH_OF_BRANCH_NAMES);

				if (configs.makeLowerCase) {
					branch = branch.toLowerCase();
				}

				resolve(branch);
			});
		});
	},
	getCurrentTabUrl: function getCurrentTabUrl(callback) {
		const queryInfo = {
			active: true,
			currentWindow: true,
		};
		chrome.tabs.query(queryInfo, (tabs) => {
			const currentTab = tabs[0];
			callback(currentTab.url);
		});
	},
	getTicketKey: function getTicketKey(xmlResponse) {
		const key = xmlResponse.getElementsByTagName("key");
		if (!!key && key.length > 0 && key[0].childNodes.length > 0) {
			return key[0].childNodes[0].nodeValue;
		} else {
			return "";
		}
	},
	getTicketSummary: function getTicketSummary(xmlResponse) {
		const summary = xmlResponse.getElementsByTagName("summary");
		if (!!summary && summary.length > 0 && summary[0].childNodes.length > 0) {
			return summary[0].childNodes[0].nodeValue;
		} else {
			return "";
		}
	},
	getTicketType: async function getTicketType(xmlResponse) {
		const origType = xmlResponse.getElementsByTagName("type");
		if (!!origType && origType.length > 0 && origType[0].childNodes.length > 0) {
			const type = origType[0].childNodes[0].nodeValue.toLowerCase();
			switch (type) {
				case "bug":
				case "fehler":
				case "error":
				case "defect":
					return await typePrefixesStorageUtilFunctions.getBugPrefix();
				case "story":
					return await typePrefixesStorageUtilFunctions.getStoryPrefix();
				case "sub-task":
					return await typePrefixesStorageUtilFunctions.getSubtaskPrefix();
				default:
					return "feature";
			}
		}
	},
	getTicketParent: function getTicketParent(xmlResponse) {
		const parent = xmlResponse.getElementsByTagName("parent");
		if (
			!!parent &&
			parent.length > 0 &&
			parent[0].childNodes.length > 0 &&
			parent[0].childNodes[0].nodeValue !== ""
		) {
			return parent[0].childNodes[0].nodeValue;
		} else {
			return "";
		}
	},
	getTicketLink: function getTicketLink(xmlResponse) {
		const link = xmlResponse.getElementsByTagName("link");
		if (!!link && link.length > 0 && link[1].childNodes.length > 0 && link[1].childNodes[0].nodeValue !== "") {
			return link[1].childNodes[0].textContent;
		} else {
			return "";
		}
	},
	shortenText: function shortenText(txt, limit) {
		if (txt.length > limit) {
			txt = txt.substr(0, limit - 5);
		}
		return txt;
	},
};

const util_copyToClipboard = function (text) {
	navigator.clipboard.writeText(text).then(
		function () {
			console.log("Copying to clipboard was successful!");
		},
		function (err) {
			console.error("Could not copy text: ", err);
		}
	);
};
