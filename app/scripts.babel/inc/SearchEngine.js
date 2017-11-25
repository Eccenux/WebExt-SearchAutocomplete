import SearchEngineAction from './SearchEngineAction.js';

export function SearchEngine(engine) {
	this.keywords = [];
	if (typeof engine.keywords === 'string') {
		this.keywords.push(engine.keywords);
	} else {
		this.keywords = engine.keywords;
	}
	this.baseUrl = '';
	if (typeof engine.baseUrl === 'string') {
		this.baseUrl = engine.baseUrl;
	}
	this.openAction = new SearchEngineAction(engine.openAction);
	this.autocompleteAction = new SearchEngineAction(engine.autocompleteAction);
}
