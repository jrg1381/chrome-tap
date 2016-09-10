var data = $("pre")[0].innerHTML;
var port = chrome.runtime.connect({ name : "taptaptap"});

function reportTapStatus(message) {
    console.log(message);
    chrome.runtime.sendMessage({msg : message},
			       function(response) {
				   console.log(response.msg);
			       });
}

if(data != null && data.startsWith("TAP")) {
    reportTapStatus("TAP_START");
} else {
    reportTapStatus("TAP_END");
}

$div = $("body").append("<div></div>");
$div.css({"font-family" : "monospace"});
for(let line of data.split("\n")) {
    $div.append(line+"</br>");
}

