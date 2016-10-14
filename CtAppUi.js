var CtAppUi = function(preNode) {
    var self = this;

    self.preNode = preNode;
    self.showingParsedTap = true;
    self.INVISIBLE_CLASS = "chrome-tap-invisible";
    
    /* Return <span class="spanClass">content</span> as a jQuery object */
    CtAppUi.prototype.spanWithClass = function(contents, spanClass) {
        var span = $("<span class=\""+spanClass+"\"></span>");
        span.text(contents);
        return span;
    }

    /* Action to perform when the 'Next' button is clicked */
    CtAppUi.prototype.nextFailure = function tapNextFailure() {
        window.find("not ok", true, false, true, false, false, false);
    }
    
    /* Action to perform when the 'Previous' button is clicked */
    CtAppUi.prototype.previousFailure = function tapPreviousFailure() {
        window.find("not ok", true, true, true, false, false, false);
    }

    CtAppUi.prototype.addToolbar = function addToolbar(body, callbacks) {
        self.toolbar = $("<div class=\"chrome-tap-toolbar\" id=\"chrome-tap-toolbar\">" 
                         + "<ul>"
                         + "<li id=\"chrome-tap-pie\"><span>&nbsp;</span></li>"
                         + "<li id=\"chrome-tap-shell\"><a href=\"javascript:void(0)\">&#x1f4bb;&#xfe0e;</a></li>"
                         + "<li id=\"chrome-tap-next\"><a href=\"javascript:void(0)\">Next</a></li>"
                         + "<li id=\"chrome-tap-previous\"><a href=\"javascript:void(0)\">Previous</a></li>"
                         + "</ul></div>");

        self.tree = $("<div id=\"chrome-tap-tree\"></div>");
        self.tree.hide();

        self.treeContainer = $("<div id=\"chrome-tap-tree-container\"></div>");
        self.treeContainer.append(self.tree);
                
        body.append(self.toolbar);
        body.append(self.treeContainer);
        
        $("#chrome-tap-shell").click(callbacks.shellPrompt);
        $("#chrome-tap-previous").click(self.previousFailure);
        $("#chrome-tap-next").click(self.nextFailure);

        self.testIndicator = $("#chrome-tap-pie");
    }

    /* Show/hide the original TAP output */
    CtAppUi.prototype.tapSwitchView = function() {
        if(self.showingParsedTap) {
            $(self.preNode).removeClass(self.INVISIBLE_CLASS);
            self.parsedOutputContainer.addClass(self.INVISIBLE_CLASS);
        } else {
            $(self.preNode).addClass(self.INVISIBLE_CLASS);
            self.parsedOutputContainer.removeClass(self.INVISIBLE_CLASS);
        }
        self.showingParsedTap = !self.showingParsedTap;
    }
    
    CtAppUi.prototype.setTestStatusIndicator = function setTestStatusIndicator(color) {
        self.testIndicator.css("background-color", color);
    }
    
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
                  
                  var link = "ssh://"
                      + username
                      + "@"
                      + host
                      + "/"
                      + path.join("/")
                      + "/";
                  
                  var span = $('<span>&nbsp;&#x1f4bb;&#xfe0e;</span>');
                  span.click(function() { document.location = link; });
                  $li.find('.jqtree-title').after(span);
              },
              selectable : false
            });

        self.treeContainer.css("top", self.toolbar.height());
    }

    CtAppUi.prototype.addParsedOutputContainer = function addParsedOutputContainer(body) {
        self.parsedOutputContainer = $("<div id=\"chrome-tap-parsed-output-boxed\" class=\"chrome-tap-pre\"></div>");
        body.append(self.parsedOutputContainer);
        return self.parsedOutputContainer;
    }
}

