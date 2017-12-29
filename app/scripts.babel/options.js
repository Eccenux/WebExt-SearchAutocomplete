'use strict';

import SearchEngine from './inc/SearchEngine.js';
import SearchEngineModel from './inc/SearchEngineModel.js';

import wikiTemplateEngine from './engines/wiki-template';
import enWikiEngine from './engines/wiki-en';
import plWikiEngine from './engines/wiki-pl';
Object.assign(enWikiEngine, wikiTemplateEngine);
Object.assign(plWikiEngine, wikiTemplateEngine);

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
	console.log(engines);
	app.EngineController.engines.length = 0;
	for (let e = 0; e < engines.length; e++) {
		let engine = new SearchEngine(engines[e]);
		engine.id = e;
		app.EngineController.engines.push(engine);
	}
	//app.EngineController.$apply();
}

/**
 * Load engine for editing.
 * @param {SearchEngine} engine 
 */
function editEngine(engine) {
	console.log(engine);
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
	engine.id = currentEngine.id;
	app.EngineController.engines[engine.id] = engine;
	//app.EngineController.$apply();
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