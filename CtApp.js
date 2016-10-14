var CtApp = function(preNode, data) {
    var self = this;

    self.data = data;
    self.preNode = preNode;
    self.ui = new CtAppUi(preNode);
    self.parser = require('tap-parser');
    self.directoryTree = new DirectoryTree();
    self.username = "(unset)";
    self.scpPaths = {};
    self.scpRegex = new RegExp("(?: |^)(/(?:scratch|export)/buildbot/slave-(.*?)(?:/[^/]+/)+[^ ]+)(?: |$)","g");
    self.finalResult = true; // assume passing test
    self.currentDepth = 0;
    self.indentDepthPixels = 25;
    self.parsedOutputContainer = null;
    self.spanIdCounter = 0;

    /* Tell the background page outside the content script whether the page is TAP or not.
       The response from the background page contains the user configuration information */
    CtApp.prototype.reportTapStatus = function(message, processDocumentCallback) {
        console.log(message);
        chrome.runtime.sendMessage({msg : message},
                                   function(response) {
                                       console.log(response);
                                       self.username = response.config.username;
                                       processDocumentCallback();
                                   });
    }

    /* Action to perform when the shell prompt icon is clicked */
    CtApp.prototype.shellPrompt = function shellPrompt() {
        var menu = $("#chrome-tap-tree");
        var parent = $("#chrome-tap-shell");
        var parentPosition = parent.offset();
        parentPosition.left = parentPosition.left - menu.width() + parent.width();
        parentPosition.top += parent.height();
        menu.css(parentPosition);
        
        if(menu.is(":visible")) {
            return;
        }
        
        menu.slideToggle( {
            complete : function() {
                $('html').click(function(event) {
                    if($(event.target).parents('#chrome-tap-tree').length == 0) {
                        $('#chrome-tap-tree').slideToggle();
                        $(this).unbind(event);
                    }
                });
            }
        });
    }

    /* Return the class to use for assertions. */
    CtApp.prototype.okOrNotOkClass = function okOrNotOkClass(pass) {
        return pass ? "chrome-tap-ok" : "chrome-tap-not-ok";
    }

    CtApp.prototype.boxAtIndent = function boxAtIndent(level) {
        var currentBox = $("<div class=\"chrome-tap-box\"></div>");
        currentBox.css("margin-left",level*self.indentDepthPixels+"px");
        return currentBox;
    }

    CtApp.prototype.getMatches = function getMatches(input, regex, index) {
        index || (index = 1); // first capturing group
        var matches = [];
        var match;
        while(match = regex.exec(input)) {
            matches.push(match[index]);
        }
        return matches;
    }  

    CtApp.prototype.pathToScpUrlLink = function pathToScpUrlLink(path, parentDOMItem) {
        var result = {};
        // This goes through twice, inefficient
        var paths = self.getMatches(path, self.scpRegex, 1);
        var hostnames = self.getMatches(path, self.scpRegex, 2);
        var innerText = parentDOMItem.text();
        
        for(var i=0;i<paths.length;i++) {
            self.directoryTree.add(paths[i]);
            
            var url = "scp://"
                + self.username
                + "@"
                + hostnames[i]
                + paths[i];
            
            // Chop off the filename (but this is wrong if the path actually is a directory...)
            url = url.substring(0, url.lastIndexOf("/")+1);
            
            var id = "ct-link-" + (self.spanIdCounter++);
            var link = "<span class=\"chrome-tap-scp\" id=\"" + id + "\">&#x21af;</span>";
            innerText = innerText.replace(paths[i],link + paths[i]);
            self.scpPaths[id] = url;
        }
        
        parentDOMItem.html(innerText);
    }

    CtApp.prototype.addEventHandlers = function addEventHandlers(tapParser) {      
        tapParser.on('comment', function(comment) {
            comment = comment.trim("\n");
            var line = self.ui.spanWithClass(comment, "chrome-tap-comment");
            self.pathToScpUrlLink(comment, line);
            tapParser.currentBox.append(line);
            tapParser.currentBox.append($("<br>"));
        });
        
        tapParser.on('extra', function(extraLine) {
            extraLine = extraLine.trim("\n");
            var line = self.ui.spanWithClass(extraLine, "chrome-tap-extra-line");
            self.pathToScpUrlLink(extraLine, line);
            tapParser.currentBox.append(line);
            tapParser.currentBox.append($("<br>"));
        });
        
        tapParser.on('complete', function(results) {
            self.currentDepth--;
            var current = tapParser.currentBox;
            var parent = tapParser.currentBox.parent();
            
            // The plan is to mark the parents as having failed children, but this isn't used for anything yet
            if(current.hasClass("chrome-tap-failed") &&
               !parent.hasClass("chrome-tap-failed"))
            {
                parent.addClass("chrome-tap-failed");
            }
            
            tapParser.currentBox = parent;
            if(self.currentDepth == 0) {
                if(self.finalResult && results.ok) {
                    self.ui.setTestStatusIndicator("green");
                    
                } else {
                    self.finalResult = false;
                    self.ui.setTestStatusIndicator("red");
                }
            }
        });
        
        tapParser.on('plan', function(plan) {
            var line = self.ui.spanWithClass(plan.start + ".." + plan.end,
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
            
            var line = self.ui.spanWithClass([assertion.ok ? "ok" : "not ok",
                                              assertion.id,
                                              "-",
                                              assertionName].join(" "),
                                             self.okOrNotOkClass(assertion.ok));
            
            if(!assertion.ok) {
                tapParser.currentBox.addClass("chrome-tap-failed");
            }
            
            self.pathToScpUrlLink(assertion.name, line);
            tapParser.currentBox.append(line);
            tapParser.currentBox.append($("<br>"));
        });
        
        tapParser.on('child', function(childParser) {
            self.currentDepth++;
            newBox = self.boxAtIndent(self.currentDepth);
            tapParser.currentBox.append(newBox);
            childParser.currentBox = newBox;
            self.addEventHandlers(childParser);
        });
    }

    CtApp.prototype.processDocument = function processDocument() {
        var body = $("body");
        $(self.preNode).removeAttr('style');
        $(self.preNode).addClass("chrome-tap-pre chrome-tap-invisible");
        
        self.ui.addToolbar(body,
                          {
                              shellPrompt : self.shellPrompt
                          });
        
        self.parsedOutputContainer = self.ui.addParsedOutputContainer(body);
        
        var currentBox = self.boxAtIndent(0);
        self.parsedOutputContainer.append(currentBox);
        
        var p = new self.parser({preserveWhitespace : true});
        
        p.currentBox = currentBox;
        self.addEventHandlers(p);
        
        p.write(self.data);
        p.end();
        
        for(var key in self.scpPaths) {
            var value = self.scpPaths[key];
            function clickHandlerMaker(x) {
                return function() {
                    document.location = x;
                    console.log("Navigating to " + x);
                };
            };
            
            var element = $("#" + key);
            element.click(clickHandlerMaker(value));
            element.attr('title', value);
        }
        
        var treeData = self.directoryTree.convertForJqTree();
        self.ui.addTreeData(treeData, self.username, self.directoryTree.host);
    }    
}

/* Annoyingly it seems like we have to have this here otherwise CtApp can't be seen after being browserify'd */

$(document).ready(function() {
    // Chrome renders text documents inside a faked up <pre> node
    var preNode = $("pre")[0];
    var data = preNode.innerHTML;

    var App = new CtApp(preNode, data);
    
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
    if(data != null && /1\.\.\d+/.test(data)) {
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

