var tapDocuments = new Set();
var isPassesHidden = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // The page can send us messages if the extension loads inside it and finds TAP.
    var response = "";

    if(request.msg == "TAP_START") {
	enableUI(sender.tab.id);
	tapDocuments.add(sender.tab.id);
	response = "OK";
	
    } else {
	disableUI(sender.tab.id);
	tapDocuments.delete(sender.tab.id);
	response = "NOT OK";
    }
    
    sendResponse({msg : response});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Assume that changing URL is not going to take us to a TAP page. If it does, then
    // TAP_START will be sent from the page, enabling the icon again.
    if(tapDocuments.has(tabId)) {
	disableUI(tabId);
    }
});

function enableUI(tabId) {
    chrome.browserAction.setIcon({ tabId : tabId, path : "icon-live.png" });
    chrome.browserAction.setPopup({ tabId : tabId, popup : "popup.html" });
}

function disableUI(tabId) {
    console.log("Disabling UI");
    console.trace();
    chrome.browserAction.setIcon({ tabId : tabId, path : "icon.png" });
    chrome.browserAction.setPopup({ tabId : tabId, popup : "" });
}

function sendMessage(message) {
    chrome.tabs.query({active:true,currentWindow:true}, function(tabs) {
	chrome.tabs.sendMessage(tabs[0].id, {msg : message}, null);
    });
}

function switchView() {
    sendMessage("TAP_SWITCH_VIEW");
}

function hidePasses() {
    sendMessage("TAP_SWITCH_HIDE_PASSES");
    isPassesHidden = !isPassesHidden;
}

