var SHOW_PARSED = "Show parsed TAP";
var SHOW_RAW = "Show raw TAP";
var backgroundPage;

document.addEventListener('DOMContentLoaded', function() {
    backgroundPage = chrome.extension.getBackgroundPage();
    
    var viewButton = document.getElementById('parse-button');
    viewButton.onclick = backgroundPage.switchView;

    var optionsButton = document.getElementById('options');
    optionsButton.onclick = function() {
        chrome.runtime.openOptionsPage();
    };
});


