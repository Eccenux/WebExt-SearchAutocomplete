'use strict';

import SearchEngine from './inc/SearchEngine.js';
import SearchEngineModel from './inc/SearchEngineModel.js';

import wikiTemplateEngine from './engines/wiki-template';
import enWikiEngine from './engines/wiki-en';
import plWikiEngine from './engines/wiki-pl';
Object.assign(enWikiEngine, wikiTemplateEngine);
Object.assign(plWikiEngine, wikiTemplateEngine);

// load from storage
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
 * Prepare options managment.
 */
function prepareEngines(engines) {
	console.log(engines);
	app.EngineController.engines.length = 0;
	for (let e = 0; e < engines.length; e++) {
		let engine = new SearchEngine(engines[e]);
		app.EngineController.engines.push(engine);
	}
	//app.EngineController.$apply();
}

function editEngine(engine) {
	console.log(engine);
	app.EngineController.currentEngine.update(engine);
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

		loadEngines();
	})
;