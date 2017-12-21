'use strict';

import SearchEngine from './inc/SearchEngine.js';
import SearchEngineModel from './inc/SearchEngineModel.js';

import wikiTemplateEngine from './engines/wiki-template';
import enWikiEngine from './engines/wiki-en';
import plWikiEngine from './engines/wiki-pl';
Object.assign(enWikiEngine, wikiTemplateEngine);
Object.assign(plWikiEngine, wikiTemplateEngine);

// load from storage
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
	prepareEngines([enWikiEngine, plWikiEngine]);
}

/**
 * Prepare options managment.
 */
function prepareEngines(engines) {
	console.log(engines);
	let container = document.getElementById('engines-container');
	for (let e = 0; e < engines.length; e++) {
		let engine = new SearchEngine(engines[e]);
		
		let el = document.createElement('li');
		el.engine = engine;
		
		el.textContent = `[${engine.keywords.join(',')}] ${engine.title}`;
		// edit
		let button = document.createElement('a');
		button.addEventListener('click', function(){
			let engine = this.parentNode.engine;
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

window.currentEngine = new SearchEngineModel(new SearchEngine({
	title : 'Just a test',
	keyword : 't',
	baseUrl : 'http://test.localhost/'
}));

window.app = {};
angular
	.module('app', [])
	.controller('EngineController', function($scope) {
		app.EngineController = $scope;

		$scope.engine = currentEngine;
	})
;