var DirectoryTree = function() {
    var self = this;
    this.root = {};
    this.host = "(unset)";
    this.hostRegexp = new RegExp("slave-(.+)");

    // Add pathElement as a child of node, unless such a child already exists.
    DirectoryTree.prototype.addToNode = function(pathElement, node) {
        if(!node.hasOwnProperty(pathElement)) {
            node[pathElement] = {};
        }
        return node[pathElement];
    }

    // Given a path that looks like foo/bar/baz, add the elements to the directory tree
    // such that if foo/bar has already been seen, it will not be added again. The intent
    // is to take a set of file paths and recreate the directory structure from them.
    DirectoryTree.prototype.add = function(path) {
        var pathElements = path.split('/');
        var currentNode = self.root;
        
        pathElements.forEach(function(element, index, array) {
            var matches = element.match(self.hostRegexp);
            if(matches != null && matches.length > 0) {
                self.host = matches[1];
            }
            currentNode = self.addToNode(element, currentNode);
        });
    }

    DirectoryTree.prototype.depthFirstTraversal = function(node, currentStack, leafNodeVisitor) {
        var leafNode = true;
        
        for(var child in node) {
            leafNode = false;
            currentStack.push(child);
            self.depthFirstTraversal(node[child], currentStack, leafNodeVisitor);
        }

        if(leafNode) {
            leafNodeVisitor(currentStack);
        }
        
        currentStack.pop();
    }
    
    DirectoryTree.prototype.getPaths = function() {
        var paths = [];
        self.depthFirstTraversal(self.root, [], function(pathStack) {
            paths.push(pathStack.slice());
        });
        console.log(paths);
    }
}
