var SHOW_PARSED = "Show parsed TAP";
var SHOW_RAW = "Show raw TAP";

document.addEventListener('DOMContentLoaded', function() {
    var button = document.getElementById('parse-button');

    button.innerText = SHOW_RAW;
    
    button.onclick = function(event) {
	if(event.srcElement.innerText == SHOW_RAW) {
	    event.srcElement.innerText = SHOW_PARSED;
	    chrome.extension.getBackgroundPage().showRawTap();
	} else {
	    event.srcElement.innerText = SHOW_RAW;
	    chrome.extension.getBackgroundPage().showParsedTap();
	}
    };
});


