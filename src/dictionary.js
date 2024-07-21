// The code responsible for the from-Na'vi dictionary in Reykunyu. This module
// encapsulates the dictionary data read from data/words.json.
//
// Each word has an integer ID, which is its position in the list in
// words.json. Furthermore, we assume that combinations of word (the Na’vi word)
// and type (the word class, such as "n" or "v:tr") are unique, so that we can
// uniquely define words by word and type too. We call the combination of a word
// and its type the key of that word.

module.exports = {
	'reload': reload,
	'getById': getById,
	'get': get,
	'getEditable': getEditable,
	'getOfTypes': getOfTypes,
	'getNotOfTypes': getNotOfTypes,
	'getAll': getAll,
	'splitWordAndType': splitWordAndType
}

const fs = require('fs');

const dialect = require('./dialect');
const output = require('./output');

var words;

// dictionaries of all Na'vi words in the database, one per dialect
// each dictionary is a mapping from strings to (arrays of) IDs in `words`
// used for searching
var searchables = {};

// dictionary of all word:type keys in the database
// this is a mapping from strings to IDs in `words`
// used for resolving word links
var wordTypeKeys = {};

// Processes the dictionary data.
function reload() {
	try {
		words = JSON.parse(fs.readFileSync("./data/words.json"));
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

	for (let i = 0; i < words.length; i++) {
		let word = words[i];

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
		for (let dialect of ['FN', 'RN']) {
			let searchable = word['word_raw'][dialect].toLowerCase();
			if (!searchables[dialect].hasOwnProperty(searchable)) {
				searchables[dialect][searchable] = [];
			}
			searchables[dialect][searchable].push(i);
			if (!searchables['combined'].hasOwnProperty(searchable)) {
				searchables['combined'][searchable] = [];
			}
			if (!searchables['combined'][searchable].includes(i)) {
				searchables['combined'][searchable].push(i);
			}
		}

		// put the word in the wordTypeKeys dictionary
		let wordTypeKey = word['word_raw']['FN'] + ':' + word['type'];
		if (wordTypeKeys.hasOwnProperty(wordTypeKey)) {
			output.warning('Duplicate word/type ' + wordTypeKey + ' in words.json');
			output.hint(`Reykunyu assumes there cannot be two identical words with the same word
type (as word/type combinations are used to refer to words). Because
there is a duplicate, the second word/type combination will not be able
to be linked to from other words.`, 'duplicate-word-type');
		}
		wordTypeKeys[wordTypeKey] = i;
	}
}

function getById(id) {
	return words[id];
}

// Returns the given word of the given type.
// The returned object is a deep copy. Editing it won't change the data in the
// dictionary itself (see also getEditable).
function get(word, type, dialect) {
	//console.log('GETTING', word, type, dialect);
	if (searchables[dialect].hasOwnProperty(word)) {
		//console.log('FINDING', searchables[dialect][word]);
		for (let id of searchables[dialect][word]) {
			let result = words[id];
			//console.log('ID', result);
			if (result['type'] === type) {
				return deepCopy(result);
			}
		}
	}
	//console.log('NOPE');
	return null;
}

// Returns the given word of the given type, without making a deep copy.
// The word is assumed to be in FN.
function getEditable(word, type) {
	if (searchables['FN'].hasOwnProperty(word)) {
		for (let id of searchables['FN'][word]) {
			let result = words[id];
			if (result['type'] === type) {
				return result;
			}
		}
	}
	return null;
}

// Returns the given word of one of the given types. This returns an array
// because more than one type may match.
function getOfTypes(word, types, dialect) {
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
function getNotOfTypes(word, types, dialect) {
	let results = [];
	if (searchables[dialect].hasOwnProperty(word)) {
		for (let id of searchables[dialect][word]) {
			let result = words[id];
			if (!types.includes(result['type'])) {
				results.push(JSON.parse(JSON.stringify(result)));
			}
		}
	}
	return results;
}

function getAll() {
	return words;
}

function deepCopy(object) {
	return JSON.parse(JSON.stringify(object));
}

function splitWordAndType(wordType) {
	let i = wordType.indexOf(':');
	return [wordType.substring(0, i), wordType.substring(i + 1)];
}
