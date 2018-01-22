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

const SETTINGS = {
	MAX_SUGGESTIONS: 6

	/**
 	Default engines.
 	
 	Syntax for defining engines is roughly compatible with `OpenSearchDescription`.
 */
};

Object.assign(_wikiEn2.default, _wikiTemplate2.default);
Object.assign(_wikiPl2.default, _wikiTemplate2.default);

//
// Initialize settings from storage (or defaults)
//
browser.storage.local.get('engines').then(function (result) {
	let engines = [];
	if (!('engines' in result) || !Array.isArray(result.engines)) {
		engines = [_wikiEn2.default, _wikiPl2.default];
		browser.storage.local.set({ 'engines': engines });
	} else {
		engines = result.engines;
	}
	browser.storage.local.get('credentials').then(function (result) {
		let credentials = [];
		if ('credentials' in result && Array.isArray(result.credentials)) {
			credentials = result.credentials;
		}
		prepareOmnibox(engines, credentials);
	});
});

//
// Omnibox setup
//


/**
 * Prepare omnibox for autocomplete.
 */
function prepareOmnibox(engines, credentials) {
	let searchHelper = new _SearchHelper2.default(SETTINGS, engines, credentials);

	//
	// Reload settings when storage changes
	//
	browser.storage.onChanged.addListener(function (values, storageType) {
		console.log('storage.onChanged:', storageType, Object.keys(values));
		if (storageType === 'local' && 'engines' in values) {
			let engines = values.engines.newValue;
			searchHelper.updateEngines(engines);
		}
		if (storageType === 'local' && 'credentials' in values) {
			let credentials = values.credentials.newValue;
			searchHelper.updateCredentials(credentials);
		}
	});

	/**
  * Default suggestion displayed after typing in `sa`.
  */
	browser.omnibox.setDefaultSuggestion({
		description: browser.i18n.getMessage('searchShortInformation')
	});

	/**
  * Reaction for newly entered phrase.
  */
	browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
		let engineWithTerm = searchHelper.getEngine(text);
		let searchTerm = engineWithTerm.text;
		let engine = engineWithTerm.engine;
		let credentials = engineWithTerm.credentials;
		// no keyword matched yet - running search engines autocomplete
		if (engine === null) {
			console.log('no keyword matched');
			addSuggestions(searchHelper.createEnginesSuggestions(searchTerm));
			return;
		}
		// no phrase typed in yet after the keyword
		if (!searchTerm.length) {
			console.log('no phrase typed in yet after the keyword');
			return;
		}
		let action = engine.autocompleteAction;
		let headers = new Headers({
			'Accept': action.type
		});
		if (credentials) {
			console.log(`adding credentials: ${credentials.codename} (${credentials.username})`);
			headers.append('Authorization', 'Basic ' + btoa(credentials.username + ':' + credentials.password));
		}
		let init = {
			method: action.method,
			headers: headers
		};
		let url = searchHelper.buildSearchUrl(engine, action, searchTerm);
		console.log('searchTerm:', searchTerm, 'url:', url, 'engine:', engine);
		let request = new Request(url, init);

		fetch(request).then(function (response) {
			if (response.status === 200) {
				return searchHelper.createSuggestionsFromResponse(engine, response);
			} else {
				console.error(`Failed with code ${response.status}: ${response.body}`);
			}
		}).then(addSuggestions);
	});

	/**
  * React to choosen phrase or suggestion.
  */
	browser.omnibox.onInputEntered.addListener((text, disposition) => {
		console.log('onInputEntered: ', text, disposition);
		// if suggestion was choosen then the text should contain a go-to URL
		let url = text;
		// suggestion was not choosen, must build URL
		if (text.search(/^https?:/) !== 0) {
			let engineWithTerm = searchHelper.getEngine(text);
			let searchTerm = engineWithTerm.text;
			let engine = engineWithTerm.engine;
			// no valid search to go to
			if (engine === null) {
				// open options for `sa ` and `sa options`
				if (!searchTerm.length || searchTerm === 'options') {
					openOptions();
				} else {
					console.log('no valid search to go to', {
						text: text,
						engine: engine,
						searchTerm: searchTerm
					});
				}
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
				browser.tabs.update({ url });
				break;
			case 'newForegroundTab':
				browser.tabs.create({ url });
				break;
			case 'newBackgroundTab':
				browser.tabs.create({ url, active: false });
				break;
		}
	});
}

/**
 * Open options for this add-on.
 */
