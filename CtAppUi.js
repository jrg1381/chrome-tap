var CtAppUi = function(originalTextPreNode, uiParent) {
    var self = this;

    self.originalTextPreNode = originalTextPreNode;
    self.body = uiParent;
    self.showingParsedTap = true;
    self.INVISIBLE_CLASS = "chrome-tap-invisible";
        
    /* Return <span class="spanClass">content</span> as a jQuery object */
    CtAppUi.prototype.spanWithClass = function(contents, spanClass) {
        var span = $("<span class=\""+spanClass+"\"></span>");
        span.text(contents);
        return span;
    };

    /* hide the original TAP data */
    CtAppUi.prototype.hideOriginalText = function () {
        $(self.originalTextPreNode).removeAttr('style');
        $(self.originalTextPreNode).addClass("chrome-tap-pre chrome-tap-invisible");
    };
    
    /* Action to perform when the 'Next' button is clicked */
    CtAppUi.prototype.nextFailure = function tapNextFailure() {
        window.find("not ok", true, false, true, false, false, false);
    };
    
    /* Action to perform when the 'Previous' button is clicked */
    CtAppUi.prototype.previousFailure = function tapPreviousFailure() {
        window.find("not ok", true, true, true, false, false, false);
    };

    CtAppUi.prototype.addToolbar = function addToolbar() {
        self.toolbar = $("<div class=\"chrome-tap-toolbar\" id=\"chrome-tap-toolbar\">" + 
                         "<ul>" +
                         "<li id=\"chrome-tap-pie\"><span>&nbsp;</span></li>" +
                         "<li id=\"chrome-tap-shell\"><a href=\"javascript:void(0)\">&#x1f4bb;&#xfe0e;</a></li>" +
                         "<li id=\"chrome-tap-next\"><a href=\"javascript:void(0)\">Next</a></li>" +
                         "<li id=\"chrome-tap-previous\"><a href=\"javascript:void(0)\">Previous</a></li>" +
                         "</ul></div>");

        self.tree = $("<div id=\"chrome-tap-tree\"></div>");
        self.tree.hide();

        self.treeContainer = $("<div id=\"chrome-tap-tree-container\"></div>");
        self.treeContainer.append(self.tree);

        self.body.prepend(self.treeContainer);
        self.body.prepend(self.toolbar);

        self.menuButton = self.body.find("#chrome-tap-shell");
        self.toolbarPrevious = self.body.find("#chrome-tap-previous");
        self.toolbarNext = self.body.find("#chrome-tap-next");

        self.menuButton.click(self.showShellPromptMenu);
        self.toolbarPrevious.click(self.previousFailure);
        self.toolbarNext.click(self.nextFailure);

        self.testIndicator = self.body.find("#chrome-tap-pie");
        self.setTestStatusIndicator(CtAppUi.TEST_STATE.UNKNOWN);
    };

    /* Show/hide the original TAP output */
    CtAppUi.prototype.tapSwitchView = function() {
        if(self.showingParsedTap) {
            $(self.originalTextPreNode).removeClass(self.INVISIBLE_CLASS);
            self.parsedOutputContainer.addClass(self.INVISIBLE_CLASS);
        } else {
            $(self.originalTextPreNode).addClass(self.INVISIBLE_CLASS);
            self.parsedOutputContainer.removeClass(self.INVISIBLE_CLASS);
        }
        self.showingParsedTap = !self.showingParsedTap;
    };
    
    CtAppUi.prototype.setTestStatusIndicator = function setTestStatusIndicator(status) {
        var colors = {};
        colors[CtAppUi.TEST_STATE.PASS] = "green";
        colors[CtAppUi.TEST_STATE.FAIL] = "red";
        colors[CtAppUi.TEST_STATE.UNKNOWN] = "purple";
        // Could do this as a style if we wanted something more complex
        self.testIndicator.css("background-color", colors[status]);
    };

    /* Action to perform when the shell prompt icon is clicked */
    CtAppUi.prototype.showShellPromptMenu = function shellPrompt() {
        var parentPosition = self.menuButton.offset();
        parentPosition.left = parentPosition.left - self.tree.width() + self.menuButton.width();
        parentPosition.top += self.menuButton.height();
        self.tree.css(parentPosition);
        
        if(self.tree.is(":visible")) {
            return;
        }
        
        self.tree.slideToggle( {
            complete : function() {
                $('html').click(function(event) {
                    if($(event.target).parents('#chrome-tap-tree').length === 0) {
                        self.tree.slideToggle();
                        $(this).unbind(event);
                    }
                });
            }
        });
    };
    
    CtAppUi.prototype.addTreeData = function addTreeData(treeData, username, host) {
        self.tree.tree(
            { data : treeData,
              autoOpen : 4,
              onCreateLi : function(node, $li) {
                  var path = [];
                  var currentNode = node;

                  while(currentNode.name != "/") {
                      path.unshift(currentNode.name);
                      currentNode = currentNode.parent;
                  }
                  
                  var link = "ssh://" +
                      username +
                      "@" +
                      host +
                      "/" +
                      path.join("/") +
                      "/";
                  
                  var span = $('<span>&nbsp;&#x1f4bb;&#xfe0e;</span>');
                  span.click(function() { document.location = link; });
                  span.attr("title", link);
                  $li.find('.jqtree-title').after(span);
              },
              selectable : false
            });

        self.treeContainer.css("top", self.toolbar.height());
    };

    CtAppUi.prototype.addParsedOutputContainer = function addParsedOutputContainer() {
        self.parsedOutputContainer = $("<div id=\"chrome-tap-parsed-output-boxed\" class=\"chrome-tap-pre\"></div>");
        self.body.append(self.parsedOutputContainer);
        return self.parsedOutputContainer;
    };
};

CtAppUi.TEST_STATE = { "PASS" : 0, "FAIL" : 1, "UNKNOWN" : 2 };

