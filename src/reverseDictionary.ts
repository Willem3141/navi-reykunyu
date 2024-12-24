// The code responsible for the to-Na'vi dictionary in Reykunyu. This module
// encapsulates the dictionary data read from data/words.json.

import * as dictionary from './dictionary';

// dictionaries of all natural language words in the database, one per language
// each dictionary is a mapping from strings to (arrays of) IDs in the
// dictionary
let searchables: Record<string, { [word: string]: number[] }>;

// Processes the dictionary data.
export function reload(): void {
	searchables = {};

	for (let word of dictionary.getAll()) {
		for (let translation of word['translations']) {
			for (let language in translation) {
				if (!searchables.hasOwnProperty(language)) {
					searchables[language] = {};
				}
				// split translation into words
				let t = translation[language].replace(/[.,:;!?"\|\(\)\[\]\<\>/\\-]/g, ' ');
				let words = t.split(' ').map((v) => v.toLowerCase());
				for (let w of words) {
					if (w.length === 0) {
						continue;
					}
					if (!searchables[language].hasOwnProperty(w)) {
						searchables[language][w] = [];
					}
					if (!searchables[language][w].includes(word['id'])) {
						searchables[language][w].push(word['id']);
					}
				}
			}
		}
	}
}

export function search(word: string, language: string): WordData[] {
	if (!searchables.hasOwnProperty(language) || !searchables[language].hasOwnProperty(word)) {
		return [];
	}
	let results: WordData[] = [];
	const indices = searchables[language][word];
	for (let id of indices) {
		let result = JSON.parse(JSON.stringify(dictionary.getById(id)));
		results.push(result);
	}
	return results;
}
