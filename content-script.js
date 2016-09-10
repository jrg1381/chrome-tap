function reportTapStatus(message) {
    console.log(message);
    chrome.runtime.sendMessage({msg : message},
			       function(response) {
				   console.log(response.msg);
			       });
}

function spanWithClass(contents, spanClass) {
    return $("<span class=\""+spanClass+"\">"+contents+"</span>");
}

$(document).ready(function() {
    var preNode = $("pre")[0];
    
    chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
	    switch(request.msg) {
	    case "TAP_SHOW_RAW":
		$(preNode).show();
		$("#chrome-tap-parsed-output").hide();
		break;
	    case "TAP_SHOW_PARSED":
		$(preNode).hide();
		$("#chrome-tap-parsed-output").show();
	    }
	});
    
    // Chrome renders text documents inside a faked up <pre> node
    var preNode = $("pre")[0];
    var data = preNode.innerHTML;

    if(data != null && data.startsWith("TAP")) {
	reportTapStatus("TAP_START");
    } else {
	reportTapStatus("TAP_END");
    }
    
    $(preNode).hide();

    // Replace the plain text with something formatted

    $div = $("<div id=\"chrome-tap-parsed-output\"></div>");
    $("body").append($div);
    $div.css({"font-family" : "monospace"});
    for(let line of data.split("\n")) {
	if(line.startsWith("#")) {
	    line = spanWithClass(line, "chrome-tap-comment");
	} else if(line.startsWith("ok")) {
	    line = spanWithClass(line, "chrome-tap-ok");
	} else if(line.startsWith("not ok")) {
	    line = spanWithClass(line, "chrome-tap-not-ok");
	}
	$div.append(line).append("</br>");
    }
});

