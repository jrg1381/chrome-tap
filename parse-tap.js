document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        var viewButton = document.getElementById('parse-button');
        viewButton.onclick = backgroundPage.switchView;
    });
    
    var optionsButton = document.getElementById('options');
    optionsButton.onclick = function() {
        chrome.runtime.openOptionsPage();
    };
});


