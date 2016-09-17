#!/bin/sh

if [ -z $(which browserify) ]; then
    echo "browserify not on path, aborting"
    exit 1
fi

npm install
browserify content-script.js -o content-script-bundle.js
