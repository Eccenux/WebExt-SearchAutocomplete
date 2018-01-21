/**
 * Observable search engine model.
 * 
 * @param {SearchEngine} engine Optional initial engine.
 */
function SearchEngineModel(engine) {
    this.id = null;
    this.keywords = '';
    this.baseUrl = '';
	this.title = '';
	this.useCredentials = false;
	this.credential = '';
	this.actions = [];
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
	this.id = engine.id;
    this.keywords = engine.keywords.join(',');
    this.baseUrl = engine.baseUrl;
	this.title = engine.title;
	if (typeof engine.credential === 'string' && engine.credential.length) {
		this.useCredentials = true;
		this.credential = engine.credential;
	} else {
		this.useCredentials = false;
		this.credential = '';
	}
	this.actions.length = 0;
	this.addAction('open', engine.openAction);
	this.addAction('autocomplete', engine.autocompleteAction);
}

/**
 * Recreate engine definition from the model.
 */
SearchEngineModel.prototype.getEngine = function() {
	let engine = {};
	engine.id = this.id;
	engine.keywords = this.keywords;
	engine.baseUrl = this.baseUrl;
	engine.title = this.title;
	if (this.useCredentials && this.credential.length) {
		engine.credential = this.credential;
	}
	for (let a = 0; a < this.actions.length; a++) {
		const action = this.actions[a];
		let data = {};
		for (let d = 0; d < action.data.length; d++) {
			const dat = action.data[d];
			data[dat.key] = dat.value;
		}
		engine[`${action.name}Action`] = {
			url: action.url,
			method: action.method,
			type: action.type,
			data: data
		};
	}
	return engine;
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
		});
	}
	this.actions.push({
		name: name,
		url: action.url,
		method: action.method,
		type: action.type,
		data: data
    });
}

export default SearchEngineModel