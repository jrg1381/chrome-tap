$(document).ready(function() {
    // Chrome renders text documents inside a faked up <pre> node
    var originalTextPreNode = $("pre")[0];
    var data = originalTextPreNode.innerHTML;

    var App = new CtApp(originalTextPreNode, data, $("body"));
    
    // Respond to requests from the extension's main menu
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            switch(request.msg) {
            case "TAP_SWITCH_VIEW":
                App.ui.tapSwitchView();
                break;
            }
        });
    
    // Look for a TAP plan (1..N) as evidence that this is TAP data.
    if(data !== null && /1\.\.\d+/.test(data)) {
        App.reportTapStatus("TAP_START",
                            function() {
                                App.processDocument();
                            }
                           );
    } else {
        App.reportTapStatus("TAP_END", function() {});
        return;
    }
});
