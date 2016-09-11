var passesHidden = false;
var showingParsedTap = true;

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

$(document).ready(function() {
    // Chrome renders text documents inside a faked up <pre> node
    var preNode = $("pre")[0];
    
    chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
	    switch(request.msg) {
	    case "TAP_SWITCH_VIEW":
		if(showingParsedTap) {
		    $(preNode).show();
		    $("#chrome-tap-parsed-output").hide();
		} else {
		    $(preNode).hide();
		    $("#chrome-tap-parsed-output").show();
		}
		showingParsedTap = !showingParsedTap;
		break;
	    case "TAP_SWITCH_HIDE_PASSES":
		if(passesHidden) {
		    $(".chrome-tap-ok").show();
		} else {
		    $(".chrome-tap-ok").hide();
		}
		passesHidden = !passesHidden;
		break;
	    }
	});
    
    var data = preNode.innerHTML;

    if(data != null && data.startsWith("TAP")) {
	reportTapStatus("TAP_START");
    } else {
	reportTapStatus("TAP_END");
	return;
    }
    
    $(preNode).hide();

    // Replace the plain text with something formatted

    $div = $("<div id=\"chrome-tap-parsed-output\"></div>");

    $("body").append($div);
    $div.css({"font-family" : "monospace", "white-space" : "pre-wrap"});
    for(let line of data.split("\n")) {
	if(line.startsWith("#")) {
	    line = spanWithClass(line, "chrome-tap-comment");
	} else if(line.startsWith("ok")) {
	    line = spanWithClass(line, "chrome-tap-ok");
	} else if(line.startsWith("not ok")) {
	    line = spanWithClass(line, "chrome-tap-not-ok");
	} else {
	    line = spanWithClass(line, "chrome-tap-default");
	}
	$div.append(line);
    }
});

