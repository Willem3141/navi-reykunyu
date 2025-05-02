// The code responsible for the from-Na'vi dictionary in Reykunyu. This module
// encapsulates the dictionary data read from data/words.json.
//
// Each word has an integer ID, which is its position in the list in
// words.json. Furthermore, we assume that combinations of word (the Na’vi word)
// and type (the word class, such as "n" or "v:tr") are unique, so that we can
// uniquely define words by word and type too. We call the combination of a word
// and its type the key of that word.

import fs from 'fs';

import * as dialect from './dialect';
import * as output from './output';

let wordArray: WordData[];
let words = new Map<number,WordData>();

// dictionaries of all Na'vi words in the database, one per dialect
// each dictionary is a mapping from strings to (arrays of) IDs in `words`
// used for searching
let searchables: Record<Dialect, { [word: string]: number[] }>;

// dictionary of all word:type keys in the database
// this is a mapping from strings to IDs in `words`
// used for resolving word links
let wordTypeKeys: {[key: string]: number};

reload();

// Processes the dictionary data.
// Returns a list of data errors.
export function reload(): string[] {
	words.clear();
	try {
		wordArray = JSON.parse(fs.readFileSync('./data/words.json', 'utf8'));
	} catch (e) {
		output.error('words.json not found, exiting');
		output.hint(`Reykunyu gets its dictionary data from a JSON file called words.json.
	This file does not seem to be present. If you want to run a local mirror
	of the instance at https://reykunyu.lu, you can copy the dictionary data
	from there:

	$ wget -O data/words.json https://reykunyu.lu/words.json

	Alternatively, you can start with an empty database:

	$ echo "{}" > data/words.json`);
		process.exit(1);
	}

	searchables = {
		'FN': {},
		'RN': {},
		'combined': {}
	};

	wordTypeKeys = {};

	let dataErrors: string[] = [];

	for (let i = 0; i < wordArray.length; i++) {
		let word = wordArray[i];

                let id = word['id'];
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
			if (!searchables[dialect].hasOwnProperty(searchable)) {
				searchables[dialect][searchable] = [];
			}
			searchables[dialect][searchable].push(id);
			if (!searchables['combined'].hasOwnProperty(searchable)) {
				searchables['combined'][searchable] = [];
			}
			if (!searchables['combined'][searchable].includes(id)) {
				searchables['combined'][searchable].push(id);
			}
		}

		// put the word in the wordTypeKeys dictionary
		let wordTypeKey = word['word_raw']['FN'] + ':' + word['type'];
		if (wordTypeKeys.hasOwnProperty(wordTypeKey)) {
			dataErrors.push('Duplicate word/type [' + wordTypeKey + '] in words.json');
		}
		wordTypeKeys[wordTypeKey] = id;
		words.set(id, word);
	}

	return dataErrors;
}

export function getById(id: number): WordData {
    let res : WordData | undefined = words.get(id);
    if ( res == undefined ) {
        throw new Error("undefined id " + String(id));
    } else {
        return res;
    }
}

// Returns the given word of the given type.
// The returned object is a deep copy. Editing it won't change the data in the
// dictionary itself (see also getEditable).
export function get(word: string, type: string, dialect: Dialect): WordData | null {
	if (searchables[dialect].hasOwnProperty(word)) {
		for (let id of searchables[dialect][word]) {
			let result = words.get(id);
                if ( !result ) continue;
			if (result['type'] === type) {
				return deepCopy(result);
			}
		}
	}
	return null;
}

// Returns the given word of the given type, without making a deep copy.
// The word is assumed to be in FN.
export function getEditable(word: string, type: string): WordData | null {
	if (searchables['FN'].hasOwnProperty(word)) {
		for (let id of searchables['FN'][word]) {
			let result = getById(id);
			if (result['type'] === type) {
				return result;
			}
		}
	}
	return null;
}

// Returns the given word of one of the given types. This returns an array
// because more than one type may match.
export function getOfTypes(word: string, types: string[], dialect: Dialect): WordData[] {
	let results = [];
	for (let type of types) {
		let result = get(word, type, dialect);
		if (result) {
			results.push(result);
		}
	}
	return results;
}

// Returns the given word that is not one of the given types. This returns an
// array because more than one type may match.
export function getNotOfTypes(word: string, types: string[], dialect: Dialect): WordData[] {
	let results = [];
	if (searchables[dialect].hasOwnProperty(word)) {
		for (let id of searchables[dialect][word]) {
			let result = getById(id);
			if (!types.includes(result['type'])) {
				results.push(JSON.parse(JSON.stringify(result)));
			}
		}
	}
	return results;
}

export function getAll(): WordData[] {
    //return Array.from(words.values());
    // only place this is exposed.
	return wordArray;
}

function deepCopy<T>(object: T): T {
	return JSON.parse(JSON.stringify(object));
}

export function splitWordAndType(wordType: string): [string, string] {
	let i = wordType.indexOf(':');
	return [wordType.substring(0, i), wordType.substring(i + 1)];
}
