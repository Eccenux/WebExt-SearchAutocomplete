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

import SearchEngine from '../app/scripts.babel/inc/SearchEngine.js';

describe('SearchEngine', function () {
	let engineWithTitle = JSON.parse(JSON.stringify(engineExample));	// clone
	engineWithTitle.title = 'Test-title';
	
	describe('Basic tests', function () {
		it('Should add base URL if title is missing', function () {
			let engine = new SearchEngine(engineExample);
			assert.isString(engine.title);
			assert.equal(engine.title, engineExample.baseUrl);
		});
		it('Should preserve title if given', function () {
			let engine = new SearchEngine(engineWithTitle);
			assert.isString(engine.title);
			assert.equal(engine.title, engineWithTitle.title);
		});
		it('Should support keyword prop', function () {
			let testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keyword = 'abc';

			let engine = new SearchEngine(testEngine);
			assert.isArray(engine.keywords);
			assert.equal(engine.keywords.length, 1);
			assert.equal(engine.keywords[0], testEngine.keyword);
		});
		it('Should turn keywords string into an array', function () {
			let testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keywords = 'abc';

			let engine = new SearchEngine(testEngine);
			assert.isArray(engine.keywords);
			assert.equal(engine.keywords.length, 1);
			assert.equal(engine.keywords[0], testEngine.keywords);
		});
		it('Should turn CSV keywords into an array', function () {
			let expected = ['abc','def'];
			let testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keywords = 'abc,def';

			let engine = new SearchEngine(testEngine);
			assert.isArray(engine.keywords);
			assert.sameMembers(engine.keywords, expected);
		});
		it('Should ignore whitespace in CSV keywords', function () {
			let expected = ['abc','def'];
			let testEngines = [];
			let testEngine;
			testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keywords = 'abc, def';
			testEngines.push(testEngine);
			testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keywords = 'abc , def';
			testEngines.push(testEngine);
			testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keywords = ' abc, def';
			testEngines.push(testEngine);
			testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keywords = 'abc, def ';
			testEngines.push(testEngine);

			for (let e = 0; e < testEngines.length; e++) {
				const testEngine = testEngines[e];
				let engine = new SearchEngine(testEngine);
				assert.isArray(engine.keywords);
				assert.sameMembers(engine.keywords, expected);
			}
		});
		it('Should clone keywords into an internal array', function () {
			let testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.keywords = ['abc','def'];

			let engine = new SearchEngine(testEngine);
			assert.isArray(engine.keywords);
			assert.sameMembers(engine.keywords, testEngine.keywords);
			assert.equal(engine.keywords.length, testEngine.keywords.length,
				'lengths should be the same at first'
			);
			testEngine.keywords.push('new');
			assert.notEqual(engine.keywords.length, testEngine.keywords.length,
				'changes in the engine definition should not change an internal array'
			);
		});
	});

	describe('Disabling/enabling autocomplete', function () {
		let minimalEngine = {
			keyword : 'abc',
			title : 'Basic engine without open action',
			baseUrl : 'http://localhost/',
			autocompleteAction : {
				url : '{baseUrl}',
				data : {}
			}
		};

		it('Should disable autocomplete for special keywords', function () {
			let engine = new SearchEngine({
				keyword : 'abc',
				title : 'Options or some other keyword'
			});
			assert.isTrue(engine.disabledAutocomplete);
		});
		it('Should disable autocomplete if automcomplete is empty', function () {
			let engine = new SearchEngine({
				keyword : 'abc',
				title : 'Options or some other keyword',
				baseUrl : 'http://localhost/'
			});
			assert.isTrue(engine.disabledAutocomplete);
		});
		it('Should enable autocomplete even if open action is empty', function () {
			let testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			let engine = new SearchEngine(testEngine);
			assert.isFalse(engine.disabledAutocomplete);
		});
		it('Should disable autocomplete if protocol is invalid', function () {
			function test(testEngine) {
				let engine = new SearchEngine(testEngine);
				let url = engine.getActionBaseUrl(engine.autocompleteAction);
				assert.isTrue(engine.disabledAutocomplete, `The url (${url}) should be invalid`);
			}

			let testEngine = JSON.parse(JSON.stringify(engineExample));	// clone

			testEngine.baseUrl = 'http://localhost/';
			testEngine.autocompleteAction.url = 'something {baseUrl}';
			test(testEngine);

			testEngine.baseUrl = 'blah://localhost/';
			testEngine.autocompleteAction.url = '{baseUrl}';
			test(testEngine);

			testEngine.baseUrl = 'httpz://localhost/';
			testEngine.autocompleteAction.url = '{baseUrl}';
			test(testEngine);

			testEngine.baseUrl = '';
			testEngine.autocompleteAction.url = 'httpz://localhost/';
			test(testEngine);
		});
		it('Should enable autocomplete if just the base url is empty', function () {
			function test(testEngine) {
				let engine = new SearchEngine(testEngine);
				let url = engine.getActionBaseUrl(engine.autocompleteAction);
				assert.isFalse(engine.disabledAutocomplete, `The url (${url}) should be valid`);
			}

			let testEngine = JSON.parse(JSON.stringify(engineExample));	// clone
			testEngine.baseUrl = '';

			testEngine.autocompleteAction.url = 'http://localhost/';
			test(testEngine);

			testEngine.autocompleteAction.url = 'https://localhost/';
			test(testEngine);
		});
	});
});