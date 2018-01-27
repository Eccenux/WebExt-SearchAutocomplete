import SearchEngineAction from './SearchEngineAction.js';

function SearchEngine(engine) {
	this.keywords = [];
	if (typeof engine.keyword === 'string') {
		this.keywords.push(engine.keyword);
	} else if (typeof engine.keywords === 'string') {
		if (engine.keywords.search(',')) {
			let keywords = engine.keywords.replace(/\s+/g, '');
			this.keywords = keywords.split(',');
		} else {
			this.keywords.push(engine.keywords);
		}
	} else {
		this.keywords = [].concat(engine.keywords);
	}

	this.baseUrl = '';
	if (typeof engine.baseUrl === 'string') {
		this.baseUrl = engine.baseUrl;
	}

	this.title = '';
	if (typeof engine.title === 'string') {
		this.title = engine.title;
	} else {
		this.title = engine.baseUrl;
	}

	this.credential = '';
	if (typeof engine.credential === 'string') {
		this.credential = engine.credential;
	}
	
	this.openAction = new SearchEngineAction(engine.openAction || {});
	this.autocompleteAction = new SearchEngineAction(engine.autocompleteAction || {});

	// this checks both for user-typed invalid URLs and for special engines (e.g. `sa options`)
	this.disabledAutocomplete = false;
	if (!this.hasValidUrl(this.autocompleteAction)) {
		this.disabledAutocomplete = true;
	}
}

/**
 * Check base URL for the action.
 * @param {SearchEngineAction} action
 */
SearchEngine.prototype.hasValidUrl = function (action) {
	if (action.url.length === 0 
		|| this.getActionBaseUrl(action).search(/^https?:/i) !== 0) {
		return false;
	}
	return true;
};

/**
 * Build base URL for the action.
 * @param {SearchEngineAction} action
 */
SearchEngine.prototype.getActionBaseUrl = function (action) {
	let url = action.url.replace('{baseUrl}', this.baseUrl);
	return url;
};

export default SearchEngine;