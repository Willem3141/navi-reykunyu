module.exports = {
	'getResponsesFor': getResponsesFor,
	'getSuggestionsFor': getSuggestionsFor,
}

const fs = require('fs');

const preprocess = require('./preprocess');

try {
	var annotated = JSON.parse(fs.readFileSync("./data/annotated.json"));
} catch (e) {
	output.warning('Annotated Dictionary data not found');
	output.hint(`Reykunyu uses a JSON file called annotated.json containing the source
of the Annotated Dictionary by Plumps. This file does not seem to be
present. This warning is harmless, but searching in the Annotated
Dictionary will not work.`);
	var annotated = {};
}

function getResponsesFor(query) {
	query = preprocess.preprocessQuery(query);
	query = query.toLowerCase();
	let results = [];

	if (annotated.hasOwnProperty(query)) {
		results = results.concat(annotated[query]);
	}
	let upperCasedQuery = query[0].toUpperCase() + query.substring(1);
	if (upperCasedQuery !== query) {
		if (annotated.hasOwnProperty(upperCasedQuery)) {
			results = results.concat(annotated[upperCasedQuery]);
		}
	}

	return results;
}

function getSuggestionsFor(query) {
	query = preprocess.preprocessQuery(query);
	query = query.toLowerCase();
	resultsArray = [];

	for (word in annotated) {
		if (annotated.hasOwnProperty(word)) {
			if (word.toLowerCase().startsWith(query)) {
				resultsArray.push({ 'title': word });
			}
		}
		if (resultsArray.length > 10) {
			break;
		}
	}

	return {
		'results': resultsArray
	};
}
