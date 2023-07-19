const storageUtilFunctions = {
	setData: function (key, value) {
		chrome.storage.local.set({ [key]: value }, function () {
			console.log("Data stored.");
		});
	},
	getData: function (key, callback) {
		chrome.storage.local.get(key, function (data) {
			callback(data[key]);
		});
	},
	getAllData: function (callback) {
		chrome.storage.local.get(null, function (data) {
			callback(data);
		});
	},
	clearData: function () {
		chrome.storage.local.clear(function () {
			console.log("Data cleared.");
		});
	},
};

const issueUtilFunctions = {
	transformToBranch: function transformToBranch(xmlResponse, callback) {
		const MAX_LENGTH_OF_BRANCH_NAMES = 100;
		const key = issueUtilFunctions.getTicketKey(xmlResponse);
		let summary = issueUtilFunctions.getTicketSummary(xmlResponse);
		const type = issueUtilFunctions.getTicketType(xmlResponse);
		const parent = issueUtilFunctions.getTicketParent(xmlResponse);

		summary = summary.replace("ä", "ae");
		summary = summary.replace("ö", "oe");
		summary = summary.replace("ü", "ue");
		summary = summary.replace("Ä", "Ae");
		summary = summary.replace("Ö", "Oe");
		summary = summary.replace("Ü", "Ue");
		summary = summary.replace("ß", "ss");
		summary = summary.replace(/[^ a-zA-Z0-9]/gi, "-");
		summary = summary.replace(/ /gi, "-");
		summary = summary.replace(/--+/gi, "-");
		summary = summary.replace(/\s/gi, "-");

		const values = {
			type: type,
			key: key,
			summary: summary,
		};

		let branch = pattern;

		const regex = /\$(\w+)/g;

		if (branch !== undefined) {
			branch = branch.replace(
				regex,
				(match, placeholder) => values[placeholder]
			);
		}

		branch = issueUtilFunctions.shortenText(
			branch,
			MAX_LENGTH_OF_BRANCH_NAMES
		);

		callback(branch);
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
		if (
			!!summary &&
			summary.length > 0 &&
			summary[0].childNodes.length > 0
		) {
			return summary[0].childNodes[0].nodeValue;
		} else {
			return "";
		}
	},
	getTicketType: function getTicketType(xmlResponse) {
		const origType = xmlResponse.getElementsByTagName("type");
		if (
			!!origType &&
			origType.length > 0 &&
			origType[0].childNodes.length > 0
		) {
			const type = origType[0].childNodes[0].nodeValue.toLowerCase();
			switch (type) {
				case "bug" || "fehler" || "error" || "defect":
					return typePrefixes.bug;
				case "fehler":
					return typePrefixes.bug;
				case "story":
					return typePrefixes.story;
				case "sub-task":
					return typePrefixes.subTask;
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
