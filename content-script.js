var parser = require('tap-parser');

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

function okOrNotOkClass(pass)
{
    return pass ? "chrome-tap-ok" : "chrome-tap-not-ok";
}

function indent(level) {
    var result = "";
    for(var i = 0; i < level; i++) {
        result += "    ";
    }
    return result;
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

    var div = $("<div id=\"chrome-tap-parsed-output\"></div>");

    $("body").append(div);
    div.addClass("chrome-tap-pre");
    
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
        div.append(line);
    }

    var newdiv = $("<div id=\"chrome-tap-parsed-output2\"></div>");
    $("body").append(newdiv);
    newdiv.addClass("chrome-tap-pre");

    var currentBox = $("<div class=\"chrome-tap-box\"></div>");
    newdiv.append(currentBox);
    
    var p = new parser({preserveWhitespace : true});
    var d = 1;
    
    function addEventHandlers(tapParser, depth) {
        var boxStack = [currentBox];
        var indentText = indent(depth);
        
        tapParser.on('comment', function(comment) {
            comment = indentText + comment.trim("\n");
            var line = spanWithClass(comment, "chrome-tap-comment");
            currentBox.append(line);
        });

        tapParser.on('complete', function(results) {
            d--;
            currentBox = boxStack.pop();
        });

        tapParser.on('assert', function(assertion) {
            var line = spanWithClass(indentText +
                                     [assertion.ok ? "ok" : "not ok",
                                      assertion.id,
                                      "-",
                                      assertion.name].join(" "),
                                     okOrNotOkClass(assertion.ok));

            currentBox.append(line);
        });

        tapParser.on('child', function(childParser) {
            d++;
            boxStack.push(currentBox);
            currentBox = $("<div class=\"chrome-tap-box\"></div>");
            newdiv.append(currentBox);
            addEventHandlers(childParser, d);
        });
    }
    
    addEventHandlers(p, 1);

    p.write(data);
    p.end();
});

