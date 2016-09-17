#!/bin/sh

npm install
browserify content-script.js -o content-script-bundle.js
