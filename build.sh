#!/bin/sh

if [ -z $(which browserify) ]; then
    echo "browserify not on path, aborting"
    exit 1
fi

npm install
browserify CtApp.js -o CtAppBundle.js
