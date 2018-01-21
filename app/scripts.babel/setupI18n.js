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

import {getI18n} from './inc/I18nHelper';

// other HTML content not setup in controllers
document.querySelectorAll('*[data-i18n-key]').forEach(function(el)
{
	var key = el.getAttribute('data-i18n-key');
	el.textContent = getI18n(key);
});

// maybe later...
/*
// atributes (note - for input button data-i18n-key is automatically put in it's value)
document.querySelectorAll('*[data-i18n-key-attribute]').forEach(function()
{
	var mapping = el.getAttribute('data-i18n-key-attribute').split(':');
	var key = mapping[0];
	var attribute = mapping[1];

	var content = getI18n(key);
	el.setAttribute(attribute, content);
});
*/