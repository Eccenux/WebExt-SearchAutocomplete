'use strict';

const assert = require('chai').assert;

/**
 * Example engine(s).
 */
let engineExample = {
	baseUrl : 'http://localhost/',
	openAction : {
		url : '{baseUrl}',
		data : {}
	},
	autocompleteAction : {
		url : '{baseUrl}',
		data : {}
	}
};

	
import ObjectsArrayParser from '../app/scripts.babel/inc/resultParsers/ObjectsArrayParser';
import SearchEngine from '../app/scripts.babel/inc/SearchEngine.js';

describe('ObjectsArrayParser', function () {
	// make basic objects engine
	let objectsEngineBase = JSON.parse(JSON.stringify(engineExample));	// clone
	objectsEngineBase.autocompleteAction.autocompleteType = 'objects';
	objectsEngineBase.autocompleteAction.paths = {
		root: '',
		titles: '',
		descriptions: '',
		urls: '',
	};

	describe('getByPath (static)', function () {
		let parser = new ObjectsArrayParser();
		it('Should find by key', function () {
			var result = parser.getByPath({'abc': 1}, 'abc');
			assert.strictEqual(result, 1);
		});
		it('Should be empty on failure', function () {
			var result = parser.getByPath({'abc': 1}, 'abcdef');
			assert.strictEqual(result, '');
			var result = parser.getByPath({'abc': 1}, '');
			assert.strictEqual(result, '');
		});
	});

	describe('init', function () {
		let parser = new ObjectsArrayParser();
		it('Should find invalid engines', function () {
			let engine;

			let testEngine = JSON.parse(JSON.stringify(objectsEngineBase));	// clone
			testEngine.autocompleteAction.paths = {};
			engine = new SearchEngine(testEngine);
			parser.init(engine);
			assert.isFalse(parser.valid, 'Empty paths object should be invalid');

			testEngine.autocompleteAction.paths = {
				root: '',
				titles: '',
				descriptions: '',
				urls: '',
			};
			engine = new SearchEngine(testEngine);
			parser.init(engine);
			assert.isFalse(parser.valid, 'Empty titles should be invalid');

			testEngine.autocompleteAction.paths = {
				root: '',
				titles: 'something',
				descriptions: '',
				urls: '',
			};
			engine = new SearchEngine(testEngine);
			parser.init(engine);
			assert.isTrue(parser.valid, 'Non-empty titles should be enough');
		});
		it('Should initialize paths', function () {
			let engine;

			let testEngine = JSON.parse(JSON.stringify(objectsEngineBase));	// clone
			testEngine.autocompleteAction.paths = {
				root: 'a',
				titles: 'b',
				descriptions: 'c',
				urls: 'd',
			};
			engine = new SearchEngine(testEngine);
			parser.init(engine);
			assert.hasAllKeys(parser.paths, testEngine.autocompleteAction.paths, 'Should have all paths initialized');
			// check values are the same
			for (const key in testEngine.autocompleteAction.paths) {
				if (testEngine.autocompleteAction.paths.hasOwnProperty(key)) {
					assert.equal(parser.paths[key], testEngine.autocompleteAction.paths[key]);
				}
			}
			// make sure internal paths are disconnected from original object
			assert.equal(parser.paths.root, testEngine.autocompleteAction.paths.root, 'Should still equal');
			testEngine.autocompleteAction.paths.root = 'something completely different';
			assert.notEqual(parser.paths.root, testEngine.autocompleteAction.paths.root, 'Should be different');
		});
	});

	describe('AMO results test', function () {
		let parser = new ObjectsArrayParser();
		// make AMO (addon mozilla org) engine
		let amoEngine = JSON.parse(JSON.stringify(objectsEngineBase));	// clone
		amoEngine.autocompleteAction.paths = {
			root: 'results',
			titles: 'name',
			descriptions: '',
			urls: 'url',
		};
		let engine = new SearchEngine(amoEngine);
		parser.init(engine);
	
		it('Should parse example result', function () {
			let response = {
				'results': [
					{
						'id': 689182,
						'icon_url': 'https://addons.cdn.mozilla.net/user-media/addon_icons/689/689182-64.png?modified=1510633221',
						'name': 'Search and New Tab by Yahoo',
						'url': 'https://addons.mozilla.org/en-US/firefox/addon/search-and-new-tab-by-yahoo/'
					},
					{
						'id': 455926,
						'icon_url': 'https://addons.cdn.mozilla.net/user-media/addon_icons/455/455926-64.png?modified=1505062686',
						'name': 'Search image',
						'url': 'https://addons.mozilla.org/en-US/firefox/addon/search-image/'
					},
					{
						'id': 455926,
						'icon_url': 'https://addons.cdn.mozilla.net/user-media/addon_icons/455/455926-64.png?modified=1505062686',
						'name': '',
						'url': ''
					},
				]
			}
			var result = parser.parse(response);
			assert.hasAllKeys(result, ['titles', 'descriptions', 'urls']);
			//console.log(result);
			assert.isNull(result.descriptions, 'Descriptions path is empty and the array should be null');
			assert.equal(result.titles.length, response.results.length, 'Titles must have length the same as all items');
			assert.equal(result.urls.length, response.results.length, 'URLs must have length the same as all items');
			for (let i = 0; i < response.results.length; i++) {
				const item = response.results[i];
				assert.equal(result.titles[i], item.name, `Titles must match names ${i}`);
				assert.equal(result.urls[i], item.url, `URLs must match ${i}`);
			}
		});
	});

});