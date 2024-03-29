Development
===========

This extension was initially created with [Chrome Extension Generator (Yeoman)](https://github.com/yeoman/generator-chrome-extension#user-content-getting-started). Some changes were required in the build process to support ES2015 modules (`import` syntax). But the generator does give a decent starting point for a first extension.

Prepare for building
--------------------

1. You will need [Node.js](https://nodejs.org/en/) for building the extension and downloading modules. I used Node.js 8.9, but version 4.0 (or higher) should be fine(*).
2. You will also need Gulp `npm install --global gulp-cli`. See also [Gulp Quickstart](https://gulpjs.com/docs/en/getting-started/quick-start).
3. You need to install modules for the project (`npm install`).
4. (Optional) Install [Visual Studio Code](https://code.visualstudio.com/). Not required, but makes running tasks a bit easier.

(*) Version 4.0 is required e.g. by Mocha and it's also the first Node.js version with ES6 / ES2015 support.

If you need to use older Node.js for other projects then install [nvm](https://github.com/creationix/nvm) (Linux and Mac) or [nvm-windows](https://github.com/coreybutler/nvm-windows). Note! Do *not* install `nvm-windows` in `C:\Program Files`. In fact you should *not* use any directories with a space character for `nvm-windows` installation.

Quick testing
-------------

So to quickly test if the project works I recomend using [web-ext](https://hacks.mozilla.org/2019/10/developing-cross-browser-extensions-with-web-ext-3-2-0/).

1. Install web-ext: `npm install --global web-ext`.
2. Build the project: `gulp build`.
3. Open dist dir created when building: `cd dist`.
4. Run in FF: `web-ext run -t firefox-desktop`.

No worries. Separate FF instance will be opened. So you don't have to worry about closing FF first or anything like that.

Important tasks
---------------

All important tasks are defined in `.vscode/tasks.json` and can be run in VS Code (menu Tasks → Run Task...).

* `gulp build` -- basic build task that builds and copies files from `app` to `dist`. This is required to test an extension from the `dist` folder.
* `gulp watch` -- runs Babel build on each change. Will NOT update `dist` folder.
* `gulp package` -- simply zips `dist` with correct version number.
* `scripts/test` -- run tests (Mocha). There are two scripts -- `test.cmd` for Windows, `test.sh` for Unix based systems (macOS and Linux).

Note! You also need to run one of the build tasks to e.g. test `options.html` in browser. This is because files in `scripts.babel` are not used directly.

Notes
-----
 
* **Localization** -- most strings for translation are available in `app/_locales`. Some translations are directly incorporated into `popup.html`.
* **Add-on version** -- `dist/manifest` is always +1 from `app/manifest`. This is automatic. And so in `app/manifest` minor version should always be an odd number (`dist/manifest` will have an even number then).
* **Add-on logo** -- logo icons are generated with Inkscape from SVG. This is done with `app/logo/_generate_logofiles.bat`. You might need to configure Inkscape path in `_svg2png.bat`. Obviously you would need to rewrite this if you work on Linux. 
* **Supported Firefox version** -- I currently support a minimum of FF 52 (ESR before Quantum). The extension was built when I was using FF 56, but I moved on to latest FF. So there should be no problems running it on both latests FF and FF with XUL add-ons. Minimum supported version is specified in two places: in `strict_min_version` option in `app/manifest` and in `browsers` config in `.babelrc`. The later is used by [babel-preset-env](https://babeljs.io/env/) to compile scripts.

