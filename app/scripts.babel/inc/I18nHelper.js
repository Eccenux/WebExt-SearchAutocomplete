/**
 * Get I18n string.
 * 
 * Also a mock for in-browser testing.
 * @sa https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/getMessage
 */
let getI18n = (typeof browser != 'undefined') ? browser.i18n.getMessage : function(messageName) {
	return messageName.replace(/_/g, ' ').replace(/^.+\./, '');
};

export { getI18n };