// The code responsible for the to-Na'vi dictionary in Reykunyu. This module
// encapsulates the dictionary data read from data/words.json.

import Dictionary from './dictionary';

export default class ReverseDictionary {
	dictionary: Dictionary;
	
	// dictionaries of all natural language words in the database, one per language
	// each dictionary is a mapping from strings to (arrays of) IDs in the
	// dictionary
	searchables: Record<string, { [word: string]: number[] }>;

	constructor(dictionary: Dictionary) {
		this.dictionary = dictionary;
		this.searchables = {};

		for (let word of this.dictionary.getAll()) {
			for (let translation of word['translations']) {
				for (let language in translation) {
					if (!this.searchables.hasOwnProperty(language)) {
						this.searchables[language] = {};
					}
					// split translation into words
					let t = translation[language].replace(/[.,:;!?"\|\(\)\[\]\<\>/\\-]/g, ' ');
					let words = t.split(' ').map((v) => v.toLowerCase());
					for (let w of words) {
						if (w.length === 0) {
							continue;
						}
						if (!this.searchables[language].hasOwnProperty(w)) {
							this.searchables[language][w] = [];
						}
						if (!this.searchables[language][w].includes(word['id'])) {
							this.searchables[language][w].push(word['id']);
						}
					}
				}
			}
		}
	}

	search(word: string, language: string): WordData[] {
		if (!this.searchables.hasOwnProperty(language) || !this.searchables[language].hasOwnProperty(word)) {
			return [];
		}
		let results: WordData[] = [];
		const indices = this.searchables[language][word];
		for (let id of indices) {
			let result = Dictionary.deepCopy(this.dictionary.getById(id));
			results.push(result);
		}
		return results;
	}
}
