var DirectoryTree = function() {
    var self = this;
    this.root = {};
    
    DirectoryTree.prototype.addToNode = function(pathElement, node) {
        if(!node.hasOwnProperty(pathElement)) {
            node[pathElement] = {};
        }
        return node[pathElement];
    }
    
    DirectoryTree.prototype.add = function(path) {
        var pathElements = path.split('/');
        var currentNode = self.root;
        
        pathElements.forEach(function(element, index, array) {
            currentNode = self.addToNode(element, currentNode);
        });
    }
}

var App = {};

App.parser = require('tap-parser');
App.directoryTree = new DirectoryTree();
App.passesHidden = false;
App.showingParsedTap = true;
App.invisibleClass = "chrome-tap-invisible";
App.username = "foo";

function reportTapStatus(message, processDocumentCallback) {
    console.log(message);
    chrome.runtime.sendMessage({msg : message},
                               function(response) {
                                   console.log(response);
                                   App.username = response.config.username;
                                   processDocumentCallback();
                               });
}

function spanWithClass(contents, spanClass) {
    return $("<span class=\""+spanClass+"\">"+contents+"</br></span>");
}

function tapSwitchView(preNode) {
    if(App.showingParsedTap) {
        preNode.removeClass(invisibleClass);
        $("#chrome-tap-parsed-output").addClass(invisibleClass);
    } else {
        preNode.addClass(invisibleClass);
        $("#chrome-tap-parsed-output").removeClass(invisibleClass);
    }
    App.showingParsedTap = !App.showingParsedTap;
}

function tapNextFailure() {
    window.find("not ok", true, false, true, false, false, false);
}

function tapPreviousFailure() {
    window.find("not ok", true, true, true, false, false, false);
}

function tapHidePasses() {
    var parsedOutput = $("div#chrome-tap-parsed-output-boxed");
    
    if(App.passesHidden) {
//        $(".chrome-tap-ok").removeClass(App.invisibleClass);
        parsedOutput.find("div:not(.chrome-tap-failed)")
            .removeClass(App.invisibleClass);
    } else {
//        $(".chrome-tap-ok").addClass(App.invisibleClass);
        parsedOutput.find("div:not(.chrome-tap-failed)")
            .addClass(App.invisibleClass);
    }
    
    App.passesHidden = !App.passesHidden;
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

var currentDepth = 0;

function pathToScpUrlLink(path, cssClass) {
    var matches = path.match("(?: |^)(/scratch/buildbot/slave-(.*?)(?:/[^/]+/)+[^ ]+)(?: |$)");
    if(matches != null && matches.length > 0) {
        App.directoryTree.add(matches[1]);
        
        return path.replace(matches[1],
                            "<a class=\""
                            + cssClass
                            + "\" href=\"scp://"
                            + App.username
                            + "@"
                            + matches[2]
                            + matches[1]
                            + "\">"
                            + matches[1]
                            + "</a>");
    }
    return path;
}

function addEventHandlers(tapParser) {      
    tapParser.on('comment', function(comment) {
        comment = comment.trim("\n");
        var line = spanWithClass(pathToScpUrlLink(comment, "chrome-tap-comment"),
                                 "chrome-tap-comment");
        tapParser.currentBox.append(line);
    });
    
    tapParser.on('complete', function(results) {
        currentDepth--;
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
        var assertionName = "";
        
        if(typeof assertion.name != 'undefined') {
            assertionName = pathToScpUrlLink(assertion.name, okOrNotOkClass(assertion.ok));
        } 
        else {
            console.log(assertion);
            assertionName = "(undefined assertion name - tap parsing error?)";
        }
        
        var line = spanWithClass([assertion.ok ? "ok" : "not ok",
                                  assertion.id,
                                  "-",
                                  assertionName].join(" "),
                                 okOrNotOkClass(assertion.ok));
        
        if(!assertion.ok) {
            tapParser.currentBox.addClass("chrome-tap-failed");
        }
        
        tapParser.currentBox.append(line);
    });
    
    tapParser.on('child', function(childParser) {
        currentDepth++;
        newBox = boxAtIndent(currentDepth);
        tapParser.currentBox.append(newBox);
        childParser.currentBox = newBox;
        addEventHandlers(childParser);
    });
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

    function processDocument() {
        $(preNode).removeAttr('style');
        $(preNode).addClass("chrome-tap-pre chrome-tap-invisible");
        
        var newdiv = $("<div id=\"chrome-tap-parsed-output-boxed\"></div>");
        $("body").append(newdiv);
        newdiv.addClass("chrome-tap-pre");
        
        var currentBox = boxAtIndent(0);
        newdiv.append(currentBox);
        
        var p = new App.parser({preserveWhitespace : true});
        
        p.currentBox = currentBox;
        addEventHandlers(p);
        
        p.write(data);
        p.end();   
    }
        
    // Look for a TAP plan (1..N) as evidence that this is TAP data
    if(data != null && /1\.\.\d+/.test(data)) {
        reportTapStatus("TAP_START", processDocument);
    } else {
        reportTapStatus("TAP_END", function() {});
        return;
    }
});

