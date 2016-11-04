window.jQuery = require('jquery'); // Need to do this so jqTree can see jQuery (?)
// We want scripts which live alongside this one to see jQuery in the normal way,
// this is a way of making the module global, as browserify wraps everything up.
window.$ = window.jQuery;
var jqTree = require('jqtree');

var CtApp = function(originalTextPreNode, data, uiParent) {
    var self = this;

    self.data = data;
    self.body = uiParent;
    self.ui = new CtAppUi(originalTextPreNode, uiParent);
    self.parser = require('tap-parser');
    self.directoryTree = new DirectoryTree();
    self.username = "(unset)";
    self.scpPaths = {};
    self.finalResult = true; // assume passing test
    self.currentDepth = 0;   // How deep are we in subtests?
    self.indentDepthPixels = 25;
    self.parsedOutputContainer = null;
    self.spanIdCounter = 0;
    self.filenameMatcher = new FilenameMatcher();

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
    };

    /* Return the class to use for assertions. */
    CtApp.prototype.okOrNotOkClass = function okOrNotOkClass(pass) {
        return pass ? "chrome-tap-ok" : "chrome-tap-not-ok";
    };

    /* Generate a div at a particular indent */
    CtApp.prototype.boxAtIndent = function boxAtIndent(level) {
        var currentBox = $("<div class=\"chrome-tap-box\"></div>");
        currentBox.css("margin-left",level*self.indentDepthPixels+"px");
        return currentBox;
    };

    /* Look for paths in 'path' and change them to scp links in the html */
    CtApp.prototype.pathToScpUrlLink = function pathToScpUrlLink(path, parentDOMItem) {
        var regexMatches = self.filenameMatcher.Match(path);
        var innerText = parentDOMItem.text();

        for(var i=0;i<regexMatches.paths.length;i++) {
            var currentPath = regexMatches.paths[i];
            var currentHost = regexMatches.hostnames[i];

            self.directoryTree.add(currentPath);

            var url = "scp://" +
                self.username  +
                "@"            +
                currentHost    +
                currentPath;

            // Chop off the filename (but this is wrong if the path actually
            // is a directory...)
            url = url.substring(0, url.lastIndexOf("/")+1);

            var id = "ct-link-" + (self.spanIdCounter++);
            var link = '<span class="chrome-tap-scp" id="' + id + '">&#x21af;</span>';
            innerText = innerText.replace(currentPath, link + currentPath);
            // Save the result for later, because we haven't wired up the click events..
            self.scpPaths[id] = url;
        }

        parentDOMItem.html(innerText);
    };

    /* Append a line with a linebreak to a container (e.g. a div) */
    CtApp.prototype.addLineToBox = function(box, line) {
        box.append(line);
        box.append($("<br>"));
    };

    /* Add event handler to a tap-parser parser object */
    CtApp.prototype.addEventHandlers = function addEventHandlers(tapParser) {
        tapParser.on('comment', function(comment) {
            comment = comment.trim("\n");
            var line = self.ui.spanWithClass(comment, "chrome-tap-comment");
            self.pathToScpUrlLink(comment, line);
            self.addLineToBox(tapParser.currentBox, line);
        });

        tapParser.on('extra', function(extraLine) {
            extraLine = extraLine.trim("\n");
            var line = self.ui.spanWithClass(extraLine, "chrome-tap-extra-line");
            self.pathToScpUrlLink(extraLine, line);
            self.addLineToBox(tapParser.currentBox, line);
        });

        tapParser.on('complete', function(results) {
            // there's quite a lot in results that we don't use...
            var current = tapParser.currentBox;
            var parent = tapParser.currentBox.parent();

            // The plan is to mark the parents as having failed children,
            // but this isn't used for anything yet (such as being able to collapse
            // passed tests)
            if(current.hasClass("chrome-tap-failed") &&
               !parent.hasClass("chrome-tap-failed"))
            {
                parent.addClass("chrome-tap-failed");
            }

            tapParser.currentBox = parent;
            if(self.currentDepth === 0) {
                if(self.finalResult && results.ok) {
                    self.ui.setTestStatusIndicator(CtAppUi.TEST_STATE.PASS);

                } else {
                    self.finalResult = false;
                    self.ui.setTestStatusIndicator(CtAppUi.TEST_STATE.FAIL);
                }
            }

            self.currentDepth--;
        });

        tapParser.on('plan', function(plan) {
            var line = self.ui.spanWithClass(plan.start + ".." + plan.end,
                                             "chrome-tap-plan");
            self.addLineToBox(tapParser.currentBox, line);
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
            self.addLineToBox(tapParser.currentBox, line);
        });

        /* This is where the parser gets clever, if it sees a child test it gives you
           a new parser object pointing at that test, to which you have to add the event
           handlers again. */
        tapParser.on('child', function(childParser) {
            self.currentDepth++;
            var newBox = self.boxAtIndent(self.currentDepth);
            tapParser.currentBox.append(newBox);
            childParser.currentBox = newBox;
            self.addEventHandlers(childParser);
        });
    };

    CtApp.prototype.processDocument = function processDocument() {
        function clickHandlerMaker(url) {
            return function() {
                document.location = url;
                console.log("Navigating to " + url);
            };
        }

        self.ui.hideOriginalText();
        self.ui.addToolbar();
        self.parsedOutputContainer = self.ui.addParsedOutputContainer();

        var currentBox = self.boxAtIndent(0);
        self.parsedOutputContainer.append(currentBox);

        var promise = new Promise(function(resolve, reject) {
            /* The work in here is slow(ish), so we put it inside a timeout to schedule it
               for later, so that the actions done above (adding the toolbar to the DOM)
               will get a chance to run first. This lets the user see something other
               than a blank screen. 

               We use a Promise to let the caller know when the scheduled work has completed.
               This is primarily useful for the unit tests. */
            setTimeout(function() {
                var p = new self.parser({preserveWhitespace : true});

                p.currentBox = currentBox;
                self.addEventHandlers(p);

                p.write(self.data);
                p.end();

                for(var key in self.scpPaths) {
                    if(self.scpPaths.hasOwnProperty(key)) {
                        var value = self.scpPaths[key];
                        var element = $("#" + key);
                        element.click(clickHandlerMaker(value));
                        element.attr('title', value);
                    }
                }

                var treeData = self.directoryTree.convertForJqTree();
                self.ui.addTreeData(treeData, self.username, self.directoryTree.host);
                // Let anyone who's got hold of the promise proceed with their 'then'.
                resolve();
            }, 0);
        });

        return promise;
    };
};

/* Annoyingly it seems like we have to have this here for the jasmine tests
   otherwise CtApp can't be seen after being browserify'd, because it gets taken
   out of the global scope */
window.CtApp = CtApp;
