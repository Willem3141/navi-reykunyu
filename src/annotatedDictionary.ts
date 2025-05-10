import fs from 'fs';

import * as output from './output';
import * as preprocess from './preprocess';

let annotated: {[word: string]: string[]} = {};

try {
	annotated = JSON.parse(fs.readFileSync("./data/annotated.json", 'utf8'));
} catch (e) {
	output.warning('Annotated Dictionary data not found');
	output.hint(`Reykunyu uses a JSON file called annotated.json containing the source
of the Annotated Dictionary by Plumps. This file does not seem to be
present. This warning is harmless, but searching in the Annotated
Dictionary will not work.`);
	annotated = {};
}

export function getResponsesFor(query: string): {'results': string[]} {
	// always pass combined here, as the Annotated Dictionary data is in FN;
	// this way if someone inputs d, b, g they get preprocessed into tx, px, kx
	query = preprocess.preprocessQuery(query, 'combined');
	query = query.toLowerCase();
	let results: string[] = [];

	if (annotated.hasOwnProperty(query)) {
		results = results.concat(annotated[query]);
	}
	let upperCasedQuery = query[0].toUpperCase() + query.substring(1);
	if (upperCasedQuery !== query) {
		if (annotated.hasOwnProperty(upperCasedQuery)) {
			results = results.concat(annotated[upperCasedQuery]);
		}
	}

	return {'results': results};
}

export function getSuggestionsFor(query: string): Suggestions {
	query = preprocess.preprocessQuery(query, 'combined');
	query = query.toLowerCase();
	let resultsArray: Suggestion[] = [];

	for (const word in annotated) {
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
