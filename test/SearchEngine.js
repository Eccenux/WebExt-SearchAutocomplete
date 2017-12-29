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