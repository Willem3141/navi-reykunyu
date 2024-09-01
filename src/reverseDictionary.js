// The code responsible for the to-Na'vi dictionary in Reykunyu. This module
// encapsulates the dictionary data read from data/words.json.

module.exports = {
	'reload': reload,
	'search': search
}

const fs = require('fs');

const dictionary = require('./dictionary');
const output = require('./output');

// dictionaries of all natural language words in the database, one per language
// each dictionary is a mapping from strings to (arrays of) IDs in the
// dictionary
let searchables;

// Processes the dictionary data.
function reload() {
	searchables = {};

	let words = dictionary.getAll();

	for (let word of dictionary.getAll()) {
		for (let translation of word['translations']) {
			for (let language in translation) {
				if (!searchables.hasOwnProperty(language)) {
					searchables[language] = {};
				}
				// split translation into words
				let t = translation[language].replace(/[.,:;!?"\|\(\)\[\]\<\>/\\-]/g, ' ');
				t = t.split(' ').map((v) => v.toLowerCase());
				for (let w of t) {
					if (w.length === 0) {
						continue;
					}
					if (!searchables[language].hasOwnProperty(w)) {
						searchables[language][w] = [];
					}
					searchables[language][w].push(word['id']);
				}
			}
		}
	}
}

function search(word, language) {
	if (!searchables.hasOwnProperty(language) || !searchables[language].hasOwnProperty(word)) {
		return [];
	}
	let results = [];
	const indices = searchables[language][word];
	for (let id of indices) {
		let result = JSON.parse(JSON.stringify(dictionary.getById(id)));
		results.push(result);
	}
	return results;
}
