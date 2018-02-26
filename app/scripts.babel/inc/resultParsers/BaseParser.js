/**
 * Suggestions parser.
 * 
 * Minimum parser results are below. For maxium see `OpenSearch`.
 */
class BaseParser {
	constructor(){
		this.valid = true;
	}

	/**
	 * (Re)Init with engine settings.
	 * @param {SearchEngine} engine Settings of the engine.
	 */
	init(engine) {
		return this.valid;
	}

	/**
	 * Parse results json.
	 * @param {Object} json Results from server.
	 */
	parse(json) {
		return {
			titles : [],
		}
	}
}

export default BaseParser;