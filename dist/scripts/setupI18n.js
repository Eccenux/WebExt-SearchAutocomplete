(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
// dummy
function addMessage() {}

// uncomment below to allow in-browser building of missing i18n list
// format and copy with:
// copy(JSON.stringify(_i18nMessages.missing, null, '\t'))
// Note! Messages that are hidden might not show up. Move around the app to get more messages.
/**
import messagesPl from '../../_locales/pl/messages';
import messagesEn from '../../_locales/en/messages';
//console.log('i18nhelper', messagesPl, messagesEn, wikiTemplateEngine);
if (typeof window._i18nMessages !== 'object') {
	window._i18nMessages = {
		missing: {
			pl: {},
			en: {},
		}
	};
}
function addMessage(messageName, message) {
	let obj = {
		'message' : message
	};
	if (!(messageName in messagesPl)) {
		console.log('pl: ', messageName)
		_i18nMessages.missing.pl[messageName] = obj;
	}
	if (!(messageName in messagesEn)) {
		console.log('en: ', messageName)
		_i18nMessages.missing.en[messageName] = obj;
	}
}
/**/

/**
 * Get I18n string.
 * 
 * Also a mock for in-browser testing.
 * @sa https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/getMessage
 */
let getI18n = typeof browser != 'undefined' ? browser.i18n.getMessage : function (messageName) {
	let message = messageName.replace(/_/g, ' ').replace(/^.+\./, '');
	addMessage(messageName, message);
	return message;
};

exports.getI18n = getI18n;

},{}],2:[function(require,module,exports){
'use strict';

var _I18nHelper = require('./inc/I18nHelper');

/**
 * Setup i18n in HTML.
 * 
 * Must be included when HTML is ready.
 */
// en-US -> en
let lang = typeof browser != 'undefined' ? browser.i18n.getUILanguage().replace(/[-_]\w+$/, '') : 'pl';

// remove all elements marked with language attribute that is different then current
document.querySelectorAll('[data-lang]').forEach(function (el) {
	if (lang != el.getAttribute('data-lang')) {
		el.parentNode.removeChild(el);
	}
});

// other HTML content not setup in controllers
document.querySelectorAll('*[data-i18n-key]').forEach(function (el) {
	var key = el.getAttribute('data-i18n-key');
	el.textContent = (0, _I18nHelper.getI18n)(key);
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

},{"./inc/I18nHelper":1}]},{},[2])

