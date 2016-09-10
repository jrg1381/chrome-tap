var tapDocuments = new Set();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // The page can send us messages if the extension loads inside it and finds TAP.
    if(request.msg == "TAP_START") {
	enableUI();
	tapDocuments.add(sender.tab.id);
    } else {
	disableUI();
	tapDocuments.delete(sender.tab.id);
    }
    
    sendResponse({msg : "OK"});
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    // When the user changes tabs, see if it's a tap we know about already.
    if(tapDocuments.has(activeInfo.tabId)) {
	enableUI();
    } else {
	disableUI();
    }  
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Assume that changing URL is not going to take us to a TAP page. If it does, then
    // TAP_START will be sent from the page, enabling the icon again.
    //
    // Likely this will not work if a non-active tab changes URL while we're not looking at it.
    disableUI();
});

function enableUI() {
    chrome.browserAction.setIcon({path : "icon-live.png"});
    chrome.browserAction.setPopup({popup : "popup.html"});
}

function disableUI() {
    chrome.browserAction.setIcon({path : "icon.png"});
    chrome.browserAction.setPopup({popup : ""});
}


