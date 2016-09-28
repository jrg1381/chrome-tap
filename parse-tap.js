var SHOW_PARSED = "Show parsed TAP";
var SHOW_RAW = "Show raw TAP";
var backgroundPage;

document.addEventListener('DOMContentLoaded', function() {
    backgroundPage = chrome.extension.getBackgroundPage();
    
    var viewButton = document.getElementById('parse-button');
    viewButton.onclick = backgroundPage.switchView;

    var previousButton = document.getElementById('previous');
    previousButton.onclick = backgroundPage.previousFailure;
    
    var nextButton = document.getElementById('next');
    nextButton.onclick = backgroundPage.nextFailure;
    
//    var hidePassedTestsCheckbox = document.getElementById('hide-passed-tests');

//    hidePassedTestsCheckbox.checked = backgroundPage.isPassesHidden;
//    hidePassedTestsCheckbox.onchange = backgroundPage.hidePasses;
});


