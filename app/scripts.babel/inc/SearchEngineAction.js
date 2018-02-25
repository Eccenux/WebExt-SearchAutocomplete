function SearchEngineAction(action) {
	this.url = '';
	if (typeof action.url === 'string') {
		this.url = action.url;
	}
	this.method = 'GET';
	if (typeof action.method === 'string') {
		this.method = action.method;
	}
	this.type = '';
	if (typeof action.type === 'string') {
		this.type = action.type;
	}
	this.autocompleteType = '';
	if (typeof action.autocompleteType === 'string') {
		this.autocompleteType = action.autocompleteType;
	}
	this.paths = {};
	if (typeof action.paths === 'object') {
		this.paths = action.paths;
	}
	this.data = {};
	if (typeof action.data === 'object') {
		this.data = action.data;
	}
}

export default SearchEngineAction;