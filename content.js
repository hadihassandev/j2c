chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.message === "j2c_url_changed") {
		console.log("J2C-Beta: URL changed to", request.url);
		run();
	}
});

const typePrefixes = {
	story: "Story",
	subTask: "feature",
	bug: "bugfix",
};
let pattern = "";
let unfactoredBranchName;

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

const Content = {
	async init() {
		console.log("J2C-Beta: content.js initialising...");
		loadDataFromStorage();
		setTimeout(function () {
			const currentUrl = window.location.href;
			if (currentUrl.includes("https://tickets.soptim.de/browse/")) {
				fetch(chrome.runtime.getURL("./global.css"))
					.then((response) => response.text())
					.then((css) => {
						let styleNode = document.createElement("style");
						styleNode.type = "text/css";
						styleNode.id = "your-chrome-extension-styles";
						styleNode.appendChild(document.createTextNode(css));
						(document.head || document.documentElement).appendChild(
							styleNode
						);
					});
				fetch(
					chrome.runtime.getURL(
						"injection/branch_name_injection/branch_name_injection.html"
					)
				)
					.then((response) => response.text())
					.then((html) => {
						const observer = new MutationObserver(
							(mutations, observer) => {
								const targetElement =
									document.querySelector(
										".issue-main-column"
									);
								if (targetElement) {
									observer.disconnect();
									targetElement.insertAdjacentHTML(
										"afterbegin",
										html
									);
									const copyButton = document.querySelector(
										".copy-button-wrapper"
									);
									const copyInput = document.querySelector(
										".branch-name__input"
									);
									chrome.runtime.onMessage.addListener(
										(message, sender, sendResponse) => {
											if (
												message.message ===
												"reloadBranchName"
											) {
												loadDataFromStorage();
												const currentUrl =
													window.location.href;
												const regExp =
													/(browse\/|selectedIssue=|issues\/)(.*)+/g;
												const matches =
													regExp.exec(currentUrl);
												let xmlUrl =
													"https://tickets.soptim.de/";

												if (
													matches !== null &&
													matches.length > 0 &&
													xmlUrl !== ""
												) {
													const issueMatch =
														matches[
															matches.length - 1
														];
													let issue = issueMatch;
													const issueMatchSplit =
														issueMatch.split(
															/\?filter=/g
														);
													if (
														issueMatchSplit.length >
														1
													) {
														issue =
															issueMatchSplit[0];
													}
													if (
														issue.charAt(
															issue.length - 1
														) === "#"
													) {
														issue = issue.substr(
															0,
															issue.length - 1
														);
													}
													xmlUrl =
														xmlUrl +
														"si/jira.issueviews:issue-xml/" +
														issue +
														"/jira.xml";
													const xmlHttp =
														new XMLHttpRequest();
													xmlHttp.onreadystatechange =
														function () {
															if (
																this
																	.readyState ===
																	4 &&
																this.status ===
																	200
															) {
																issueUtilFunctions.transformToBranch(
																	this
																		.responseXML,
																	(
																		branch
																	) => {
																		unfactoredBranchName =
																			branch;
																		copyInput.innerHTML =
																			branch;
																	}
																);
															}
														};
													xmlHttp.open(
														"GET",
														xmlUrl,
														true
													);
													xmlHttp.send();
												}
												console.log("HTML injected!");
												sendResponse({
													status: "Reloaded branch name",
												});
												return true;
											}
											sendResponse({
												status: "Message received, but not handled",
											});
											return true;
										}
									);
									copyButton.addEventListener(
										"click",
										(event) => {
											const range =
												document.createRange();
											range.selectNodeContents(copyInput);
											const selection =
												window.getSelection();
											selection.removeAllRanges();
											selection.addRange(range);
											document.execCommand("copy");
											selection.removeAllRanges();
											const tooltip =
												document.querySelector(
													".copied-tooltip"
												);
											tooltip.classList.remove(
												"j2c_hide"
											);
											tooltip.classList.add("j2c_show");
											setTimeout(() => {
												tooltip.classList.remove(
													"j2c_show"
												);
												tooltip.classList.add(
													"j2c_hide"
												);
											}, 2000);
										}
									);

									const currentUrl = window.location.href;
									const regExp =
										/(browse\/|selectedIssue=|issues\/)(.*)+/g;
									const matches = regExp.exec(currentUrl);
									let xmlUrl = "https://tickets.soptim.de/";
									if (
										matches !== null &&
										matches.length > 0 &&
										xmlUrl !== ""
									) {
										const issueMatch =
											matches[matches.length - 1];
										let issue = issueMatch;
										const issueMatchSplit =
											issueMatch.split(/\?filter=/g);
										if (issueMatchSplit.length > 1) {
											issue = issueMatchSplit[0];
										}
										if (
											issue.charAt(issue.length - 1) ===
											"#"
										) {
											issue = issue.substr(
												0,
												issue.length - 1
											);
										}
										xmlUrl =
											xmlUrl +
											"si/jira.issueviews:issue-xml/" +
											issue +
											"/jira.xml";
										const xmlHttp = new XMLHttpRequest();
										xmlHttp.onreadystatechange =
											function () {
												if (
													this.readyState === 4 &&
													this.status === 200
												) {
													issueUtilFunctions.transformToBranch(
														this.responseXML,
														(branch) => {
															unfactoredBranchName =
																branch;
															copyInput.innerHTML =
																branch;
														}
													);
												}
											};
										xmlHttp.open("GET", xmlUrl, true);
										xmlHttp.send();
									}

									console.log(
										"J2C-Beta: Branch Name HTML injected!"
									);
								}
							}
						);
						observer.observe(document, {
							childList: true,
							subtree: true,
						});
					});
				// TODO: Future feature
				// fetch(
				// 	chrome.runtime.getURL(
				// 		"injection/j2c_logo_injection/j2c_logo_injection.html"
				// 	)
				// )
				// 	.then((response) => response.text())
				// 	.then((html) => {
				// 		const observer = new MutationObserver(
				// 			(mutations, observer) => {
				// 				const parentElement = document.querySelector(
				// 					".aui-header-secondary"
				// 				);
				// 				const targetElement =
				// 					parentElement.querySelector(".aui-nav");
				// 				if (targetElement) {
				// 					observer.disconnect();
				// 					let firstChild = targetElement.children[0];
				// 					let newElement =
				// 						document.createElement("li");
				// 					newElement.innerHTML = html;
				// 					if (
				// 						firstChild &&
				// 						firstChild.nextElementSibling
				// 					) {
				// 						targetElement.insertBefore(
				// 							newElement,
				// 							firstChild.nextElementSibling
				// 						);
				// 					} else {
				// 						targetElement.appendChild(newElement);
				// 					}
				// 					console.log(
				// 						"J2C-Beta: J2C Logo HTML injected!"
				// 					);
				// 				}
				// 			}
				// 		);
				// 		observer.observe(document, {
				// 			childList: true,
				// 			subtree: true,
				// 		});
				// 	});
			} else {
				console.log("J2C-Beta: No issue URL found!");
			}
		});
	},
};

run();
function run() {
	if (/complete|interactive|loaded/.test(document.readyState)) {
		Content.init();
	} else {
		document.addEventListener("DOMContentLoaded", Content.init);
	}
}
