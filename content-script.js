var data = document.querySelector("pre").innerHTML;
var port = chrome.runtime.connect({ name : "taptaptap"});

function reportTapStatus(message) {
    console.log(message);
    chrome.runtime.sendMessage({msg : message},
			       function(response) {
				   console.log(response.msg);
			       });
}

if(data.startsWith("TAP")) {
    reportTapStatus("TAP_START");
} else {
    reportTapStatus("TAP_END");
}
