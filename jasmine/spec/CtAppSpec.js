describe("CtApp", function() {
    var preNode;
    var body;
    
    beforeEach(function() {
        preNode = $("<pre></pre>");
        // Don't modify the real body of the page, inject a fake one in
        body = $("<div></div>");
    });

    it("original text should be invisible", function() {
        var app = new CtApp(preNode, "1..5", body);
        app.processDocument();
        expect(preNode.hasClass("chrome-tap-invisible")).toBe(true);
    });

    /* These are the unpleasant style of unit tests where the expectation is essentially 'everything', rather than
       having the salient features pulled out, but they will do for now. */
    
    it("toolbar should be created", function() {
        var app = new CtApp(preNode, "ok 1 a test\r\n1..1", body);
        app.processDocument();
        expect($(body.children()[0]).html()).toBe('<ul><li id="chrome-tap-pie" style="background-color: green;"><span>&nbsp;</span></li><li id="chrome-tap-shell"><a href="javascript:void(0)">💻︎</a></li><li id="chrome-tap-next"><a href="javascript:void(0)">Next</a></li><li id="chrome-tap-previous"><a href="javascript:void(0)">Previous</a></li></ul>');
    });

    it("file path generates correct html", function() {
        var app = new CtApp(preNode, "1..5\r\n#   at /export/buildbot/slave-mastermind/server_API_general_mastermind/server/api/bin/t/general/../../../../lib/Linguamatics/REST.pm line 1261.", body);
        app.processDocument();
        expect($(body.children()[2]).html()).toBe('<div class="chrome-tap-box" style="margin-left: 0px;"><span class="chrome-tap-plan">1..5</span><br><span class="chrome-tap-comment">#   at <span class="chrome-tap-scp" id="ct-link-0">↯</span>/export/buildbot/slave-mastermind/server_API_general_mastermind/server/api/bin/t/general/../../../../lib/Linguamatics/REST.pm line 1261.</span><br></div>');
    });

    it("Failed test is marked failed", function() {
        var app = new CtApp(preNode, "not ok 1 - test failed\r\n1..1", body);
        app.processDocument();
        expect($(body).find("#chrome-tap-pie").css("background-color")).toBe('red');
    });

    it("Passed test is marked passed", function() {
        var app = new CtApp(preNode, "ok 1 - test passed\r\n# tests 1\r\n# pass 1\r\n1..1\r\n", body);
        app.processDocument();
        expect($(body).find("#chrome-tap-pie").css("background-color")).toBe('green');
    });

    it("Next and previous buttons are wired up", function() {
        var app = new CtApp(preNode, "ok 1 a test\r\n1..1", body);
        app.processDocument();

        spyOn(window, 'find');

        $(body).find("#chrome-tap-next").click();
        $(body).find("#chrome-tap-previous").click();

        // Worry about the arguments later
        expect(window.find).toHaveBeenCalledTimes(2);
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

describe("DirectoryTree", function() {
    var tree;

    beforeEach(function() {
        tree = new DirectoryTree();
    });
    
    it("Tree accepts a single path", function() {
        tree.add("/this/that/other/and/more/things");
        expect(JSON.stringify(tree.root)).toBe('{"":{"this":{"that":{"other":{"and":{"more":{"things":{}}}}}}}}');
    });

    it("Tree understands ..", function() {
        tree.add("/this/that/../and/../things");
        expect(JSON.stringify(tree.root)).toBe('{"":{"this":{"things":{}}}}');
    });

    it("Tree converts to jqtree format correctly", function() {
        tree.add("/this/that/other/and/more/things");
        tree.add("/this/that/other/and/different/path");
        expect(JSON.stringify(tree.convertForJqTree())).toBe('[{"name":"/","children":[{"name":"this","children":[{"name":"that","children":[{"name":"other","children":[{"name":"and","children":[{"name":"more","children":[{"name":"things","children":[]}]},{"name":"different","children":[{"name":"path","children":[]}]}]}]}]}]}]}]');
    });
});

