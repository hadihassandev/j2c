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
		// storageUtilFunctions.getAllData(function (data) {
		// 	console.log(data);
		// });
		const storyInputField = document.getElementById("story_input");
		const subTaskInputField = document.getElementById("sub_task_input");
		const bugInputField = document.getElementById("bug_input");
		const inputs = [storyInputField, subTaskInputField, bugInputField];
		const patternInputField = document.getElementById("pattern_input");
		const patternExampleText = document.getElementById("pattern_example_text");

		const el = {
			body: document.body,
			tabContents: document.querySelectorAll(".tab-content"),
			tabs: document.querySelectorAll(".tab"),
			settingsIcon: document.querySelector(".header__settings"),
			settingsIconWrapper: document.querySelector(".header__settings-wrapper"),
			currentBranchNameInput: document.getElementById("current_branch_name_input"),
			copyCurrentBranchNameButton: document.querySelector(".copy-button-wrapper"),
			link_github: document.getElementById("link_github"),
			link_reportBug: document.getElementById("link_report_bug"),
			settingsClearCacheAndStorageButton: document.querySelector(".clear-storage-button"),
			link_contribute: document.getElementById("link_contribute"),
			link_request_feature: document.getElementById("link_request_feature"),
			checkbox_convert_umlaute: document.getElementById("convert_umlaute"),
			checkbox_convert_to_lowercase: document.getElementById("convert_to_lowercase"),
			checkbox_convert_whitespace_to: document.getElementById("convert_whitespace_to"),
			input_whitespace_replacement: document.getElementById("convert_whitespace_to_char"),
		};

		typePrefixesStorageUtilFunctions.getStoryPrefix().then((prefix) => {
			storyInputField.value = prefix;
		});
		typePrefixesStorageUtilFunctions.getSubtaskPrefix().then((prefix) => {
			subTaskInputField.value = prefix;
		});
		typePrefixesStorageUtilFunctions.getBugPrefix().then((prefix) => {
			bugInputField.value = prefix;
		});
		typePrefixesStorageUtilFunctions.getPattern().then((pattern) => {
			patternInputField.value = pattern;
			updatePatternExample(patternInputField, patternExampleText);
		});
		configStorageUtilFunctions.getConfigurations().then((configurations) => {
			el.checkbox_convert_umlaute.checked = configurations.convertUmlaute;
			el.checkbox_convert_to_lowercase.checked = configurations.makeLowerCase;
			el.checkbox_convert_whitespace_to.checked = configurations.convertWhitespaces;
		});

		el.tabs.forEach((tab, index) => {
			tab.addEventListener("click", async () => {
				el.tabs.forEach((tab) => tab.classList.remove("tab--active"));
				el.settingsIconWrapper.classList.remove("header__settings-wrapper--active");
				el.tabContents.forEach((item) => item.classList.add("hidden"));
				tab.classList.add("tab--active");
				el.tabContents[index].classList.remove("hidden");
			});
		});

		el.settingsIcon.addEventListener("click", async () => {
			el.tabs.forEach((tab) => tab.classList.remove("tab--active"));
			el.tabContents.forEach((item) => item.classList.add("hidden"));
			el.settingsIconWrapper.classList.add("header__settings-wrapper--active");
			el.tabContents[el.tabContents.length - 1].classList.remove("hidden");
		});

		inputs.forEach((input) => {
			input.addEventListener("input", (event) => {
				storageUtilFunctions.setData(typePrefixeStorageKeys.storyKey, storyInputField.value);
				storageUtilFunctions.setData(typePrefixeStorageKeys.subTaskKey, subTaskInputField.value);
				storageUtilFunctions.setData(typePrefixeStorageKeys.bugKey, bugInputField.value);
				initBranchname();
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					const activeTabId = tabs[0].id;
					chrome.tabs.sendMessage(activeTabId, { message: "reloadBranchName" }, (response) => {
						if (chrome.runtime.lastError) {
							console.log(chrome.runtime.lastError.message);
						} else {
							console.log(response);
						}
					});
				});
			});
		});

		patternInputField.addEventListener("input", (event) => {
			storageUtilFunctions.setData("pattern", patternInputField.value);
			updatePatternExample(patternInputField, patternExampleText);
			initBranchname();
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs[0].id;
				chrome.tabs.sendMessage(activeTabId, { message: "reloadBranchName" }, (response) => {
					if (chrome.runtime.lastError) {
						console.log(chrome.runtime.lastError.message);
					} else {
						console.log(response);
					}
				});
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

		function initBranchname() {
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
					xmlUrl = xmlUrl + "si/jira.issueviews:issue-xml/" + issue + "/jira.xml";
					fetch(xmlUrl)
						.then((response) => {
							if (!response.ok) {
								throw new Error("HTTP error " + response.status);
							}
							return response.text();
						})
						.then((str) => new window.DOMParser().parseFromString(str, "text/xml"))
						.then(async (data) => {
							issueUtilFunctions.transformToBranch(data).then((branch) => {
								el.currentBranchNameInput.value = branch;
							});
						})
						.catch(function (error) {
							console.log("Error: " + error.message);
						});
				}
				console.log("J2C-Beta: Popup Branch Name added!");
			});
		}

		initBranchname();

		el.link_github.addEventListener("click", function (event) {
			event.preventDefault();
			chrome.tabs.create({ url: this.href });
		});

		el.link_reportBug.addEventListener("click", function (event) {
			event.preventDefault();
			chrome.tabs.create({ url: this.href });
		});

		el.link_contribute.addEventListener("click", function (event) {
			event.preventDefault();
			chrome.tabs.create({ url: this.href });
		});

		el.link_request_feature.addEventListener("click", function (event) {
			event.preventDefault();
			chrome.tabs.create({ url: this.href });
		});

		el.checkbox_convert_umlaute.addEventListener("change", function (event) {
			storageUtilFunctions.setData(configurationsStorageKeys.convertUmlaute, event.target.checked);
			initBranchname();
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs[0].id;
				chrome.tabs.sendMessage(activeTabId, { message: "reloadBranchName" }, (response) => {
					if (chrome.runtime.lastError) {
						console.log(chrome.runtime.lastError.message);
					} else {
						console.log(response);
					}
				});
			});
		});

		el.checkbox_convert_to_lowercase.addEventListener("change", function (event) {
			storageUtilFunctions.setData(configurationsStorageKeys.makeLowerCase, event.target.checked);
			initBranchname();
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs[0].id;
				chrome.tabs.sendMessage(activeTabId, { message: "reloadBranchName" }, (response) => {
					if (chrome.runtime.lastError) {
						console.log(chrome.runtime.lastError.message);
					} else {
						console.log(response);
					}
				});
			});
		});

		el.checkbox_convert_whitespace_to.addEventListener("change", function (event) {
			storageUtilFunctions.setData(configurationsStorageKeys.convertWhitespaces, event.target.checked);
			initBranchname();
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs[0].id;
				chrome.tabs.sendMessage(activeTabId, { message: "reloadBranchName" }, (response) => {
					if (chrome.runtime.lastError) {
						console.log(chrome.runtime.lastError.message);
					} else {
						console.log(response);
					}
				});
			});
		});

		el.input_whitespace_replacement.addEventListener("input", function (event) {
			storageUtilFunctions.setData(configurationsStorageKeys.whitespaceReplacementChar, event.target.value);
			initBranchname();
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTabId = tabs[0].id;
				chrome.tabs.sendMessage(activeTabId, { message: "reloadBranchName" }, (response) => {
					if (chrome.runtime.lastError) {
						console.log(chrome.runtime.lastError.message);
					} else {
						console.log(response);
					}
				});
			});
		});

		el.settingsClearCacheAndStorageButton.addEventListener("click", function (event) {
			storageUtilFunctions.clearData();
			window.close();
		});
	},
};

if (/complete|interactive|loaded/.test(document.readyState)) {
	Popup.init();
} else {
	document.addEventListener("DOMContentLoaded", Popup.init);
}
