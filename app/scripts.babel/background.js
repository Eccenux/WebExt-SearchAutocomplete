'use strict';

/**
 * Main settings.
 */
const SETTINGS = {
	MAX_SUGGESTIONS : 6
}

/**
	Default engines.
	
	Syntax for defining engines is roughly compatible with `OpenSearchDescription`.
*/
import wikiTemplateEngine from './engines/wiki-template';
import enWikiEngine from './engines/wiki-en';
import plWikiEngine from './engines/wiki-pl';

Object.assign(enWikiEngine, wikiTemplateEngine);
Object.assign(plWikiEngine, wikiTemplateEngine);

//
// Initialize settings from storage (or defaults)
//
browser.storage.local.get('engines')
.then(function(result){
	let engines = [];
	if (!('engines' in result) || !Array.isArray(result.engines)) {
		engines = [
			enWikiEngine,
			plWikiEngine
		];
		browser.storage.local.set({'engines':engines});
	} else {
		engines = result.engines;
	}
	browser.storage.local.get('credentials')
	.then(function(result){
		let credentials = [];
		if (('credentials' in result) && Array.isArray(result.credentials)) {
			credentials = result.credentials;
		} 
		prepareOmnibox(engines, credentials);
	});
});

//
// Omnibox setup
//
import SearchHelper from './inc/SearchHelper.js';
import { getI18n } from './inc/I18nHelper';

/**
 * Prepare omnibox for autocomplete.
 */
function prepareOmnibox(engines, credentials) {
	let searchHelper = new SearchHelper(SETTINGS, engines, credentials);

	//
	// Reload settings when storage changes
	//
	browser.storage.onChanged.addListener(function(values, storageType) {
		console.log('storage.onChanged:', storageType, Object.keys(values));
		if (storageType === 'local' && 'engines' in values) {
			let engines = values.engines.newValue;
			searchHelper.updateEngines(engines);
		}
		if (storageType === 'local' && 'credentials' in values) {
			let credentials = values.credentials.newValue;
			searchHelper.updateCredentials(credentials);
		}
	})
	
	/**
	 * Default suggestion displayed after typing in `sa`.
	 */
	browser.omnibox.setDefaultSuggestion({
		description: browser.i18n.getMessage('searchShortInformation')
	});

	/**
	 * Reaction for newly entered phrase.
	 */
	browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
		let engineWithTerm = searchHelper.getEngine(text);
		let searchTerm = engineWithTerm.text;
		let engine = engineWithTerm.engine;
		let credentials = engineWithTerm.credentials;
		// no keyword matched yet - running search engines autocomplete
		if (engine === null) {
			console.log('no keyword matched');
			addSuggestions(searchHelper.createEnginesSuggestions(searchTerm));
			return;
		}
		// check if autocomplete is available
		if (engine.disabledAutocomplete) {
			console.log('disabled autocomplete');
			return;
		}
		// no phrase typed in yet after the keyword
		if (!searchTerm.length) {
			console.log('no phrase typed in yet after the keyword');
			return;
		}
		let action = engine.autocompleteAction;
		let headers = new Headers();
		if (credentials) {
			console.log(`adding credentials: ${credentials.codename} (${credentials.username})`);
			headers.append('Authorization', 'Basic ' + btoa(credentials.username + ':' + credentials.password));
		}
		let requestData = {
			method: action.method,
			headers: headers,
		};
		let url = searchHelper.buildSearchUrl(engine, action, searchTerm);
		console.log(
			'searchTerm:', searchTerm,
			'url:', url,
			'engine:', engine
		);
		let request = new Request(url, requestData);
		
		fetch(request)
			.then(function (response){
				if (response.status === 200) {
					return searchHelper.createSuggestionsFromResponse(engine, response);
				} else {
					console.error(`Failed with code ${response.status}: ${response.body}`);
				}
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
			// no valid search to go to
			if (engine === null || engine.disabledAutocomplete) {
				// open options for `sa ` and `sa options` and for localized keyword for it
				if (!searchTerm.length || searchTerm==='options' || searchTerm===getI18n('optionsKeyword')) {
					openOptions();
				} else {
					console.log('no valid search to go to', {
						text: text,
						engine: engine,
						searchTerm: searchTerm
					});
				}
				return;
			}
			url = searchHelper.buildSearchUrl(engine, engine.openAction, searchTerm);
		}
		// invalid/unacceptable URL
		if (url.search(/^https?:/) !== 0) {
			console.log('invalid url: ', url);
			return;
		}
		// debug
		console.log('onInputEntered: ', {
			text: text, 
			disposition: disposition, 
			url: url
		});
		// create or update tab as expected
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
}

/**
 * Open options for this add-on.
 */
function openOptions() {
	function onOpened() {
		console.log('Options page opened');
	}

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	var opening = browser.runtime.openOptionsPage();
	opening.then(onOpened, onError);
}