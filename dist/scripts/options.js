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

const engineEditor = document.getElementById('engine-editor');
const exportImportEditor = document.getElementById('export-import');

/**
 * Get I18n string.
 * 
 * Also a mock for in-browser testing.
 * @sa https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/getMessage
 */
let getI18n = typeof browser != 'undefined' ? browser.i18n.getMessage : function (messageName) {
	return messageName.replace(/_/g, ' ').replace(/^.+\./, '');
};

/**
 * Load engines from storage.
 */
function loadEngines() {
	if (typeof browser != 'undefined') {
		browser.storage.local.get('engines').then(function (result) {
			if (!('engines' in result) || !Array.isArray(result.engines)) {
				console.warn('Engines are not an array!', result);
			} else {
				prepareEngines(result.engines);
			}
			// seem to be required here (probably due to using promises when loading data)
			app.EngineController.$apply();
		}, function (failReason) {
			console.log('failReason', failReason);
		});
		// in-browser testing examples
	} else {
		prepareEngines([_wikiEn2.default, _wikiPl2.default, {
			title: 'Just a test',
			keyword: 't',
			baseUrl: 'http://test.localhost/'
		}]);
	}
}

/**
 * Prepare a list of engines.
 */
function prepareEngines(engines) {
	console.log('prepareEngines: ', engines);
	engineEditor.style.display = 'none';
	app.EngineController.engines.length = 0;
	for (let e = 0; e < engines.length; e++) {
		let engine = new _SearchEngine2.default(engines[e]);
		app.EngineController.engines.push(engine);
	}
}

/**
 * Load engine for editing.
 * @param {SearchEngine} engine 
 */
function editEngine(engine, index) {
	console.log('editEngine: ', engine, index);
	engine.id = index;
	app.EngineController.currentEngine.update(engine);
	//app.EngineController.$apply();
	engineEditor.style.display = 'block';
}
/**
 * Prepare new engine editor.
 */
function addEngine() {
	let engine = new _SearchEngine2.default({
		title: '',
		baseUrl: 'http://',
		openAction: {
			url: '{baseUrl}',
			data: {}
		},
		autocompleteAction: {
			url: '{baseUrl}',
			data: {}
		}
	});
	app.EngineController.currentEngine.update(engine);
	engineEditor.style.display = 'block';
};

/**
 * Save changes to engine.
 * @param {SearchEngineModel} currentEngine 
 */
function saveEngine(currentEngine) {
	console.log('saved:', currentEngine.id, currentEngine);
	let engine = new _SearchEngine2.default(currentEngine.getEngine());
	if (typeof currentEngine.id === 'number') {
		engine.id = currentEngine.id;
		app.EngineController.engines[engine.id] = engine;
	} else {
		engine.id = app.EngineController.engines.length;
		app.EngineController.engines.push(engine);
	}
	//app.EngineController.$apply();
	engineEditor.style.display = 'none';
}

/**
 * Force saving as a new engine.
 * @param {SearchEngineModel} currentEngine 
 */
function saveEngineCopy(currentEngine) {
	currentEngine.id = null;
	saveEngine(currentEngine);
	engineEditor.style.display = 'none';
}

/**
 * Store changes into browser memory
 */
function storeChanges() {
	if (confirm(getI18n('options.confirmPermanentStorage'))) {
		browser.storage.local.set({
			'engines': app.EngineController.engines
		});
	}
}
/**
 * Undo all changes and reload from storage
 */
function undoChanges() {
	if (confirm(getI18n('options.confirmReloadFromStorage'))) {
		loadEngines();
	}
}

window.app = {};
angular.module('app', []).filter('i18n', function () {
	return function (input) {
		return getI18n(input);
	};
}).controller('EngineController', function ($scope) {
	app.EngineController = $scope;

	$scope.currentEngine = new _SearchEngineModel2.default();
	$scope.engines = [];

	$scope.editEngine = editEngine;
	$scope.saveEngine = saveEngine;
	$scope.saveEngineCopy = saveEngineCopy;

	$scope.storeChanges = storeChanges;
	$scope.undoChanges = undoChanges;

	$scope.addData = function (action) {
		action.data.push({ key: '', value: '' });
	};
	$scope.removeData = function (action, index) {
		action.data.splice(index, 1);
	};

	$scope.addEngine = addEngine;
	$scope.removeEngine = function (engine, index) {
		$scope.engines.splice(index, 1);
	};
	$scope.undoEngineChanges = function () {
		engineEditor.style.display = 'none';
	};

	function exportFilter(key, value) {
		// Filtering out properties
		if (key.startsWith('$$')) {
			return undefined;
		}
		return value;
	}
	$scope.exportEngines = function () {
		$scope.enginesDump = JSON.stringify($scope.engines, exportFilter, '\t');
		exportImportEditor.style.display = 'block';
	};
	$scope.prepareImport = function () {
		$scope.enginesDump = '';
		exportImportEditor.style.display = 'block';
	};
	$scope.importEngines = function () {
		if (confirm(getI18n('options.confirmImport'))) {
			let engines;
			try {
				engines = JSON.parse($scope.enginesDump);
			} catch (error) {
				console.warn('Import failure:', error.message);
				alert(getI18n('options.Import_failure'));
				return;
			}
			prepareEngines(engines);
			exportImportEditor.style.display = 'none';
		}
	};
	$scope.closeExportImport = function () {
		exportImportEditor.style.display = 'none';
	};

	loadEngines();
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

	this.openAction = new _SearchEngineAction2.default(engine.openAction || {});
	this.autocompleteAction = new _SearchEngineAction2.default(engine.autocompleteAction || {});
}

exports.default = SearchEngine;

},{"./SearchEngineAction.js":6}],6:[function(require,module,exports){
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
	this.id = null;
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
	this.id = engine.id;
	this.keywords = engine.keywords.join(',');
	this.baseUrl = engine.baseUrl;
	this.title = engine.title;
	this.actions.length = 0;
	this.addAction('open', engine.openAction);
	this.addAction('autocomplete', engine.autocompleteAction);
};

/**
 * Recreate engine definition from the model.
 */
SearchEngineModel.prototype.getEngine = function () {
	let engine = {};
	engine.id = this.id;
	engine.keywords = this.keywords;
	engine.baseUrl = this.baseUrl;
	engine.title = this.title;
	for (let a = 0; a < this.actions.length; a++) {
		const action = this.actions[a];
		let data = {};
		for (let d = 0; d < action.data.length; d++) {
			const dat = action.data[d];
			data[dat.key] = dat.value;
		}
		engine[`${action.name}Action`] = {
			url: action.url,
			method: action.method,
			type: action.type,
			data: data
		};
	}
	return engine;
};

/**
 * Add action to collection.
 * 
 * @param {String} name Name of the action to display.
 * @param {SearchEngineAction} action 
 */
SearchEngineModel.prototype.addAction = function (name, action) {
	let data = [];
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

