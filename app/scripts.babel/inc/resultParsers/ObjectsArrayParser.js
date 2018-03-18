import BaseParser from './BaseParser';
import SearchEngine from '../SearchEngine';

/**
 * Objects' array parser.
 * 
 * AMO example
 * https://addons.mozilla.org/api/v3/addons/autocomplete/?app=firefox&platform=windows&lang=en-US&q=search
 * 
	{
		"results": [
			{
				"id": 689182,
				"icon_url": "https://addons.cdn.mozilla.net/user-media/addon_icons/689/689182-64.png?modified=1510633221",
				"name": "Search and New Tab by Yahoo",
				"url": "https://addons.mozilla.org/en-US/firefox/addon/search-and-new-tab-by-yahoo/"
			},
			{
				"id": 455926,
				"icon_url": "https://addons.cdn.mozilla.net/user-media/addon_icons/455/455926-64.png?modified=1505062686",
				"name": "Search image",
				"url": "https://addons.mozilla.org/en-US/firefox/addon/search-image/"
			}
		]
	}
 * 
 */
class ObjectsArrayParser extends BaseParser {
	constructor(){
		super();
		this.valid = false;
	}

	/**
	 * (Re)Init with engine settings.
	 * 
	 * @param {SearchEngine} engine Settings of the engine.
	 */
	init(engine) {
		this.valid = false;
		this.paths = {
			root: '',
			titles: '',
			descriptions: '',
			urls: '',
		};
		if (typeof engine.autocompleteAction.paths === 'object') {
			for (const key in this.paths) {
				if (this.paths.hasOwnProperty(key)) {
					if (key in engine.autocompleteAction.paths) {
						this.paths[key] = engine.autocompleteAction.paths[key];
					}
				}
			}
			if (this.paths.titles.length) {
				this.valid = true;
			}
		}
		return this.valid;
	}
	/**
	 * Parse results json.
	 * 
	 * @param {Object} json Results from server.
	 */
	parse(json) {
		let results = {
			titles : [],
			descriptions : [],
			urls : [],
		};
		// unitialized (or init failed)
		if (!this.valid) {
			return results;
		}
		// root
		let root = this.paths.root;
		if (!root.length || !(root in json)) {
			return results;
		}
		// setup result
		if (!this.paths.descriptions.length) {
			results.descriptions = null;
		}
		if (!this.paths.urls.length) {
			results.urls = null;
		}
		// traverse results array
		let records = json[root];
		for (let i = 0; i < records.length; i++) {
			const record = records[i];
			
			results.titles.push(this.getByPath(record, this.paths.titles));
			if (results.descriptions !== null) {
				results.descriptions.push(this.getByPath(record, this.paths.descriptions));
			}
			if (results.urls !== null) {
				results.urls.push(this.getByPath(record, this.paths.urls));
			}
		}
		return results;
	}
	/**
	 * Get value from record by path.
	 * @param {Object} record Data.
	 * @param {String} path Key name for now.
	 */
	getByPath(record, path) {
		if (!path.length) {
			console.warn('path is empty');
			return '';
		}
		let parts = path.split('.');
		if (parts.length === 1) {
			if (!(path in record)) {
				console.warn(`${path} not in record`);
				return '';
			}
			return record[path];
		} else {
			var node = record;
			for (let i = 0; i < parts.length; i++) {
				const key = parts[i];
				if (key in node) {
					node = node[key];
				} else {
					console.warn(`${path} not in record`);
					return '';
				}
			}
			return node;
		}
	}
}

export default ObjectsArrayParser;