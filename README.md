#  WebExtension: SearchAutocomplete

This WebExtension aims to give you quick, keyword based autocomplete for your search engines. Making your address bar an effective tool again ;-). Should be a good replacement for Omnibar add-on (that worked until FF 56).

Default search engines
----------------------

By default you are provided with autocomplete for English and Polish Wikipedia.

You can easily add new Wikipedia by coping existing engine definition. Just change the base URL and the keyword.

<img src="https://raw.githubusercontent.com/Eccenux/WebExt-SearchAutocomplete/master/screen/sa-en-Fire.png" alt="Mass operations dialog">

Custom search engines
---------------------

### Wikipedia and similar ###

Currently I support any search engine that is roughly similar to Wikipedia API. Wikipedia is using `application/x-suggestions+json` format (MIME).

For this format the server returns something like this:
```
[
	'search term',
	[...titles...],
	[...descriptions...],
	[...direct urls...]	
]
```
I only require that the search term and tiles array is present. I don't actually use the search term, but it seems to be required by the standard.

* *titles* -- title of the matched article.
* *descriptions* -- description (preview) of the matched article. If not present then just titles will be displayed.
* *direct urls* -- url of the matched article. If not present then I will use `open` action definition to build the URL.

### Other formats ###

As I said above I only require an array with search term and tiles array is present. So that should be easy to implement if you have a control over the server.

But I'm looking into implementing more formats. Please add an issue and specify the format you need. I'm also open to suggestions on how to define response parsers more freely (maybe define a root with titles somehow?).

Anyway if you are interested how parsing responses is currently working then have a look at `createSuggestionsFromResponse` function in the `SearchHelper` class/module.

Technical information
---------------------

This extension was initially created with [Chrome Extension Generator (Yeoman)](https://github.com/yeoman/generator-chrome-extension#user-content-getting-started). Some changes were required in the build process to support ES2015 modules (`import` syntax). But the generator does give a decent starting point for a first extension.

### Prepare for building ###

1. You will need [Node.js](https://nodejs.org/en/) for building. I used 8.9, but not sure if any specific version is required. It does need to support ES2015 modules.
2. You need to install modules (`npm install`).
3. (Optional) Install [Visual Studio Code](https://code.visualstudio.com/). Not required, but makes running tasks a bit easier.

### Important tasks ###

All important tasks are defined in `.vscode/tasks.json` and can be run in VS Code (menu Tasks → Run Task...).

* `gulp build` -- basic build task that builds and copies files from `app` to `dist`. This is required to test an extension from the `dist` folder.
* `gulp watch` -- runs Babel build on each change. Will NOT update `dist` folder.
* `gulp package` -- simply zips `dist` with correct version number.
* `scripts/test` -- run tests (Mocha). There are two scripts -- `test.cmd` for Windows, `test.sh` for Unix based systems (macOS and Linux).

Note! You also need to run one of the build tasks to e.g. test `options.html` in browser. This is because files in `scripts.babel` are not used directly.

### Notes ###
 
* **Localization** -- most strings for translation are available in `app/_locales`. Some translations are directly incorporated into `popup.html`.
* **Add-on version** -- `dist/manifest` is always +1 from `app/manifest`. This is automatic. And so in `app/manifest` minor version should always be an odd number (`dist/manifest` will have an even number then).
* **Add-on logo** -- logo icons are generated with Inkscape from SVG. This is done with `app/logo/_generate_logofiles.bat`. You might need to configure Inkscape path in `_svg2png.bat`. Obviously you would need to rewrite this if you work on Linux. 
* **Supported Firefox version** -- I currently support FF 56 (last before Quantum). If you would like to build and test on previous version of FF then you need to change `strict_min_version` in `app/manifest` and probably change `browsers` in `.babelrc`. The later is used by [babel-preset-env](https://babeljs.io/env/) to compile scripts.

