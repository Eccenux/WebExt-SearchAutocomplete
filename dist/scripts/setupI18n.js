(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

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

// maybe later...
/*
// other HTML content not setup in controllers
$('*[data-i18n-key]').each(function()
{
	var key = $(el).attr('data-i18n-key');
	if ($(el).attr('type') == 'button')
	{
		$(el).val($mJ.i18n.get(key));
	}
	else
	{
		$(el).html($mJ.i18n.get(key));
	}
});

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

},{}]},{},[1])

