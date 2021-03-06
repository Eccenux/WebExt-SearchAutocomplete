'use strict';

import SearchEngine from './SearchEngine.js';
import SearchEngineModel from './SearchEngineModel.js';
import SearchCredential from './SearchCredential.js';

import wikiTemplateEngine from '../engines/wiki-template';
import enWikiEngine from '../engines/wiki-en';
import plWikiEngine from '../engines/wiki-pl';
Object.assign(enWikiEngine, wikiTemplateEngine);
Object.assign(plWikiEngine, wikiTemplateEngine);

const engineEditor = document.getElementById('engine-editor');
const exportImportEditor = document.getElementById('export-import');

import {getI18n} from '../inc/I18nHelper';

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
				prepareEngines(result.engines);
			}
			// seem to be required here (probably due to using promises when loading data)
			app.EngineController.$apply();
		}, function(failReason) {
			console.log('failReason', failReason);
		})
	// in-browser testing examples
	} else {
		prepareEngines([enWikiEngine, plWikiEngine, {
			title : 'Just a test',
			credential : 'test',
			keyword : 't',
			baseUrl : 'http://test.localhost/'
		},{
			title : 'Object autoc.',
			keyword : 'oa',
			baseUrl : 'http://oa.localhost/',
			autocompleteAction : {
				autocompleteType: 'objects',
				paths: {
					root: 'results',
					titles: 'name',
					descriptions: '',
					urls: 'url',
				},
			}
		}]);
	}
}

/**
 * Prepare a list of engines.
 */
function prepareEngines(engines, append) {
	console.log('prepareEngines: ', engines);
	let validation = {
		hasCredentials : false
	};
	if (!append) {
		app.EngineController.engines.length = 0;
	}
	for (let e = 0; e < engines.length; e++) {
		let engine = new SearchEngine(engines[e]);
		if (engine.credential.length) {
			validation.hasCredentials = true;
		}
		app.EngineController.engines.push(engine);
	}
	return validation;
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
	let engine = new SearchEngine({
		title : '',
		baseUrl : 'http://',
		openAction : {
			url : '{baseUrl}',
			data : {
				'...' : '{searchTerms}'
			}
		},
		autocompleteAction : {
			url : '{baseUrl}',
			method : 'GET',
			//type : 'application/x-suggestions+json',
			autocompleteType : 'OpenSearch',
			data : {
				'...' : '{searchTerms}'
			}
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
	let engine = new SearchEngine(currentEngine.getEngine());
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
		if (typeof browser != 'undefined') {
			browser.storage.local.set({
				'engines': app.EngineController.engines
			});
		} else {
			console.log('storeChanges', {
				'engines': app.EngineController.engines
			});
		}
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

function initEngineController($scope) {
	app.EngineController = $scope;

	$scope.currentEngine = new SearchEngineModel();
	$scope.engines = [];
	$scope.credentials = [];
	document.body.addEventListener('credentialsReady',
		function (event) {
			let credentials = event.detail;
			//console.log('credentials: ', credentials);
			$scope.credentials.length = 0;
			for (let c = 0; c < credentials.length; c++) {
				let credential = new SearchCredential(credentials[c]);
				$scope.credentials.push(credential);
			}
		}, false
	);

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
	$scope.undoEngineChanges = function(){
		engineEditor.style.display = 'none';
	};
	
	function exportFilter(key, value) {
		// Filtering out properties
		if (key.startsWith('$$') || key === 'disabledAutocomplete') {
			return undefined;
		}
		return value;
	}
	$scope.exportEngines = function(){
		$scope.enginesDump = JSON.stringify($scope.engines, exportFilter, '\t');
		exportImportEditor.style.display = 'block';
	};
	$scope.exportEngine = function(engine){
		$scope.enginesDump = JSON.stringify(engine, exportFilter, '\t');
		exportImportEditor.style.display = 'block';
	};
	$scope.prepareImport = function(){
		$scope.enginesDump = '';
		exportImportEditor.style.display = 'block';
	};
	$scope.importEngines = function(append){
		if (append || confirm(getI18n('options.confirmImport'))) {
			let engines = null;
			try {
				engines = JSON.parse($scope.enginesDump);
			} catch (error) {
				console.warn('Import failure:', error.message);
				engines = null;
			}
			// something went wrong
			if (engines === null || typeof engines !== 'object') {
				alert(getI18n('options.Import_failure'));
				return;
			}
			// single engine
			if (!Array.isArray(engines)) {
				if (!engines.autocompleteAction) {
					alert(getI18n('options.Import_failure'));
					return;
				} else {
					engines = [engines];
				}
			}
			let validation = prepareEngines(engines, append);
			exportImportEditor.style.display = 'none';
			if (validation.hasCredentials) {
				alert(getI18n('options.Import_contains_credentials'));
			}
		}
	};
	$scope.closeExportImport = function(){
		exportImportEditor.style.display = 'none';
	};

	loadEngines();
}

export {
	initEngineController,
};