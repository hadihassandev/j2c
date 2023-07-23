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
		const MAX_LENGTH_OF_BRANCH_NAMES = 100; // TODO: make configurable
		const type = await issueUtilFunctions.getTicketType(xmlResponse);
		const key = issueUtilFunctions.getTicketKey(xmlResponse);
		let summary = issueUtilFunctions.getTicketSummary(xmlResponse);
		const parent = issueUtilFunctions.getTicketParent(xmlResponse); // TODO: make parent an option to put in pattern

		summary = summary.replace("ä", "ae"); // TODO: make optional
		summary = summary.replace("ö", "oe");
		summary = summary.replace("ü", "ue");
		summary = summary.replace("Ä", "Ae");
		summary = summary.replace("Ö", "Oe");
		summary = summary.replace("Ü", "Ue");
		summary = summary.replace("ß", "ss");
		summary = summary.replace(/[^ a-zA-Z0-9]/gi, "-");
		summary = summary.replace(/ /gi, "-");
		summary = summary.replace(/--+/gi, "-");
		// summary = summary.replace(/\s/gi, "-");

		const values = {
			type: type,
			key: key,
			summary: summary,
			parent: parent,
		};

		return new Promise((resolve, reject) => {
			typePrefixesStorageUtilFunctions.getPattern().then((pattern) => {
				let branch = pattern;
				const regex = /\$(\w+)/g;

				branch = branch.replace(regex, (match, placeholder) => values[placeholder]);

				branch = issueUtilFunctions.shortenText(branch, MAX_LENGTH_OF_BRANCH_NAMES);

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
	shortenText: function shortenText(txt, limit) {
		if (txt.length > limit) {
			txt = txt.substr(0, limit - 5) + "-tldr";
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
