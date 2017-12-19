'use strict';

import SearchEngine from './inc/SearchEngine.js';

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
} else {
	let engineExample = {
		keyword : 'example',
		baseUrl : 'http://localhost/',
		openAction : {},
		autocompleteAction : {}
	};		
	let engineEg = JSON.parse(JSON.stringify(engineExample));	// clone
	engineEg.baseUrl = 'http://eg.localhost/';
	engineEg.keyword = 'eg';
	prepareEngines([engineExample,engineEg]);
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
		container.appendChild(el);
	}
}