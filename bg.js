var tapDocuments = new Set();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.msg == "TAP_START") {
	tapDocuments.add(sender.tab.url);
    } else {
	tapDocuments.delete(sender.tab.url);
    }
    
    sendResponse({msg : "OK"});
});

function callMethodIfTapPresent(callback) {
    chrome.tabs.query({active:true,lastFocusedWindow:true},
		      function(tabs) {
			  var url = tabs[0].url;
			  if(tapDocuments.has(url)) {
			      callback();
			  }
		      });
}
