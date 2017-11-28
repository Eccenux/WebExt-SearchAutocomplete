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
	});
});