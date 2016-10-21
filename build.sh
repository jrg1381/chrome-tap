#!/bin/sh

npm install

if [ -z $(which browserify) ]; then
    echo "browserify not on path, aborting"
    exit 1
fi

browserify CtApp.js -o CtAppBundle.js
