var FilenameMatcher = function() {
    self.scpRegex = new RegExp("(?: |^)(/(?:scratch|export)/buildbot/slave-(.*?)(?:/[^/]+/)+[^ ]+)(?: |$)","g");
    self.groupCount = 2;
    
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
