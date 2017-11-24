'use strict';

chrome.runtime.onInstalled.addListener(details => {
	console.log('previousVersion', details.previousVersion);
});

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
browser.omnibox.setDefaultSuggestion({
	description: 'Type in your search engine keyword and then your search terms.'
});

browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
	let engine = enWikiEngine;
	let action = engine.autocompleteAction;
	let headers = new Headers({'Accept': action.type});
	let init = {method: action.method, headers};
	let url = buildSearchUrl(engine, action, text);
	console.log('url:', url);
	let request = new Request(url, init);
	
	fetch(request)
		.then(function (response){
			return createSuggestionsFromResponse(engine, response);
		})
		.then(addSuggestions)
	;
});

/**
 * Build search URL for the text.
 * 
 * @param {Object} engine Engine to use.
 * @param {Object} action Action to call on the engine.
 * @param {String} text Search term.
 */
function buildSearchUrl(engine, action, text) {
	let url = action.url.replace('{baseUrl}', engine.baseUrl);
	let first = true;
	for (let key in action.data) {
		let value =	action.data[key].replace('{searchTerms}', text);
		url += first ? '?' : '&';
		url += `${key}=` + encodeURIComponent(value);
		first = false;
	}
	return url;
}

/**
 * Create suggestions array from response.
 * 
 * @param {Object} engine Engine used.
 * @param {Object} response The search engine response.
 */
function createSuggestionsFromResponse(engine, response) {
	return new Promise(resolve => {
		let suggestions = [];
		let suggestionsOnEmptyResults = [{
			content: engine.baseUrl,
			description: 'No results found'
		}];
		response.json().then(json => {
			console.log('response:', json);
			if (!json.length) {
				return resolve(suggestionsOnEmptyResults);
			}
			
			let max = SETTINGS.MAX_SUGGESTIONS;

			// for Wikipedia:
			// json[0] = search term
			// json[1] = [...titles...]
			// json[2] = [...descriptions...]
			// json[3] = [...direct urls...]
			let titles = json[1];
			let descriptions = json[2];
			let urls = json[3];

			if (titles.length < 1) {
				return resolve(suggestionsOnEmptyResults);
			}

			let count = Math.min(titles.length, max);
			for (let i = 0; i < count; i++) {
				// gather data
				let title = titles[i];
				let description = title;
				if (descriptions && typeof descriptions[i] === 'string') {
					description += ` -- ${descriptions[i]}`;
				}
				let url = '';
				if (urls && typeof urls[i] === 'string') {
					url = urls[i];
				} else {
					url = buildSearchUrl(engine, engine.openAction, title);
				}
				// add suggestion
				suggestions.push({
					content: url,
					description: description,
				});
			}
			return resolve(suggestions);
		});
	});
}
