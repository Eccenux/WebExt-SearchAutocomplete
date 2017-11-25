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
	description: 'Type in your search engine keyword and then your search terms.'
});

/**
 * Reaction for newly entered phrase.
 */
browser.omnibox.onInputChanged.addListener(function (text, addSuggestions) {
	var engineWithTerm = searchHelper.getEngine(text);
	var searchTerm = engineWithTerm.text;
	var engine = engineWithTerm.engine;
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
		url = searchHelper.buildSearchUrl(engine, engine.openAction, searchTerm);
	}
	// react tab as expected
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
	text.replace(/^(\S+)\s+(.+)$/, function (a, word, rest) {
		if (word in me.engineMap) {
			keyword = word;
			text = rest;
		}
	});
	var engine = void 0;
	if (keyword === null) {
		engine = this.engineMap.default;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L19Ud29yY3pvc2MvV2ViRXh0ZW5zaW9ucy9GRkV4dC9TZWFyY2hBdXRvY29tcGxldGUvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFwcFxcc2NyaXB0cy5iYWJlbFxcYmFja2dyb3VuZC5qcyIsImQ6XFxfVHdvcmN6b3NjXFxXZWJFeHRlbnNpb25zXFxGRkV4dFxcU2VhcmNoQXV0b2NvbXBsZXRlXFxhcHBcXHNjcmlwdHMuYmFiZWxcXGluY1xcU2VhcmNoRW5naW5lLmpzIiwiZDpcXF9Ud29yY3pvc2NcXFdlYkV4dGVuc2lvbnNcXEZGRXh0XFxTZWFyY2hBdXRvY29tcGxldGVcXGFwcFxcc2NyaXB0cy5iYWJlbFxcaW5jXFxTZWFyY2hFbmdpbmVBY3Rpb24uanMiLCJkOlxcX1R3b3Jjem9zY1xcV2ViRXh0ZW5zaW9uc1xcRkZFeHRcXFNlYXJjaEF1dG9jb21wbGV0ZVxcYXBwXFxzY3JpcHRzLmJhYmVsXFxpbmNcXFNlYXJjaEhlbHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQUVBOzs7O0FBcUNBOzs7Ozs7QUFsQ0EsSUFBTSxXQUFXO0FBQ2hCLGtCQUFrQjs7QUFHbkI7Ozs7O0FBSmlCLENBQWpCLENBU0EsSUFBTSxlQUFlO0FBQ3BCLFdBQVcsQ0FBQyxJQUFELENBRFM7QUFFcEIsVUFBVSwyQkFGVTtBQUdwQixhQUFZO0FBQ1gsT0FBTSxXQURLO0FBRVgsVUFBUyxLQUZFO0FBR1gsUUFBTztBQUNOLFdBQVMsZUFESDtBQUVOLGFBQVU7QUFGSjtBQUhJLEVBSFE7QUFXcEIscUJBQW9CO0FBQ25CLE9BQU0sb0JBRGE7QUFFbkIsVUFBUyxLQUZVO0FBR25CLFFBQU8sZ0NBSFk7QUFJbkIsUUFBTztBQUNOLFdBQVMsWUFESDtBQUVOLFdBQVM7QUFGSDtBQUpZOztBQVdyQjtBQUNBO0FBQ0E7QUF4QnFCLENBQXJCO0FBMEJBLElBQUksZUFBZSwyQkFBaUIsUUFBakIsRUFBMkI7QUFDN0MsT0FB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UyxHQURPO0FBRWhCLGtCQUFhO0FBRkcsS0FBakI7QUFJQTtBQUNELFVBQU8sUUFBUSxXQUFSLENBQVA7QUFDQSxHQTFDRDtBQTJDQSxFQWpETSxDQUFQO0FBa0RBLENBbkREOztrQkFxRGUsWSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWFpbiBzZXR0aW5ncy5cbiAqL1xuY29uc3QgU0VUVElOR1MgPSB7XG5cdE1BWF9TVUdHRVNUSU9OUyA6IDZcbn1cblxuLyoqXG5cdEV4YW1wbGUgZW5naW5lLlxuXHRcblx0Um91Z2hseSBjb21wYXRpYmxlIHdpdGggYE9wZW5TZWFyY2hEZXNjcmlwdGlvbmAuXG4qL1xuY29uc3QgZW5XaWtpRW5naW5lID0ge1xuXHRrZXl3b3JkcyA6IFsnZW4nXSxcblx0YmFzZVVybCA6ICdodHRwczovL2VuLndpa2lwZWRpYS5vcmcvJyxcblx0b3BlbkFjdGlvbjoge1xuXHRcdHVybCA6ICd7YmFzZVVybH0nLFxuXHRcdG1ldGhvZCA6ICdHRVQnLFxuXHRcdGRhdGEgOiB7XG5cdFx0XHRzZWFyY2ggOiAne3NlYXJjaFRlcm1zfScsXG5cdFx0XHRzb3VyY2VpZDogJ01vemlsbGEtc2VhcmNoJ1xuXHRcdH1cblx0fSxcblx0YXV0b2NvbXBsZXRlQWN0aW9uOiB7XG5cdFx0dXJsIDogJ3tiYXNlVXJsfXcvYXBpLnBocCcsXG5cdFx0bWV0aG9kIDogJ0dFVCcsXG5cdFx0dHlwZSA6ICdhcHBsaWNhdGlvbi94LXN1Z2dlc3Rpb25zK2pzb24nLFxuXHRcdGRhdGEgOiB7XG5cdFx0XHRhY3Rpb24gOiAnb3BlbnNlYXJjaCcsXG5cdFx0XHRzZWFyY2ggOiAne3NlYXJjaFRlcm1zfSdcblx0XHR9XG5cdH1cbn1cblxuLy9cbi8vIE9tbmlib3ggc2V0dXBcbi8vXG5pbXBvcnQgU2VhcmNoSGVscGVyIGZyb20gJy4vaW5jL1NlYXJjaEhlbHBlci5qcyc7XG5sZXQgc2VhcmNoSGVscGVyID0gbmV3IFNlYXJjaEhlbHBlcihTRVRUSU5HUywge1xuXHQnZW4nIDogZW5XaWtpRW5naW5lXG59KTtcblxuLyoqXG4gKiBEZWZhdWx0IHN1Z2dlc3Rpb24gZGlzcGxheWVkIGFmdGVyIHR5cGluZyBpbiBgc2FgLlxuICovXG5icm93c2VyLm9tbmlib3guc2V0RGVmYXVsdFN1Z2dlc3Rpb24oe1xuXHRkZXNjcmlwdGlvbjogJ1R5cGUgaW4geW91ciBzZWFyY2ggZW5naW5lIGtleXdvcmQgYW5kIHRoZW4geW91ciBzZWFyY2ggdGVybXMuJ1xufSk7XG5cbi8qKlxuICogUmVhY3Rpb24gZm9yIG5ld2x5IGVudGVyZWQgcGhyYXNlLlxuICovXG5icm93c2VyLm9tbmlib3gub25JbnB1dENoYW5nZWQuYWRkTGlzdGVuZXIoKHRleHQsIGFkZFN1Z2dlc3Rpb25zKSA9PiB7XG5cdGxldCBlbmdpbmVXaXRoVGVybSA9IHNlYXJjaEhlbHBlci5nZXRFbmdpbmUodGV4dCk7XG5cdGxldCBzZWFyY2hUZXJtID0gZW5naW5lV2l0aFRlcm0udGV4dDtcblx0bGV0IGVuZ2luZSA9IGVuZ2luZVdpdGhUZXJtLmVuZ2luZTtcblx0bGV0IGFjdGlvbiA9IGVuZ2luZS5hdXRvY29tcGxldGVBY3Rpb247XG5cdGxldCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoeydBY2NlcHQnOiBhY3Rpb24udHlwZX0pO1xuXHRsZXQgaW5pdCA9IHttZXRob2Q6IGFjdGlvbi5tZXRob2QsIGhlYWRlcnN9O1xuXHRsZXQgdXJsID0gc2VhcmNoSGVscGVyLmJ1aWxkU2VhcmNoVXJsKGVuZ2luZSwgYWN0aW9uLCBzZWFyY2hUZXJtKTtcblx0Y29uc29sZS5sb2coXG5cdFx0J3NlYXJjaFRlcm06Jywgc2VhcmNoVGVybSxcblx0XHQndXJsOicsIHVybCxcblx0XHQnZW5naW5lOicsIGVuZ2luZVxuXHQpO1xuXHRsZXQgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHVybCwgaW5pdCk7XG5cdFxuXHRmZXRjaChyZXF1ZXN0KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gc2VhcmNoSGVscGVyLmNyZWF0ZVN1Z2dlc3Rpb25zRnJvbVJlc3BvbnNlKGVuZ2luZSwgcmVzcG9uc2UpO1xuXHRcdH0pXG5cdFx0LnRoZW4oYWRkU3VnZ2VzdGlvbnMpXG5cdDtcbn0pO1xuXG4vKipcbiAqIFJlYWN0IHRvIGNob29zZW4gcGhyYXNlIG9yIHN1Z2dlc3Rpb24uXG4gKi9cbmJyb3dzZXIub21uaWJveC5vbklucHV0RW50ZXJlZC5hZGRMaXN0ZW5lcigodGV4dCwgZGlzcG9zaXRpb24pID0+IHtcblx0Y29uc29sZS5sb2coJ29uSW5wdXRFbnRlcmVkOiAnLCB0ZXh0LCBkaXNwb3NpdGlvbik7XG5cdC8vIGlmIHN1Z2dlc3Rpb24gd2FzIGNob29zZW4gdGhlbiB0aGUgdGV4dCBzaG91bGQgY29udGFpbiBhIGdvLXRvIFVSTFxuXHRsZXQgdXJsID0gdGV4dDtcblx0Ly8gc3VnZ2VzdGlvbiB3YXMgbm90IGNob29zZW4sIG11c3QgYnVpbGQgVVJMXG5cdGlmICh0ZXh0LnNlYXJjaCgvXmh0dHBzPzovKSAhPT0gMCkge1xuXHRcdGxldCBlbmdpbmVXaXRoVGVybSA9IHNlYXJjaEhlbHBlci5nZXRFbmdpbmUodGV4dCk7XG5cdFx0bGV0IHNlYXJjaFRlcm0gPSBlbmdpbmVXaXRoVGVybS50ZXh0O1xuXHRcdGxldCBlbmdpbmUgPSBlbmdpbmVXaXRoVGVybS5lbmdpbmU7XG5cdFx0dXJsID0gc2VhcmNoSGVscGVyLmJ1aWxkU2VhcmNoVXJsKGVuZ2luZSwgZW5naW5lLm9wZW5BY3Rpb24sIHNlYXJjaFRlcm0pO1xuXHR9XG5cdC8vIHJlYWN0IHRhYiBhcyBleHBlY3RlZFxuXHRzd2l0Y2ggKGRpc3Bvc2l0aW9uKSB7XG5cdFx0Y2FzZSAnY3VycmVudFRhYic6XG5cdFx0XHRicm93c2VyLnRhYnMudXBkYXRlKHt1cmx9KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ25ld0ZvcmVncm91bmRUYWInOlxuXHRcdFx0YnJvd3Nlci50YWJzLmNyZWF0ZSh7dXJsfSk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICduZXdCYWNrZ3JvdW5kVGFiJzpcblx0XHRcdGJyb3dzZXIudGFicy5jcmVhdGUoe3VybCwgYWN0aXZlOiBmYWxzZX0pO1xuXHRcdFx0YnJlYWs7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IFNlYXJjaEVuZ2luZUFjdGlvbiBmcm9tICcuL1NlYXJjaEVuZ2luZUFjdGlvbi5qcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gU2VhcmNoRW5naW5lKGVuZ2luZSkge1xyXG5cdHRoaXMua2V5d29yZHMgPSBbXTtcclxuXHRpZiAodHlwZW9mIGVuZ2luZS5rZXl3b3JkcyA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMua2V5d29yZHMucHVzaChlbmdpbmUua2V5d29yZHMpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHR0aGlzLmtleXdvcmRzID0gZW5naW5lLmtleXdvcmRzO1xyXG5cdH1cclxuXHR0aGlzLmJhc2VVcmwgPSAnJztcclxuXHRpZiAodHlwZW9mIGVuZ2luZS5iYXNlVXJsID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy5iYXNlVXJsID0gZW5naW5lLmJhc2VVcmw7XHJcblx0fVxyXG5cdHRoaXMub3BlbkFjdGlvbiA9IG5ldyBTZWFyY2hFbmdpbmVBY3Rpb24oZW5naW5lLm9wZW5BY3Rpb24pO1xyXG5cdHRoaXMuYXV0b2NvbXBsZXRlQWN0aW9uID0gbmV3IFNlYXJjaEVuZ2luZUFjdGlvbihlbmdpbmUuYXV0b2NvbXBsZXRlQWN0aW9uKTtcclxufVxyXG4iLCJleHBvcnQgZnVuY3Rpb24gU2VhcmNoRW5naW5lQWN0aW9uKGFjdGlvbikge1xyXG5cdHRoaXMudXJsID0gJyc7XHJcblx0aWYgKHR5cGVvZiBhY3Rpb24udXJsID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy51cmwgPSBhY3Rpb24udXJsO1xyXG5cdH1cclxuXHR0aGlzLm1ldGhvZCA9ICdHRVQnO1xyXG5cdGlmICh0eXBlb2YgYWN0aW9uLm1ldGhvZCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMubWV0aG9kID0gYWN0aW9uLm1ldGhvZDtcclxuXHR9XHJcblx0dGhpcy50eXBlID0gJyc7XHJcblx0aWYgKHR5cGVvZiBhY3Rpb24udHlwZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMudHlwZSA9IGFjdGlvbi50eXBlO1xyXG5cdH1cclxuXHR0aGlzLmRhdGEgPSB7fTtcclxuXHRpZiAodHlwZW9mIGFjdGlvbi5kYXRhID09PSAnb2JqZWN0Jykge1xyXG5cdFx0dGhpcy5kYXRhID0gYWN0aW9uLmRhdGE7XHJcblx0fVxyXG59IiwiaW1wb3J0IFNlYXJjaEVuZ2luZSBmcm9tICcuL1NlYXJjaEVuZ2luZS5qcyc7XHJcbi8vaW1wb3J0IFNlYXJjaEVuZ2luZUFjdGlvbiBmcm9tICcuL1NlYXJjaEVuZ2luZUFjdGlvbi5qcyc7XHJcblxyXG4vKipcclxuICogUHJlLXBhcnNlIGFsbCBzZXR0aW5ncy5cclxuICogXHJcbiAqIEBUT0RPIE1heWJlIHN1cHBvcnQgZW5naW5lcyBhcnJheSBsYXRlcj8gV291bGQgYWxsb3cgc3VwcG9ydCBvZiBtdWxpdHBsZSBrZXl3b3Jkcy5cclxuICogXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBTRVRUSU5HUyBHZW5lcmFsIHNldHRpbmdzIG9iamVjdC5cclxuICogQHBhcmFtIHtPYmplY3R9IGVuZ2luZU1hcCBLZXl3b3JkLWJhc2VkIHNlYXJjaCBlbmdpbmVzIG1hcC5cclxuICovXHJcbmZ1bmN0aW9uIFNlYXJjaEhlbHBlciAoU0VUVElOR1MsIGVuZ2luZU1hcCkge1xyXG5cdHRoaXMuU0VUVElOR1MgPSBTRVRUSU5HUztcclxuXHR0aGlzLmVuZ2luZU1hcCA9IGVuZ2luZU1hcDtcclxuXHRpZiAodHlwZW9mIGVuZ2luZU1hcC5kZWZhdWx0ICE9PSAnb2JqZWN0Jykge1xyXG5cdFx0dmFyIGZpcnN0S2V5d29yZCA9IE9iamVjdC5rZXlzKGVuZ2luZU1hcClbMF07XHJcblx0XHR0aGlzLmVuZ2luZU1hcC5kZWZhdWx0ID0gdGhpcy5lbmdpbmVNYXBbZmlyc3RLZXl3b3JkXTtcclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBCdWlsZCBzZWFyY2ggVVJMIGZvciB0aGUgdGV4dC5cclxuICogXHJcbiAqIEBwYXJhbSB7U2VhcmNoRW5naW5lfSBlbmdpbmUgRW5naW5lIHRvIHVzZS5cclxuICogQHBhcmFtIHtTZWFyY2hFbmdpbmVBY3Rpb259IGFjdGlvbiBBY3Rpb24gdG8gY2FsbCBvbiB0aGUgZW5naW5lLlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBTZWFyY2ggdGVybS5cclxuICovXHJcblNlYXJjaEhlbHBlci5wcm90b3R5cGUuYnVpbGRTZWFyY2hVcmwgPSBmdW5jdGlvbiAoZW5naW5lLCBhY3Rpb24sIHRleHQpIHtcclxuXHRsZXQgdXJsID0gYWN0aW9uLnVybC5yZXBsYWNlKCd7YmFzZVVybH0nLCBlbmdpbmUuYmFzZVVybCk7XHJcblx0bGV0IGZpcnN0ID0gdHJ1ZTtcclxuXHRmb3IgKGxldCBrZXkgaW4gYWN0aW9uLmRhdGEpIHtcclxuXHRcdGxldCB2YWx1ZSA9XHRhY3Rpb24uZGF0YVtrZXldLnJlcGxhY2UoJ3tzZWFyY2hUZXJtc30nLCB0ZXh0KTtcclxuXHRcdHVybCArPSBmaXJzdCA/ICc/JyA6ICcmJztcclxuXHRcdHVybCArPSBgJHtrZXl9PWAgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xyXG5cdFx0Zmlyc3QgPSBmYWxzZTtcclxuXHR9XHJcblx0cmV0dXJuIHVybDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEVuZ2luZVdpdGhUZXJtXHJcbiAqIEBwcm9wZXJ0eSB7U2VhcmNoRW5naW5lfSBlbmdpbmUgRW5naW5lIHRvIHVzZS5cclxuICogQHByb3BlcnR5IHtTdHJpbmd9IHRleHQgVHJhbnNmb3JtZWQgc2VhcmNoIHRlcm0uXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEZpbmQgb3V0IHdoaWNoIGVuZ2luZSBzaG91bGQgYmUgdXNlZCBiYXNlZCBvbiBlbnRlcmVkIHRleHQuXHJcbiAqIFxyXG4gKiBgc2EgIHNvbWV0aGluZ2AgdXNlcyBkZWZhdWx0IChmaXJzdCkgZW5naW5lXHJcbiAqIGBzYSBgIHNob3VsZCBzaG93IHlvdSBhIGxpc3Qgb2YgZW5naW5lcyAoaW4gZnV0dXJlKVxyXG4gKiBgc2EgYWAgc2hvdWxkIHNob3cgeW91IGEgbGlzdCBvZiBlbmdpbmVzIHdpdGgga2V5d29yZHMgc3RhcnRpbmcgd2l0aCBgYWBcclxuICogXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFNlYXJjaCB0ZXJtLlxyXG4gKiBAcmV0dXJuIHtFbmdpbmVXaXRoVGVybX0gRW5naW5lIHdpdGggdGVybSBzdHJpcHBlZCBmcm9tIHRoZSBlbmdpbmUga2V5b3dyZC5cclxuICovXHJcblNlYXJjaEhlbHBlci5wcm90b3R5cGUuZ2V0RW5naW5lID0gZnVuY3Rpb24gKHRleHQpIHtcclxuXHRsZXQga2V5d29yZCA9IG51bGw7XHJcblx0bGV0IG1lID0gdGhpcztcclxuXHR0ZXh0LnJlcGxhY2UoL14oXFxTKylcXHMrKC4rKSQvLCBmdW5jdGlvbihhLCB3b3JkLCByZXN0KXtcclxuXHRcdGlmICh3b3JkIGluIG1lLmVuZ2luZU1hcCkge1xyXG5cdFx0XHRrZXl3b3JkID0gd29yZDtcclxuXHRcdFx0dGV4dCA9IHJlc3Q7XHJcblx0XHR9XHJcblx0fSk7XHJcblx0bGV0IGVuZ2luZTtcclxuXHRpZiAoa2V5d29yZCA9PT0gbnVsbCkge1xyXG5cdFx0ZW5naW5lID0gdGhpcy5lbmdpbmVNYXAuZGVmYXVsdDtcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZW5naW5lID0gdGhpcy5lbmdpbmVNYXBba2V5d29yZF07XHJcblx0fVxyXG5cdHJldHVybiB7XHJcblx0XHRlbmdpbmUgOiBlbmdpbmUsXHJcblx0XHR0ZXh0IDogdGV4dFxyXG5cdH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgc3VnZ2VzdGlvbnMgYXJyYXkgZnJvbSByZXNwb25zZS5cclxuICogXHJcbiAqIEBwYXJhbSB7U2VhcmNoRW5naW5lfSBlbmdpbmUgRW5naW5lIHVzZWQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBUaGUgc2VhcmNoIGVuZ2luZSByZXNwb25zZS5cclxuICovXHJcblNlYXJjaEhlbHBlci5wcm90b3R5cGUuY3JlYXRlU3VnZ2VzdGlvbnNGcm9tUmVzcG9uc2UgPSBmdW5jdGlvbiAoZW5naW5lLCByZXNwb25zZSkge1xyXG5cdHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuXHRcdGxldCBzdWdnZXN0aW9ucyA9IFtdO1xyXG5cdFx0bGV0IHN1Z2dlc3Rpb25zT25FbXB0eVJlc3VsdHMgPSBbe1xyXG5cdFx0XHRjb250ZW50OiBlbmdpbmUuYmFzZVVybCxcclxuXHRcdFx0ZGVzY3JpcHRpb246ICdObyByZXN1bHRzIGZvdW5kJ1xyXG5cdFx0fV07XHJcblx0XHRyZXNwb25zZS5qc29uKCkudGhlbihqc29uID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3Jlc3BvbnNlOicsIGpzb24pO1xyXG5cdFx0XHRpZiAoIWpzb24ubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlc29sdmUoc3VnZ2VzdGlvbnNPbkVtcHR5UmVzdWx0cyk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGxldCBtYXggPSB0aGlzLlNFVFRJTkdTLk1BWF9TVUdHRVNUSU9OUztcclxuXHJcblx0XHRcdC8vIGZvciBXaWtpcGVkaWE6XHJcblx0XHRcdC8vIGpzb25bMF0gPSBzZWFyY2ggdGVybVxyXG5cdFx0XHQvLyBqc29uWzFdID0gWy4uLnRpdGxlcy4uLl1cclxuXHRcdFx0Ly8ganNvblsyXSA9IFsuLi5kZXNjcmlwdGlvbnMuLi5dXHJcblx0XHRcdC8vIGpzb25bM10gPSBbLi4uZGlyZWN0IHVybHMuLi5dXHJcblx0XHRcdGxldCB0aXRsZXMgPSBqc29uWzFdO1xyXG5cdFx0XHRsZXQgZGVzY3JpcHRpb25zID0ganNvblsyXTtcclxuXHRcdFx0bGV0IHVybHMgPSBqc29uWzNdO1xyXG5cclxuXHRcdFx0aWYgKHRpdGxlcy5sZW5ndGggPCAxKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlc29sdmUoc3VnZ2VzdGlvbnNPbkVtcHR5UmVzdWx0cyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGxldCBjb3VudCA9IE1hdGgubWluKHRpdGxlcy5sZW5ndGgsIG1heCk7XHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG5cdFx0XHRcdC8vIGdhdGhlciBkYXRhXHJcblx0XHRcdFx0bGV0IHRpdGxlID0gdGl0bGVzW2ldO1xyXG5cdFx0XHRcdGxldCBkZXNjcmlwdGlvbiA9IHRpdGxlO1xyXG5cdFx0XHRcdGlmIChkZXNjcmlwdGlvbnMgJiYgdHlwZW9mIGRlc2NyaXB0aW9uc1tpXSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uICs9IGAgLS0gJHtkZXNjcmlwdGlvbnNbaV19YDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bGV0IHVybCA9ICcnO1xyXG5cdFx0XHRcdGlmICh1cmxzICYmIHR5cGVvZiB1cmxzW2ldID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0dXJsID0gdXJsc1tpXTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dXJsID0gYnVpbGRTZWFyY2hVcmwoZW5naW5lLCBlbmdpbmUub3BlbkFjdGlvbiwgdGl0bGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBhZGQgc3VnZ2VzdGlvblxyXG5cdFx0XHRcdHN1Z2dlc3Rpb25zLnB1c2goe1xyXG5cdFx0XHRcdFx0Y29udGVudDogdXJsLFxyXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXNvbHZlKHN1Z2dlc3Rpb25zKTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTZWFyY2hIZWxwZXI7Il19

//# sourceMappingURL=background.js.map
