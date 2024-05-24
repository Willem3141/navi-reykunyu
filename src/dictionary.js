// The code from-Na'vi dictionary in Reykunyu. This module encapsulates the
// dictionary data read from data/words.json.
//
// Each word has an integer ID, which is its position in the list in
// words.json. Furthermore, we assume that combinations of word (the Na’vi word)
// and type (the word class, such as "n" or "v:tr") are unique, so that we can
// uniquely define words by word and type too. We call the combination of a word
// and its type the key of that word.
//
// TODO: define how exactly the key works. What is the key of toruk (torùk?) and
// pekxinum (peekxinùm?)

module.exports = {
	'getById': getById,
	'get': get,
	'getOfTypes': getOfTypes,
	'getNotOfTypes': getNotOfTypes,
	'getAll': getAll
}

const fs = require('fs');
const output = require('./output');

try {
	var words = JSON.parse(fs.readFileSync("./data/words.json"));
} catch (e) {
	output.error('words.json not found, exiting');
	output.hint(`Reykunyu gets its dictionary data from a JSON file called words.json.
This file does not seem to be present. If you want to run a local mirror
of the instance at https://reykunyu.lu, you can copy the dictionary data
from there:

$ wget -O data/words.json https://reykunyu.lu/api/list/all

Alternatively, you can start with an empty database:

$ echo "{}" > data/words.json`);
	process.exit(1);
}

// dictionary of all Na'vi words in the database
// this is a mapping from strings to (arrays of) IDs in `words`
// used for searching
var searchables = {};

// dictionary of all word:type keys in the database
// this is a mapping from strings to IDs in `words`
// used for resolving word links
var wordTypeKeys = {};

reload();

// Processes the dictionary data.
function reload() {
	searchables = {};

	for (let i = 0; i < words.length; i++) {
		let word = words[i];

		// put the word in the searchables dictionary
		let searchable = word["na'vi"].toLowerCase()
			.replace(/[-\[\]]/g, '').replaceAll('/', '').replaceAll('ù', 'u');  // TODO replace by word_raw
		if (!searchables.hasOwnProperty(searchable)) {
			searchables[searchable] = [];
		}
		searchables[searchable].push(i);

		// put the word in the wordTypeKeys dictionary
		let wordTypeKey = word['type'];
		if (wordTypeKey.hasOwnProperty(searchable)) {
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
function get(word, type) {
	if (searchables.hasOwnProperty(word)) {
		for (let id of searchables[word]) {
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
function getOfTypes(word, types) {
	let results = [];
	for (let type of types) {
		let result = get(word, type);
		if (result) {
			results.push(result);
		}
	}
	return results;
}

// Returns the given word that is not one of the given types. This returns an
// array because more than one type may match.
function getNotOfTypes(word, types) {
	let results = [];
	if (searchables.hasOwnProperty(word)) {
		for (let id of searchables[word]) {
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
