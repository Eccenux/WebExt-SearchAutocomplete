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
});