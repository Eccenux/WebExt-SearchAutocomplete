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
}

export default SearchEngine;