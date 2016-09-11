var SHOW_PARSED = "Show parsed TAP";
var SHOW_RAW = "Show raw TAP";

document.addEventListener('DOMContentLoaded', function() {
    var viewButton = document.getElementById('parse-button');
    viewButton.onclick = chrome.extension.getBackgroundPage().switchView;

    var hidePassedTestsCheckbox = document.getElementById('hide-passed-tests');
    hidePassedTestsCheckbox.onchange = chrome.extension.getBackgroundPage().hidePasses;
});


