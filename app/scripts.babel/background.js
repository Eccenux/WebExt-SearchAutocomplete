'use strict';

/**
 * Main settings.
 */
const SETTINGS = {
	MAX_SUGGESTIONS : 6
}

/**
	Example engine.
	
	Roughly compatible with `OpenSearchDescription`.
*/
const enWikiEngine = {
	keywords : ['en'],
	baseUrl : 'https://en.wikipedia.org/',
	openAction: {
		url : '{baseUrl}',
		method : 'GET',
		data : {
			search : '{searchTerms}',
			sourceid: 'Mozilla-search'
		}
	},
	autocompleteAction: {
		url : '{baseUrl}w/api.php',
		method : 'GET',
		type : 'application/x-suggestions+json',
		data : {
			action : 'opensearch',
			search : '{searchTerms}'
		}
	}
}

//
// Omnibox setup
//
import SearchHelper from './inc/SearchHelper.js';
let searchHelper = new SearchHelper(SETTINGS);

browser.omnibox.setDefaultSuggestion({
	description: 'Type in your search engine keyword and then your search terms.'
});

browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
	let engine = enWikiEngine;
	let action = engine.autocompleteAction;
	let headers = new Headers({'Accept': action.type});
	let init = {method: action.method, headers};
	let url = searchHelper.buildSearchUrl(engine, action, text);
	console.log('url:', url);
	let request = new Request(url, init);
	
	fetch(request)
		.then(function (response){
			return searchHelper.createSuggestionsFromResponse(engine, response);
		})
		.then(addSuggestions)
	;
});