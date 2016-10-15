describe("CtApp", function() {
    var preNode;
    var body;
    
    beforeEach(function() {
        preNode = $("<pre></pre>");
        // Don't modify the real body of the page, inject a fake one in
        body = $("<div></div>");
    });

    it("original text should be invisible", function() {
        var app = new CtApp(preNode, "1..5");
        app.processDocument(body);
        expect(preNode.hasClass("chrome-tap-invisible")).toBe(true);
    });

    it("toolbar should be created", function() {
        var app = new CtApp(preNode, "1..5");
        app.processDocument(body);
        expect($(body.children()[0]).html()).toBe('<ul><li id="chrome-tap-pie"><span>&nbsp;</span></li><li id="chrome-tap-shell"><a href="javascript:void(0)">💻︎</a></li><li id="chrome-tap-next"><a href="javascript:void(0)">Next</a></li><li id="chrome-tap-previous"><a href="javascript:void(0)">Previous</a></li></ul>');
    });
});

describe("FilenameMatcher", function() {
    var matcher = new FilenameMatcher();

    it("extracts host and path from string containing one path", function() {
        var matches = matcher.Match("/scratch/buildbot/slave-foobar/sometest-name/file.txt");
        expect(matches.hostnames[0]).toBe("foobar");
        expect(matches.paths[0]).toBe("/scratch/buildbot/slave-foobar/sometest-name/file.txt");
    });

    it("extracts host and path from string containing two paths", function() {
        var matches = matcher.Match("/scratch/buildbot/slave-foobar/sometest-name/file.txt fdgdfg /scratch/buildbot/slave-foobar/sometest-else/foo.txt");
        expect(matches.hostnames[0]).toBe("foobar");
        expect(matches.paths[0]).toBe("/scratch/buildbot/slave-foobar/sometest-name/file.txt");
        expect(matches.hostnames[1]).toBe("foobar");
        expect(matches.paths[1]).toBe("/scratch/buildbot/slave-foobar/sometest-else/foo.txt");
    });
});
      