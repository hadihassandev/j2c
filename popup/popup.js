const defaultConfigs = {
	storyDefault: "Story",
	subTaskDefault: "feature",
	bugDefault: "bugfix",
	patternDefualt: "$type/$key/$summary",
};

const typePrefixes = {
	story: "Story",
	subTask: "feature",
	bug: "bugfix",
};

let pattern = "";

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

function loadDataFromStorage() {
	storageUtilFunctions.getData("story", function (data) {
		typePrefixes.story = data;
	});
	storageUtilFunctions.getData("subTask", function (data) {
		typePrefixes.subTask = data;
	});
	storageUtilFunctions.getData("bug", function (data) {
		typePrefixes.bug = data;
	});
	storageUtilFunctions.getData("pattern", function (data) {
		pattern = data;
	});
}

function updatePatternExample(input, text) {
	const pattern = input.value;
	const values = {
		type: "Story",
		key: "XYZ-001",
		summary: "I-am-a-summary",
	};
	let branch = pattern;
	const regex = /\$(\w+)/g;
	branch = branch.replace(regex, (match, placeholder) => values[placeholder]);
	branch = "Example: " + branch;
	text.innerHTML = branch;
}

const Popup = {
	async init() {
		loadDataFromStorage();
		const storyInputField = document.getElementById("story_input");
		const subTaskInputField = document.getElementById("sub_task_input");
		const bugInputField = document.getElementById("bug_input");
		const inputs = [storyInputField, subTaskInputField, bugInputField];
		const patternInputField = document.getElementById("pattern_input");
		const patternExampleText = document.getElementById(
			"pattern_example_text"
		);

		const el = {
			body: document.body,
			tabContents: document.querySelectorAll(".tab-content"),
			tabs: document.querySelectorAll(".tab"),
			settingsIcon: document.querySelector(".header__settings"),
			settingsIconWrapper: document.querySelector(
				".header__settings-wrapper"
			),
			currentBranchNameInput: document.getElementById(
				"current_branch_name_input"
			),
			copyCurrentBranchNameButton: document.querySelector(
				".copy-button-wrapper"
			),
			link_github: document.getElementById("link_github"),
			link_reportBug: document.getElementById("link_report_bug"),
			settingsClearCacheAndStorageButton: document.querySelector(
				".clear-storage-button"
			),
		};

		storageUtilFunctions.getData("story", function (data) {
			if (data === undefined) {
				storageUtilFunctions.setData(
					"story",
					defaultConfigs.storyDefault
				);
				storyInputField.value = defaultConfigs.storyDefault;
			} else {
				storyInputField.value = data;
			}
		});
		storageUtilFunctions.getData("subTask", function (data) {
			if (data === undefined) {
				storageUtilFunctions.setData(
					"subTask",
					defaultConfigs.subTaskDefault
				);
				subTaskInputField.value = defaultConfigs.subTaskDefault;
			} else {
				subTaskInputField.value = data;
			}
		});
		storageUtilFunctions.getData("bug", function (data) {
			if (data === undefined) {
				storageUtilFunctions.setData("bug", defaultConfigs.bugDefault);
				bugInputField.value = defaultConfigs.bugDefault;
			} else {
				bugInputField.value = data;
			}
		});
		storageUtilFunctions.getData("pattern", function (data) {
			if (data === undefined) {
				storageUtilFunctions.setData(
					"pattern",
					defaultConfigs.patternDefualt
				);
				patternInputField.value = defaultConfigs.patternDefualt;
			} else {
				patternInputField.value = data;
				updatePatternExample(patternInputField, patternExampleText);
			}
		});

		el.tabs.forEach((tab, index) => {
			tab.addEventListener("click", async () => {
				el.tabs.forEach((tab) => tab.classList.remove("tab--active"));
				el.settingsIconWrapper.classList.remove(
					"header__settings-wrapper--active"
				);
				el.tabContents.forEach((item) => item.classList.add("hidden"));
				tab.classList.add("tab--active");
				el.tabContents[index].classList.remove("hidden");
			});
		});

		el.settingsIcon.addEventListener("click", async () => {
			el.tabs.forEach((tab) => tab.classList.remove("tab--active"));
			el.tabContents.forEach((item) => item.classList.add("hidden"));
			el.settingsIconWrapper.classList.add(
				"header__settings-wrapper--active"
			);
			el.tabContents[el.tabContents.length - 1].classList.remove(
				"hidden"
			);
		});

		inputs.forEach((input) => {
			input.addEventListener("input", (event) => {
				storageUtilFunctions.setData("story", storyInputField.value);
				storageUtilFunctions.setData(
					"subTask",
					subTaskInputField.value
				);
				storageUtilFunctions.setData("bug", bugInputField.value);
				chrome.tabs.query(
					{ active: true, currentWindow: true },
					(tabs) => {
						const activeTabId = tabs[0].id;
						chrome.tabs.sendMessage(
							activeTabId,
							{ message: "reloadBranchName" },
							(response) => {
								if (chrome.runtime.lastError) {
									console.log(
										chrome.runtime.lastError.message
									);
								} else {
									console.log(response);
								}
							}
						);
					}
				);
			});
		});

		patternInputField.addEventListener("input", (event) => {
			storageUtilFunctions.setData("pattern", patternInputField.value);
			updatePatternExample(patternInputField, patternExampleText);
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs[0].id;
				chrome.tabs.sendMessage(
					activeTabId,
					{ message: "reloadBranchName" },
					(response) => {
						console.log(response);
					}
				);
			});
		});

		el.copyCurrentBranchNameButton.addEventListener("click", (event) => {
			navigator.clipboard.writeText(el.currentBranchNameInput.value).then(
				function () {
					console.log("Copying to clipboard was successful!");
				},
				function (err) {
					console.error("Could not copy text: ", err);
				}
			);
			const tooltip = document.querySelector(".copied-tooltip");
			tooltip.classList.remove("j2c_hide");
			setTimeout(() => {
				tooltip.classList.add("j2c_hide");
			}, 2000);
		});

		issueUtilFunctions.getCurrentTabUrl((url) => {
			const currentUrl = url;
			const regExp = /(browse\/|selectedIssue=|issues\/)(.*)+/g;
			const matches = regExp.exec(currentUrl);
			let xmlUrl = "https://tickets.soptim.de/";
			if (matches !== null && matches.length > 0 && xmlUrl !== "") {
				const issueMatch = matches[matches.length - 1];
				let issue = issueMatch;
				const issueMatchSplit = issueMatch.split(/\?filter=/g);
				if (issueMatchSplit.length > 1) {
					issue = issueMatchSplit[0];
				}
				if (issue.charAt(issue.length - 1) === "#") {
					issue = issue.substr(0, issue.length - 1);
				}
				xmlUrl =
					xmlUrl +
					"si/jira.issueviews:issue-xml/" +
					issue +
					"/jira.xml";
				const xmlHttp = new XMLHttpRequest();
				xmlHttp.onreadystatechange = function () {
					if (this.readyState === 4 && this.status === 200) {
						issueUtilFunctions.transformToBranch(
							this.responseXML,
							(branch) => {
								el.currentBranchNameInput.value = branch;
							}
						);
					}
				};
				xmlHttp.open("GET", xmlUrl, true);
				xmlHttp.send();
			}
			console.log("J2C-Beta: Popup Branch Name added!");
		});

		el.link_github.addEventListener("click", function (event) {
			event.preventDefault();
			chrome.tabs.create({ url: this.href });
		});

		el.link_reportBug.addEventListener("click", function (event) {
			event.preventDefault();
			chrome.tabs.create({ url: this.href });
		});

		el.settingsClearCacheAndStorageButton.addEventListener(
			"click",
			function (event) {
				storageUtilFunctions.clearData();
				window.close();
			}
		);
	},
};

if (/complete|interactive|loaded/.test(document.readyState)) {
	Popup.init();
} else {
	document.addEventListener("DOMContentLoaded", Popup.init);
}
