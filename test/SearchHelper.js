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

import SearchHelper from '../app/scripts.babel/inc/SearchHelper.js';
//var SearchHelper = require('../app/scripts.babel/inc/SearchHelper');
var searchHelper = new SearchHelper(
	{
		MAX_SUGGESTIONS : 6
	},
	{
		example : engineExample
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
});