// The code responsible for the from-Na'vi dictionary in Reykunyu. This module
// encapsulates the dictionary data read from data/words.json.
//
// Each word has an integer ID, which is its position in the list in
// words.json. Furthermore, we assume that combinations of word (the Na’vi word)
// and type (the word class, such as "n" or "v:tr") are unique, so that we can
// uniquely define words by word and type too. We call the combination of a word
// and its type the key of that word.

import * as dialect from './dialect';

export default class Dictionary {

	words: WordData[];

	// dictionaries of all Na'vi words in the database, one per dialect
	// each dictionary is a mapping from strings to (arrays of) IDs in `words`
	// used for searching
	searchables: Record<Dialect, { [word: string]: number[] }>;

	// dictionary of all word:type keys in the database
	// this is a mapping from strings to IDs in `words`
	// used for resolving word links
	wordTypeKeys: { [key: string]: number };

	constructor(dictionaryJSON: any, dataErrors: string[]) {
		this.words = dictionaryJSON;

		this.searchables = {
			'FN': {},
			'RN': {},
			'combined': {}
		};

		this.wordTypeKeys = {};

		for (let i = 0; i < this.words.length; i++) {
			let word = this.words[i];

			// dialect forms of the word
			word['word'] = {
				'combined': word["na'vi"],
				'FN': dialect.combinedToFN(word["na'vi"]),
				'RN': dialect.combinedToRN(word["na'vi"])
			};
			word['word_raw'] = {
				'combined': dialect.makeRaw(word['word']['combined']),
				'FN': dialect.makeRaw(word['word']['FN']),
				'RN': dialect.makeRaw(word['word']['RN'])
			};

			word["na'vi"] = word['word_raw']['FN'];  // for compatibility reasons

			// put the word in the searchables dictionary
			for (let dialect of ['FN', 'RN'] as Dialect[]) {
				let searchable = word['word_raw'][dialect].toLowerCase();
				if (!this.searchables[dialect].hasOwnProperty(searchable)) {
					this.searchables[dialect][searchable] = [];
				}
				this.searchables[dialect][searchable].push(i);
				if (!this.searchables['combined'].hasOwnProperty(searchable)) {
					this.searchables['combined'][searchable] = [];
				}
				if (!this.searchables['combined'][searchable].includes(i)) {
					this.searchables['combined'][searchable].push(i);
				}
			}

			// put the word in the wordTypeKeys dictionary
			let wordTypeKey = word['word_raw']['FN'] + ':' + word['type'];
			if (this.wordTypeKeys.hasOwnProperty(wordTypeKey)) {
				dataErrors.push('Duplicate word/type [' + wordTypeKey + '] in words.json');
			}
			this.wordTypeKeys[wordTypeKey] = i;
		}
	}

	getById(id: number): WordData {
		return this.words[id];
	}

	// Returns the given word of the given type.
	// The returned object is a deep copy. Editing it won't change the data in the
	// dictionary itself (see also getEditable).
	get(word: string, type: string, dialect: Dialect): WordData | null {
		if (this.searchables[dialect].hasOwnProperty(word)) {
			for (let id of this.searchables[dialect][word]) {
				let result = this.words[id];
				if (result['type'] === type) {
					return Dictionary.deepCopy(result);
				}
			}
		}
		return null;
	}

	// Returns the given word of the given type, without making a deep copy.
	// The word is assumed to be in FN.
	getEditable(word: string, type: string): WordData | null {
		if (this.searchables['FN'].hasOwnProperty(word)) {
			for (let id of this.searchables['FN'][word]) {
				let result = this.words[id];
				if (result['type'] === type) {
					return result;
				}
			}
		}
		return null;
	}

	// Returns the given word of one of the given types. This returns an array
	// because more than one type may match.
	getOfTypes(word: string, types: string[], dialect: Dialect): WordData[] {
		let results = [];
		for (let type of types) {
			let result = this.get(word, type, dialect);
			if (result) {
				results.push(result);
			}
		}
		return results;
	}

	// Returns the given word that is not one of the given types. This returns an
	// array because more than one type may match.
	getNotOfTypes(word: string, types: string[], dialect: Dialect): WordData[] {
		let results = [];
		if (this.searchables[dialect].hasOwnProperty(word)) {
			for (let id of this.searchables[dialect][word]) {
				let result = this.words[id];
				if (!types.includes(result['type'])) {
					results.push(JSON.parse(JSON.stringify(result)));
				}
			}
		}
		return results;
	}

	getAll(): WordData[] {
		return this.words;
	}

	static deepCopy<T>(object: T): T {
		return JSON.parse(JSON.stringify(object));
	}

	splitWordAndType(wordType: string): [string, string] {
		let i = wordType.indexOf(':');
		return [wordType.substring(0, i), wordType.substring(i + 1)];
	}
}
