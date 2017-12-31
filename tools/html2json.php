<?php
	date_default_timezone_set('Europe/Warsaw');

	$html = file_get_contents('options.src.html');
	
	$langEn = array();
	$langPl = array();
	
	$html = preg_replace_callback('#<(\w+) data-lang="en">([\s\S]+?)</\1>\s+<(\w+) data-lang="pl">([\s\S]+?)</\3>#', function($matches) {
		global $langEn, $langPl;
		$en = $matches[2];
		$pl = $matches[4];
		$key = "options." . trim(preg_replace('#[^A-Za-z0-9_]+#', '_', $en), '_');
		
		$langEn[$key] = array(
			"message" => $en
		);
		$langPl[$key] = array(
			"message" => $pl
		);
		
		return '{{ "'.$key.'" | i18n }}';
	}, $html);
	
	file_put_contents('options.html', $html);
	file_put_contents('options.en.json', json_encode($langEn, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	file_put_contents('options.pl.json', json_encode($langPl, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
