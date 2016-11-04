#!/bin/sh

cd $(dirname $(realpath $0))

npm install

if [ -z $(which browserify) ]; then
    echo "browserify not on path, aborting"
    exit 1
fi

browserify CtApp.js -o CtAppBundle.js

if [ ! -d "build" ]; then
    mkdir build
else
    rm build/*
fi

if [ ! -x $(which phantomjs) -a ! -x $(which phantom-jasmine) ]; then
    echo "Tests will not run"
fi

cp node_modules/jqtree/jqtree.css manifest.json LICENSE *.js *.css *.html *.png build
# Because it's already included in CtAppBundle.js
rm build/CtApp.js
# Don't need the gruntfile in there
rm build/Gruntfile.js

grunt

rm -f build/chrome-tap.zip
# -j => junk the paths
zip -j build/chrome-tap.zip build/*

