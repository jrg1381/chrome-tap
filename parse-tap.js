var SHOW_PARSED = "Show parsed TAP";
var SHOW_RAW = "Show raw TAP";

document.addEventListener('DOMContentLoaded', function() {
    var viewButton = document.getElementById('parse-button');
    viewButton.onclick = chrome.extension.getBackgroundPage().switchView;

    var hidePassedTestsButton = document.getElementById('hide-ok-button');
    hidePassedTestsButton.onclick = chrome.extension.getBackgroundPage().hidePasses;
});