function openOptions() {
	function onOpened() {
		console.log('Options page opened');
	}

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	var opening = browser.runtime.openOptionsPage();
	opening.then(onOpened, onError);
}

},{"./engines/wiki-en":2,"./engines/wiki-pl":3,"./engines/wiki-template":4,"./inc/SearchHelper.js":9}],2:[function(require,module,exports){
module.exports={
	"title" : "English Wikipedia",
	"keywords" : ["en"],
	"baseUrl" : "https://en.wikipedia.org/"
}

},{}],3:[function(require,module,exports){
module.exports={
	"title" : "Polska Wikipedia",
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
/**
 * Get I18n string.
 * 
 * Also a mock for in-browser testing.
 * @sa https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/getMessage
 */
let getI18n = typeof browser != 'undefined' ? browser.i18n.getMessage : function (messageName) {
  return messageName.replace(/_/g, ' ').replace(/^.+\./, '');
};

exports.getI18n = getI18n;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
function SearchCredential(credential) {
	this.codename = '';
	this.username = '';
	this.password = '';
	// set fields
	if (typeof credential === 'object') {
		const fields = ['codename', 'username', 'password'];
		for (let index = 0; index < fields.length; index++) {
			const key = fields[index];
			if (typeof credential[key] === 'string') {
				this[key] = credential[key];
			}
		}
	}
}

exports.default = SearchCredential;

},{}],7:[function(require,module,exports){
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
		if (engine.keywords.search(',')) {
			let keywords = engine.keywords.replace(/\s+/g, '');
			this.keywords = keywords.split(',');
		} else {
			this.keywords.push(engine.keywords);
		}
	} else {
		this.keywords = [].concat(engine.keywords);
	}

	this.baseUrl = '';
	if (typeof engine.baseUrl === 'string') {
		this.baseUrl = engine.baseUrl;
	}

	this.title = '';
	if (typeof engine.title === 'string') {
		this.title = engine.title;
	} else {
		this.title = engine.baseUrl;
	}

	this.credential = '';
	if (typeof engine.credential === 'string') {
		this.credential = engine.credential;
	}

	this.openAction = new _SearchEngineAction2.default(engine.openAction || {});
	this.autocompleteAction = new _SearchEngineAction2.default(engine.autocompleteAction || {});
}

exports.default = SearchEngine;

},{"./SearchEngineAction.js":8}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
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
	if (typeof action.data === 'object') {
		this.data = action.data;
	}
}

exports.default = SearchEngineAction;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _SearchEngine = require('./SearchEngine.js');

var _SearchEngine2 = _interopRequireDefault(_SearchEngine);

var _SearchCredential = require('./SearchCredential.js');

var _SearchCredential2 = _interopRequireDefault(_SearchCredential);

