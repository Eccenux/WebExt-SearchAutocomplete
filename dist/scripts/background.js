(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Main settings.
 */

var _wikiTemplate = require('./engines/wiki-template');

var _wikiTemplate2 = _interopRequireDefault(_wikiTemplate);

var _wikiEn = require('./engines/wiki-en');

var _wikiEn2 = _interopRequireDefault(_wikiEn);

var _wikiPl = require('./engines/wiki-pl');

var _wikiPl2 = _interopRequireDefault(_wikiPl);

var _SearchHelper = require('./inc/SearchHelper.js');

var _SearchHelper2 = _interopRequireDefault(_SearchHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SETTINGS = {
	MAX_SUGGESTIONS: 6

	/**
 	Default engines.
 	
 	Syntax for defining engines is roughly compatible with `OpenSearchDescription`.
 */
};

Object.assign(_wikiEn2.default, _wikiTemplate2.default);
Object.assign(_wikiPl2.default, _wikiTemplate2.default);

browser.storage.local.get('engines').then(function (result) {
	var engines = [];
	if (!('engines' in result) || !Array.isArray(result.engines)) {
		engines = [_wikiEn2.default, _wikiPl2.default];
		browser.storage.local.set({ 'engines': engines });
	} else {
		engines = result.engines;
	}
	prepareOmnibox(engines);
});

//
// Omnibox setup
//


/**
 * Prepare omnibox for autocomplete.
 */
function prepareOmnibox(engines) {
	var searchHelper = new _SearchHelper2.default(SETTINGS, engines);

	/**
  * Default suggestion displayed after typing in `sa`.
  */
	browser.omnibox.setDefaultSuggestion({
		description: browser.i18n.getMessage('searchShortInformation')
	});

	/**
  * Reaction for newly entered phrase.
  */
	browser.omnibox.onInputChanged.addListener(function (text, addSuggestions) {
		var engineWithTerm = searchHelper.getEngine(text);
		var searchTerm = engineWithTerm.text;
		var engine = engineWithTerm.engine;
		// no keyword matched
		if (engine === null) {
			console.log('no keyword matched');
			return;
		}
		// no phrase typed in yet after the keyword
		if (!searchTerm.length) {
			console.log('no phrase typed in yet after the keyword');
			return;
		}
		var action = engine.autocompleteAction;
		var headers = new Headers({ 'Accept': action.type });
		var init = { method: action.method, headers: headers };
		var url = searchHelper.buildSearchUrl(engine, action, searchTerm);
		console.log('searchTerm:', searchTerm, 'url:', url, 'engine:', engine);
		var request = new Request(url, init);

		fetch(request).then(function (response) {
			return searchHelper.createSuggestionsFromResponse(engine, response);
		}).then(addSuggestions);
	});

	/**
  * React to choosen phrase or suggestion.
  */
	browser.omnibox.onInputEntered.addListener(function (text, disposition) {
		console.log('onInputEntered: ', text, disposition);
		// if suggestion was choosen then the text should contain a go-to URL
		var url = text;
		// suggestion was not choosen, must build URL
		if (text.search(/^https?:/) !== 0) {
			var engineWithTerm = searchHelper.getEngine(text);
			var searchTerm = engineWithTerm.text;
			var engine = engineWithTerm.engine;
			// no valid search to go to
			if (engine === null || !searchTerm.length) {
				console.log('no valid search to go to', {
					text: text,
					engine: engine,
					searchTerm: searchTerm
				});
				return;
			}
			url = searchHelper.buildSearchUrl(engine, engine.openAction, searchTerm);
		}
		// debug
		console.log('onInputEntered: ', {
			text: text,
			disposition: disposition,
			url: url
		});
		// create or update tab as expected
		switch (disposition) {
			case 'currentTab':
				browser.tabs.update({ url: url });
				break;
			case 'newForegroundTab':
				browser.tabs.create({ url: url });
				break;
			case 'newBackgroundTab':
				browser.tabs.create({ url: url, active: false });
				break;
		}
	});
}

},{"./engines/wiki-en":2,"./engines/wiki-pl":3,"./engines/wiki-template":4,"./inc/SearchHelper.js":7}],2:[function(require,module,exports){
module.exports={
	"keywords" : ["en"],
	"baseUrl" : "https://en.wikipedia.org/"
}

},{}],3:[function(require,module,exports){
module.exports={
	"keywords" : ["pl"],
	"baseUrl" : "https://pl.wikipedia.org/"
}

},{}],4:[function(require,module,exports){
module.exports={
	"openAction" : {
		"url" : "{baseUrl}",
		"method" : "GET",
		"data" : {
			"search" : "{searchTerms}",
			"sourceid": "Mozilla-search"
		}
	},
	"autocompleteAction": {
		"url" : "{baseUrl}w/api.php",
		"method" : "GET",
		"type" : "application/x-suggestions+json",
		"data" : {
			"action" : "opensearch",
			"search" : "{searchTerms}"
		}
	}
}

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _SearchEngineAction = require('./SearchEngineAction.js');

var _SearchEngineAction2 = _interopRequireDefault(_SearchEngineAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function SearchEngine(engine) {
	this.keywords = [];
	if (typeof engine.keyword === 'string') {
		this.keywords.push(engine.keyword);
	} else if (typeof engine.keywords === 'string') {
		this.keywords.push(engine.keywords);
	} else {
		this.keywords = engine.keywords;
	}
	this.baseUrl = '';
	if (typeof engine.baseUrl === 'string') {
		this.baseUrl = engine.baseUrl;
	}
	this.openAction = new _SearchEngineAction2.default(engine.openAction);
	this.autocompleteAction = new _SearchEngineAction2.default(engine.autocompleteAction);
}

exports.default = SearchEngine;

},{"./SearchEngineAction.js":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function SearchEngineAction(action) {
	this.url = '';
	if (typeof action.url === 'string') {
		this.url = action.url;
	}
	this.method = 'GET';
	if (typeof action.method === 'string') {
		this.method = action.method;
	}
	this.type = '';
	if (typeof action.type === 'string') {
		this.type = action.type;
	}
	this.data = {};
	if (_typeof(action.data) === 'object') {
		this.data = action.data;
	}
}

exports.default = SearchEngineAction;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _SearchEngine = require('./SearchEngine.js');

var _SearchEngine2 = _interopRequireDefault(_SearchEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import SearchEngineAction from './SearchEngineAction.js';

/**
 * Pre-parse all settings.
 * 
 * @TODO Maybe support engines array later? Would allow support of mulitple keywords.
 * 
 * @param {Object} SETTINGS General settings object.
 * @param {Object|Array} engines Keyword-based search engines map
 * OR an array of search engines with `keywords` property.
 */
function SearchHelper(SETTINGS, engines) {
	this.SETTINGS = SETTINGS;
	// parse engines to engine map
	if (Array.isArray(engines)) {
		this.engineMap = this.buildEngineMap(engines);
	} else {
		this.engineMap = engines;
	}
	// figure out default (unless explictly defined)
	if (_typeof(this.engineMap.default) !== 'object') {
		var firstKeyword = Object.keys(this.engineMap)[0];
		this.engineMap.default = this.engineMap[firstKeyword];
	}
}

/**
 * Builds a keyword-based search engines map.
 * @param {Array} engines An array of search engines with `keywords` property.
 */
SearchHelper.prototype.buildEngineMap = function (engines) {
	var engineMap = {};
	for (var i = 0; i < engines.length; i++) {
		var engine = new _SearchEngine2.default(engines[i]);
		var keywords = engine.keywords;
		for (var k = 0; k < keywords.length; k++) {
			var key = keywords[k];
			engineMap[key] = engine;
		}
	}
	return engineMap;
};

/**
 * Build search URL for the text.
 * 
 * @param {SearchEngine} engine Engine to use.
 * @param {SearchEngineAction} action Action to call on the engine.
 * @param {String} text Search term.
 */
SearchHelper.prototype.buildSearchUrl = function (engine, action, text) {
	var url = action.url.replace('{baseUrl}', engine.baseUrl);
	var first = true;
	for (var key in action.data) {
		var value = action.data[key].replace('{searchTerms}', text);
		url += first ? '?' : '&';
		url += key + '=' + encodeURIComponent(value);
		first = false;
	}
	return url;
};

/**
 * @typedef {Object} EngineWithTerm
 * @property {SearchEngine} engine Engine to use.
 * @property {String} text Transformed search term.
 */

/**
 * Find out which engine should be used based on entered text.
 * 
 * `sa  something` uses default (first) engine
 * `sa ` should show you a list of engines (in future)
 * `sa a` should show you a list of engines with keywords starting with `a`
 * 
 * @param {String} text Search term.
 * @return {EngineWithTerm} Engine with term stripped from the engine keyowrd.
 */
SearchHelper.prototype.getEngine = function (text) {
	var keyword = null;
	var me = this;
	text.replace(/^(\S*)\s+(.*)$/, function (a, word, rest) {
		if (!word.length) {
			keyword = 'default';
			text = rest;
		} else if (word in me.engineMap) {
			keyword = word;
			text = rest;
		}
	});
	var engine = void 0;
	if (keyword === null) {
		engine = null;
	} else {
		engine = this.engineMap[keyword];
	}
	return {
		engine: engine,
		text: text
	};
};

/**
 * Create suggestions array from response.
 * 
 * @param {SearchEngine} engine Engine used.
 * @param {Object} response The search engine response.
 */
SearchHelper.prototype.createSuggestionsFromResponse = function (engine, response) {
	var _this = this;

	return new Promise(function (resolve) {
		var suggestions = [];
		var suggestionsOnEmptyResults = [{
			content: engine.baseUrl,
			description: 'No results found'
		}];
		response.json().then(function (json) {
			console.log('response:', json);
			if (!json.length) {
				return resolve(suggestionsOnEmptyResults);
			}

			var max = _this.SETTINGS.MAX_SUGGESTIONS;

			// for Wikipedia:
			// json[0] = search term
			// json[1] = [...titles...]
			// json[2] = [...descriptions...]
			// json[3] = [...direct urls...]
			var titles = json[1];
			var descriptions = json[2];
			var urls = json[3];

			if (titles.length < 1) {
				return resolve(suggestionsOnEmptyResults);
			}

			var count = Math.min(titles.length, max);
			for (var i = 0; i < count; i++) {
				// gather data
				var title = titles[i];
				var description = title;
				if (descriptions && typeof descriptions[i] === 'string') {
					description += ' -- ' + descriptions[i];
				}
				var url = '';
				if (urls && typeof urls[i] === 'string') {
					url = urls[i];
				} else {
					url = buildSearchUrl(engine, engine.openAction, title);
				}
				// add suggestion
				suggestions.push({
					content: url,
					description: description
				});
			}
			return resolve(suggestions);
		});
	});
};

exports.default = SearchHelper;

},{"./SearchEngine.js":5}]},{},[1])

