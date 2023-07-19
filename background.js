chrome.runtime.onInstalled.addListener(function () {
	console.log("Extension installed!");
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.url) {
		chrome.tabs.sendMessage(
			tabId,
			{
				message: "j2c_url_changed",
				url: changeInfo.url,
			},
			function () {
				if (chrome.runtime.lastError) {
					console.log(chrome.runtime.lastError.message);
				}
			}
		);
	}
});
