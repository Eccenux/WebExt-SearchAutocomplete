import SearchEngine from './SearchEngine.js';
//import SearchEngineAction from './SearchEngineAction.js';

/**
 * Pre-parse all settings.
 * 
 * @TODO Maybe support engines array later? Would allow support of mulitple keywords.
 * 
 * @param {Object} SETTINGS General settings object.
 * @param {Object|Array} engines Keyword-based search engines map
 * OR an array of search engines with `keywords` property.
 */
function SearchHelper (SETTINGS, engines) {
	this.SETTINGS = SETTINGS;
	// parse engines to engine map
	if (Array.isArray(engines)) {
		this.engineMap = this.buildEngineMap(engines);
	} else {
		this.engineMap = engines;
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
		var engine = engines[i];
		var keywords = ('keyword' in engine) ? [engine.keyword] : engine.keywords;
		for (let k = 0; k < keywords.length; k++) {
			var key = keywords[k];
			engineMap[key] = engine;
		}
	}
	return engineMap;
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
	let engine;
	if (keyword === null) {
		engine = null;
	} else {
		engine = this.engineMap[keyword];
	}
	return {
		engine : engine,
		text : text
	};
}

/**
 * Create suggestions array from response.
 * 
 * @param {SearchEngine} engine Engine used.
 * @param {Object} response The search engine response.
 */
SearchHelper.prototype.createSuggestionsFromResponse = function (engine, response) {
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
			
			let max = this.SETTINGS.MAX_SUGGESTIONS;

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

export default SearchHelper;