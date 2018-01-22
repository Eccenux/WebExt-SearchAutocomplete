import SearchEngine from './SearchEngine.js';
import SearchCredential from './SearchCredential.js';
import { getI18n } from './I18nHelper';
//import SearchEngineAction from './SearchEngineAction.js';

/**
 * Pre-parse all settings.
 * 
 * @TODO Maybe support engines array later? Would allow support of mulitple keywords.
 * 
 * @param {Object} SETTINGS General settings object.
 * @param {Object|Array} engines Keyword-based search engines map.
 * @param {Array} credentials Array of credentials for autocomplete.
 * OR an array of search engines with `keywords` property.
 */
function SearchHelper (SETTINGS, engines, credentials) {
	this.SETTINGS = SETTINGS;
	this.updateEngines(engines);
	this.updateCredentials(credentials);
}

/**
 * (Re)parse engine settings.
 * 
 * @param {Object|Array} engines Keyword-based search engines map
 */
SearchHelper.prototype.updateEngines = function (engines) {
	// parse engines to engine map
	if (Array.isArray(engines)) {
		this.engineMap = this.buildEngineMap(engines);
	} else {
		// must rebuild to have `SearchEngine` objects in the `engineMap`.
		this.engineMap = {};
		for (const key in engines) {
			if (engines.hasOwnProperty(key)) {
				this.engineMap[key] = new SearchEngine(engines[key]);
			}
		}
	}
	// figure out default (unless explictly defined)
	if (typeof this.engineMap.default !== 'object') {
		var firstKeyword = Object.keys(this.engineMap)[0];
		this.engineMap.default = this.engineMap[firstKeyword];
	}
}

/**
 * Builds a keyword-based search engines map.
 * @param {Array} engines An array of search engines with `keywords` property.
 */
SearchHelper.prototype.buildEngineMap = function (engines) {
	let engineMap = {};
	for (let i = 0; i < engines.length; i++) {
		var engine = new SearchEngine(engines[i]);
		var keywords =engine.keywords;
		for (let k = 0; k < keywords.length; k++) {
			var key = keywords[k];
			engineMap[key] = engine;
		}
	}
	return engineMap;
}

/**
 * (Re)parse credential settings.
 * 
 * @param {Object|Array} credentials Keyword-based search credentials map
 */
SearchHelper.prototype.updateCredentials = function (credentials) {
	// parse credentials to credential map
	if (Array.isArray(credentials)) {
		this.credentialMap = this.buildCredentialMap(credentials);
	}
}

/**
 * Builds a keyword-based search credentials map.
 * @param {Array} credentials An array of search credentials with `codename` property.
 */
SearchHelper.prototype.buildCredentialMap = function (credentials) {
	let credentialMap = {};
	for (let i = 0; i < credentials.length; i++) {
		var credential = new SearchCredential(credentials[i]);
		var key = credential.codename;
		credentialMap[key] = credential;
	}
	return credentialMap;
}

/**
 * Build search URL for the text.
 * 
 * @param {SearchEngine} engine Engine to use.
 * @param {SearchEngineAction} action Action to call on the engine.
 * @param {String} text Search term.
 */
SearchHelper.prototype.buildSearchUrl = function (engine, action, text) {
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
 * @typedef {Object} EngineWithTerm
 * @property {SearchEngine} engine Engine to use.
 * @property {String} text Transformed search term.
 */

/**
 * Find out which engine should be used based on entered text.
 * 
 * `sa  something` uses default (first) engine
 * `sa ` should show you a list of engines (in future)
 * `sa a` should show you a list of engines with keywords starting with `a`
 * 
 * @param {String} text Search term.
 * @return {EngineWithTerm} Engine with term stripped from the engine keyowrd.
 */
SearchHelper.prototype.getEngine = function (text) {
	let keyword = null;
	let me = this;
	text.replace(/^(\S*)\s+(.*)$/, function(a, word, rest){
		if (!word.length) {
			keyword = 'default';
			text = rest;
		} else if (word in me.engineMap) {
			keyword = word;
			text = rest;
		}
	});
	let engine, credentials;
	if (keyword === null) {
		engine = null;
	} else {
		engine = this.engineMap[keyword];
		credentials = null;
		if (engine.credential.length) {
			if (engine.credential in this.credentialMap) {
				credentials = this.credentialMap[engine.credential];
			}
		}
	}
	return {
		engine : engine,
		credentials : credentials,
		text : text
	};
}

/**
 * Get engines matching the term.
 * 
 * @param {String} text Search term.
 */
SearchHelper.prototype.getEngines = function (text) {
	// list all engines by default
	if (typeof text !== 'string' || !text.length || text === '*') {
		let engines = [];
		for (const key in this.engineMap) {
			if (key !== 'default') {
				const engine = this.engineMap[key];
				engines.push(engine)
			}
		}
		return engines;
	}
	let engines = [];
	for (const key in this.engineMap) {
		if (key.startsWith(text)) {
			const engine = this.engineMap[key];
			engines.push(engine)
		}
	}
	return engines;
};

/**
 * Create engines suggestions array.
 * 
 * @param {String} text Search term.
 */
SearchHelper.prototype.createEnginesSuggestions = function (text) {
	let me = this;
	let suggestions = [];
	let suggestionsOnEmptyResults = [{
		content: '',
		description: getI18n('searchHelper.No_Results_Found')
	}];

	let engines = me.getEngines(text);
	//console.log('engines:', engines);
	if (engines.length < 1) {
		return suggestionsOnEmptyResults;
	}

	let max = me.SETTINGS.MAX_SUGGESTIONS;
	let count = Math.min(engines.length, max);
	for (let i = 0; i < count; i++) {
		let engine = engines[i];
		// gather data
		let description = engine.title;
		let url = engine.keywords[0];
		// add suggestion
		suggestions.push({
			content: url,
			description: description,
		});
	}
	console.log('suggestions:', suggestions);
	return suggestions;
};

/**
 * Create suggestions array from response.
 * 
 * @param {SearchEngine} engine Engine used.
 * @param {Object} response The search engine response.
 */
SearchHelper.prototype.createSuggestionsFromResponse = function (engine, response) {
	let me = this;
	return new Promise(resolve => {
		let suggestions = [];
		let suggestionsOnEmptyResults = [{
			content: engine.baseUrl,
			description: getI18n('searchHelper.No_Results_Found')
		}];
		response.json().then(json => {
			console.log('response:', json);
			if (!json.length) {
				return resolve(suggestionsOnEmptyResults);
			}
			
			let max = me.SETTINGS.MAX_SUGGESTIONS;

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
					url = me.buildSearchUrl(engine, engine.openAction, title);
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

export default SearchHelper;