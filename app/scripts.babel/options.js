'use strict';

browser.storage.local.get('engines')
.then(function(result){
	if (!('engines' in result) || !Array.isArray(result.engines)) {
		console.warn('Engines are not an array!', result);
	} else {
		prepareEngines(result.engines)
	}
}, function(failReason) {
	console.log('failReason', failReason);
})

/**
 * Prepare options managment.
 */
function prepareEngines(engines) {
	console.log(engines);
}