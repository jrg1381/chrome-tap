var passesHidden = false;
var showingParsedTap = true;
var invisibleClass = "chrome-tap-invisible";

function reportTapStatus(message) {
    console.log(message);
    chrome.runtime.sendMessage({msg : message},
			       function(response) {
				   console.log(response.msg);
			       });
}

function spanWithClass(contents, spanClass) {
    return $("<span class=\""+spanClass+"\">"+contents+"</br></span>");
}

function tapSwitchView(preNode) {
    if(showingParsedTap) {
	preNode.removeClass(invisibleClass);
	$("#chrome-tap-parsed-output").addClass(invisibleClass);
    } else {
	preNode.addClass(invisibleClass);
	$("#chrome-tap-parsed-output").removeClass(invisibleClass);
    }
    showingParsedTap = !showingParsedTap;
}

function tapHidePasses() {
    if(passesHidden) {
	$(".chrome-tap-ok").removeClass(invisibleClass);
    } else {
	$(".chrome-tap-ok").addClass(invisibleClass);
    }
    passesHidden = !passesHidden;
}

$(document).ready(function() {
    // Chrome renders text documents inside a faked up <pre> node
    var preNode = $("pre")[0];
    
    chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
	    switch(request.msg) {
	    case "TAP_SWITCH_VIEW":
		tapSwitchView($(preNode));
		break;
	    case "TAP_SWITCH_HIDE_PASSES":
		tapHidePasses();
		break;
	    }
	});
    
    var data = preNode.innerHTML;

    if(data != null && /1\.\.\d+/.test(data)) {
	reportTapStatus("TAP_START");
    } else {
	reportTapStatus("TAP_END");
	return;
    }

    $(preNode).removeAttr('style');
    $(preNode).addClass("chrome-tap-pre chrome-tap-invisible");

    // Replace the plain text with something formatted

    $div = $("<div id=\"chrome-tap-parsed-output\"></div>");

    $("body").append($div);
    $div.addClass("chrome-tap-pre");
    for(let line of data.split("\n")) {
	if(/^\s*#/.test(line)) {
	    line = spanWithClass(line, "chrome-tap-comment");
	} else if(/^\s*ok/.test(line)) {
	    line = spanWithClass(line, "chrome-tap-ok");
	} else if(/^\s*not ok/.test(line)) {
	    line = spanWithClass(line, "chrome-tap-not-ok");
	} else {
	    line = spanWithClass(line, "chrome-tap-default");
	}
	$div.append(line);
    }
});

