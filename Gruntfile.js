module.exports = function(grunt) {
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jasmine : {
            tests: {
                src : [
                    'FilenameMatcher.js',
                    'directoryTree.js',
                    'CtAppBundle.js',
                    'CtAppUi.js'
                ],
                options : {
                    specs : ['jasmine/spec/*.js']
                }
            }
        },
        jshint : {
            all : [
                'CtApp.js',
                'CtAppUi.js',
                'directoryTree.js',
                'FilenameMatcher.js',
                'documentReady.js',
                'options.js',
                'parse-tap.js',
                'bg.js'
            ],
            options: {
                reporterOutput : ""
            }
        }
    });
    
    // Load the plugin that provides the "jasmine" task.
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    
    // Default task(s).
    grunt.registerTask('default', ['jshint', 'jasmine']);
};
