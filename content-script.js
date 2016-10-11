var App = {};

App.parser = require('tap-parser');
App.directoryTree = new DirectoryTree();
App.showingParsedTap = true;
App.invisibleClass = "chrome-tap-invisible";
App.username = "(unset)";
App.scpPaths = {};
App.scpRegex = new RegExp("(?: |^)(/(?:scratch|export)/buildbot/slave-(.*?)(?:/[^/]+/)+[^ ]+)(?: |$)","g");
App.finalResult = true; // assume pass

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
    var span = $("<span class=\""+spanClass+"\"></span>");
    span.text(contents);
    return span;
}

function tapSwitchView(preNode) {
    if(App.showingParsedTap) {
        preNode.removeClass(App.invisibleClass);
        $("#chrome-tap-parsed-output").addClass(App.invisibleClass);
    } else {
        preNode.addClass(App.invisibleClass);
        $("#chrome-tap-parsed-output").removeClass(App.invisibleClass);
    }
    App.showingParsedTap = !App.showingParsedTap;
}

App.nextFailure = function tapNextFailure() {
    window.find("not ok", true, false, true, false, false, false);
}

App.previousFailure = function tapPreviousFailure() {
    window.find("not ok", true, true, true, false, false, false);
}

App.shellPrompt = function shellPrompt() {
    var menu = $("#chrome-tap-tree");
    var parent = $("#chrome-tap-shell");
    var parentPosition = parent.offset();
    parentPosition.left = parentPosition.left - menu.width() + parent.width();
    parentPosition.top += parent.height();
    menu.css(parentPosition);
    menu.slideToggle();
}

function okOrNotOkClass(pass)
{
    return pass ? "chrome-tap-ok" : "chrome-tap-not-ok";
}

function boxAtIndent(level) {
    var currentBox = $("<div class=\"chrome-tap-box\"></div>");
    currentBox.css("margin-left",level*25+"px");
    return currentBox;
}

var currentDepth = 0;

function getMatches(input, regex, index) {
    index || (index = 1); // first capturing group
    var matches = [];
    var match;
    while(match = regex.exec(input)) {
        matches.push(match[index]);
    }
    return matches;
}  

{
    var counter = 0;
    function pathToScpUrlLink(path, parentDOMItem) {
        var result = {};
        // This goes through twice, inefficient
        var paths = getMatches(path, App.scpRegex, 1);
        var hostnames = getMatches(path, App.scpRegex, 2);
        var innerText = parentDOMItem.text();
        
        for(var i=0;i<paths.length;i++) {
            App.directoryTree.add(paths[i]);
            
            var url = "scp://"
                + App.username
                + "@"
                + hostnames[i]
                + paths[i];

            // Chop off the filename (but this is wrong if the path actually is a directory...)
            url = url.substring(0, url.lastIndexOf("/")+1);

            var id = "ct-link-" + (counter++);
            var link = "<span class=\"chrome-tap-scp\" id=\"" + id + "\">&#x21af;</span>";
            innerText = innerText.replace(paths[i],link + paths[i]);
            App.scpPaths[id] = url;
        }

        parentDOMItem.html(innerText);
    }
}

