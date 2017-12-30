'use strict';

import SearchEngine from './inc/SearchEngine.js';
import SearchEngineModel from './inc/SearchEngineModel.js';

import wikiTemplateEngine from './engines/wiki-template';
import enWikiEngine from './engines/wiki-en';
import plWikiEngine from './engines/wiki-pl';
Object.assign(enWikiEngine, wikiTemplateEngine);
Object.assign(plWikiEngine, wikiTemplateEngine);

/**
 * Get I18n string.
 * 
 * Also a mock for in-browser testing.
 * @sa https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/getMessage
 */
let getI18n = (typeof browser != 'undefined') ? browser.i18n.getMessage : function(messageName) {
	return messageName;
};

/**
 * Load engines from storage.
 */
function loadEngines() {
	if (typeof browser != 'undefined') {
		browser.storage.local.get('engines')
		.then(function(result){
			if (!('engines' in result) || !Array.isArray(result.engines)) {
				console.warn('Engines are not an array!', result);
			} else {
				prepareEngines(result.engines)
			}
		}, function(failReason) {
			console.log('failReason', failReason);
		})
	// in-browser testing examples
	} else {
		prepareEngines([enWikiEngine, plWikiEngine, {
			title : 'Just a test',
			keyword : 't',
			baseUrl : 'http://test.localhost/'
		}]);
	}
}

/**
 * Prepare a list of engines.
 */
function prepareEngines(engines) {
	console.log('prepareEngines: ', engines);
	app.EngineController.engines.length = 0;
	for (let e = 0; e < engines.length; e++) {
		let engine = new SearchEngine(engines[e]);
		app.EngineController.engines.push(engine);
	}
	// seem to be required when working with FF (probably due to using promises when loading data)
	if (typeof browser != 'undefined') {
		app.EngineController.$apply();
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
}
/**
 * Prepare new engine editor.
 */
function addEngine() {
	let engine = new SearchEngine({
		title : '',
		baseUrl : 'http://',
		openAction : {
			url : '{baseUrl}',
			data : {}
		},
		autocompleteAction : {
			url : '{baseUrl}',
			data : {}
		}
	});
	app.EngineController.currentEngine.update(engine);
};

/**
 * Save changes to engine.
 * @param {SearchEngineModel} currentEngine 
 */
function saveEngine(currentEngine) {
	console.log('saved:', currentEngine.id, currentEngine);
	let engine = new SearchEngine(currentEngine.getEngine());
	if (typeof currentEngine.id === 'number') {
		engine.id = currentEngine.id;
		app.EngineController.engines[engine.id] = engine;
	} else {
		engine.id = app.EngineController.engines.length;
		app.EngineController.engines.push(engine);
	}
	//app.EngineController.$apply();
}

/**
 * Force saving as a new engine.
 * @param {SearchEngineModel} currentEngine 
 */
function saveEngineCopy(currentEngine) {
	currentEngine.id = null;
	saveEngine(currentEngine);
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
angular
	.module('app', [])
	.controller('EngineController', function($scope) {
		app.EngineController = $scope;

		$scope.currentEngine = new SearchEngineModel();
		$scope.engines = [];

		$scope.editEngine = editEngine;
		$scope.saveEngine = saveEngine;
		$scope.saveEngineCopy = saveEngineCopy;

		$scope.storeChanges = storeChanges;
		$scope.undoChanges = undoChanges;

		$scope.addData = function(action){
			action.data.push({key:'', value:''});
		};
		$scope.removeData = function(action, index){
			action.data.splice(index, 1);
		};

		$scope.addEngine = addEngine;
		$scope.removeEngine = function(engine, index){
			$scope.engines.splice(index, 1);
		};

		loadEngines();
	})
;