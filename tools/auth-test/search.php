<?php
/*
Full `application/x-suggestions+json` format:
[
	'search term',
	[...titles...],
	[...descriptions...],
	[...direct urls...]	
]
*/

header('Content-Type: application/json');

// query
$searchTerm = empty($_GET['q']) ? '' : $_GET['q'];
if (empty($searchTerm)) {
	die('[]');
}

// search (generated)
$titles = array(
	"$searchTerm test 1",
	"$searchTerm test 2",
	"$searchTerm test 3",
	"$searchTerm test 4",
	"$searchTerm test 5",
	"$searchTerm test 6",
	"$searchTerm test 7",
);

// mini
$results = array(
	$searchTerm,
	$titles
);

echo json_encode($results);