var _I18nHelper = require('./I18nHelper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import SearchEngineAction from './SearchEngineAction.js';

/**
 * Pre-parse all settings.
 * 
 * @TODO Maybe support engines array later? Would allow support of mulitple keywords.
 * 
 * @param {Object} SETTINGS General settings object.
 * @param {Object|Array} engines Keyword-based search engines map.
 * @param {Array} credentials Array of credentials for autocomplete.
 * OR an array of search engines with `keywords` property.
 */
function SearchHelper(SETTINGS, engines, credentials) {
	this.SETTINGS = SETTINGS;
	this.updateEngines(engines);
	this.updateCredentials(credentials);
}

/**
 * (Re)parse engine settings.
 * 
 * @param {Object|Array} engines Keyword-based search engines map
 */
SearchHelper.prototype.updateEngines = function (engines) {
	// parse engines to engine map
	if (Array.isArray(engines)) {
		this.engineMap = this.buildEngineMap(engines);
	} else {
		// must rebuild to have `SearchEngine` objects in the `engineMap`.
		this.engineMap = {};
		for (const key in engines) {
			if (engines.hasOwnProperty(key)) {
				this.engineMap[key] = new _SearchEngine2.default(engines[key]);
			}
		}
	}
	// figure out default (unless explictly defined)
	if (typeof this.engineMap.default !== 'object') {
		var firstKeyword = Object.keys(this.engineMap)[0];
		this.engineMap.default = this.engineMap[firstKeyword];
	}
};

/**
 * Builds a keyword-based search engines map.
 * @param {Array} engines An array of search engines with `keywords` property.
 */
SearchHelper.prototype.buildEngineMap = function (engines) {
	let engineMap = {};
	for (let i = 0; i < engines.length; i++) {
		var engine = new _SearchEngine2.default(engines[i]);
		var keywords = engine.keywords;
		for (let k = 0; k < keywords.length; k++) {
			var key = keywords[k];
			engineMap[key] = engine;
		}
	}
	return engineMap;
};

/**
 * (Re)parse credential settings.
 * 
 * @param {Object|Array} credentials Keyword-based search credentials map
 */
SearchHelper.prototype.updateCredentials = function (credentials) {
	// parse credentials to credential map
	if (Array.isArray(credentials)) {
		this.credentialMap = this.buildCredentialMap(credentials);
	}
};

/**
 * Builds a keyword-based search credentials map.
 * @param {Array} credentials An array of search credentials with `codename` property.
 */
SearchHelper.prototype.buildCredentialMap = function (credentials) {
	let credentialMap = {};
	for (let i = 0; i < credentials.length; i++) {
		var credential = new _SearchCredential2.default(credentials[i]);
		var key = credential.codename;
		credentialMap[key] = credential;
	}
	return credentialMap;
};

/**
 * Build search URL for the text.
 * 
 * @param {SearchEngine} engine Engine to use.
 * @param {SearchEngineAction} action Action to call on the engine.
 * @param {String} text Search term.
 */
SearchHelper.prototype.buildSearchUrl = function (engine, action, text) {
	let url = action.url.replace('{baseUrl}', engine.baseUrl);
	let first = true;
	for (let key in action.data) {
		let value = action.data[key].replace('{searchTerms}', text);
		url += first ? '?' : '&';
		url += `${key}=` + encodeURIComponent(value);
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
	let keyword = null;
	let me = this;
	text.replace(/^(\S*)\s+(.*)$/, function (a, word, rest) {
		if (!word.length) {
			keyword = 'default';
			text = rest;
		} else if (word in me.engineMap) {
			keyword = word;
			text = rest;
		}
	});
	let engine, credentials;
	if (keyword === null) {
		engine = null;
	} else {
		engine = this.engineMap[keyword];
		credentials = null;
		if (engine.credential.length) {
			if (engine.credential in this.credentialMap) {
				credentials = this.credentialMap[engine.credential];
			}
		}
	}
	return {
		engine: engine,
		credentials: credentials,
		text: text
	};
};

/**
 * Get engines matching the term.
 * 
 * @param {String} text Search term.
 */
SearchHelper.prototype.getEngines = function (text) {
	// list all engines by default
	if (typeof text !== 'string' || !text.length || text === '*') {
		let engines = [];
		for (const key in this.engineMap) {
			if (key !== 'default') {
				const engine = this.engineMap[key];
				engines.push(engine);
			}
		}
		return engines;
	}
	let engines = [];
	for (const key in this.engineMap) {
		if (key.startsWith(text)) {
			const engine = this.engineMap[key];
			engines.push(engine);
		}
	}
	return engines;
};

/**
 * Create engines suggestions array.
 * 
 * @param {String} text Search term.
 */
SearchHelper.prototype.createEnginesSuggestions = function (text) {
	let me = this;
	let suggestions = [];
	let suggestionsOnEmptyResults = [{
		content: '',
		description: (0, _I18nHelper.getI18n)('searchHelper.No_Results_Found')
	}];

	let engines = me.getEngines(text);
	console.log('engines:', engines);
	if (engines.length < 1) {
		return suggestionsOnEmptyResults;
	}

	let max = me.SETTINGS.MAX_SUGGESTIONS;
	let count = Math.min(engines.length, max);
	for (let i = 0; i < count; i++) {
		let engine = engines[i];
		// gather data
		let description = engine.title;
		let url = engine.keywords[0];
		// add suggestion
		suggestions.push({
			content: url,
			description: description
		});
	}
	console.log('suggestions:', suggestions);
	return suggestions;
};

/**
 * Create suggestions array from response.
 * 
 * @param {SearchEngine} engine Engine used.
 * @param {Object} response The search engine response.
 */
SearchHelper.prototype.createSuggestionsFromResponse = function (engine, response) {
	let me = this;
	return new Promise(resolve => {
		let suggestions = [];
		let suggestionsOnEmptyResults = [{
			content: engine.baseUrl,
			description: (0, _I18nHelper.getI18n)('searchHelper.No_Results_Found')
		}];
		response.json().then(json => {
			console.log('response:', json);
			if (!json.length) {
				return resolve(suggestionsOnEmptyResults);
			}

			let max = me.SETTINGS.MAX_SUGGESTIONS;

			// for Wikipedia:
			// json[0] = search term
			// json[1] = [...titles...]
			// json[2] = [...descriptions...]
			// json[3] = [...direct urls...]
			let titles = json[1];
			let descriptions = json[2];
			let urls = json[3];

			if (titles.length < 1) {
				return resolve(suggestionsOnEmptyResults);
			}

			let count = Math.min(titles.length, max);
			for (let i = 0; i < count; i++) {
				// gather data
				let title = titles[i];
				let description = title;
				if (descriptions && typeof descriptions[i] === 'string') {
					description += ` -- ${descriptions[i]}`;
				}
				let url = '';
				if (urls && typeof urls[i] === 'string') {
					url = urls[i];
				} else {
					url = me.buildSearchUrl(engine, engine.openAction, title);
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

},{"./I18nHelper":5,"./SearchCredential.js":6,"./SearchEngine.js":7}]},{},[1])

