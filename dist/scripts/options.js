(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _SearchEngine = require('./inc/SearchEngine.js');

var _SearchEngine2 = _interopRequireDefault(_SearchEngine);

var _SearchEngineModel = require('./inc/SearchEngineModel.js');

var _SearchEngineModel2 = _interopRequireDefault(_SearchEngineModel);

var _wikiTemplate = require('./engines/wiki-template');

var _wikiTemplate2 = _interopRequireDefault(_wikiTemplate);

var _wikiEn = require('./engines/wiki-en');

var _wikiEn2 = _interopRequireDefault(_wikiEn);

var _wikiPl = require('./engines/wiki-pl');

var _wikiPl2 = _interopRequireDefault(_wikiPl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_wikiEn2.default, _wikiTemplate2.default);
Object.assign(_wikiPl2.default, _wikiTemplate2.default);

// load from storage
if (typeof browser != 'undefined') {
	browser.storage.local.get('engines').then(function (result) {
		if (!('engines' in result) || !Array.isArray(result.engines)) {
			console.warn('Engines are not an array!', result);
		} else {
			prepareEngines(result.engines);
		}
	}, function (failReason) {
		console.log('failReason', failReason);
	});
	// in-browser testing examples
} else {
	prepareEngines([_wikiEn2.default, _wikiPl2.default]);
}

/**
 * Prepare options managment.
 */
function prepareEngines(engines) {
	console.log(engines);
	var container = document.getElementById('engines-container');
	for (var e = 0; e < engines.length; e++) {
		var engine = new _SearchEngine2.default(engines[e]);

		var el = document.createElement('li');
		el.engine = engine;

		el.textContent = '[' + engine.keywords.join(',') + '] ' + engine.title;
		// edit
		var button = document.createElement('a');
		button.addEventListener('click', function () {
			var engine = this.parentNode.engine;
			editEngine(engine);
		});
		button.textContent = '✏️';
		el.appendChild(button);
		// append
		container.appendChild(el);
	}
}

function editEngine(engine) {
	console.log(engine);
	currentEngine.update(engine);
	app.EngineController.$apply();
}

window.currentEngine = new _SearchEngineModel2.default(new _SearchEngine2.default({
	title: 'Just a test',
	keyword: 't',
	baseUrl: 'http://test.localhost/'
}));

window.app = {};
angular.module('app', []).controller('EngineController', function ($scope) {
	app.EngineController = $scope;

	$scope.engine = currentEngine;
});

},{"./engines/wiki-en":2,"./engines/wiki-pl":3,"./engines/wiki-template":4,"./inc/SearchEngine.js":5,"./inc/SearchEngineModel.js":7}],2:[function(require,module,exports){
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

	this.title = '';
	if (typeof engine.title === 'string') {
		this.title = engine.title;
	} else {
		this.title = engine.baseUrl;
	}

	this.openAction = new _SearchEngineAction2.default(engine.openAction || {});
	this.autocompleteAction = new _SearchEngineAction2.default(engine.autocompleteAction || {});
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
/**
 * Observable search engine model.
 * 
 * @param {SearchEngine} engine Optional initial engine.
 */
function SearchEngineModel(engine) {
	this.keywords = '';
	this.baseUrl = '';
	this.title = '';
	this.actions = [];
	if (engine) {
		this.update(engine);
	}
};
/**
 * Update the engine model.
 * 
 * @param {SearchEngine} engine 
 */
SearchEngineModel.prototype.update = function (engine) {
	this.keywords = engine.keywords.join(',');
	this.baseUrl = engine.baseUrl;
	this.title = engine.title;
	this.actions.length = 0;
	this.addAction('open', engine.openAction);
	this.addAction('autocomplete', engine.autocompleteAction);
};

/**
 * Add action to collection.
 * 
 * @param {String} name Name of the action to display.
 * @param {SearchEngineAction} action 
 */
SearchEngineModel.prototype.addAction = function (name, action) {
	var data = [];
	for (var key in action.data) {
		data.push({
			key: key,
			value: action.data[key]
		});
	}
	this.actions.push({
		name: name,
		url: action.url,
		method: action.method,
		type: action.type,
		data: data
	});
};

exports.default = SearchEngineModel;

},{}]},{},[1])

