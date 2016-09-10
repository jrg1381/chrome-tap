var SHOW_PARSED = "Show parsed TAP";
var SHOW_RAW = "Show raw TAP";

document.addEventListener('DOMContentLoaded', function() {
    var button = document.getElementById('parse-button');

    button.innerText = "Switch view";
    
    button.onclick = chrome.extension.getBackgroundPage().switchView;
});


