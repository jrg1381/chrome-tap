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

function tapNextFailure() {
    window.find("not ok", true, false, true, false, false, false);
}

function tapPreviousFailure() {
    window.find("not ok", true, true, true, false, false, false);
}

function tapHidePasses() {
    var parsedOutput = $("div#chrome-tap-parsed-output-boxed");
    
    if(passesHidden) {
//        $(".chrome-tap-ok").removeClass(invisibleClass);
        parsedOutput.find("div:not(.chrome-tap-failed)")
            .removeClass(invisibleClass);
    } else {
//        $(".chrome-tap-ok").addClass(invisibleClass);
        parsedOutput.find("div:not(.chrome-tap-failed)")
            .addClass(invisibleClass);
    }
    
    passesHidden = !passesHidden;
}

function okOrNotOkClass(pass)
{
    return pass ? "chrome-tap-ok" : "chrome-tap-not-ok";
}

function boxAtIndent(level) {
  //  var colors = ["#b2a589","#96b8ff","#fff9b1","#9ab285","#11929e"];
    var currentBox = $("<div class=\"chrome-tap-box\"></div>");
 //   currentBox.css("background-color",colors[level]);
    currentBox.css("margin-left",level*25+"px");
    return currentBox;
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
            case "TAP_NEXT_FAILURE":
                tapNextFailure();
                break;
            case "TAP_PREVIOUS_FAILURE":
                tapPreviousFailure();
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

    var newdiv = $("<div id=\"chrome-tap-parsed-output-boxed\"></div>");
    $("body").append(newdiv);
    newdiv.addClass("chrome-tap-pre");

    var d = 0;
    var currentBox0 = boxAtIndent(d);
    newdiv.append(currentBox0);
    
    var p = new parser({preserveWhitespace : true});
    
    function addEventHandlers(tapParser, depth) {      
        tapParser.on('comment', function(comment) {
            comment = comment.trim("\n");
            var line = spanWithClass(comment, "chrome-tap-comment");
            tapParser.currentBox.append(line);
        });

        tapParser.on('complete', function(results) {
            d--;
            var current = tapParser.currentBox;
            var parent = tapParser.currentBox.parent();
            
            if(current.hasClass("chrome-tap-failed") &&
               !parent.hasClass("chrome-tap-failed"))
            {
                parent.addClass("chrome-tap-failed");
            }
            
            tapParser.currentBox = parent;
        });

        tapParser.on('plan', function(plan) {
            var line = spanWithClass(plan.start + ".." + plan.end,
                                     "chrome-tap-plan");
            tapParser.currentBox.append(line);
        });
        
        tapParser.on('assert', function(assertion) {
            var line = spanWithClass([assertion.ok ? "ok" : "not ok",
                                      assertion.id,
                                      "-",
                                      assertion.name].join(" "),
                                     okOrNotOkClass(assertion.ok));

            if(!assertion.ok) {
                tapParser.currentBox.addClass("chrome-tap-failed");
            }
            
            tapParser.currentBox.append(line);
        });

        tapParser.on('child', function(childParser) {
            d++;
            newBox = boxAtIndent(d);
            tapParser.currentBox.append(newBox);
            childParser.currentBox = newBox;
            addEventHandlers(childParser, d);
        });
    }

    p.currentBox = currentBox0;
    addEventHandlers(p, 0);

    p.write(data);
    p.end();
});

