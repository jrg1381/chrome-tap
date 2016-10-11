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
    //
    // We also have to treat ".." specially and proceed to the next element if it's encountered.
    // This has the effect of going up a directory, so that with the input "a/b/../c", "c" is
    // made a child of "a".
    DirectoryTree.prototype.add = function(path) {
        var pathElements = path.split('/');
        var currentNode = self.root;
        
        pathElements.forEach(function(element, index, array) {
            if(element == "..") {
                // Not so fast, my fine friend!
                return;
            }
            
            var matches = element.match(self.hostRegexp);
            if(matches != null && matches.length > 0) {
                self.host = matches[1];
            }
            currentNode = self.addToNode(element, currentNode);
        });
    }

    DirectoryTree.prototype.probablyFilename = function(filename) {
        return filename.endsWith(".json")
            || filename.endsWith(".zip")
            || filename.endsWith(".out")
            || filename.endsWith(".log")
            || filename.endsWith(".xml")
            || filename.endsWith(".pm")
            || filename.endsWith(".t")
            || filename.endsWith(".txt")
            || filename.endsWith(".html");

    }
    
    DirectoryTree.prototype.depthFirstTraversal = function(root, parentNode) { 
        for(var child in root) {
            // Make the wild guess that filenames with . in them are files, not directories
            if(self.probablyFilename(child)) {
                console.log(child);
                continue;
            }
            var newNode = { name : child, children: [] };
            parentNode.children.push(newNode);
            self.depthFirstTraversal(root[child], newNode);
        }
    }
    
    DirectoryTree.prototype.convertForJqTree = function() {
        var data = {name : "/", children: []};
        self.depthFirstTraversal(self.root[""], data);
        // It has to be in an array to represent multiple top-level nodes to jqTree.
        // As we're a filesystem we only have /, so wrap the object in an array here to keep jqTree happy.
        return [data];
    }
}
