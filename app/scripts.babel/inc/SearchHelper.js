import SearchEngine from './SearchEngine.js';
//import SearchEngineAction from './SearchEngineAction.js';

function SearchHelper (SETTINGS) {
	this.SETTINGS = SETTINGS;
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