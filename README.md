WebExtension: SearchAutocomplete
================================

This WebExtension aims to give you quick, keyword based autocomplete for your search engines. Making your address bar an effective tool again ;-). Should be a good replacement for Omnibar add-on (that worked until FF 56).

Installation through AMO page: https://addons.mozilla.org/pl/firefox/addon/searchautocomplete/

If you would like to contribute (or fork) this extension see the [Development instruction](DEVELOPMENT.md).

Default search engines
----------------------

By default you are provided with autocomplete for English and Polish Wikipedia.

You can easily add new Wikipedia by coping existing engine definition. Just change the base URL and the keyword.

<img src="https://raw.githubusercontent.com/Eccenux/WebExt-SearchAutocomplete/master/screen/sa-en-Fire.png" alt="Mass operations dialog">

Custom search engines
---------------------

### Wikipedia and similar ###

Currently I support any search engine that is roughly similar to Wikipedia API. Wikipedia uses the [OpenSearch Suggestions standard](http://www.opensearch.org/Specifications/OpenSearch/Extensions/Suggestions/1.0#Response_Content).

For this format the server returns something like this:
```
[
	'search term',
	[...titles...],
	[...descriptions...],
	[...direct urls...]	
]
```
I only require that the search term and tiles array is present. I don't actually use the search term, but it seems to be required by the standard.

* *titles* -- title of the matched article.
* *descriptions* -- description (preview) of the matched article. If not present then just titles will be displayed.
* *direct urls* -- url of the matched article. If not present then I will use `open` action definition to build the URL.

### Other formats ###

As I said above I only require an array with search term and tiles array is present. So that should be easy to implement if you have a control over the server.

But I'm looking into implementing more formats. Please add an issue and specify the format you need. I'm also open to suggestions on how to define response parsers more freely (maybe define a root with titles somehow?).

Anyway if you are interested how parsing responses is currently working then have a look at `createSuggestionsFromResponse` function in the `SearchHelper` class/module.
