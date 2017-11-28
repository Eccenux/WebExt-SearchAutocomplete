'use strict';

// any engine (not important form most testing)
var engineExample = {
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
var engineEg = JSON.parse(JSON.stringify(engineExample));	// clone
engineEg.baseUrl = 'http://eg.localhost/';

import SearchHelper from '../app/scripts.babel/inc/SearchHelper.js';
//var SearchHelper = require('../app/scripts.babel/inc/SearchHelper');
var searchHelper = new SearchHelper(
	{
		MAX_SUGGESTIONS : 6
	},
	{
		example : engineExample,
		eg : engineEg
	}
);
var assert = require('chai').assert;

describe('SearchHelper', function () {
	
	describe('Test building URLs', function () {
		it('Should replace a search term', function () {
			var action = {
				url : '{baseUrl}',
				data : {
					abc : '{searchTerms}'
				}
			};
			var text = 'def';
			var url = searchHelper.buildSearchUrl(engineExample, action, text);
			assert.equal(url, 'http://localhost/?abc=' + text);
		});
		it('Should work without params', function () {
			var action = {
				url : '{baseUrl}',
				data : {
				}
			};
			var text = 'def';
			var url = searchHelper.buildSearchUrl(engineExample, action, text);
			assert.equal(url, 'http://localhost/');
		});
		it('Should append a second parameter', function () {
			var action = {
				url : '{baseUrl}',
				data : {
					abc : 'test',
					def : 'test2'
				}
			};
			var text = 'nothing';
			var url = searchHelper.buildSearchUrl(engineExample, action, text);
			assert.equal(url, 'http://localhost/?abc=test&def=test2');
		});
		it('Should escape values', function () {
			var testValue = 'zażółćgęśląjaźń';
			var action = {
				url : '{baseUrl}',
				data : {
					testValue : testValue
				}
			};
			var text = 'nothing';
			var url = searchHelper.buildSearchUrl(engineExample, action, text);
			url.replace(/testValue=(.+)$/, function(a, transformedValue) {
				assert.notEqual(transformedValue, testValue, 'Should not match unescaped value');
				assert.equal(decodeURIComponent(transformedValue), testValue, 'Should decode to original');
			});
		});
		it('Should contain only one question mark', function () {
			var action = {
				url : '{baseUrl}',
				data : {
					abc : 'te?st',
					def : 'te?st2',
					hij : 'te?st3'
				}
			};
			var text = 'nothing';
			var url = searchHelper.buildSearchUrl(engineExample, action, text);
			var parts = url.split('?');
			assert.equal(parts.length - 1, 1);
		});
		it('Should separate params correctly', function () {
			var action = {
				url : '{baseUrl}',
				data : {
					abc : 't&e?st',
					def : 't&e?st2',
					hij : 't&e?st3'
				}
			};
			var text = 'nothing';
			var url = searchHelper.buildSearchUrl(engineExample, action, text);
			var parts = url.split('&');
			assert.equal(parts.length - 1, Object.keys(action.data).length - 1);
		});
	});

	describe('Test choosing engines', function () {
		it('Should choose a default engine for space', function () {
			var engineWithTerm = searchHelper.getEngine(' something');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.equal(engine.baseUrl, engineExample.baseUrl, 'First engine should be the default');
			assert.equal(term, 'something', 'should strip space');
		});
		it('Should choose no engine for unknown keyword', function () {
			var engineWithTerm = searchHelper.getEngine('something');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.isNull(engine);
		});
		it('Should not choose an engine until space is present after a valid keyword', function () {
			var engineWithTerm = searchHelper.getEngine('eg');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.isNull(engine);
		});
		it('Should choose the eg engine for its keyword', function () {
			var engineWithTerm = searchHelper.getEngine('eg ');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.equal(engine.baseUrl, engineEg.baseUrl, 'Should choose eg engine');
			assert.equal(term, '', 'Should be empty');
		});
		it('Should have empty term until non-space', function () {
			// default engine
			var engineWithTerm = searchHelper.getEngine(' ');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.equal(engine.baseUrl, engineExample.baseUrl, 'Should be default');
			assert.equal(term, '', 'Should be empty');

			var engineWithTerm = searchHelper.getEngine(' a');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.equal(engine.baseUrl, engineExample.baseUrl, 'Should be default');
			assert.equal(term, 'a', 'Should be a charcter');

			// keyword engine
			var engineWithTerm = searchHelper.getEngine('eg ');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.equal(engine.baseUrl, engineEg.baseUrl, 'Should choose eg engine');
			assert.equal(term, '', 'Should be empty');

			var engineWithTerm = searchHelper.getEngine('eg a');
			var engine = engineWithTerm.engine;
			var term = engineWithTerm.text;
			assert.equal(engine.baseUrl, engineEg.baseUrl, 'Should choose eg engine');
			assert.equal(term, 'a', 'Should be a charcter');
		});
	});
});