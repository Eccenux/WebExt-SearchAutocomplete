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
var searchHelper = new _SearchHelper2.default(SETTINGS);

browser.omnibox.setDefaultSuggestion({
	description: 'Type in your search engine keyword and then your search terms.'
});

browser.omnibox.onInputChanged.addListener(function (text, addSuggestions) {
	var engine = enWikiEngine;
	var action = engine.autocompleteAction;
	var headers = new Headers({ 'Accept': action.type });
	var init = { method: action.method, headers: headers };
	var url = searchHelper.buildSearchUrl(engine, action, text);
	console.log('url:', url);
	var request = new Request(url, init);

	fetch(request).then(function (response) {
		return searchHelper.createSuggestionsFromResponse(engine, response);
	}).then(addSuggestions);
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

var _SearchEngine = require('./SearchEngine.js');

var _SearchEngine2 = _interopRequireDefault(_SearchEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import SearchEngineAction from './SearchEngineAction.js';

function SearchHelper(SETTINGS) {
	this.SETTINGS = SETTINGS;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L19Ud29yY3pvc2MvV2ViRXh0ZW5zaW9ucy9GRkV4dC9TZWFyY2hBdXRvY29tcGxldGUvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFwcFxcc2NyaXB0cy5iYWJlbFxcYmFja2dyb3VuZC5qcyIsImQ6XFxfVHdvcmN6b3NjXFxXZWJFeHRlbnNpb25zXFxGRkV4dFxcU2VhcmNoQXV0b2NvbXBsZXRlXFxhcHBcXHNjcmlwdHMuYmFiZWxcXGluY1xcU2VhcmNoRW5naW5lLmpzIiwiZDpcXF9Ud29yY3pvc2NcXFdlYkV4dGVuc2lvbnNcXEZGRXh0XFxTZWFyY2hBdXRvY29tcGxldGVcXGFwcFxcc2NyaXB0cy5iYWJlbFxcaW5jXFxTZWFyY2hFbmdpbmVBY3Rpb24uanMiLCJkOlxcX1R3b3Jjem9zY1xcV2ViRXh0ZW5zaW9uc1xcRkZFeHRcXFNlYXJjaEF1dG9jb21wbGV0ZVxcYXBwXFxzY3JpcHRzLmJhYmVsXFxpbmNcXFNlYXJjaEhlbHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQUVBOzs7O0FBcUNBOzs7Ozs7QUFsQ0EsSUFBTSxXQUFXO0FBQ2hCLGtCQUFrQjs7QUFHbkI7Ozs7O0FBSmlCLENBQWpCLENBU0EsSUFBTSxlQUFlO0FBQ3BCLFdBQVcsQ0FBQyxJQUFELENBRFM7QUFFcEIsVUFBVSwyQkFGVTtBQUdwQixhQUFZO0FBQ1gsT0FBTSxXQURLO0FBRVgsVUFBUyxLQUZFO0FBR1gsUUFBTztBQUNOLFdBQVMsZUFESDtBQUVOLGFBQVU7QUFGSjtBQUhJLEVBSFE7QUFXcEIscUJBQW9CO0FBQ25CLE9BQU0sb0JBRGE7QUFFbkIsVUFBUyxLQUZVO0FBR25CLFFBQU8sZ0NBSFk7QUFJbkIsUUFBTztBQUNOLFdBQVMsWUFESDtBQUVOLFdBQVM7QUFGSDtBQUpZOztBQVdyQjtBQUNBO0FBQ0E7QUF4QnFCLENBQXJCO0FBMEJBLElBQUksZUFBZSwyQkFBaUIsUUFBakIsQ0FBbkI7O0FBRUEsUUFB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LFFBQUksUUFBUSxPQUFPLENBQVAsQ0FBWjtBQUNBLFFBQUksY0FBYyxLQUFsQjtBQUNBLFFBQUksZ0JBQWdCLE9BQU8sYUFBYSxDQUFiLENBQVAsS0FBMkIsUUFBL0MsRUFBeUQ7QUFDeEQsNkJBQXNCLGFBQWEsQ0FBYixDQUF0QjtBQUNBO0FBQ0QsUUFBSSxNQUFNLEVBQVY7QUFDQSxRQUFJLFFBQVEsT0FBTyxLQUFLLENBQUwsQ0FBUCxLQUFtQixRQUEvQixFQUF5QztBQUN4QyxXQUFNLEtBQUssQ0FBTCxDQUFOO0FBQ0EsS0FGRCxNQUVPO0FBQ04sV0FBTSxlQUFlLE1BQWYsRUFBdUIsT0FBTyxVQUE5QixFQUEwQyxLQUExQyxDQUFOO0FBQ0E7QUFDRDtBQUNBLGdCQUFZLElBQVosQ0FBaUI7QUFDaEIsY0FBUyxHQURPO0FBRWhCLGtCQUFhO0FBRkcsS0FBakI7QUFJQTtBQUNELFVBQU8sUUFBUSxXQUFSLENBQVA7QUFDQSxHQTFDRDtBQTJDQSxFQWpETSxDQUFQO0FBa0RBLENBbkREOztrQkFxRGUsWSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWFpbiBzZXR0aW5ncy5cbiAqL1xuY29uc3QgU0VUVElOR1MgPSB7XG5cdE1BWF9TVUdHRVNUSU9OUyA6IDZcbn1cblxuLyoqXG5cdEV4YW1wbGUgZW5naW5lLlxuXHRcblx0Um91Z2hseSBjb21wYXRpYmxlIHdpdGggYE9wZW5TZWFyY2hEZXNjcmlwdGlvbmAuXG4qL1xuY29uc3QgZW5XaWtpRW5naW5lID0ge1xuXHRrZXl3b3JkcyA6IFsnZW4nXSxcblx0YmFzZVVybCA6ICdodHRwczovL2VuLndpa2lwZWRpYS5vcmcvJyxcblx0b3BlbkFjdGlvbjoge1xuXHRcdHVybCA6ICd7YmFzZVVybH0nLFxuXHRcdG1ldGhvZCA6ICdHRVQnLFxuXHRcdGRhdGEgOiB7XG5cdFx0XHRzZWFyY2ggOiAne3NlYXJjaFRlcm1zfScsXG5cdFx0XHRzb3VyY2VpZDogJ01vemlsbGEtc2VhcmNoJ1xuXHRcdH1cblx0fSxcblx0YXV0b2NvbXBsZXRlQWN0aW9uOiB7XG5cdFx0dXJsIDogJ3tiYXNlVXJsfXcvYXBpLnBocCcsXG5cdFx0bWV0aG9kIDogJ0dFVCcsXG5cdFx0dHlwZSA6ICdhcHBsaWNhdGlvbi94LXN1Z2dlc3Rpb25zK2pzb24nLFxuXHRcdGRhdGEgOiB7XG5cdFx0XHRhY3Rpb24gOiAnb3BlbnNlYXJjaCcsXG5cdFx0XHRzZWFyY2ggOiAne3NlYXJjaFRlcm1zfSdcblx0XHR9XG5cdH1cbn1cblxuLy9cbi8vIE9tbmlib3ggc2V0dXBcbi8vXG5pbXBvcnQgU2VhcmNoSGVscGVyIGZyb20gJy4vaW5jL1NlYXJjaEhlbHBlci5qcyc7XG5sZXQgc2VhcmNoSGVscGVyID0gbmV3IFNlYXJjaEhlbHBlcihTRVRUSU5HUyk7XG5cbmJyb3dzZXIub21uaWJveC5zZXREZWZhdWx0U3VnZ2VzdGlvbih7XG5cdGRlc2NyaXB0aW9uOiAnVHlwZSBpbiB5b3VyIHNlYXJjaCBlbmdpbmUga2V5d29yZCBhbmQgdGhlbiB5b3VyIHNlYXJjaCB0ZXJtcy4nXG59KTtcblxuYnJvd3Nlci5vbW5pYm94Lm9uSW5wdXRDaGFuZ2VkLmFkZExpc3RlbmVyKCh0ZXh0LCBhZGRTdWdnZXN0aW9ucykgPT4ge1xuXHRsZXQgZW5naW5lID0gZW5XaWtpRW5naW5lO1xuXHRsZXQgYWN0aW9uID0gZW5naW5lLmF1dG9jb21wbGV0ZUFjdGlvbjtcblx0bGV0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyh7J0FjY2VwdCc6IGFjdGlvbi50eXBlfSk7XG5cdGxldCBpbml0ID0ge21ldGhvZDogYWN0aW9uLm1ldGhvZCwgaGVhZGVyc307XG5cdGxldCB1cmwgPSBzZWFyY2hIZWxwZXIuYnVpbGRTZWFyY2hVcmwoZW5naW5lLCBhY3Rpb24sIHRleHQpO1xuXHRjb25zb2xlLmxvZygndXJsOicsIHVybCk7XG5cdGxldCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QodXJsLCBpbml0KTtcblx0XG5cdGZldGNoKHJlcXVlc3QpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKXtcblx0XHRcdHJldHVybiBzZWFyY2hIZWxwZXIuY3JlYXRlU3VnZ2VzdGlvbnNGcm9tUmVzcG9uc2UoZW5naW5lLCByZXNwb25zZSk7XG5cdFx0fSlcblx0XHQudGhlbihhZGRTdWdnZXN0aW9ucylcblx0O1xufSk7IiwiaW1wb3J0IFNlYXJjaEVuZ2luZUFjdGlvbiBmcm9tICcuL1NlYXJjaEVuZ2luZUFjdGlvbi5qcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gU2VhcmNoRW5naW5lKGVuZ2luZSkge1xyXG5cdHRoaXMua2V5d29yZHMgPSBbXTtcclxuXHRpZiAodHlwZW9mIGVuZ2luZS5rZXl3b3JkcyA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMua2V5d29yZHMucHVzaChlbmdpbmUua2V5d29yZHMpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHR0aGlzLmtleXdvcmRzID0gZW5naW5lLmtleXdvcmRzO1xyXG5cdH1cclxuXHR0aGlzLmJhc2VVcmwgPSAnJztcclxuXHRpZiAodHlwZW9mIGVuZ2luZS5iYXNlVXJsID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy5iYXNlVXJsID0gZW5naW5lLmJhc2VVcmw7XHJcblx0fVxyXG5cdHRoaXMub3BlbkFjdGlvbiA9IG5ldyBTZWFyY2hFbmdpbmVBY3Rpb24oZW5naW5lLm9wZW5BY3Rpb24pO1xyXG5cdHRoaXMuYXV0b2NvbXBsZXRlQWN0aW9uID0gbmV3IFNlYXJjaEVuZ2luZUFjdGlvbihlbmdpbmUuYXV0b2NvbXBsZXRlQWN0aW9uKTtcclxufVxyXG4iLCJleHBvcnQgZnVuY3Rpb24gU2VhcmNoRW5naW5lQWN0aW9uKGFjdGlvbikge1xyXG5cdHRoaXMudXJsID0gJyc7XHJcblx0aWYgKHR5cGVvZiBhY3Rpb24udXJsID09PSAnc3RyaW5nJykge1xyXG5cdFx0dGhpcy51cmwgPSBhY3Rpb24udXJsO1xyXG5cdH1cclxuXHR0aGlzLm1ldGhvZCA9ICdHRVQnO1xyXG5cdGlmICh0eXBlb2YgYWN0aW9uLm1ldGhvZCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMubWV0aG9kID0gYWN0aW9uLm1ldGhvZDtcclxuXHR9XHJcblx0dGhpcy50eXBlID0gJyc7XHJcblx0aWYgKHR5cGVvZiBhY3Rpb24udHlwZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHRoaXMudHlwZSA9IGFjdGlvbi50eXBlO1xyXG5cdH1cclxuXHR0aGlzLmRhdGEgPSB7fTtcclxuXHRpZiAodHlwZW9mIGFjdGlvbi5kYXRhID09PSAnb2JqZWN0Jykge1xyXG5cdFx0dGhpcy5kYXRhID0gYWN0aW9uLmRhdGE7XHJcblx0fVxyXG59IiwiaW1wb3J0IFNlYXJjaEVuZ2luZSBmcm9tICcuL1NlYXJjaEVuZ2luZS5qcyc7XHJcbi8vaW1wb3J0IFNlYXJjaEVuZ2luZUFjdGlvbiBmcm9tICcuL1NlYXJjaEVuZ2luZUFjdGlvbi5qcyc7XHJcblxyXG5mdW5jdGlvbiBTZWFyY2hIZWxwZXIgKFNFVFRJTkdTKSB7XHJcblx0dGhpcy5TRVRUSU5HUyA9IFNFVFRJTkdTO1xyXG59XHJcblxyXG4vKipcclxuICogQnVpbGQgc2VhcmNoIFVSTCBmb3IgdGhlIHRleHQuXHJcbiAqIFxyXG4gKiBAcGFyYW0ge1NlYXJjaEVuZ2luZX0gZW5naW5lIEVuZ2luZSB0byB1c2UuXHJcbiAqIEBwYXJhbSB7U2VhcmNoRW5naW5lQWN0aW9ufSBhY3Rpb24gQWN0aW9uIHRvIGNhbGwgb24gdGhlIGVuZ2luZS5cclxuICogQHBhcmFtIHtTdHJpbmd9IHRleHQgU2VhcmNoIHRlcm0uXHJcbiAqL1xyXG5TZWFyY2hIZWxwZXIucHJvdG90eXBlLmJ1aWxkU2VhcmNoVXJsID0gZnVuY3Rpb24gKGVuZ2luZSwgYWN0aW9uLCB0ZXh0KSB7XHJcblx0bGV0IHVybCA9IGFjdGlvbi51cmwucmVwbGFjZSgne2Jhc2VVcmx9JywgZW5naW5lLmJhc2VVcmwpO1xyXG5cdGxldCBmaXJzdCA9IHRydWU7XHJcblx0Zm9yIChsZXQga2V5IGluIGFjdGlvbi5kYXRhKSB7XHJcblx0XHRsZXQgdmFsdWUgPVx0YWN0aW9uLmRhdGFba2V5XS5yZXBsYWNlKCd7c2VhcmNoVGVybXN9JywgdGV4dCk7XHJcblx0XHR1cmwgKz0gZmlyc3QgPyAnPycgOiAnJic7XHJcblx0XHR1cmwgKz0gYCR7a2V5fT1gICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcclxuXHRcdGZpcnN0ID0gZmFsc2U7XHJcblx0fVxyXG5cdHJldHVybiB1cmw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgc3VnZ2VzdGlvbnMgYXJyYXkgZnJvbSByZXNwb25zZS5cclxuICogXHJcbiAqIEBwYXJhbSB7U2VhcmNoRW5naW5lfSBlbmdpbmUgRW5naW5lIHVzZWQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBUaGUgc2VhcmNoIGVuZ2luZSByZXNwb25zZS5cclxuICovXHJcblNlYXJjaEhlbHBlci5wcm90b3R5cGUuY3JlYXRlU3VnZ2VzdGlvbnNGcm9tUmVzcG9uc2UgPSBmdW5jdGlvbiAoZW5naW5lLCByZXNwb25zZSkge1xyXG5cdHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuXHRcdGxldCBzdWdnZXN0aW9ucyA9IFtdO1xyXG5cdFx0bGV0IHN1Z2dlc3Rpb25zT25FbXB0eVJlc3VsdHMgPSBbe1xyXG5cdFx0XHRjb250ZW50OiBlbmdpbmUuYmFzZVVybCxcclxuXHRcdFx0ZGVzY3JpcHRpb246ICdObyByZXN1bHRzIGZvdW5kJ1xyXG5cdFx0fV07XHJcblx0XHRyZXNwb25zZS5qc29uKCkudGhlbihqc29uID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3Jlc3BvbnNlOicsIGpzb24pO1xyXG5cdFx0XHRpZiAoIWpzb24ubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlc29sdmUoc3VnZ2VzdGlvbnNPbkVtcHR5UmVzdWx0cyk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGxldCBtYXggPSB0aGlzLlNFVFRJTkdTLk1BWF9TVUdHRVNUSU9OUztcclxuXHJcblx0XHRcdC8vIGZvciBXaWtpcGVkaWE6XHJcblx0XHRcdC8vIGpzb25bMF0gPSBzZWFyY2ggdGVybVxyXG5cdFx0XHQvLyBqc29uWzFdID0gWy4uLnRpdGxlcy4uLl1cclxuXHRcdFx0Ly8ganNvblsyXSA9IFsuLi5kZXNjcmlwdGlvbnMuLi5dXHJcblx0XHRcdC8vIGpzb25bM10gPSBbLi4uZGlyZWN0IHVybHMuLi5dXHJcblx0XHRcdGxldCB0aXRsZXMgPSBqc29uWzFdO1xyXG5cdFx0XHRsZXQgZGVzY3JpcHRpb25zID0ganNvblsyXTtcclxuXHRcdFx0bGV0IHVybHMgPSBqc29uWzNdO1xyXG5cclxuXHRcdFx0aWYgKHRpdGxlcy5sZW5ndGggPCAxKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlc29sdmUoc3VnZ2VzdGlvbnNPbkVtcHR5UmVzdWx0cyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGxldCBjb3VudCA9IE1hdGgubWluKHRpdGxlcy5sZW5ndGgsIG1heCk7XHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG5cdFx0XHRcdC8vIGdhdGhlciBkYXRhXHJcblx0XHRcdFx0bGV0IHRpdGxlID0gdGl0bGVzW2ldO1xyXG5cdFx0XHRcdGxldCBkZXNjcmlwdGlvbiA9IHRpdGxlO1xyXG5cdFx0XHRcdGlmIChkZXNjcmlwdGlvbnMgJiYgdHlwZW9mIGRlc2NyaXB0aW9uc1tpXSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uICs9IGAgLS0gJHtkZXNjcmlwdGlvbnNbaV19YDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bGV0IHVybCA9ICcnO1xyXG5cdFx0XHRcdGlmICh1cmxzICYmIHR5cGVvZiB1cmxzW2ldID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0dXJsID0gdXJsc1tpXTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dXJsID0gYnVpbGRTZWFyY2hVcmwoZW5naW5lLCBlbmdpbmUub3BlbkFjdGlvbiwgdGl0bGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBhZGQgc3VnZ2VzdGlvblxyXG5cdFx0XHRcdHN1Z2dlc3Rpb25zLnB1c2goe1xyXG5cdFx0XHRcdFx0Y29udGVudDogdXJsLFxyXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXNvbHZlKHN1Z2dlc3Rpb25zKTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTZWFyY2hIZWxwZXI7Il19

//# sourceMappingURL=background.js.map
