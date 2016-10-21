# chrome-tap
Chrome extension for processing Test Anything Protocol

## Building

Chrome TAP uses browserify to use node modules inside browser javascript.

1. Run `npm install` to get the packages
2. Get a global installation of browserify via `sudo npm install -g browserify`
3. Run ./build.sh to build the application
4. Load the whole directory into Chrome as an extension

## Notes

As regular node users probably know, but it was new to me, some Linux systems have a binary called `node` from a different package. Some sample solutions are given in http://stackoverflow.com/questions/18130164/nodejs-vs-node-on-ubuntu-12-04, but the simplest thing is probably to edit the first line of `browserify` from 

```
#!/usr/bin/env node
```

to

```
#!/usr/bin/env nodejs
```

## Testing

You can open the html file `./jasmine/SpecRunner.html` to run the jasmine-based unit tests.


