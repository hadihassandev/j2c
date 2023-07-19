const defaultConfigs = {
	storyDefault: "Story",
	subTaskDefault: "feature",
	bugDefault: "bugfix",
	patternDefualt: "$type/$key/$summary",
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
		const storyInputField = document.getElementById("story_input");
		const subTaskInputField = document.getElementById("sub_task_input");
		const bugInputField = document.getElementById("bug_input");
		const inputs = [storyInputField, subTaskInputField, bugInputField];
		const patternInputField = document.getElementById("pattern_input");
		const patternExampleText = document.getElementById(
			"pattern_example_text"
		);

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

		const el = {
			body: document.body,
			tabContents: document.querySelectorAll(".tab-content"),
			tabs: document.querySelectorAll(".tab"),
			settingsIcon: document.querySelector(".header__settings"),
			settingsIconWrapper: document.querySelector(
				".header__settings-wrapper"
			),
		};

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
	},
};

if (/complete|interactive|loaded/.test(document.readyState)) {
	Popup.init();
} else {
	document.addEventListener("DOMContentLoaded", Popup.init);
}
