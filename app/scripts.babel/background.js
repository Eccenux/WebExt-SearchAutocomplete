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
	prepareOmnibox(engines);
})

//
// Omnibox setup
//
import SearchHelper from './inc/SearchHelper.js';

/**
 * Prepare omnibox for autocomplete.
 */
function prepareOmnibox(engines) {
	let searchHelper = new SearchHelper(SETTINGS, engines);

	//
	// Reload settings when storage changes
	//
	browser.storage.onChanged.addListener(function(values, storageType) {
		console.log('storage.onChanged:', storageType, values);
		if (storageType === 'local' && 'engines' in values) {
			let engines = values.engines.newValue;
			searchHelper.updateEngines(engines);
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
		// no keyword matched
		if (engine === null) {
			console.log('no keyword matched');
			return;
		}
		// no phrase typed in yet after the keyword
		if (!searchTerm.length) {
			console.log('no phrase typed in yet after the keyword');
			return;
		}
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
			// no valid search to go to
			if (engine === null || !searchTerm.length) {
				console.log('no valid search to go to', {
					text: text,
					engine: engine,
					searchTerm: searchTerm
				});
				return;
			}
			url = searchHelper.buildSearchUrl(engine, engine.openAction, searchTerm);
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