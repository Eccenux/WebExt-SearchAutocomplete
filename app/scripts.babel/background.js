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
let searchHelper = new SearchHelper(SETTINGS, {
	'en' : enWikiEngine
});

/**
 * Default suggestion displayed after typing in `sa`.
 */
browser.omnibox.setDefaultSuggestion({
	description: 'Type in your search engine keyword and then your search terms.'
});

/**
 * Reaction for newly entered phrase.
 */
browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
	let engineWithTerm = searchHelper.getEngine(text);
	let searchTerm = engineWithTerm.text;
	let engine = engineWithTerm.engine;
	let action = engine.autocompleteAction;
	let headers = new Headers({'Accept': action.type});
	let init = {method: action.method, headers};
	let url = searchHelper.buildSearchUrl(engine, action, searchTerm);
	console.log(
		'searchTerm:', searchTerm,
		'url:', url,
		'engine:', engine
	);
	let request = new Request(url, init);
	
	fetch(request)
		.then(function (response){
			return searchHelper.createSuggestionsFromResponse(engine, response);
		})
		.then(addSuggestions)
	;
});

/**
 * React to choosen phrase or suggestion.
 */
browser.omnibox.onInputEntered.addListener((text, disposition) => {
	console.log('onInputEntered: ', text, disposition);
	// if suggestion was choosen then the text should contain a go-to URL
	let url = text;
	// suggestion was not choosen, must build URL
	if (text.search(/^https?:/) !== 0) {
		let engineWithTerm = searchHelper.getEngine(text);
		let searchTerm = engineWithTerm.text;
		let engine = engineWithTerm.engine;
		url = searchHelper.buildSearchUrl(engine, engine.openAction, searchTerm);
	}
	// debug
	console.log('onInputEntered: ', {
		text: text, 
		disposition: disposition, 
		searchTerm: searchTerm, 
		url: url
	});
	// react tab as expected
	switch (disposition) {
		case 'currentTab':
			browser.tabs.update({url});
			break;
		case 'newForegroundTab':
			browser.tabs.create({url});
			break;
		case 'newBackgroundTab':
			browser.tabs.create({url, active: false});
			break;
	}
});
