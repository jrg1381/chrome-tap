document.addEventListener('DOMContentLoaded', function() {
    var button = document.getElementById('parse-button');
    
    button.onclick = function() { alert("Clicked"); };
    chrome.extension.getBackgroundPage().callMethodIfTapPresent(function() {
	alert("Foo");
    });
});

