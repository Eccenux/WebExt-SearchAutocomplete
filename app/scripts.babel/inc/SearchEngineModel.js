/**
 * Observable search engine model.
 * 
 * @param {SearchEngine} engine Optional initial engine.
 */
function SearchEngineModel(engine) {
    this.keywords = ko.observable('');
    this.baseUrl = ko.observable('');
	this.title = ko.observable('');
	this.actions = ko.observableArray();
	if (engine) {
		this.update(engine);
	}
};
/**
 * Update the engine model.
 * 
 * @param {SearchEngine} engine 
 */
SearchEngineModel.prototype.update = function(engine) {
    this.keywords(engine.keywords.join(','));
    this.baseUrl(engine.baseUrl);
	this.title(engine.title);
	this.actions.removeAll();
	this.addAction('open', engine.openAction);
	this.addAction('autocomplete', engine.autocompleteAction);
}

/**
 * Add action to collection.
 * 
 * @param {String} name Name of the action to display.
 * @param {SearchEngineAction} action 
 */
SearchEngineModel.prototype.addAction = function(name, action) {
	let data = [];
	for (var key in action.data) {
		data.push({
			key: key,
			value: action.data[key]
		})
	}
	this.actions.push({
		name: name,
		url: action.url,
		method: action.method,
		type: action.type,
		data: ko.observableArray(data)
    });
}

export default SearchEngineModel