var FilenameMatcher = function() {
    var self = this;
    
    FilenameMatcher.prototype.scpRegex = new RegExp("(?: |^)(/(?:scratch|export)/buildbot/slave-(.*?)(?:/[^/]+/)+[^ ]+)(?: |$)","g");
    
    FilenameMatcher.prototype.Match = function(input) {
        var matches = { paths : [], hostnames : [] };
        
        var match; // Needs this scope for while loop to find successive matches
        
        while(match = self.scpRegex.exec(input)) {
            matches.paths.push(match[1]);
            matches.hostnames.push(match[2]);
        }

        return matches;
    }  
}
