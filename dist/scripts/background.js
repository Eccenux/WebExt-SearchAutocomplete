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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L19Ud29yY3pvc2MvV2ViRXh0ZW5zaW9ucy9GRkV4dC9TZWFyY2hBdXRvY29tcGxldGUvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFwcFxcc2NyaXB0cy5iYWJlbFxcYmFja2dyb3VuZC5qcyIsImQ6XFxfVHdvcmN6b3NjXFxXZWJFeHRlbnNpb25zXFxGRkV4dFxcU2VhcmNoQXV0b2NvbXBsZXRlXFxhcHBcXHNjcmlwdHMuYmFiZWxcXGluY1xcU2VhcmNoRW5naW5lLmpzIiwiZDpcXF9Ud29yY3pvc2NcXFdlYkV4dGVuc2lvbnNcXEZGRXh0XFxTZWFyY2hBdXRvY29tcGxldGVcXGFwcFxcc2NyaXB0cy5iYWJlbFxcaW5jXFxTZWFyY2hFbmdpbmVBY3Rpb24uanMiLCJkOlxcX1R3b3Jjem9zY1xcV2ViRXh0ZW5zaW9uc1xcRkZFeHRcXFNlYXJjaEF1dG9jb21wbGV0ZVxcYXBwXFxzY3JpcHRzLmJhYmVsXFxpbmNcXFNlYXJjaEhlbHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQUVBOzs7O0FBcUNBOzs7Ozs7QUFsQ0EsSUFBTSxXQUFXO0FBQ2hCLGtCQUFrQjs7QUFHbkI7Ozs7O0FBSmlCLENBQWpCLENBU0EsSUFBTSxlQUFlO0FBQ3BCLFdBQVcsQ0FBQyxJQUFELENBRFM7QUFFcEIsVUFBVSwyQkFGVTtBQUdwQixhQUFZO0FBQ1gsT0FBTSxXQURLO0FBRVgsVUFBUyxLQUZFO0FBR1gsUUFBTztBQUNOLFdBQVMsZUFESDtBQUVOLGFBQVU7QUFGSjtBQUhJLEVBSFE7QUFXcEIscUJBQW9CO0FBQ25CLE9BQU0sb0JBRGE7QUFFbkIsVUFBUyxLQUZVO0FBR25CLFFBQU8sZ0NBSFk7QUFJbkIsUUFBTztBQUNOLFdBQVMsWUFESDtBQUVOLFdBQVM7QUFGSDtBQUpZOztBQVdyQjtBQUNBO0FBQ0E7QUF4QnFCLENBQXJCO0FBMEJBLElBQUksZUFBZSwyQkFBaUIsUUFBakIsRUFBMkI7QUFDN0MsT0FBTztBQURzQyxDQUEzQixDQUFuQjs7QUFJQTs7O0FBR0EsUUFBUSxPQUFSLENBQWdCLG9CQUFoQixDQUFxQztBQUNwQyxjQUFhO0FBRHVCLENBQXJDOztBQUlBOzs7QUFHQSxRQUFRLE9BQVIsQ0FBZ0IsY0FBaEIsQ0FBK0IsV0FBL0IsQ0FBMkMsVUFBQyxJQUFELEVBQU8sY0FBUCxFQUEwQjtBQUNwRSxLQUFJLGlCQUFpQixhQUFhLFNBQWIsQ0FBdUIsSUFBdkIsQ0FBckI7QUFDQSxLQUFJLGFBQWEsZUFBZSxJQUFoQztBQUNBLEtBQUksU0FBUyxlQUFlLE1BQTVCO0FBQ0E7QUFDQSxLQUFJLFdBQVcsSUFBZixFQUFxQjtBQUNwQixVQUFRLEdBQVIsQ0FBWSxvQkFBWjtBQUNBO0FBQ0E7QUFDRDtBQUNBLEtBQUksQ0FBQyxXQUFXLE1BQWhCLEVBQXdCO0FBQ3ZCLFVBQVEsR0FBUixDQUFZLDBDQUFaO0FBQ0E7QUFDQTtBQUNELEtBQUksU0FBUyxPQUFPLGtCQUFwQjtBQUNBLEtBQUksVUFBVSxJQUFJLE9BQUosQ0FBWSxFQUFDLFVBQVUsT0FBTyxJQUFsQixFQUFaLENBQWQ7QUFDQSxLQUFJLE9BQU8sRUFBQyxRQUFRLE9BQU8sTUFBaEIsRUFBd0IsZ0JBQXhCLEVBQVg7QUFDQSxLQUFJLE1BQU0sYUFBYSxjQUFiLENBQTRCLE1BQTVCLEVBQW9DLE1BQXBDLEVBQTRDLFVBQTVDLENBQVY7QUFDQSxTQUFRLEdBQVIsQ0FDQyxhQURELEVBQ2dCLFVBRGhCLEVBRUMsTUFGRCxFQUVTLEdBRlQsRUFHQyxTQUhELEVBR1ksTUFIWjtBQUtBLEtBQUksVUFBVSxJQUFJLE9BQUosQ0FBWSxHQUFaLEVBQWlCLElBQWpCLENBQWQ7O0FBRUEsT0FBTSxPQUFOLEVBQ0UsSUFERixDQUNPLFVBQVUsUUFBVixFQUFtQjtBQUN4QixTQUFPLGFBQWEsNkJBQWIsQ0FBMkMsTUFBM0MsRUFBbUQsUUFBbkQsQ0FBUDtBQUNBLEVBSEYsRUFJRSxJQUpGLENBSU8sY0FKUDtBQU1BLENBL0JEOztBQWlDQTs7O0FBR0EsUUFBUSxPQUFSLENBQWdCLGNBQWhCLENBQStCLFdBQS9CLENBQTJDLFVBQUMsSUFBRCxFQUFPLFdBQVAsRUFBdUI7QUFDakUsU0FBUSxHQUFSLENBQVksa0JBQVosRUFBZ0MsSUFBaEMsRUFBc0MsV0FBdEM7QUFDQTtBQUNBLEtBQUksTUFBTSxJQUFWO0FBQ0E7QUFDQSxLQUFJLEtBQUssTUFBTCxDQUFZLFVBQVosTUFBNEIsQ0FBaEMsRUFBbUM7QUFDbEMsTUFBSSxpQkFBaUIsYUFBYSxTQUFiLENBQXVCLElBQXZCLENBQXJCO0FBQ0EsTUFBSSxhQUFhLGVBQWUsSUFBaEM7QUFDQSxNQUFJLFNBQVMsZUFBZSxNQUE1QjtBQUNBO0FBQ0EsTUFBSSxXQUFXLElBQVgsSUFBbUIsQ0FBQyxXQUFXLE1BQW5DLEVBQTJDO0FBQzFDLFdBQVEsR0FBUixDQUFZLDBCQUFaLEVBQXdDO0FBQ3ZDLFVBQU0sSUFEaUM7QUFFdkMsWUFBUSxNQUYrQjtBQUd2QyxnQkFBWTtBQUgyQixJQUF4QztBQUtBO0FBQ0E7QUFDRCxRQUFNLGFBQWEsY0FBYixDQUE0QixNQUE1QixFQUFvQyxPQUFPLFVBQTNDLEVBQXVELFVBQXZELENBQU47QUFDQTtBQUNEO0FBQ0EsU0FBUSxHQUFSLENBQVksa0JBQVosRUFBZ0M7QUFDL0IsUUFBTSxJQUR5QjtBQUUvQixlQUFhLFdBRmtCO0FBRy9CLE9BQUs7QUFIMEIsRUFBaEM7QUFLQTtBQUNBLFNBQVEsV0FBUjtBQUNDLE9BQUssWUFBTDtBQUNDLFdBQVEsSUFBUixDQUFhLE1BQWIsQ0FBb0IsRUFBQyxRQUFELEVBQXBCO0FBQ0E7QUFDRCxPQUFLLGtCQUFMO0FBQ0MsV0FBUSxJQUFSLENBQWEsTUFBYixDQUFvQixFQUFDLFFBQUQsRUFBcEI7QUFDQTtBQUNELE9BQUssa0JBQUw7QUFDQyxXQUFRLElBQVIsQ0FBYSxNQUFiLENBQW9CLEVBQUMsUUFBRCxFQUFNLFFBQVEsS0FBZCxFQUFwQjtBQUNBO0FBVEY7QUFXQSxDQXRDRDs7Ozs7Ozs7UUN4RmdCLFksR0FBQSxZOztBQUZoQjs7Ozs7O0FBRU8sU0FBUyxZQUFULENBQXNCLE1BQXRCLEVBQThCO0FBQ3BDLE1BQUssUUFBTCxHQUFnQixFQUFoQjtBQUNBLEtBQUksT0FBTyxPQUFPLFFBQWQsS0FBMkIsUUFBL0IsRUFBeUM7QUFDeEMsT0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixPQUFPLFFBQTFCO0FBQ0EsRUFGRCxNQUVPO0FBQ04sT0FBSyxRQUFMLEdBQWdCLE9BQU8sUUFBdkI7QUFDQTtBQUNELE1BQUssT0FBTCxHQUFlLEVBQWY7QUFDQSxLQUFJLE9BQU8sT0FBTyxPQUFkLEtBQTBCLFFBQTlCLEVBQXdDO0FBQ3ZDLE9BQUssT0FBTCxHQUFlLE9BQU8sT0FBdEI7QUFDQTtBQUNELE1BQUssVUFBTCxHQUFrQixpQ0FBdUIsT0FBTyxVQUE5QixDQUFsQjtBQUNBLE1BQUssa0JBQUwsR0FBMEIsaUNBQXVCLE9BQU8sa0JBQTlCLENBQTFCO0FBQ0E7Ozs7Ozs7Ozs7O1FDZmUsa0IsR0FBQSxrQjtBQUFULFNBQVMsa0JBQVQsQ0FBNEIsTUFBNUIsRUFBb0M7QUFDMUMsTUFBSyxHQUFMLEdBQVcsRUFBWDtBQUNBLEtBQUksT0FBTyxPQUFPLEdBQWQsS0FBc0IsUUFBMUIsRUFBb0M7QUFDbkMsT0FBSyxHQUFMLEdBQVcsT0FBTyxHQUFsQjtBQUNBO0FBQ0QsTUFBSyxNQUFMLEdBQWMsS0FBZDtBQUNBLEtBQUksT0FBTyxPQUFPLE1BQWQsS0FBeUIsUUFBN0IsRUFBdUM7QUFDdEMsT0FBSyxNQUFMLEdBQWMsT0FBTyxNQUFyQjtBQUNBO0FBQ0QsTUFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLEtBQUksT0FBTyxPQUFPLElBQWQsS0FBdUIsUUFBM0IsRUFBcUM7QUFDcEMsT0FBSyxJQUFMLEdBQVksT0FBTyxJQUFuQjtBQUNBO0FBQ0QsTUFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLEtBQUksUUFBTyxPQUFPLElBQWQsTUFBdUIsUUFBM0IsRUFBcUM7QUFDcEMsT0FBSyxJQUFMLEdBQVksT0FBTyxJQUFuQjtBQUNBO0FBQ0Q7Ozs7Ozs7Ozs7O0FDakJEOzs7Ozs7QUFDQTs7QUFFQTs7Ozs7Ozs7QUFRQSxTQUFTLFlBQVQsQ0FBdUIsUUFBdkIsRUFBaUMsU0FBakMsRUFBNEM7QUFDM0MsTUFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsTUFBSyxTQUFMLEdBQWlCLFNBQWpCO0FBQ0EsS0FBSSxRQUFPLFVBQVUsT0FBakIsTUFBNkIsUUFBakMsRUFBMkM7QUFDMUMsTUFBSSxlQUFlLE9BQU8sSUFBUCxDQUFZLFNBQVosRUFBdUIsQ0FBdkIsQ0FBbkI7QUFDQSxPQUFLLFNBQUwsQ0FBZSxPQUFmLEdBQXlCLEtBQUssU0FBTCxDQUFlLFlBQWYsQ0FBekI7QUFDQTtBQUNEOztBQUVEOzs7Ozs7O0FBT0EsYUFBYSxTQUFiLENBQXVCLGNBQXZCLEdBQXdDLFVBQVUsTUFBVixFQUFrQixNQUFsQixFQUEwQixJQUExQixFQUFnQztBQUN2RSxLQUFJLE1BQU0sT0FBTyxHQUFQLENBQVcsT0FBWCxDQUFtQixXQUFuQixFQUFnQyxPQUFPLE9BQXZDLENBQVY7QUFDQSxLQUFJLFFBQVEsSUFBWjtBQUNBLE1BQUssSUFBSSxHQUFULElBQWdCLE9BQU8sSUFBdkIsRUFBNkI7QUFDNUIsTUFBSSxRQUFRLE9BQU8sSUFBUCxDQUFZLEdBQVosRUFBaUIsT0FBakIsQ0FBeUIsZUFBekIsRUFBMEMsSUFBMUMsQ0FBWjtBQUNBLFNBQU8sUUFBUSxHQUFSLEdBQWMsR0FBckI7QUFDQSxTQUFVLEdBQUgsU0FBWSxtQkFBbUIsS0FBbkIsQ0FBbkI7QUFDQSxVQUFRLEtBQVI7QUFDQTtBQUNELFFBQU8sR0FBUDtBQUNBLENBVkQ7O0FBWUE7Ozs7OztBQU1BOzs7Ozs7Ozs7O0FBVUEsYUFBYSxTQUFiLENBQXVCLFNBQXZCLEdBQW1DLFVBQVUsSUFBVixFQUFnQjtBQUNsRCxLQUFJLFVBQVUsSUFBZDtBQUNBLEtBQUksS0FBSyxJQUFUO0FBQ0EsTUFBSyxPQUFMLENBQWEsZ0JBQWIsRUFBK0IsVUFBUyxDQUFULEVBQVksSUFBWixFQUFrQixJQUFsQixFQUF1QjtBQUNyRCxNQUFJLENBQUMsS0FBSyxNQUFWLEVBQWtCO0FBQ2pCLGFBQVUsU0FBVjtBQUNBLFVBQU8sSUFBUDtBQUNBLEdBSEQsTUFHTyxJQUFJLFFBQVEsR0FBRyxTQUFmLEVBQTBCO0FBQ2hDLGFBQVUsSUFBVjtBQUNBLFVBQU8sSUFBUDtBQUNBO0FBQ0QsRUFSRDtBQVNBLEtBQUksZUFBSjtBQUNBLEtBQUksWUFBWSxJQUFoQixFQUFzQjtBQUNyQixXQUFTLElBQVQ7QUFDQSxFQUZELE1BRU87QUFDTixXQUFTLEtBQUssU0FBTCxDQUFlLE9BQWYsQ0FBVDtBQUNBO0FBQ0QsUUFBTztBQUNOLFVBQVMsTUFESDtBQUVOLFFBQU87QUFGRCxFQUFQO0FBSUEsQ0F0QkQ7O0FBd0JBOzs7Ozs7QUFNQSxhQUFhLFNBQWIsQ0FBdUIsNkJBQXZCLEdBQXVELFVBQVUsTUFBVixFQUFrQixRQUFsQixFQUE0QjtBQUFBOztBQUNsRixRQUFPLElBQUksT0FBSixDQUFZLG1CQUFXO0FBQzdCLE1BQUksY0FBYyxFQUFsQjtBQUNBLE1BQUksNEJBQTRCLENBQUM7QUFDaEMsWUFBUyxPQUFPLE9BRGdCO0FBRWhDLGdCQUFhO0FBRm1CLEdBQUQsQ0FBaEM7QUFJQSxXQUFTLElBQVQsR0FBZ0IsSUFBaEIsQ0FBcUIsZ0JBQVE7QUFDNUIsV0FBUSxHQUFSLENBQVksV0FBWixFQUF5QixJQUF6QjtBQUNBLE9BQUksQ0FBQyxLQUFLLE1BQVYsRUFBa0I7QUFDakIsV0FBTyxRQUFRLHlCQUFSLENBQVA7QUFDQTs7QUFFRCxPQUFJLE1BQU0sTUFBSyxRQUFMLENBQWMsZUFBeEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQUksU0FBUyxLQUFLLENBQUwsQ0FBYjtBQUNBLE9BQUksZUFBZSxLQUFLLENBQUwsQ0FBbkI7QUFDQSxPQUFJLE9BQU8sS0FBSyxDQUFMLENBQVg7O0FBRUEsT0FBSSxPQUFPLE1BQVAsR0FBZ0IsQ0FBcEIsRUFBdUI7QUFDdEIsV0FBTyxRQUFRLHlCQUFSLENBQVA7QUFDQTs7QUFFRCxPQUFJLFFBQVEsS0FBSyxHQUFMLENBQVMsT0FBTyxNQUFoQixFQUF3QixHQUF4QixDQUFaO0FBQ0EsUUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQXBCLEVBQTJCLEdBQTNCLEVBQWdDO0FBQy9CO0FBQ0EsUUFBSSxRQUFRLE9BQU8sQ0FBUCxDQUFaO0FBQ0EsUUFBSSxjQUFjLEtBQWxCO0FBQ0EsUUFBSSxnQkFBZ0IsT0FBTyxhQUFhLENBQWIsQ0FBUCxLQUEyQixRQUEvQyxFQUF5RDtBQUN4RCw2QkFBc0IsYUFBYSxDQUFiLENBQXRCO0FBQ0E7QUFDRCxRQUFJLE1BQU0sRUFBVjtBQUNBLFFBQUksUUFBUSxPQUFPLEtBQUssQ0FBTCxDQUFQLEtBQW1CLFFBQS9CLEVBQXlDO0FBQ3hDLFdBQU0sS0FBSyxDQUFMLENBQU47QUFDQSxLQUZELE1BRU87QUFDTixXQUFNLGVBQWUsTUFBZixFQUF1QixPQUFPLFVBQTlCLEVBQTBDLEtBQTFDLENBQU47QUFDQTtBQUNEO0FBQ0EsZ0JBQVksSUFBWixDQUFpQjtBQUNoQixjQUFTLEdBRE87QUFFaEIsa0JBQWE7QUFGRyxLQUFqQjtBQUlBO0FBQ0QsVUFBTyxRQUFRLFdBQVIsQ0FBUDtBQUNBLEdBMUNEO0FBMkNBLEVBakRNLENBQVA7QUFrREEsQ0FuREQ7O2tCQXFEZSxZIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNYWluIHNldHRpbmdzLlxuICovXG5jb25zdCBTRVRUSU5HUyA9IHtcblx0TUFYX1NVR0dFU1RJT05TIDogNlxufVxuXG4vKipcblx0RXhhbXBsZSBlbmdpbmUuXG5cdFxuXHRSb3VnaGx5IGNvbXBhdGlibGUgd2l0aCBgT3BlblNlYXJjaERlc2NyaXB0aW9uYC5cbiovXG5jb25zdCBlbldpa2lFbmdpbmUgPSB7XG5cdGtleXdvcmRzIDogWydlbiddLFxuXHRiYXNlVXJsIDogJ2h0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy8nLFxuXHRvcGVuQWN0aW9uOiB7XG5cdFx0dXJsIDogJ3tiYXNlVXJsfScsXG5cdFx0bWV0aG9kIDogJ0dFVCcsXG5cdFx0ZGF0YSA6IHtcblx0XHRcdHNlYXJjaCA6ICd7c2VhcmNoVGVybXN9Jyxcblx0XHRcdHNvdXJjZWlkOiAnTW96aWxsYS1zZWFyY2gnXG5cdFx0fVxuXHR9LFxuXHRhdXRvY29tcGxldGVBY3Rpb246IHtcblx0XHR1cmwgOiAne2Jhc2VVcmx9dy9hcGkucGhwJyxcblx0XHRtZXRob2QgOiAnR0VUJyxcblx0XHR0eXBlIDogJ2FwcGxpY2F0aW9uL3gtc3VnZ2VzdGlvbnMranNvbicsXG5cdFx0ZGF0YSA6IHtcblx0XHRcdGFjdGlvbiA6ICdvcGVuc2VhcmNoJyxcblx0XHRcdHNlYXJjaCA6ICd7c2VhcmNoVGVybXN9J1xuXHRcdH1cblx0fVxufVxuXG4vL1xuLy8gT21uaWJveCBzZXR1cFxuLy9cbmltcG9ydCBTZWFyY2hIZWxwZXIgZnJvbSAnLi9pbmMvU2VhcmNoSGVscGVyLmpzJztcbmxldCBzZWFyY2hIZWxwZXIgPSBuZXcgU2VhcmNoSGVscGVyKFNFVFRJTkdTLCB7XG5cdCdlbicgOiBlbldpa2lFbmdpbmVcbn0pO1xuXG4vKipcbiAqIERlZmF1bHQgc3VnZ2VzdGlvbiBkaXNwbGF5ZWQgYWZ0ZXIgdHlwaW5nIGluIGBzYWAuXG4gKi9cbmJyb3dzZXIub21uaWJveC5zZXREZWZhdWx0U3VnZ2VzdGlvbih7XG5cdGRlc2NyaXB0aW9uOiAnVHlwZSBpbiB5b3VyIHNlYXJjaCBlbmdpbmUga2V5d29yZCBhbmQgdGhlbiB5b3VyIHNlYXJjaCB0ZXJtcy4nXG59KTtcblxuLyoqXG4gKiBSZWFjdGlvbiBmb3IgbmV3bHkgZW50ZXJlZCBwaHJhc2UuXG4gKi9cbmJyb3dzZXIub21uaWJveC5vbklucHV0Q2hhbmdlZC5hZGRMaXN0ZW5lcigodGV4dCwgYWRkU3VnZ2VzdGlvbnMpID0+IHtcblx0bGV0IGVuZ2luZVdpdGhUZXJtID0gc2VhcmNoSGVscGVyLmdldEVuZ2luZSh0ZXh0KTtcblx0bGV0IHNlYXJjaFRlcm0gPSBlbmdpbmVXaXRoVGVybS50ZXh0O1xuXHRsZXQgZW5naW5lID0gZW5naW5lV2l0aFRlcm0uZW5naW5lO1xuXHQvLyBubyBrZXl3b3JkIG1hdGNoZWRcblx0aWYgKGVuZ2luZSA9PT0gbnVsbCkge1xuXHRcdGNvbnNvbGUubG9nKCdubyBrZXl3b3JkIG1hdGNoZWQnKTtcblx0XHRyZXR1cm47XG5cdH1cblx0Ly8gbm8gcGhyYXNlIHR5cGVkIGluIHlldCBhZnRlciB0aGUga2V5d29yZFxuXHRpZiAoIXNlYXJjaFRlcm0ubGVuZ3RoKSB7XG5cdFx0Y29uc29sZS5sb2coJ25vIHBocmFzZSB0eXBlZCBpbiB5ZXQgYWZ0ZXIgdGhlIGtleXdvcmQnKTtcblx0XHRyZXR1cm47XG5cdH1cblx0bGV0IGFjdGlvbiA9IGVuZ2luZS5hdXRvY29tcGxldGVBY3Rpb247XG5cdGxldCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoeydBY2NlcHQnOiBhY3Rpb24udHlwZX0pO1xuXHRsZXQgaW5pdCA9IHttZXRob2Q6IGFjdGlvbi5tZXRob2QsIGhlYWRlcnN9O1xuXHRsZXQgdXJsID0gc2VhcmNoSGVscGVyLmJ1aWxkU2VhcmNoVXJsKGVuZ2luZSwgYWN0aW9uLCBzZWFyY2hUZXJtKTtcblx0Y29uc29sZS5sb2coXG5cdFx0J3NlYXJjaFRlcm06Jywgc2VhcmNoVGVybSxcblx0XHQndXJsOicsIHVybCxcblx0XHQnZW5naW5lOicsIGVuZ2luZVxuXHQpO1xuXHRsZXQgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHVybCwgaW5pdCk7XG5cdFxuXHRmZXRjaChyZXF1ZXN0KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gc2VhcmNoSGVscGVyLmNyZWF0ZVN1Z2dlc3Rpb25zRnJvbVJlc3BvbnNlKGVuZ2luZSwgcmVzcG9uc2UpO1xuXHRcdH0pXG5cdFx0LnRoZW4oYWRkU3VnZ2VzdGlvbnMpXG5cdDtcbn0pO1xuXG4vKipcbiAqIFJlYWN0IHRvIGNob29zZW4gcGhyYXNlIG9yIHN1Z2dlc3Rpb24uXG4gKi9cbmJyb3dzZXIub21uaWJveC5vbklucHV0RW50ZXJlZC5hZGRMaXN0ZW5lcigodGV4dCwgZGlzcG9zaXRpb24pID0+IHtcblx0Y29uc29sZS5sb2coJ29uSW5wdXRFbnRlcmVkOiAnLCB0ZXh0LCBkaXNwb3NpdGlvbik7XG5cdC8vIGlmIHN1Z2dlc3Rpb24gd2FzIGNob29zZW4gdGhlbiB0aGUgdGV4dCBzaG91bGQgY29udGFpbiBhIGdvLXRvIFVSTFxuXHRsZXQgdXJsID0gdGV4dDtcblx0Ly8gc3VnZ2VzdGlvbiB3YXMgbm90IGNob29zZW4sIG11c3QgYnVpbGQgVVJMXG5cdGlmICh0ZXh0LnNlYXJjaCgvXmh0dHBzPzovKSAhPT0gMCkge1xuXHRcdGxldCBlbmdpbmVXaXRoVGVybSA9IHNlYXJjaEhlbHBlci5nZXRFbmdpbmUodGV4dCk7XG5cdFx0bGV0IHNlYXJjaFRlcm0gPSBlbmdpbmVXaXRoVGVybS50ZXh0O1xuXHRcdGxldCBlbmdpbmUgPSBlbmdpbmVXaXRoVGVybS5lbmdpbmU7XG5cdFx0Ly8gbm8gdmFsaWQgc2VhcmNoIHRvIGdvIHRvXG5cdFx0aWYgKGVuZ2luZSA9PT0gbnVsbCB8fCAhc2VhcmNoVGVybS5sZW5ndGgpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdubyB2YWxpZCBzZWFyY2ggdG8gZ28gdG8nLCB7XG5cdFx0XHRcdHRleHQ6IHRleHQsXG5cdFx0XHRcdGVuZ2luZTogZW5naW5lLFxuXHRcdFx0XHRzZWFyY2hUZXJtOiBzZWFyY2hUZXJtXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dXJsID0gc2VhcmNoSGVscGVyLmJ1aWxkU2VhcmNoVXJsKGVuZ2luZSwgZW5naW5lLm9wZW5BY3Rpb24sIHNlYXJjaFRlcm0pO1xuXHR9XG5cdC8vIGRlYnVnXG5cdGNvbnNvbGUubG9nKCdvbklucHV0RW50ZXJlZDogJywge1xuXHRcdHRleHQ6IHRleHQsIFxuXHRcdGRpc3Bvc2l0aW9uOiBkaXNwb3NpdGlvbiwgXG5cdFx0dXJsOiB1cmxcblx0fSk7XG5cdC8vIGNyZWF0ZSBvciB1cGRhdGUgdGFiIGFzIGV4cGVjdGVkXG5cdHN3aXRjaCAoZGlzcG9zaXRpb24pIHtcblx0XHRjYXNlICdjdXJyZW50VGFiJzpcblx0XHRcdGJyb3dzZXIudGFicy51cGRhdGUoe3VybH0pO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnbmV3Rm9yZWdyb3VuZFRhYic6XG5cdFx0XHRicm93c2VyLnRhYnMuY3JlYXRlKHt1cmx9KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ25ld0JhY2tncm91bmRUYWInOlxuXHRcdFx0YnJvd3Nlci50YWJzLmNyZWF0ZSh7dXJsLCBhY3RpdmU6IGZhbHNlfSk7XG5cdFx0XHRicmVhaztcblx0fVxufSk7XG4iLCJpbXBvcnQgU2VhcmNoRW5naW5lQWN0aW9uIGZyb20gJy4vU2VhcmNoRW5naW5lQWN0aW9uLmpzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBTZWFyY2hFbmdpbmUoZW5naW5lKSB7XHJcblx0dGhpcy5rZXl3b3JkcyA9IFtdO1xyXG5cdGlmICh0eXBlb2YgZW5naW5lLmtleXdvcmRzID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy5rZXl3b3Jkcy5wdXNoKGVuZ2luZS5rZXl3b3Jkcyk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHRoaXMua2V5d29yZHMgPSBlbmdpbmUua2V5d29yZHM7XHJcblx0fVxyXG5cdHRoaXMuYmFzZVVybCA9ICcnO1xyXG5cdGlmICh0eXBlb2YgZW5naW5lLmJhc2VVcmwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHR0aGlzLmJhc2VVcmwgPSBlbmdpbmUuYmFzZVVybDtcclxuXHR9XHJcblx0dGhpcy5vcGVuQWN0aW9uID0gbmV3IFNlYXJjaEVuZ2luZUFjdGlvbihlbmdpbmUub3BlbkFjdGlvbik7XHJcblx0dGhpcy5hdXRvY29tcGxldGVBY3Rpb24gPSBuZXcgU2VhcmNoRW5naW5lQWN0aW9uKGVuZ2luZS5hdXRvY29tcGxldGVBY3Rpb24pO1xyXG59XHJcbiIsImV4cG9ydCBmdW5jdGlvbiBTZWFyY2hFbmdpbmVBY3Rpb24oYWN0aW9uKSB7XHJcblx0dGhpcy51cmwgPSAnJztcclxuXHRpZiAodHlwZW9mIGFjdGlvbi51cmwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHR0aGlzLnVybCA9IGFjdGlvbi51cmw7XHJcblx0fVxyXG5cdHRoaXMubWV0aG9kID0gJ0dFVCc7XHJcblx0aWYgKHR5cGVvZiBhY3Rpb24ubWV0aG9kID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy5tZXRob2QgPSBhY3Rpb24ubWV0aG9kO1xyXG5cdH1cclxuXHR0aGlzLnR5cGUgPSAnJztcclxuXHRpZiAodHlwZW9mIGFjdGlvbi50eXBlID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy50eXBlID0gYWN0aW9uLnR5cGU7XHJcblx0fVxyXG5cdHRoaXMuZGF0YSA9IHt9O1xyXG5cdGlmICh0eXBlb2YgYWN0aW9uLmRhdGEgPT09ICdvYmplY3QnKSB7XHJcblx0XHR0aGlzLmRhdGEgPSBhY3Rpb24uZGF0YTtcclxuXHR9XHJcbn0iLCJpbXBvcnQgU2VhcmNoRW5naW5lIGZyb20gJy4vU2VhcmNoRW5naW5lLmpzJztcclxuLy9pbXBvcnQgU2VhcmNoRW5naW5lQWN0aW9uIGZyb20gJy4vU2VhcmNoRW5naW5lQWN0aW9uLmpzJztcclxuXHJcbi8qKlxyXG4gKiBQcmUtcGFyc2UgYWxsIHNldHRpbmdzLlxyXG4gKiBcclxuICogQFRPRE8gTWF5YmUgc3VwcG9ydCBlbmdpbmVzIGFycmF5IGxhdGVyPyBXb3VsZCBhbGxvdyBzdXBwb3J0IG9mIG11bGl0cGxlIGtleXdvcmRzLlxyXG4gKiBcclxuICogQHBhcmFtIHtPYmplY3R9IFNFVFRJTkdTIEdlbmVyYWwgc2V0dGluZ3Mgb2JqZWN0LlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZW5naW5lTWFwIEtleXdvcmQtYmFzZWQgc2VhcmNoIGVuZ2luZXMgbWFwLlxyXG4gKi9cclxuZnVuY3Rpb24gU2VhcmNoSGVscGVyIChTRVRUSU5HUywgZW5naW5lTWFwKSB7XHJcblx0dGhpcy5TRVRUSU5HUyA9IFNFVFRJTkdTO1xyXG5cdHRoaXMuZW5naW5lTWFwID0gZW5naW5lTWFwO1xyXG5cdGlmICh0eXBlb2YgZW5naW5lTWFwLmRlZmF1bHQgIT09ICdvYmplY3QnKSB7XHJcblx0XHR2YXIgZmlyc3RLZXl3b3JkID0gT2JqZWN0LmtleXMoZW5naW5lTWFwKVswXTtcclxuXHRcdHRoaXMuZW5naW5lTWFwLmRlZmF1bHQgPSB0aGlzLmVuZ2luZU1hcFtmaXJzdEtleXdvcmRdO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEJ1aWxkIHNlYXJjaCBVUkwgZm9yIHRoZSB0ZXh0LlxyXG4gKiBcclxuICogQHBhcmFtIHtTZWFyY2hFbmdpbmV9IGVuZ2luZSBFbmdpbmUgdG8gdXNlLlxyXG4gKiBAcGFyYW0ge1NlYXJjaEVuZ2luZUFjdGlvbn0gYWN0aW9uIEFjdGlvbiB0byBjYWxsIG9uIHRoZSBlbmdpbmUuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFNlYXJjaCB0ZXJtLlxyXG4gKi9cclxuU2VhcmNoSGVscGVyLnByb3RvdHlwZS5idWlsZFNlYXJjaFVybCA9IGZ1bmN0aW9uIChlbmdpbmUsIGFjdGlvbiwgdGV4dCkge1xyXG5cdGxldCB1cmwgPSBhY3Rpb24udXJsLnJlcGxhY2UoJ3tiYXNlVXJsfScsIGVuZ2luZS5iYXNlVXJsKTtcclxuXHRsZXQgZmlyc3QgPSB0cnVlO1xyXG5cdGZvciAobGV0IGtleSBpbiBhY3Rpb24uZGF0YSkge1xyXG5cdFx0bGV0IHZhbHVlID1cdGFjdGlvbi5kYXRhW2tleV0ucmVwbGFjZSgne3NlYXJjaFRlcm1zfScsIHRleHQpO1xyXG5cdFx0dXJsICs9IGZpcnN0ID8gJz8nIDogJyYnO1xyXG5cdFx0dXJsICs9IGAke2tleX09YCArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XHJcblx0XHRmaXJzdCA9IGZhbHNlO1xyXG5cdH1cclxuXHRyZXR1cm4gdXJsO1xyXG59XHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge09iamVjdH0gRW5naW5lV2l0aFRlcm1cclxuICogQHByb3BlcnR5IHtTZWFyY2hFbmdpbmV9IGVuZ2luZSBFbmdpbmUgdG8gdXNlLlxyXG4gKiBAcHJvcGVydHkge1N0cmluZ30gdGV4dCBUcmFuc2Zvcm1lZCBzZWFyY2ggdGVybS5cclxuICovXHJcblxyXG4vKipcclxuICogRmluZCBvdXQgd2hpY2ggZW5naW5lIHNob3VsZCBiZSB1c2VkIGJhc2VkIG9uIGVudGVyZWQgdGV4dC5cclxuICogXHJcbiAqIGBzYSAgc29tZXRoaW5nYCB1c2VzIGRlZmF1bHQgKGZpcnN0KSBlbmdpbmVcclxuICogYHNhIGAgc2hvdWxkIHNob3cgeW91IGEgbGlzdCBvZiBlbmdpbmVzIChpbiBmdXR1cmUpXHJcbiAqIGBzYSBhYCBzaG91bGQgc2hvdyB5b3UgYSBsaXN0IG9mIGVuZ2luZXMgd2l0aCBrZXl3b3JkcyBzdGFydGluZyB3aXRoIGBhYFxyXG4gKiBcclxuICogQHBhcmFtIHtTdHJpbmd9IHRleHQgU2VhcmNoIHRlcm0uXHJcbiAqIEByZXR1cm4ge0VuZ2luZVdpdGhUZXJtfSBFbmdpbmUgd2l0aCB0ZXJtIHN0cmlwcGVkIGZyb20gdGhlIGVuZ2luZSBrZXlvd3JkLlxyXG4gKi9cclxuU2VhcmNoSGVscGVyLnByb3RvdHlwZS5nZXRFbmdpbmUgPSBmdW5jdGlvbiAodGV4dCkge1xyXG5cdGxldCBrZXl3b3JkID0gbnVsbDtcclxuXHRsZXQgbWUgPSB0aGlzO1xyXG5cdHRleHQucmVwbGFjZSgvXihcXFMqKVxccysoLiopJC8sIGZ1bmN0aW9uKGEsIHdvcmQsIHJlc3Qpe1xyXG5cdFx0aWYgKCF3b3JkLmxlbmd0aCkge1xyXG5cdFx0XHRrZXl3b3JkID0gJ2RlZmF1bHQnO1xyXG5cdFx0XHR0ZXh0ID0gcmVzdDtcclxuXHRcdH0gZWxzZSBpZiAod29yZCBpbiBtZS5lbmdpbmVNYXApIHtcclxuXHRcdFx0a2V5d29yZCA9IHdvcmQ7XHJcblx0XHRcdHRleHQgPSByZXN0O1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cdGxldCBlbmdpbmU7XHJcblx0aWYgKGtleXdvcmQgPT09IG51bGwpIHtcclxuXHRcdGVuZ2luZSA9IG51bGw7XHJcblx0fSBlbHNlIHtcclxuXHRcdGVuZ2luZSA9IHRoaXMuZW5naW5lTWFwW2tleXdvcmRdO1xyXG5cdH1cclxuXHRyZXR1cm4ge1xyXG5cdFx0ZW5naW5lIDogZW5naW5lLFxyXG5cdFx0dGV4dCA6IHRleHRcclxuXHR9O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHN1Z2dlc3Rpb25zIGFycmF5IGZyb20gcmVzcG9uc2UuXHJcbiAqIFxyXG4gKiBAcGFyYW0ge1NlYXJjaEVuZ2luZX0gZW5naW5lIEVuZ2luZSB1c2VkLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgVGhlIHNlYXJjaCBlbmdpbmUgcmVzcG9uc2UuXHJcbiAqL1xyXG5TZWFyY2hIZWxwZXIucHJvdG90eXBlLmNyZWF0ZVN1Z2dlc3Rpb25zRnJvbVJlc3BvbnNlID0gZnVuY3Rpb24gKGVuZ2luZSwgcmVzcG9uc2UpIHtcclxuXHRyZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcblx0XHRsZXQgc3VnZ2VzdGlvbnMgPSBbXTtcclxuXHRcdGxldCBzdWdnZXN0aW9uc09uRW1wdHlSZXN1bHRzID0gW3tcclxuXHRcdFx0Y29udGVudDogZW5naW5lLmJhc2VVcmwsXHJcblx0XHRcdGRlc2NyaXB0aW9uOiAnTm8gcmVzdWx0cyBmb3VuZCdcclxuXHRcdH1dO1xyXG5cdFx0cmVzcG9uc2UuanNvbigpLnRoZW4oanNvbiA9PiB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdyZXNwb25zZTonLCBqc29uKTtcclxuXHRcdFx0aWYgKCFqc29uLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiByZXNvbHZlKHN1Z2dlc3Rpb25zT25FbXB0eVJlc3VsdHMpO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRsZXQgbWF4ID0gdGhpcy5TRVRUSU5HUy5NQVhfU1VHR0VTVElPTlM7XHJcblxyXG5cdFx0XHQvLyBmb3IgV2lraXBlZGlhOlxyXG5cdFx0XHQvLyBqc29uWzBdID0gc2VhcmNoIHRlcm1cclxuXHRcdFx0Ly8ganNvblsxXSA9IFsuLi50aXRsZXMuLi5dXHJcblx0XHRcdC8vIGpzb25bMl0gPSBbLi4uZGVzY3JpcHRpb25zLi4uXVxyXG5cdFx0XHQvLyBqc29uWzNdID0gWy4uLmRpcmVjdCB1cmxzLi4uXVxyXG5cdFx0XHRsZXQgdGl0bGVzID0ganNvblsxXTtcclxuXHRcdFx0bGV0IGRlc2NyaXB0aW9ucyA9IGpzb25bMl07XHJcblx0XHRcdGxldCB1cmxzID0ganNvblszXTtcclxuXHJcblx0XHRcdGlmICh0aXRsZXMubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHRcdHJldHVybiByZXNvbHZlKHN1Z2dlc3Rpb25zT25FbXB0eVJlc3VsdHMpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRsZXQgY291bnQgPSBNYXRoLm1pbih0aXRsZXMubGVuZ3RoLCBtYXgpO1xyXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuXHRcdFx0XHQvLyBnYXRoZXIgZGF0YVxyXG5cdFx0XHRcdGxldCB0aXRsZSA9IHRpdGxlc1tpXTtcclxuXHRcdFx0XHRsZXQgZGVzY3JpcHRpb24gPSB0aXRsZTtcclxuXHRcdFx0XHRpZiAoZGVzY3JpcHRpb25zICYmIHR5cGVvZiBkZXNjcmlwdGlvbnNbaV0gPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRkZXNjcmlwdGlvbiArPSBgIC0tICR7ZGVzY3JpcHRpb25zW2ldfWA7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGxldCB1cmwgPSAnJztcclxuXHRcdFx0XHRpZiAodXJscyAmJiB0eXBlb2YgdXJsc1tpXSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdHVybCA9IHVybHNbaV07XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHVybCA9IGJ1aWxkU2VhcmNoVXJsKGVuZ2luZSwgZW5naW5lLm9wZW5BY3Rpb24sIHRpdGxlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gYWRkIHN1Z2dlc3Rpb25cclxuXHRcdFx0XHRzdWdnZXN0aW9ucy5wdXNoKHtcclxuXHRcdFx0XHRcdGNvbnRlbnQ6IHVybCxcclxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzb2x2ZShzdWdnZXN0aW9ucyk7XHJcblx0XHR9KTtcclxuXHR9KTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2VhcmNoSGVscGVyOyJdfQ==

//# sourceMappingURL=background.js.map
