// dummy
function addMessage() {
}

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
let getI18n = (typeof browser != 'undefined') ? browser.i18n.getMessage : function(messageName) {
	let message = messageName.replace(/_/g, ' ').replace(/^.+\./, '');
	addMessage(messageName, message);
	return message;
};

export { getI18n };