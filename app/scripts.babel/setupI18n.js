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