function addEventHandlers(tapParser) {      
    tapParser.on('comment', function(comment) {
        comment = comment.trim("\n");
        var line = spanWithClass(comment, "chrome-tap-comment");
        pathToScpUrlLink(comment, line);
        tapParser.currentBox.append(line);
        tapParser.currentBox.append($("<br>"));
    });

    tapParser.on('extra', function(extraLine) {
        extraLine = extraLine.trim("\n");
        var line = spanWithClass(extraLine, "chrome-tap-extra-line");
        pathToScpUrlLink(extraLine, line);
        tapParser.currentBox.append(line);
        tapParser.currentBox.append($("<br>"));
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
        if(currentDepth == 0) {
            if(App.finalResult && results.ok) {
                $("#chrome-tap-pie").css("background-color","green");
            } else {
                App.finalResult = false;
                $("#chrome-tap-pie").css("background-color","red");
            }
        }
    });
    
    tapParser.on('plan', function(plan) {
        var line = spanWithClass(plan.start + ".." + plan.end,
                                 "chrome-tap-plan");
        tapParser.currentBox.append(line);
        tapParser.currentBox.append($("<br>"));
    });
    
    tapParser.on('assert', function(assertion) {
        var assertionName = "";
        
        if(typeof assertion.name == 'undefined') {
            console.log(assertion);
            assertionName = "(undefined assertion name - tap parsing error?)";
        } else {
            assertionName = assertion.name;
        }
                
        var line = spanWithClass([assertion.ok ? "ok" : "not ok",
                                  assertion.id,
                                  "-",
                                  assertionName].join(" "),
                                 okOrNotOkClass(assertion.ok));
        
        if(!assertion.ok) {
            tapParser.currentBox.addClass("chrome-tap-failed");
        }

        pathToScpUrlLink(assertion.name, line);
        tapParser.currentBox.append(line);
        tapParser.currentBox.append($("<br>"));
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
            }
        });
        
    var data = preNode.innerHTML;

    function processDocument() {
        $(preNode).removeAttr('style');
        $(preNode).addClass("chrome-tap-pre chrome-tap-invisible");

        var toolbar = $("<div class=\"chrome-tap-toolbar\" id=\"chrome-tap-toolbar\">" 
                        + "<ul>"
                        + "<li id=\"chrome-tap-pie\"><span>&nbsp;</span></li>"
                        + "<li id=\"chrome-tap-shell\"><a href=\"javascript:void(0)\">&#x1f4bb;&#xfe0e;</a></li>"
                        + "<li id=\"chrome-tap-next\"><a href=\"javascript:void(0)\">Next</a></li>"
                        + "<li id=\"chrome-tap-previous\"><a href=\"javascript:void(0)\">Previous</a></li>"
                        + "</ul></div>");

        var tree = $("<div id=\"chrome-tap-tree\"></div>");
        tree.hide();

        var treeContainer = $("<div id=\"chrome-tap-tree-container\"></div>");
        treeContainer.append(tree);
        
        var newdiv = $("<div id=\"chrome-tap-parsed-output-boxed\"></div>");
        
        $("body").append(toolbar);
        $("body").append(treeContainer);
        $("body").append(newdiv);
        $("#chrome-tap-shell").click(App.shellPrompt);
        $("#chrome-tap-previous").click(App.previousFailure);
        $("#chrome-tap-next").click(App.nextFailure);
                
        newdiv.addClass("chrome-tap-pre");
        
        var currentBox = boxAtIndent(0);
        newdiv.append(currentBox);
        
        var p = new App.parser({preserveWhitespace : true});
        
        p.currentBox = currentBox;
        addEventHandlers(p);
        
        p.write(data);
        p.end();

        for(var key in App.scpPaths) {
            var value = App.scpPaths[key];
            function clickHandlerMaker(x) {
                return function() {
                    document.location = x;
                    console.log("Navigating to " + x);
                };
            };
            
            $("#" + key).click(clickHandlerMaker(value));
        }

        var treeData = App.directoryTree.convertForJqTree();
        
        $("#chrome-tap-tree").tree(
            { data : treeData,
              autoOpen : 4,
              onCreateLi : function(node, $li) {
                  var path = [];
                  var currentNode = node;

                  while(currentNode.name != "/") {
                      path.unshift(currentNode.name);
                      currentNode = currentNode.parent;
                  }
                  
                  var link = "ssh://"
                      + App.username
                      + "@"
                      + App.directoryTree.host
                      + "/"
                      + path.join("/")
                      + "/";
                  
                  var span = $('<span>&nbsp;&#x1f4bb;&#xfe0e;</span>');
                  span.click(function() { document.location = link; });
                  $li.find('.jqtree-title').after(span);
              },
              selectable : false
            });

        treeContainer.css("top",toolbar.height());
    }
        
    // Look for a TAP plan (1..N) as evidence that this is TAP data
    if(data != null && /1\.\.\d+/.test(data)) {
        reportTapStatus("TAP_START", processDocument);
    } else {
        reportTapStatus("TAP_END", function() {});
        return;
    }
});

