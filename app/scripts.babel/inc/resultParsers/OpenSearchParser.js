import BaseParser from './BaseParser';

/**
 * OpenSearch suggestions parser.
 * 
 * OpenSearch Suggestions standard:
 * http://www.opensearch.org/Specifications/OpenSearch/Extensions/Suggestions/1.0#Response_Content
 */
class OpenSearchParser extends BaseParser {
	/**
	 * Parse results json.
	 * 
	 * For Wikipedia results are:
	 * json[0] = search term
	 * json[1] = [...titles...]
	 * json[2] = [...descriptions...]
	 * json[3] = [...direct urls...]
	 * 
	 * Standard only requires `titles` (and the search term).
	 * 
	 * @param {Object} json Results from server.
	 */
	parse(json) {
		return {
			titles : json[1],
			descriptions : json[2],
			urls : json[3],
		}
	}
}

export default OpenSearchParser;