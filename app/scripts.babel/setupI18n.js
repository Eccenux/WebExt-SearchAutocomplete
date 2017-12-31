/**
 * Setup i18n in HTML.
 * 
 * Must be included when HTML is ready.
 */
// en-US -> en
let lang = (typeof browser != 'undefined') ? browser.i18n.getUILanguage().replace(/[-_]\w+$/, '') : 'pl';

// remove all elements marked with language attribute that is different then current
document.querySelectorAll('[data-lang]').forEach(function(el){
	if (lang != el.getAttribute('data-lang')) {
		el.parentNode.removeChild(el);
	}
})

/**
 * Get I18n string.
 * 
 * Also a mock for in-browser testing.
 * @sa https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/getMessage
 */
let getI18n = (typeof browser != 'undefined') ? browser.i18n.getMessage : function(messageName) {
	return messageName.replace(/_/g, ' ').replace(/^.+\./, '');
};

// other HTML content not setup in controllers
document.querySelectorAll('*[data-i18n-key]').forEach(function(el)
{
	var key = el.getAttribute('data-i18n-key');
	el.textContent = getI18n(key);
});

// maybe later...
/*
// atributes (note - for input button data-i18n-key is automatically put in it's value)
$('*[data-i18n-key-attribute]').each(function()
{
	var mapping = el.getAttribute('data-i18n-key-attribute').split(':');
	var key = mapping[0];
	var attribute = mapping[1];

	var content = $mJ.i18n.get(key);
	el.setAttribute(attribute, content);
});
*/