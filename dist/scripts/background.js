(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Main settings.
 */

var _SearchHelper = require('./inc/SearchHelper.js');

var _SearchHelper2 = _interopRequireDefault(_SearchHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SETTINGS = {
	MAX_SUGGESTIONS: 6

	/**
 	Example engine.
 	
 	Roughly compatible with `OpenSearchDescription`.
 */
};var enWikiEngine = {
	keywords: ['en'],
	baseUrl: 'https://en.wikipedia.org/',
	openAction: {
		url: '{baseUrl}',
		method: 'GET',
		data: {
			search: '{searchTerms}',
			sourceid: 'Mozilla-search'
		}
	},
	autocompleteAction: {
		url: '{baseUrl}w/api.php',
		method: 'GET',
		type: 'application/x-suggestions+json',
		data: {
			action: 'opensearch',
			search: '{searchTerms}'
		}
	}

	//
	// Omnibox setup
	//
};
var searchHelper = new _SearchHelper2.default(SETTINGS, {
	'en': enWikiEngine
});

/**
 * Default suggestion displayed after typing in `sa`.
 */
browser.omnibox.setDefaultSuggestion({
	//description: 'Type in your search engine keyword and then your search terms.'
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

},{"./inc/SearchHelper.js":4}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.SearchEngine = SearchEngine;

var _SearchEngineAction = require('./SearchEngineAction.js');

var _SearchEngineAction2 = _interopRequireDefault(_SearchEngineAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function SearchEngine(engine) {
	this.keywords = [];
	if (typeof engine.keywords === 'string') {
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

},{"./SearchEngineAction.js":3}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.SearchEngineAction = SearchEngineAction;
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

},{}],4:[function(require,module,exports){
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
 * @param {Object} engineMap Keyword-based search engines map.
 */
function SearchHelper(SETTINGS, engineMap) {
	this.SETTINGS = SETTINGS;
	this.engineMap = engineMap;
	if (_typeof(engineMap.default) !== 'object') {
		var firstKeyword = Object.keys(engineMap)[0];
		this.engineMap.default = this.engineMap[firstKeyword];
	}
}

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

},{"./SearchEngine.js":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L19Ud29yY3pvc2MvV2ViRXh0ZW5zaW9ucy9GRkV4dC9TZWFyY2hBdXRvY29tcGxldGUvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFwcFxcc2NyaXB0cy5iYWJlbFxcYmFja2dyb3VuZC5qcyIsImQ6XFxfVHdvcmN6b3NjXFxXZWJFeHRlbnNpb25zXFxGRkV4dFxcU2VhcmNoQXV0b2NvbXBsZXRlXFxhcHBcXHNjcmlwdHMuYmFiZWxcXGluY1xcU2VhcmNoRW5naW5lLmpzIiwiZDpcXF9Ud29yY3pvc2NcXFdlYkV4dGVuc2lvbnNcXEZGRXh0XFxTZWFyY2hBdXRvY29tcGxldGVcXGFwcFxcc2NyaXB0cy5iYWJlbFxcaW5jXFxTZWFyY2hFbmdpbmVBY3Rpb24uanMiLCJkOlxcX1R3b3Jjem9zY1xcV2ViRXh0ZW5zaW9uc1xcRkZFeHRcXFNlYXJjaEF1dG9jb21wbGV0ZVxcYXBwXFxzY3JpcHRzLmJhYmVsXFxpbmNcXFNlYXJjaEhlbHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQUVBOzs7O0FBcUNBOzs7Ozs7QUFsQ0EsSUFBTSxXQUFXO0FBQ2hCLGtCQUFrQjs7QUFHbkI7Ozs7O0FBSmlCLENBQWpCLENBU0EsSUFBTSxlQUFlO0FBQ3BCLFdBQVcsQ0FBQyxJQUFELENBRFM7QUFFcEIsVUFBVSwyQkFGVTtBQUdwQixhQUFZO0FBQ1gsT0FBTSxXQURLO0FBRVgsVUFBUyxLQUZFO0FBR1gsUUFBTztBQUNOLFdBQVMsZUFESDtBQUVOLGFBQVU7QUFGSjtBQUhJLEVBSFE7QUFXcEIscUJBQW9CO0FBQ25CLE9BQU0sb0JBRGE7QUFFbkIsVUFBUyxLQUZVO0FBR25CLFFBQU8sZ0NBSFk7QUFJbkIsUUFBTztBQUNOLFdBQVMsWUFESDtBQUVOLFdBQVM7QUFGSDtBQUpZOztBQVdyQjtBQUNBO0FBQ0E7QUF4QnFCLENBQXJCO0FBMEJBLElBQUksZUFBZSwyQkFBaUIsUUFBakIsRUFBMkI7QUFDN0MsT0FB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Q0FBUDtBQUNBOztBQUVELE9BQUksUUFBUSxLQUFLLEdBQUwsQ0FBUyxPQUFPLE1BQWhCLEVBQXdCLEdBQXhCLENBQVo7QUFDQSxRQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBcEIsRUFBMkIsR0FBM0IsRUFBZ0M7QUFDL0I7QUFDQSxRQUFJLFFBQVEsT0FBTyxDQUFQLENBQVo7QUFDQSxRQUFJLGNBQWMsS0FBbEI7QUFDQSxRQUFJLGdCQUFnQixPQUFPLGFBQWEsQ0FBYixDQUFQLEtBQTJCLFFBQS9DLEVBQXlEO0FBQ3hELDZCQUFzQixhQUFhLENBQWIsQ0FBdEI7QUFDQTtBQUNELFFBQUksTUFBTSxFQUFWO0FBQ0EsUUFBSSxRQUFRLE9BQU8sS0FBSyxDQUFMLENBQVAsS0FBbUIsUUFBL0IsRUFBeUM7QUFDeEMsV0FBTSxLQUFLLENBQUwsQ0FBTjtBQUNBLEtBRkQsTUFFTztBQUNOLFdBQU0sZUFBZSxNQUFmLEVBQXVCLE9BQU8sVUFBOUIsRUFBMEMsS0FBMUMsQ0FBTjtBQUNBO0FBQ0Q7QUFDQSxnQkFBWSxJQUFaLENBQWlCO0FBQ2hCLGNBQVMsR0FETztBQUVoQixrQkFBYTtBQUZHLEtBQWpCO0FBSUE7QUFDRCxVQUFPLFFBQVEsV0FBUixDQUFQO0FBQ0EsR0ExQ0Q7QUEyQ0EsRUFqRE0sQ0FBUDtBQWtEQSxDQW5ERDs7a0JBcURlLFkiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1haW4gc2V0dGluZ3MuXG4gKi9cbmNvbnN0IFNFVFRJTkdTID0ge1xuXHRNQVhfU1VHR0VTVElPTlMgOiA2XG59XG5cbi8qKlxuXHRFeGFtcGxlIGVuZ2luZS5cblx0XG5cdFJvdWdobHkgY29tcGF0aWJsZSB3aXRoIGBPcGVuU2VhcmNoRGVzY3JpcHRpb25gLlxuKi9cbmNvbnN0IGVuV2lraUVuZ2luZSA9IHtcblx0a2V5d29yZHMgOiBbJ2VuJ10sXG5cdGJhc2VVcmwgOiAnaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnLycsXG5cdG9wZW5BY3Rpb246IHtcblx0XHR1cmwgOiAne2Jhc2VVcmx9Jyxcblx0XHRtZXRob2QgOiAnR0VUJyxcblx0XHRkYXRhIDoge1xuXHRcdFx0c2VhcmNoIDogJ3tzZWFyY2hUZXJtc30nLFxuXHRcdFx0c291cmNlaWQ6ICdNb3ppbGxhLXNlYXJjaCdcblx0XHR9XG5cdH0sXG5cdGF1dG9jb21wbGV0ZUFjdGlvbjoge1xuXHRcdHVybCA6ICd7YmFzZVVybH13L2FwaS5waHAnLFxuXHRcdG1ldGhvZCA6ICdHRVQnLFxuXHRcdHR5cGUgOiAnYXBwbGljYXRpb24veC1zdWdnZXN0aW9ucytqc29uJyxcblx0XHRkYXRhIDoge1xuXHRcdFx0YWN0aW9uIDogJ29wZW5zZWFyY2gnLFxuXHRcdFx0c2VhcmNoIDogJ3tzZWFyY2hUZXJtc30nXG5cdFx0fVxuXHR9XG59XG5cbi8vXG4vLyBPbW5pYm94IHNldHVwXG4vL1xuaW1wb3J0IFNlYXJjaEhlbHBlciBmcm9tICcuL2luYy9TZWFyY2hIZWxwZXIuanMnO1xubGV0IHNlYXJjaEhlbHBlciA9IG5ldyBTZWFyY2hIZWxwZXIoU0VUVElOR1MsIHtcblx0J2VuJyA6IGVuV2lraUVuZ2luZVxufSk7XG5cbi8qKlxuICogRGVmYXVsdCBzdWdnZXN0aW9uIGRpc3BsYXllZCBhZnRlciB0eXBpbmcgaW4gYHNhYC5cbiAqL1xuYnJvd3Nlci5vbW5pYm94LnNldERlZmF1bHRTdWdnZXN0aW9uKHtcblx0Ly9kZXNjcmlwdGlvbjogJ1R5cGUgaW4geW91ciBzZWFyY2ggZW5naW5lIGtleXdvcmQgYW5kIHRoZW4geW91ciBzZWFyY2ggdGVybXMuJ1xuXHRkZXNjcmlwdGlvbjogYnJvd3Nlci5pMThuLmdldE1lc3NhZ2UoJ3NlYXJjaFNob3J0SW5mb3JtYXRpb24nKVxufSk7XG5cbi8qKlxuICogUmVhY3Rpb24gZm9yIG5ld2x5IGVudGVyZWQgcGhyYXNlLlxuICovXG5icm93c2VyLm9tbmlib3gub25JbnB1dENoYW5nZWQuYWRkTGlzdGVuZXIoKHRleHQsIGFkZFN1Z2dlc3Rpb25zKSA9PiB7XG5cdGxldCBlbmdpbmVXaXRoVGVybSA9IHNlYXJjaEhlbHBlci5nZXRFbmdpbmUodGV4dCk7XG5cdGxldCBzZWFyY2hUZXJtID0gZW5naW5lV2l0aFRlcm0udGV4dDtcblx0bGV0IGVuZ2luZSA9IGVuZ2luZVdpdGhUZXJtLmVuZ2luZTtcblx0Ly8gbm8ga2V5d29yZCBtYXRjaGVkXG5cdGlmIChlbmdpbmUgPT09IG51bGwpIHtcblx0XHRjb25zb2xlLmxvZygnbm8ga2V5d29yZCBtYXRjaGVkJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdC8vIG5vIHBocmFzZSB0eXBlZCBpbiB5ZXQgYWZ0ZXIgdGhlIGtleXdvcmRcblx0aWYgKCFzZWFyY2hUZXJtLmxlbmd0aCkge1xuXHRcdGNvbnNvbGUubG9nKCdubyBwaHJhc2UgdHlwZWQgaW4geWV0IGFmdGVyIHRoZSBrZXl3b3JkJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxldCBhY3Rpb24gPSBlbmdpbmUuYXV0b2NvbXBsZXRlQWN0aW9uO1xuXHRsZXQgaGVhZGVycyA9IG5ldyBIZWFkZXJzKHsnQWNjZXB0JzogYWN0aW9uLnR5cGV9KTtcblx0bGV0IGluaXQgPSB7bWV0aG9kOiBhY3Rpb24ubWV0aG9kLCBoZWFkZXJzfTtcblx0bGV0IHVybCA9IHNlYXJjaEhlbHBlci5idWlsZFNlYXJjaFVybChlbmdpbmUsIGFjdGlvbiwgc2VhcmNoVGVybSk7XG5cdGNvbnNvbGUubG9nKFxuXHRcdCdzZWFyY2hUZXJtOicsIHNlYXJjaFRlcm0sXG5cdFx0J3VybDonLCB1cmwsXG5cdFx0J2VuZ2luZTonLCBlbmdpbmVcblx0KTtcblx0bGV0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdCh1cmwsIGluaXQpO1xuXHRcblx0ZmV0Y2gocmVxdWVzdClcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2Upe1xuXHRcdFx0cmV0dXJuIHNlYXJjaEhlbHBlci5jcmVhdGVTdWdnZXN0aW9uc0Zyb21SZXNwb25zZShlbmdpbmUsIHJlc3BvbnNlKTtcblx0XHR9KVxuXHRcdC50aGVuKGFkZFN1Z2dlc3Rpb25zKVxuXHQ7XG59KTtcblxuLyoqXG4gKiBSZWFjdCB0byBjaG9vc2VuIHBocmFzZSBvciBzdWdnZXN0aW9uLlxuICovXG5icm93c2VyLm9tbmlib3gub25JbnB1dEVudGVyZWQuYWRkTGlzdGVuZXIoKHRleHQsIGRpc3Bvc2l0aW9uKSA9PiB7XG5cdGNvbnNvbGUubG9nKCdvbklucHV0RW50ZXJlZDogJywgdGV4dCwgZGlzcG9zaXRpb24pO1xuXHQvLyBpZiBzdWdnZXN0aW9uIHdhcyBjaG9vc2VuIHRoZW4gdGhlIHRleHQgc2hvdWxkIGNvbnRhaW4gYSBnby10byBVUkxcblx0bGV0IHVybCA9IHRleHQ7XG5cdC8vIHN1Z2dlc3Rpb24gd2FzIG5vdCBjaG9vc2VuLCBtdXN0IGJ1aWxkIFVSTFxuXHRpZiAodGV4dC5zZWFyY2goL15odHRwcz86LykgIT09IDApIHtcblx0XHRsZXQgZW5naW5lV2l0aFRlcm0gPSBzZWFyY2hIZWxwZXIuZ2V0RW5naW5lKHRleHQpO1xuXHRcdGxldCBzZWFyY2hUZXJtID0gZW5naW5lV2l0aFRlcm0udGV4dDtcblx0XHRsZXQgZW5naW5lID0gZW5naW5lV2l0aFRlcm0uZW5naW5lO1xuXHRcdC8vIG5vIHZhbGlkIHNlYXJjaCB0byBnbyB0b1xuXHRcdGlmIChlbmdpbmUgPT09IG51bGwgfHwgIXNlYXJjaFRlcm0ubGVuZ3RoKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnbm8gdmFsaWQgc2VhcmNoIHRvIGdvIHRvJywge1xuXHRcdFx0XHR0ZXh0OiB0ZXh0LFxuXHRcdFx0XHRlbmdpbmU6IGVuZ2luZSxcblx0XHRcdFx0c2VhcmNoVGVybTogc2VhcmNoVGVybVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHVybCA9IHNlYXJjaEhlbHBlci5idWlsZFNlYXJjaFVybChlbmdpbmUsIGVuZ2luZS5vcGVuQWN0aW9uLCBzZWFyY2hUZXJtKTtcblx0fVxuXHQvLyBkZWJ1Z1xuXHRjb25zb2xlLmxvZygnb25JbnB1dEVudGVyZWQ6ICcsIHtcblx0XHR0ZXh0OiB0ZXh0LCBcblx0XHRkaXNwb3NpdGlvbjogZGlzcG9zaXRpb24sIFxuXHRcdHVybDogdXJsXG5cdH0pO1xuXHQvLyBjcmVhdGUgb3IgdXBkYXRlIHRhYiBhcyBleHBlY3RlZFxuXHRzd2l0Y2ggKGRpc3Bvc2l0aW9uKSB7XG5cdFx0Y2FzZSAnY3VycmVudFRhYic6XG5cdFx0XHRicm93c2VyLnRhYnMudXBkYXRlKHt1cmx9KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ25ld0ZvcmVncm91bmRUYWInOlxuXHRcdFx0YnJvd3Nlci50YWJzLmNyZWF0ZSh7dXJsfSk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICduZXdCYWNrZ3JvdW5kVGFiJzpcblx0XHRcdGJyb3dzZXIudGFicy5jcmVhdGUoe3VybCwgYWN0aXZlOiBmYWxzZX0pO1xuXHRcdFx0YnJlYWs7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IFNlYXJjaEVuZ2luZUFjdGlvbiBmcm9tICcuL1NlYXJjaEVuZ2luZUFjdGlvbi5qcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gU2VhcmNoRW5naW5lKGVuZ2luZSkge1xyXG5cdHRoaXMua2V5d29yZHMgPSBbXTtcclxuXHRpZiAodHlwZW9mIGVuZ2luZS5rZXl3b3JkcyA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMua2V5d29yZHMucHVzaChlbmdpbmUua2V5d29yZHMpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHR0aGlzLmtleXdvcmRzID0gZW5naW5lLmtleXdvcmRzO1xyXG5cdH1cclxuXHR0aGlzLmJhc2VVcmwgPSAnJztcclxuXHRpZiAodHlwZW9mIGVuZ2luZS5iYXNlVXJsID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy5iYXNlVXJsID0gZW5naW5lLmJhc2VVcmw7XHJcblx0fVxyXG5cdHRoaXMub3BlbkFjdGlvbiA9IG5ldyBTZWFyY2hFbmdpbmVBY3Rpb24oZW5naW5lLm9wZW5BY3Rpb24pO1xyXG5cdHRoaXMuYXV0b2NvbXBsZXRlQWN0aW9uID0gbmV3IFNlYXJjaEVuZ2luZUFjdGlvbihlbmdpbmUuYXV0b2NvbXBsZXRlQWN0aW9uKTtcclxufVxyXG4iLCJleHBvcnQgZnVuY3Rpb24gU2VhcmNoRW5naW5lQWN0aW9uKGFjdGlvbikge1xyXG5cdHRoaXMudXJsID0gJyc7XHJcblx0aWYgKHR5cGVvZiBhY3Rpb24udXJsID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy51cmwgPSBhY3Rpb24udXJsO1xyXG5cdH1cclxuXHR0aGlzLm1ldGhvZCA9ICdHRVQnO1xyXG5cdGlmICh0eXBlb2YgYWN0aW9uLm1ldGhvZCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMubWV0aG9kID0gYWN0aW9uLm1ldGhvZDtcclxuXHR9XHJcblx0dGhpcy50eXBlID0gJyc7XHJcblx0aWYgKHR5cGVvZiBhY3Rpb24udHlwZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMudHlwZSA9IGFjdGlvbi50eXBlO1xyXG5cdH1cclxuXHR0aGlzLmRhdGEgPSB7fTtcclxuXHRpZiAodHlwZW9mIGFjdGlvbi5kYXRhID09PSAnb2JqZWN0Jykge1xyXG5cdFx0dGhpcy5kYXRhID0gYWN0aW9uLmRhdGE7XHJcblx0fVxyXG59IiwiaW1wb3J0IFNlYXJjaEVuZ2luZSBmcm9tICcuL1NlYXJjaEVuZ2luZS5qcyc7XHJcbi8vaW1wb3J0IFNlYXJjaEVuZ2luZUFjdGlvbiBmcm9tICcuL1NlYXJjaEVuZ2luZUFjdGlvbi5qcyc7XHJcblxyXG4vKipcclxuICogUHJlLXBhcnNlIGFsbCBzZXR0aW5ncy5cclxuICogXHJcbiAqIEBUT0RPIE1heWJlIHN1cHBvcnQgZW5naW5lcyBhcnJheSBsYXRlcj8gV291bGQgYWxsb3cgc3VwcG9ydCBvZiBtdWxpdHBsZSBrZXl3b3Jkcy5cclxuICogXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBTRVRUSU5HUyBHZW5lcmFsIHNldHRpbmdzIG9iamVjdC5cclxuICogQHBhcmFtIHtPYmplY3R9IGVuZ2luZU1hcCBLZXl3b3JkLWJhc2VkIHNlYXJjaCBlbmdpbmVzIG1hcC5cclxuICovXHJcbmZ1bmN0aW9uIFNlYXJjaEhlbHBlciAoU0VUVElOR1MsIGVuZ2luZU1hcCkge1xyXG5cdHRoaXMuU0VUVElOR1MgPSBTRVRUSU5HUztcclxuXHR0aGlzLmVuZ2luZU1hcCA9IGVuZ2luZU1hcDtcclxuXHRpZiAodHlwZW9mIGVuZ2luZU1hcC5kZWZhdWx0ICE9PSAnb2JqZWN0Jykge1xyXG5cdFx0dmFyIGZpcnN0S2V5d29yZCA9IE9iamVjdC5rZXlzKGVuZ2luZU1hcClbMF07XHJcblx0XHR0aGlzLmVuZ2luZU1hcC5kZWZhdWx0ID0gdGhpcy5lbmdpbmVNYXBbZmlyc3RLZXl3b3JkXTtcclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBCdWlsZCBzZWFyY2ggVVJMIGZvciB0aGUgdGV4dC5cclxuICogXHJcbiAqIEBwYXJhbSB7U2VhcmNoRW5naW5lfSBlbmdpbmUgRW5naW5lIHRvIHVzZS5cclxuICogQHBhcmFtIHtTZWFyY2hFbmdpbmVBY3Rpb259IGFjdGlvbiBBY3Rpb24gdG8gY2FsbCBvbiB0aGUgZW5naW5lLlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBTZWFyY2ggdGVybS5cclxuICovXHJcblNlYXJjaEhlbHBlci5wcm90b3R5cGUuYnVpbGRTZWFyY2hVcmwgPSBmdW5jdGlvbiAoZW5naW5lLCBhY3Rpb24sIHRleHQpIHtcclxuXHRsZXQgdXJsID0gYWN0aW9uLnVybC5yZXBsYWNlKCd7YmFzZVVybH0nLCBlbmdpbmUuYmFzZVVybCk7XHJcblx0bGV0IGZpcnN0ID0gdHJ1ZTtcclxuXHRmb3IgKGxldCBrZXkgaW4gYWN0aW9uLmRhdGEpIHtcclxuXHRcdGxldCB2YWx1ZSA9XHRhY3Rpb24uZGF0YVtrZXldLnJlcGxhY2UoJ3tzZWFyY2hUZXJtc30nLCB0ZXh0KTtcclxuXHRcdHVybCArPSBmaXJzdCA/ICc/JyA6ICcmJztcclxuXHRcdHVybCArPSBgJHtrZXl9PWAgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xyXG5cdFx0Zmlyc3QgPSBmYWxzZTtcclxuXHR9XHJcblx0cmV0dXJuIHVybDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEVuZ2luZVdpdGhUZXJtXHJcbiAqIEBwcm9wZXJ0eSB7U2VhcmNoRW5naW5lfSBlbmdpbmUgRW5naW5lIHRvIHVzZS5cclxuICogQHByb3BlcnR5IHtTdHJpbmd9IHRleHQgVHJhbnNmb3JtZWQgc2VhcmNoIHRlcm0uXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEZpbmQgb3V0IHdoaWNoIGVuZ2luZSBzaG91bGQgYmUgdXNlZCBiYXNlZCBvbiBlbnRlcmVkIHRleHQuXHJcbiAqIFxyXG4gKiBgc2EgIHNvbWV0aGluZ2AgdXNlcyBkZWZhdWx0IChmaXJzdCkgZW5naW5lXHJcbiAqIGBzYSBgIHNob3VsZCBzaG93IHlvdSBhIGxpc3Qgb2YgZW5naW5lcyAoaW4gZnV0dXJlKVxyXG4gKiBgc2EgYWAgc2hvdWxkIHNob3cgeW91IGEgbGlzdCBvZiBlbmdpbmVzIHdpdGgga2V5d29yZHMgc3RhcnRpbmcgd2l0aCBgYWBcclxuICogXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFNlYXJjaCB0ZXJtLlxyXG4gKiBAcmV0dXJuIHtFbmdpbmVXaXRoVGVybX0gRW5naW5lIHdpdGggdGVybSBzdHJpcHBlZCBmcm9tIHRoZSBlbmdpbmUga2V5b3dyZC5cclxuICovXHJcblNlYXJjaEhlbHBlci5wcm90b3R5cGUuZ2V0RW5naW5lID0gZnVuY3Rpb24gKHRleHQpIHtcclxuXHRsZXQga2V5d29yZCA9IG51bGw7XHJcblx0bGV0IG1lID0gdGhpcztcclxuXHR0ZXh0LnJlcGxhY2UoL14oXFxTKilcXHMrKC4qKSQvLCBmdW5jdGlvbihhLCB3b3JkLCByZXN0KXtcclxuXHRcdGlmICghd29yZC5sZW5ndGgpIHtcclxuXHRcdFx0a2V5d29yZCA9ICdkZWZhdWx0JztcclxuXHRcdFx0dGV4dCA9IHJlc3Q7XHJcblx0XHR9IGVsc2UgaWYgKHdvcmQgaW4gbWUuZW5naW5lTWFwKSB7XHJcblx0XHRcdGtleXdvcmQgPSB3b3JkO1xyXG5cdFx0XHR0ZXh0ID0gcmVzdDtcclxuXHRcdH1cclxuXHR9KTtcclxuXHRsZXQgZW5naW5lO1xyXG5cdGlmIChrZXl3b3JkID09PSBudWxsKSB7XHJcblx0XHRlbmdpbmUgPSBudWxsO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRlbmdpbmUgPSB0aGlzLmVuZ2luZU1hcFtrZXl3b3JkXTtcclxuXHR9XHJcblx0cmV0dXJuIHtcclxuXHRcdGVuZ2luZSA6IGVuZ2luZSxcclxuXHRcdHRleHQgOiB0ZXh0XHJcblx0fTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBzdWdnZXN0aW9ucyBhcnJheSBmcm9tIHJlc3BvbnNlLlxyXG4gKiBcclxuICogQHBhcmFtIHtTZWFyY2hFbmdpbmV9IGVuZ2luZSBFbmdpbmUgdXNlZC5cclxuICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFRoZSBzZWFyY2ggZW5naW5lIHJlc3BvbnNlLlxyXG4gKi9cclxuU2VhcmNoSGVscGVyLnByb3RvdHlwZS5jcmVhdGVTdWdnZXN0aW9uc0Zyb21SZXNwb25zZSA9IGZ1bmN0aW9uIChlbmdpbmUsIHJlc3BvbnNlKSB7XHJcblx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG5cdFx0bGV0IHN1Z2dlc3Rpb25zID0gW107XHJcblx0XHRsZXQgc3VnZ2VzdGlvbnNPbkVtcHR5UmVzdWx0cyA9IFt7XHJcblx0XHRcdGNvbnRlbnQ6IGVuZ2luZS5iYXNlVXJsLFxyXG5cdFx0XHRkZXNjcmlwdGlvbjogJ05vIHJlc3VsdHMgZm91bmQnXHJcblx0XHR9XTtcclxuXHRcdHJlc3BvbnNlLmpzb24oKS50aGVuKGpzb24gPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZygncmVzcG9uc2U6JywganNvbik7XHJcblx0XHRcdGlmICghanNvbi5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzb2x2ZShzdWdnZXN0aW9uc09uRW1wdHlSZXN1bHRzKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0bGV0IG1heCA9IHRoaXMuU0VUVElOR1MuTUFYX1NVR0dFU1RJT05TO1xyXG5cclxuXHRcdFx0Ly8gZm9yIFdpa2lwZWRpYTpcclxuXHRcdFx0Ly8ganNvblswXSA9IHNlYXJjaCB0ZXJtXHJcblx0XHRcdC8vIGpzb25bMV0gPSBbLi4udGl0bGVzLi4uXVxyXG5cdFx0XHQvLyBqc29uWzJdID0gWy4uLmRlc2NyaXB0aW9ucy4uLl1cclxuXHRcdFx0Ly8ganNvblszXSA9IFsuLi5kaXJlY3QgdXJscy4uLl1cclxuXHRcdFx0bGV0IHRpdGxlcyA9IGpzb25bMV07XHJcblx0XHRcdGxldCBkZXNjcmlwdGlvbnMgPSBqc29uWzJdO1xyXG5cdFx0XHRsZXQgdXJscyA9IGpzb25bM107XHJcblxyXG5cdFx0XHRpZiAodGl0bGVzLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzb2x2ZShzdWdnZXN0aW9uc09uRW1wdHlSZXN1bHRzKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bGV0IGNvdW50ID0gTWF0aC5taW4odGl0bGVzLmxlbmd0aCwgbWF4KTtcclxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcblx0XHRcdFx0Ly8gZ2F0aGVyIGRhdGFcclxuXHRcdFx0XHRsZXQgdGl0bGUgPSB0aXRsZXNbaV07XHJcblx0XHRcdFx0bGV0IGRlc2NyaXB0aW9uID0gdGl0bGU7XHJcblx0XHRcdFx0aWYgKGRlc2NyaXB0aW9ucyAmJiB0eXBlb2YgZGVzY3JpcHRpb25zW2ldID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb24gKz0gYCAtLSAke2Rlc2NyaXB0aW9uc1tpXX1gO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRsZXQgdXJsID0gJyc7XHJcblx0XHRcdFx0aWYgKHVybHMgJiYgdHlwZW9mIHVybHNbaV0gPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHR1cmwgPSB1cmxzW2ldO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR1cmwgPSBidWlsZFNlYXJjaFVybChlbmdpbmUsIGVuZ2luZS5vcGVuQWN0aW9uLCB0aXRsZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGFkZCBzdWdnZXN0aW9uXHJcblx0XHRcdFx0c3VnZ2VzdGlvbnMucHVzaCh7XHJcblx0XHRcdFx0XHRjb250ZW50OiB1cmwsXHJcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc29sdmUoc3VnZ2VzdGlvbnMpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNlYXJjaEhlbHBlcjsiXX0=

//# sourceMappingURL=background.js.map
