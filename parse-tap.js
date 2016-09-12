var SHOW_PARSED = "Show parsed TAP";
var SHOW_RAW = "Show raw TAP";

document.addEventListener('DOMContentLoaded', function() {
    var backgroundPage = chrome.extension.getBackgroundPage();
    
    var viewButton = document.getElementById('parse-button');
    viewButton.onclick = backgroundPage.switchView;

    var hidePassedTestsCheckbox = document.getElementById('hide-passed-tests');

    hidePassedTestsCheckbox.checked = backgroundPage.isPassesHidden;
    hidePassedTestsCheckbox.onchange = backgroundPage.hidePasses;
});


