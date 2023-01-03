module.exports = {
	'getWord': getWord,
	'getWordPostprocessed': getWordPostprocessed,
	'hasWord': hasWord,
	'getResponsesFor': getResponsesFor,
	'getSuggestionsFor': getSuggestionsFor,
	'getReverseResponsesFor': getReverseResponsesFor,
	'getReverseSuggestionsFor': getReverseSuggestionsFor,
	'getRandomWords': getRandomWords,
	'getUntranslated': getUntranslated,
	'getAll': getAll,
	'getAllKeys': getAllKeys,
	'getVerbs': getVerbs,
	'getTransitivityList': getTransitivityList,
	'getRhymes': getRhymes,
	'getAnnotatedResponsesFor': getAnnotatedResponsesFor,
	'getAnnotatedSuggestionsFor': getAnnotatedSuggestionsFor,
	'getAllSentences': getAllSentences,
	'removeWord': removeWord,
	'insertWord': insertWord,
	'saveDictionary': saveDictionary,
	'removeSentence': removeSentence,
	'insertSentence': insertSentence,
	'hasSentence': hasSentence,
	'saveCorpus': saveCorpus
}

const fs = require('fs');

const levenshtein = require('js-levenshtein');

const adjectives = require('./adjectives');
const conjugationString = require('./conjugationString');
const convert = require('./convert');
const ipa = require('./ipa');
const nouns = require('./nouns');
const numbers = require('./numbers');
const output = require('./output');
const pronouns = require('./pronouns');
const rhymes = require('./rhymes');
const verbs = require('./verbs');

const matchAll = require('string.prototype.matchall');
matchAll.shim();

try {
	var dictionary = JSON.parse(fs.readFileSync(__dirname + "/words.json"));
} catch (e) {
	output.error('words.json not found, exiting');
	output.hint(`Reykunyu gets its dictionary data from a JSON file called words.json.
This file does not seem to be present. If you want to run a local mirror
of the instance at https://reykunyu.lu, you can copy the dictionary data
from there:

$ wget -O words.json https://reykunyu.lu/api/list/all

Alternatively, you can start with an empty database:

$ echo "{}" > words.json`);
	process.exit(1);
}

try {
	var annotated = JSON.parse(fs.readFileSync(__dirname + "/annotated.json"));
} catch (e) {
	output.warning('Annotated Dictionary data not found');
	output.hint(`Reykunyu uses a JSON file called annotated.json containing the source
of the Annotated Dictionary by Plumps. This file does not seem to be
present. This warning is harmless, but searching in the Annotated
Dictionary will not work.`);
	var annotated = {};
}

try {
	var sentences = JSON.parse(fs.readFileSync(__dirname + "/corpus.json"));
} catch (e) {
	output.warning('Corpus data not found');
	output.hint(`Reykunyu uses a JSON file called corpus.json containing the example
sentences. This file does not seem to be present. This warning is
harmless, but Reykunyu won't find any example sentences.`);
	var sentences = {};
}

var sentencesForWord = {};
var derivedWords = {};
var pronounForms = {};

// list of all words, for randomization
var allWords = [];
var allWordsOfType = {};

reloadData();

// Replaces word links in a string by dictionary objects.
function addWordLinks(text) {

	// matches word links between brackets
	const wordLinkRegex = /\[([^:\]]+):([^\]]+)\]/g;
	pieces = text.split(wordLinkRegex);

	let list = [];
	for (let i = 0; i < pieces.length; i++) {
		if (i % 3 === 0) {
			// string piece: just place it into the list
			list.push(pieces[i]);
		} else {
			// regex-matched piece: get object from dictionary
			const navi = pieces[i];
			const type = pieces[i + 1];
			const key = navi + ':' + type;
			if (dictionary.hasOwnProperty(key)) {
				list.push(stripToLinkData(dictionary[key]));
			} else {
				console.log('Invalid reference to [' + key + ']');
			}
			i++;  // skip type
		}
	}
	return list;
}

function reloadData() {

	derivedWords = {};
	sentencesForWord = {};

	for (let word of Object.keys(dictionary)) {
		if (dictionary[word].hasOwnProperty('etymology')) {
			let etymology = dictionary[word]['etymology'];
			etymology = addWordLinks(etymology);
			for (let piece of etymology) {
				if (typeof piece === "string") {
					continue;
				}
				const navi = piece["na'vi"];
				const type = piece["type"];
				const key = navi + ':' + type;
				if (dictionary.hasOwnProperty(key)) {
					if (!derivedWords.hasOwnProperty(key)) {
						derivedWords[key] = [];
					}
					derivedWords[key].push(stripToLinkData(dictionary[word]));
				} else {
					console.log('Invalid reference to [' + key + '] in etymology for ' + word);
				}
			}
		}
	}

	for (let word of Object.keys(derivedWords)) {
		derivedWords[word].sort(function (a, b) {
			return a["na'vi"].localeCompare(b["na'vi"]);
		});
	}

	for (const sentenceKey of Object.keys(sentences)) {
		const sentence = sentences[sentenceKey];
		for (const a of sentence['na\'vi']) {
			const word = a[0];
			const roots = a[1];
			for (const r of roots) {
				if (dictionary.hasOwnProperty(r)) {
					if (!sentencesForWord.hasOwnProperty(r)) {
						sentencesForWord[r] = [];
					}
					if (!sentencesForWord[r].includes(sentences[sentenceKey])) {
						sentencesForWord[r].push(sentences[sentenceKey]);
					}
				} else {
					console.log('Invalid reference to [' + r + '] in sentence ' + sentenceKey);
				}
			}
		}
	}

	pronounForms = pronouns.getConjugatedForms(dictionary);

	allWords = [];
	for (let word of Object.keys(dictionary)) {
		allWords.push(dictionary[word]);
	}

	allWordsOfType = {};
	for (const type of ['n', 'adj', 'v:in', 'v:tr', 'adv', 'adp', 'aff:in']) {
		allWordsOfType[type] = getAllWordsOfType(type, false);
	}
	for (const type of ['v:']) {
		allWordsOfType[type] = getAllWordsOfType(type, true);
	}
}

function getAllWordsOfType(type, allowSubtype) {
	let result = [];
	for (let word of Object.keys(dictionary)) {
		if (dictionary[word]['type'] == type ||
				(allowSubtype && dictionary[word]['type'].startsWith(type))) {
			result.push(dictionary[word]);
		}
	}
	return result;
}

// Given a word object, returns an object that contains only the word data
// relevant when making a word link (Na'vi word, type, and translations).
// Calling this function makes the returned data smaller, and avoids potential
// infinite loops if two words happen to have word links to each other.
function stripToLinkData(word) {
	let result = {
		"na'vi": word["na'vi"],
		"type": word["type"],
		"translations": word["translations"]
	};
	if (word.hasOwnProperty("short_translation")) {
		result["short_translation"] = word["short_translation"];
	}
	return result;
}

function simplifiedTranslation(translation, language) {
	let result = "";

	for (let i = 0; i < translation.length; i++) {
		if (i > 0) {
			result += "; ";
		}
		if (translation[i].hasOwnProperty(language)) {
			result += translation[i][language].split(",")[0];
		} else {
			result += translation[i]["en"].split(",")[0];
		}
	}

	return result;
}

function getWord(word, type) {
	return dictionary[word.toLowerCase() + ':' + type];
}

function getWordPostprocessed(word, type) {
	let result = JSON.parse(JSON.stringify(getWord(word, type)));
	postprocessResult(result);
	return result;
}

function hasWord(word, type) {
	return dictionary.hasOwnProperty(word.toLowerCase() + ':' + type);
}

function getResponsesFor(query) {
	query = preprocessQuery(query);
	let results = [];

	// first split query on spaces to get individual words
	const spacesRegex = /\s+/g;
	let originalQueryWords = query.split(spacesRegex);

	// maintains if the previous word was a leniting adposition
	let externalLenition = false;

	let queryWords = [];
	for (let i = 0; i < originalQueryWords.length; i++) {
		let queryWord = originalQueryWords[i].replace(/[ .,!?:;]+/g, "");
		queryWord = queryWord.toLowerCase();
		queryWords.push(queryWord);
	}

	for (let i = 0; i < queryWords.length;) {
		let queryWord = queryWords[i];
		if (queryWord === '') {
			results.push({
				"tìpawm": originalQueryWords[i],
				"sì'eyng": [],
				"aysämok": []
			});
			i++;
			continue;
		}

		let wordResults = [];
		let wordCount = 1;

		if (!externalLenition) {
			// the simple case: no external lenition, so just look up the
			// query word
			let queryArray = [queryWord].concat(queryWords.slice(i + 1));
			[wordCount, wordResults] = lookUpWordOrPhrase(queryArray);

		} else {
			// the complicated case: figure out which words this query word
			// could possibly be lenited from, and look all of these up
			let unlenitedWords = unlenite(queryWord);
			for (let j = 0; j < unlenitedWords.length; j++) {
				let wordResult = lookUpWord(unlenitedWords[j]);
				for (let k = 0; k < wordResult.length; k++) {
					if (!forbiddenByExternalLenition(wordResult[k])) {
						wordResult[k]["externalLenition"] = {
							"from": unlenitedWords[j],
							"to": queryWord,
							"by": queryWords[i - 1]
						};
						wordResults.push(wordResult[k]);
					}
				}
			}
		}

		// sort on result relevancy
		// higher scores result in being sorted lower
		wordResults.sort((a, b) => {
			scoreA = resultScore(a);
			scoreB = resultScore(b);
			return scoreA - scoreB;
		});

		deduplicateResults(wordResults);

		// the next word will be externally lenited if this word is an adp:len
		// note that there are no adp:lens with several meanings, so we just
		// check the first element of the results array
		externalLenition = wordResults.length > 0 && wordResults[0]['type'] === 'adp:len';

		let suggestions = [];

		if (wordResults.length === 0) {
			let minDistance = queryWord.length / 3 + 1;  // allow more leeway with longer queries
			for (word in dictionary) {
				if (dictionary.hasOwnProperty(word)) {
					const distance = levenshtein(dictionary[word]["na'vi"], queryWord);
					minDistance = Math.min(minDistance, distance);
					if (distance <= minDistance) {
						suggestions.push([dictionary[word]["na'vi"] + (dictionary[word]["type"] === "n:si" ? " si" : ""), distance]);
					}
				}
			}
			suggestions = suggestions.filter(a => a[1] === minDistance).map(a => a[0]);
		}

		results.push({
			"tìpawm": originalQueryWords.slice(i, i + wordCount).join(' '),
			"sì'eyng": wordResults,
			"aysämok": suggestions
		});

		i += wordCount;
	}

	postprocessResults(results);

	return results;
}

let unlenitions = {
	"s": ["ts", "t", "s"],
	"f": ["p", "f"],
	"h": ["k", "h"],
	"t": ["tx"],
	"p": ["px"],
	"k": ["kx"]
};

function unlenite(word) {

	// word starts with vowel
	if (["a", "ä", "e", "i", "ì", "o", "u"].includes(word[0])) {
		return [word, "'" + word];
	}

	// word starts with ejective or ts
	if (word[1] === "x" || (word.substring(0, 2) === "ts")) {
		return [];
	}

	// word starts with constant that could not have been lenited
	if (!(word[0] in unlenitions)) {
		return [word];
	}

	// word starts with constant that could have been lenited
	let initials = unlenitions[word[0]];
	let result = [];
	for (let i = 0; i < initials.length; i++) {
		result.push(initials[i] + word.slice(1));
	}
	return result;
}

// figures out if a result cannot be valid if the query word was externally
// lenited; this is the case for nouns in the short plural
// (i.e., "mì hilvan" cannot be parsed as "mì + (ay)hilvan")
function forbiddenByExternalLenition(result) {
	if (!result.hasOwnProperty("conjugated")) {
		return false;
	}
	let outerConjugated = result["conjugated"][result["conjugated"].length - 1];
	if (outerConjugated["type"] !== "n") {
		return false;
	}
	const determinerPrefix = outerConjugated["conjugation"]["affixes"][0];
	const pluralPrefix = outerConjugated["conjugation"]["affixes"][1];
	let isShortPlural = pluralPrefix === "(ay)" ||
		(pluralPrefix === "ay" && !outerConjugated["conjugation"]["result"][0].startsWith("ay"));
	if (!isShortPlural) {
		return false;
	}
	let hasNoDeterminer = determinerPrefix === "";
	return hasNoDeterminer;
}

function lookUpWordOrPhrase(queryWord) {
	// phrases
	for (let length = 8; length > 1; length--) {
		let phrase = queryWord.slice(0, length).join(' ');
		let key = phrase + ':phr';
		if (dictionary.hasOwnProperty(key)) {
			return [length, [JSON.parse(JSON.stringify(dictionary[key]))]];
		}
	}
	return [1, lookUpWord(queryWord[0])];
}

// Looks up a single word; returns a list of results.
//
// This method ensures that the data returned is a deep copy (i.e., we can
// safely change it without changing the dictionary data itself).
function lookUpWord(queryWord) {
	let wordResults = [];
	lookUpNoun(queryWord, wordResults);
	lookUpVerb(queryWord, wordResults);
	lookUpAdjective(queryWord, wordResults);
	lookUpProductiveAdverb(queryWord, wordResults);
	lookUpOtherType(queryWord, wordResults);
	return wordResults;
}

function lookUpNoun(queryWord, wordResults) {
	// handles conjugated nouns and pronouns
	let nounResults = nouns.parse(queryWord);
	nounResults.forEach(function (nounResult) {
		let noun = findNoun(nounResult["root"]);
		if (noun) {
			noun["conjugated"] = [{
				"type": "n",
				"conjugation": nounResult
			}];
			noun["affixes"] = makeAffixList(noun["conjugated"]);
			wordResults.push(noun);
		}
		const suffixes = ['yu', 'tswo'];
		for (const suffix of suffixes) {
			if (nounResult["root"].endsWith(suffix)) {
				let possibleVerb = nounResult["root"].slice(0, -suffix.length);
				let verbResults = [];
				lookUpVerb(possibleVerb, verbResults);
				verbResults.forEach(function (verb) {
					verb["conjugated"].push({
						"type": "v_to_n",
						"conjugation": {
							"result": [nounResult["root"]],
							"root": possibleVerb,
							"affixes": [suffix]
						}
					});
					verb["conjugated"].push({
						"type": "n",
						"conjugation": nounResult
					});
					verb["affixes"] = makeAffixList(verb["conjugated"]);
					wordResults.push(verb);
				});
			}
		}

		if (pronounForms.hasOwnProperty(nounResult["root"])) {
			let foundForm = pronounForms[nounResult["root"]];
			let word = JSON.parse(JSON.stringify(foundForm["word"]));

			if (word["type"] === "pn") {
				// pronouns use the same parser as nouns, however we only
				// consider the possibilities where the plural and case affixes
				// are empty (because in pronounForms, all plural- and
				// case-affixed forms are already included)
				if (nounResult["affixes"][1] === "" &&
					nounResult["affixes"][2] === "" &&
					(nounResult["affixes"][3] === "" || foundForm["case"] === "") &&
					nounResult["affixes"][4] === "" &&
					(nounResult["affixes"][5] === "" || (nounResult["affixes"][3] !== "" && foundForm["case"] === "") || (foundForm["case"] === "" && ['l', 't', 'r', 'ä', 'ri'].indexOf(nounResult["affixes"][5]) === -1))) {
					nounResult["root"] = word["na'vi"];
					nounResult["affixes"][1] = foundForm["plural"];
					if (foundForm["case"] !== "") {
						nounResult["affixes"][5] = foundForm["case"];
					}
					word["conjugated"] = [{
						"type": "n",
						"conjugation": nounResult
					}];
					word["affixes"] = makeAffixList(word["conjugated"]);
					wordResults.push(word);
				}

			} else {
				// for non-pronouns, we allow no pre- and suffixes whatsoever
				if (queryWord === nounResult["root"]) {
					nounResult["root"] = word["na'vi"];
					nounResult["affixes"][1] = foundForm["plural"];
					nounResult["affixes"][5] = foundForm["case"];
					word["conjugated"] = [{
						"type": "n",
						"conjugation": nounResult
					}];
					word["affixes"] = makeAffixList(word["conjugated"]);
					wordResults.push(word);
				}
			}
		}
	});
}

function lookUpVerb(queryWord, wordResults, allowParticiples) {
	// handles conjugated verbs
	let verbResults = verbs.parse(queryWord);
	verbResults.forEach(function (result) {
		const infixes = result['infixes'];
		if (!allowParticiples && (infixes[1] === 'us' || infixes[1] === 'awn')) {
			// these are handled as adjectives; see lookUpAdjective()
			return;
		}
		let results = findVerb(result["root"]);
		for (let verb of results) {
			let conjugation = conjugationString.formsFromString(
				verbs.conjugate(verb["infixes"], result["infixes"]));
			let resultCopy = JSON.parse(JSON.stringify(result));
			if (conjugation.indexOf(queryWord) === -1) {
				resultCopy["correction"] = queryWord;
			}
			resultCopy["result"] = conjugation;
			verb["conjugated"] = [{
				"type": "v",
				"conjugation": resultCopy
			}];
			verb["affixes"] = makeAffixList(verb["conjugated"]);
			wordResults.push(verb);
		}
	});
}

function lookUpAdjective(queryWord, wordResults) {
	// handles conjugated adjectives
	let adjectiveResults = adjectives.parse(queryWord);
	adjectiveResults.forEach(function (adjResult) {
		if (dictionary.hasOwnProperty(adjResult["root"] + ":adj")) {
			adjective = JSON.parse(JSON.stringify(dictionary[adjResult["root"] + ":adj"]));
			let conjugation = conjugationString.formsFromString(
				adjectives.conjugate(adjResult["root"], adjResult["form"], adjective["etymology"]));
			let adjResultCopy = JSON.parse(JSON.stringify(adjResult));
			adjResultCopy["result"] = conjugation;
			adjective["conjugated"] = [{
				"type": "adj",
				"conjugation": adjResultCopy
			}];
			adjective["affixes"] = makeAffixList(adjective["conjugated"]);
			wordResults.push(adjective);
		}

		// verb participles (somewhat hacky as the <us>/<awn> is parsed by the
		// verb parser, so we have to take that out again...)
		let verbResults = [];
		lookUpVerb(adjResult["root"], verbResults, true);
		verbResults.forEach(function (verb) {
			const infixes = verb['conjugated'][0]['conjugation']['infixes'];
			if (infixes[1] === 'us' || infixes[1] === 'awn') {
				let infixesWithoutFirst = [infixes[0], '', infixes[2]];
				let conjugatedWithoutFirst = conjugationString.formsFromString(verbs.conjugate(verb["infixes"], infixesWithoutFirst));
				verb['conjugated'][0]['conjugation']['result'] = conjugatedWithoutFirst;
				verb['conjugated'][0]['conjugation']['infixes'] = infixesWithoutFirst;
				verb["conjugated"].push({
					"type": "v_to_part",
					"conjugation": {
						"result": [adjResult["root"]],
						"root": conjugatedWithoutFirst[0],
						"affixes": [infixes[1]]
					}
				});
				verb["conjugated"].push({
					"type": "adj",
					"conjugation": adjResult
				});
				verb["affixes"] = makeAffixList(verb["conjugated"]);
				wordResults.push(verb);
			}
		});

		// (ke)tsuk- + <verb>
		const prefixes = ['tsuk', 'ketsuk'];
		for (const prefix of prefixes) {
			if (adjResult["root"].startsWith(prefix)) {
				let possibleVerb = adjResult["root"].substring(prefix.length);
				let verbResults = [];
				lookUpVerb(possibleVerb, verbResults);
				verbResults.forEach(function (verb) {
					verb["conjugated"].push({
						"type": "v_to_adj",
						"conjugation": {
							"result": [adjResult["root"]],
							"root": possibleVerb,
							"affixes": [prefix]
						}
					});
					verb["conjugated"].push({
						"type": "adj",
						"conjugation": adjResult
					});
					verb["affixes"] = makeAffixList(verb["conjugated"]);
					wordResults.push(verb);
				});
			}
		}
	});
}

function lookUpProductiveAdverb(queryWord, wordResults) {
	// handles adverbs made from nì- + adjectives
	if (queryWord.startsWith('nì')) {
		const possibleAdjective = queryWord.substring(2);
		if (dictionary.hasOwnProperty(possibleAdjective + ':adj')) {
			const adjective = JSON.parse(JSON.stringify(dictionary[possibleAdjective + ':adj']));
			adjective["conjugated"] = [{
				"type": "adj_to_adv",
				"conjugation": {
					"result": ['nì' + possibleAdjective],
					"root": possibleAdjective,
					"affixes": ['nì']
				}
			}];
			adjective["affixes"] = makeAffixList(adjective["conjugated"]);
			wordResults.push(adjective);
		}
	}
}

function lookUpOtherType(queryWord, wordResults) {
	// handles other word types
	for (word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			let type = dictionary[word]['type'];
			if (dictionary[word]["na'vi"].toLowerCase() === queryWord &&
				type !== "n" && type !== "n:pr" &&
				type !== "adj" &&
				!dictionary[word].hasOwnProperty('conjugation') &&
				type.indexOf("v:") === -1) {
				wordResults.push(JSON.parse(JSON.stringify(dictionary[word])));
			}
		}
	}
}

// fwew frafnetstxolì'ut lì'upukmì
function findNoun(word) {
	if (dictionary.hasOwnProperty(word + ":n")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":n"]));
	}
	if (dictionary.hasOwnProperty(word + ":n:pr")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":n:pr"]));
	}
	return null;
}

// fwew frafnekemlì'ut lì'upukmì
function findVerb(word) {
	let results = [];
	if (dictionary.hasOwnProperty(word + ":v:in")) {
		results.push(JSON.parse(JSON.stringify(dictionary[word + ":v:in"])));
	}
	if (dictionary.hasOwnProperty(word + ":v:tr")) {
		results.push(JSON.parse(JSON.stringify(dictionary[word + ":v:tr"])));
	}
	if (dictionary.hasOwnProperty(word + ":v:cp")) {
		results.push(JSON.parse(JSON.stringify(dictionary[word + ":v:cp"])));
	}
	if (dictionary.hasOwnProperty(word + ":v:m")) {
		results.push(JSON.parse(JSON.stringify(dictionary[word + ":v:m"])));
	}
	if (dictionary.hasOwnProperty(word + ":v:si")) {
		results.push(JSON.parse(JSON.stringify(dictionary[word + ":v:si"])));
	}
	if (dictionary.hasOwnProperty(word + ":v:?")) {
		results.push(JSON.parse(JSON.stringify(dictionary[word + ":v:?"])));
	}
	return results;
}

function makeAffixList(conjugated) {
	list = [];

	for (let conjugation of conjugated) {
		let affixes = conjugation['conjugation']['affixes'];
		if (conjugation['type'] === 'n') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre']);
			if (affixes[1] === '(ay)') {
				addAffix(list, 'prefix', 'ay', ['aff:pre']);
			} else {
				addAffix(list, 'prefix', affixes[1], ['aff:pre']);
			}
			addAffix(list, 'prefix', affixes[2], ['aff:pre']);
			addAffix(list, 'suffix', affixes[3], ['aff:suf']);
			addAffix(list, 'suffix', affixes[4], ['aff:suf']);
			addAffix(list, 'suffix', affixes[5], ['aff:suf', 'adp', 'adp:len']);
			addAffix(list, 'suffix', affixes[6], ['part']);

		} else if (conjugation['type'] === 'v_to_n') {
			addAffix(list, 'suffix', affixes[0], ['aff:suf']);

		} else if (conjugation['type'] === 'v_to_adj') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre']);

		} else if (conjugation['type'] === 'v_to_part') {
			addAffix(list, 'infix', affixes[0], ['aff:in']);

		} else if (conjugation['type'] === 'v') {
			let infixes = conjugation['conjugation']['infixes'];
			addPrefirstVerbInfix(list, infixes[0]);
			addFirstVerbInfix(list, infixes[1]);
			addAffix(list, 'infix', infixes[2], ['aff:in']);

		} else if (conjugation['type'] === 'adj') {
			let form = conjugation['conjugation']['form'];
			if (form === 'postnoun') {
				addAffix(list, 'prefix', 'a', ['aff:pre']);
			} else if (form === 'prenoun') {
				addAffix(list, 'suffix', 'a', ['aff:suf']);
			}

		} else if (conjugation['type'] === 'adj_to_adv') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre']);
		}
	}

	return list;
}

function addAffix(list, affixType, affixString, types) {
	if (!affixString.length) {
		return;
	}
	let affix;
	for (let t of types) {
		if (hasWord(affixString, t)) {
			affix = getWord(affixString, t);
			break;
		}
	}
	if (affix) {
		list.push({
			'type': affixType,
			'affix': affix
		});
	}
}

function addCombinedAffix(list, affixType, combined, affixStrings, types) {
	let combinedList = [];
	for (const affixString of affixStrings) {
		addAffix(combinedList, affixType, affixString, types);
	}
	list.push({
		'type': affixType,
		'affix': combined,
		'combinedFrom': combinedList
	});
}

function addPrefirstVerbInfix(list, affixString) {
	if (affixString === "äpeyk") {
		addCombinedAffix(list, 'infix', affixString, ['äp', 'eyk'], ['aff:in']);
	} else {
		addAffix(list, 'infix', affixString, ['aff:in']);
	}
}

function addFirstVerbInfix(list, affixString) {
	if (affixString === "ìsy") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 's'], ['aff:in']);
	} else if (affixString === "asy") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 's'], ['aff:in']);
	} else if (affixString === "alm") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'ol'], ['aff:in']);
	} else if (affixString === "ìlm") {
		addCombinedAffix(list, 'infix', affixString, ['ìm', 'ol'], ['aff:in']);
	} else if (affixString === "ìly") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 'ol'], ['aff:in']);
	} else if (affixString === "aly") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'ol'], ['aff:in']);
	} else if (affixString === "arm") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'er'], ['aff:in']);
	} else if (affixString === "ìrm") {
		addCombinedAffix(list, 'infix', affixString, ['ìm', 'er'], ['aff:in']);
	} else if (affixString === "ìry") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 'er'], ['aff:in']);
	} else if (affixString === "ary") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'er'], ['aff:in']);
	} else if (affixString === "imv") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'iv'], ['aff:in']);
	} else if (affixString === "ìyev") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'iv'], ['aff:in']);
	} else if (affixString === "ilv") {
		addCombinedAffix(list, 'infix', affixString, ['ol', 'iv'], ['aff:in']);
	} else if (affixString === "irv") {
		addCombinedAffix(list, 'infix', affixString, ['er', 'iv'], ['aff:in']);
	} else {
		addAffix(list, 'infix', affixString, ['aff:in']);
	}
}

function resultScore(result, queryWord) {
	let score = 0;

	if (result["na'vi"].toLowerCase() !== queryWord) {
		// if this was an incorrect conjugation, sort it further down
		if (result.hasOwnProperty("conjugated")) {
			for (let conjugation of result["conjugated"]) {
				if (conjugation.hasOwnProperty("conjugation") &&
					conjugation["conjugation"].hasOwnProperty("correction")) {
					score += 10;
					let distance = 10;
					for (let result of conjugation["conjugation"]["result"]) {
						const d = levenshtein(convert.compress(conjugation["conjugation"]["correction"]), convert.compress(result));
						distance = Math.min(distance, d);
					}
					score += distance;
				}
			}
		}
		// the longer the root word, the higher it should be sorted
		// because it likely has a more specialized meaning
		// (e.g. utraltsyìp vs. utral)
		score += 100 - result["na'vi"].length;
	}
	return score;
}

/**
 * Removes any duplicated results from the results array. If duplicates occur,
 * the first one is retained and the others are removed.
 */
function deduplicateResults(results) {
	let seenKeys = new Set();
	for (let i = 0; i < results.length; i++) {
		const key = results[i]["na'vi"] + ':' + results[i]['type'];
		if (seenKeys.has(key)) {
			results.splice(i, 1);
			i--;
		}
		seenKeys.add(key);
	}
}

/**
 * Given a result object, postprocesses it by adding word links, and doing
 * si-verb merges.
 */
function postprocessResults(results) {
	mergeSiVerbs(results);

	for (let word of results) {
		for (let result of word['sì\'eyng']) {
			postprocessResult(result);
		}
	}
}

function postprocessResult(result) {
	if (result['type'] === 'n' || result['type'] === 'n:pr') {
		result['conjugation'] = {
			'forms': createNounConjugation(result['na\'vi'], result['type'])
		};
	}
	if (result['type'] === 'adj') {
		result['conjugation'] = {
			'forms': createAdjectiveConjugation(result)
		};
	}
	if (result.hasOwnProperty('etymology')) {
		result['etymology'] = addWordLinks(result['etymology']);
	}
	if (result.hasOwnProperty('meaning_note')) {
		result['meaning_note'] = addWordLinks(result['meaning_note']);
	}
	if (result.hasOwnProperty('pronunciation')) {
		for (let pronunciation of result['pronunciation']) {
			pronunciation['ipa'] = {
				'FN': ipa.generateIpa(pronunciation, result['type'], 'FN'),
				'RN': ipa.generateIpa(pronunciation, result['type'], 'RN')
			};
		}
	}
	const key = result['na\'vi'] + ':' + result['type'];
	if (derivedWords.hasOwnProperty(key)) {
		result['derived'] = derivedWords[key];
	}
	if (sentencesForWord.hasOwnProperty(key)) {
		result['sentences'] = sentencesForWord[key];
	}
}

function createNounConjugation(word, type) {

	let conjugation = [];
	let cases = ['', 'l', 't', 'r', 'ä', 'ri'];
	let plurals = ['', 'me', 'pxe', 'ay'];

	for (let j = 0; j < 4; j++) {
		let row = [];
		if (type !== 'n:pr' || j === 0) {
			for (let i = 0; i < 6; i++) {
				let conjugated = nouns.conjugate(word,
					['', plurals[j], '', '', '', cases[i], ''], true);
				row.push(conjugated);
			}
		}
		conjugation.push(row);
	}

	return conjugation;
}

function createAdjectiveConjugation(word) {
	const conjugation = {
		"prefixed": adjectives.conjugate(word["na'vi"], 'postnoun', word["etymology"]),
		"suffixed": adjectives.conjugate(word["na'vi"], 'prenoun', word["etymology"])
	};
	return conjugation;
}

/**
 * Merges si-verbs into a single entry in the results array.
 *
 * A phrase like "kaltxì si" should be seen as a single si-verb, so this method
 * finds instances of n:si + v:si and merges them into a single entry of type
 * nv:si.
 */
function mergeSiVerbs(results) {
	for (let i = 0; i < results.length - 1; i++) {
		const second = results[i + 1];

		if (second["sì'eyng"].length !== 1) {
			continue;
		}
		const secondAnswer = second["sì'eyng"][0];
		if (secondAnswer["type"] !== "v:si") {
			continue;
		}

		const first = results[i];
		let newResult = {
			"tìpawm": first["tìpawm"] + " " + second["tìpawm"],
			"sì'eyng": [],
			"aysämok": []
		};

		for (let answer of first["sì'eyng"]) {
			if (answer["type"] === "n:si") {
				let newAnswer = JSON.parse(JSON.stringify(answer));
				newAnswer["type"] = "nv:si";
				newAnswer["conjugated"] = secondAnswer["conjugated"];
				newResult["sì'eyng"].push(newAnswer);
			}
		}

		if (newResult["sì'eyng"].length > 0) {
			results[i + 1] = newResult;
			results.splice(i, 1);
		}
	}
}

function getSuggestionsFor(query, language) {
	if (query.length < 3) {
		return { 'results': [] };
	}
	query = preprocessQuery(query);
	query = query.toLowerCase();
	let results = [];
	for (let w in dictionary) {
		if (dictionary.hasOwnProperty(w)) {
			let word = dictionary[w];
			if (word["na'vi"].toLowerCase().startsWith(query)) {
				results.push({
					"title": word["na'vi"] + (word['type'] === 'n:si' ? ' si' : ''),
					"description": '<div class="ui horizontal label">' + typeName(word['type'], language) + '</div> ' + simplifiedTranslation(word["translations"], language)
				});
			}
		}
	}
	return {
		'results': results
	};
}

function getReverseSuggestionsFor(query, language) {
	if (query.length < 3) {
		return { 'results': [] };
	}

	let results = [];

	if (!language) {
		language = "en";
	}

	query = query.toLowerCase();

	wordLoop:
	for (word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			let translation = dictionary[word]['translations'][0][language];
			if (translation) {
				// split translation into words
				translation = translation.replace(/[.,:;\(\)\[\]\<\>/\\-]/g, ' ');
				translation = translation.split(' ');
				for (const w of translation) {
					if (w.toLowerCase().startsWith(query)) {
						results.push({
							"title": dictionary[word]["na'vi"] + (word['type'] === 'n:si' ? ' si' : ''),
							"description": '<div class="ui horizontal label">' + typeName(dictionary[word]['type'], language) + '</div> ' + simplifiedTranslation(dictionary[word]["translations"], language)
						});
						continue wordLoop;
					}
				}
			}
		}
	}

	return {
		'results': results
	};
}

function typeName(type, language) {
	const types = {
		'n': 'n.',
		'n:unc': 'n.',
		'n:si': 'vin.',
		'n:pr': 'npr.',
		'pn': 'pn.',
		'adj': 'adj.',
		'num': 'num.',
		'adv': 'adv.',
		'adp': 'adp.',
		'adp:len': 'adp+',
		'intj': 'intj.',
		'part': 'part.',
		'conj': 'conj.',
		'ctr': 'sbd.',
		'v:?': 'v.',
		'v:in': 'vin.',
		'v:tr': 'vtr.',
		'v:m': 'vm.',
		'v:si': 'vin.',
		'v:cp': 'vcp.',
		'phr': 'phr.',
		'inter': 'inter.',
		'aff:pre': 'pref.',
		'aff:in': 'inf.',
		'aff:suf': 'suff.',
		'nv:si': 'vin.',
	};

	return types[type];
}

// normalizes a query by replacing weird Unicode tìftang variations by
// normal ASCII ', and c -> ts / g -> ng
function preprocessQuery(query) {
	query = query.replace(/’/g, "'");
	query = query.replace(/‘/g, "'");
	query = query.replace(/c/g, "ts");
	query = query.replace(/C/g, "Ts");
	query = query.replace(/sh/g, "sy");
	query = query.replace(/Sh/g, "Sy");
	query = query.replace(/(?<![Nn])g/g, "ng");
	query = query.replace(/(?<![Nn])G/g, "Ng");
	return query;
}

function getReverseResponsesFor(query, language) {
	if (query === "") {
		return [];
	}

	let results = [];

	if (!language) {
		language = "en";
	}

	query = query.toLowerCase();

	for (word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			let translation = dictionary[word]['translations'][0][language];
			if (translation) {
				// split translation into words
				translation = translation.replace(/[.,:;\(\)\[\]\<\>/\\-]/g, ' ');
				translation = translation.split(' ').map((v) => v.toLowerCase());
				if (translation.includes(query)) {
					let result = JSON.parse(JSON.stringify(dictionary[word]));
					results.push(result);
				}
			}
		}
	}

	// special case: numbers
	if (/^\d+$/.test(query)) {
		const number = parseInt(query, 10);
		const result = numbers.conjugate(number);
		if (result !== null) {
			results.push(result);
		}
	}

	// sort on result relevancy
	// higher scores result in being sorted lower
	let resultScore = function (result) {
		let translation = result['translations'][0][language];
		if (translation.toLowerCase() !== query) {
			// the longer the translation, the lower it should be sorted because
			// in long translations, it is likely that the searched word is only
			// a small, irrelevant part of the translation
			return translation.length;
		}
		return 0;
	}

	results.sort((a, b) => {
		scoreA = resultScore(a);
		scoreB = resultScore(b);
		return scoreA - scoreB;
	});

	for (let result of results) {
		postprocessResult(result);
	}

	return results;
}

function getRandomWords(number, type) {
	let results = [];
	let wordList = allWords;
	if (type && allWordsOfType.hasOwnProperty(type)) {
		wordList = allWordsOfType[type];
	}
	const n = wordList.length;

	for (let i = n - 1; i >= n - number; i--) {

		// draw random word in [0, i]
		let random = Math.floor(Math.random() * (i + 1));
		let randomWord = wordList[random];
		results.push(JSON.parse(JSON.stringify(randomWord)));

		// swap drawn word to the end so we won't draw it again
		// (note: we don't care that wordList gets shuffled in the process because we use it only for
		// random draws anyway)
		const h = wordList[i];
		wordList[i] = wordList[random];
		wordList[random] = h;
	}

	for (let result of results) {
		postprocessResult(result);
	}

	return results;
}

function getUntranslated(language) {
	let results = [];

	wordLoop:
	for (let w in dictionary) {
		let word = dictionary[w];
		for (let translation of word['translations']) {
			if (!translation.hasOwnProperty(language) ||
				translation[language].length === 0) {
				results.push(word);
				continue wordLoop;
			}
		}
	}

	return results;
}

function getAll() {
	return dictionary;
}

function getAllKeys() {
	let result = [];
	for (let key in dictionary) {
		result.push(key);
	}
	return result;
}

function getVerbs() {
	let verbs = [];

	for (word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			let type = "";
			if ('type' in dictionary[word]) {
				type = dictionary[word]['type'];
			}
			if (type.startsWith('v') || type === 'n:si') {
				verbs.push(dictionary[word]);
			}
		}
	}

	return verbs;
}

function getTransitivityList() {
	let list = [];

	let verbs = getVerbs();
	for (let i = 0; i < verbs.length; i++) {
		const verb = verbs[i];
		let word = verb["na'vi"];
		const translation = verb["translations"][0]["en"];
		let type = verb["type"];
		if (type === "n:si") {
			word += " si";
			type = "v:in";
		}
		if (type === "v:in") {
			type = "intransitive";
		} else if (type === "v:tr") {
			type = "transitive";
		} else {
			continue;
		}
		list.push([word, translation, type]);
	}

	return list;
}

function getRhymes(query) {
	query = query.toLowerCase();

	let words = {};

	for (const word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			if (rhymes.rhymes(dictionary[word]["na'vi"], query)) {
				let key = 0;
				if (dictionary[word].hasOwnProperty('pronunciation')) {
					key = dictionary[word]['pronunciation'][0]['syllables'].split('-').length;
				}
				if (!words.hasOwnProperty(key)) {
					words[key] = [];
				}
				let subKey = 0;
				if (dictionary[word].hasOwnProperty('pronunciation')) {
					subKey = dictionary[word]['pronunciation'][0]['stressed'];
				}
				if (!words[key].hasOwnProperty(subKey)) {
					words[key][subKey] = [];
				}
				words[key][subKey].push(dictionary[word]);
			}
		}
	}

	for (const s in Object.keys(words)) {
		if (words[s]) {
			for (const s2 in Object.keys(words[s])) {
				if (words[s][s2]) {
					words[s][s2].sort(function (a, b) {
						return a["na'vi"].localeCompare(b["na'vi"]);
					});
				}
			}
		}
	}

	return words;
}

function getAnnotatedResponsesFor(query) {
	query = query.toLowerCase();
	let results = [];

	if (annotated.hasOwnProperty(query)) {
		results.push(annotated[query]);
	}
	let upperCasedQuery = query[0].toUpperCase() + query.substring(1);
	if (upperCasedQuery !== query) {
		if (annotated.hasOwnProperty(upperCasedQuery)) {
			results.push(annotated[upperCasedQuery]);
		}
	}

	return results;
}

function getAnnotatedSuggestionsFor(query) {
	if (query.length < 1) {
		return { 'results': [] };
	}

	query = query.toLowerCase();
	resultsArray = [];

	for (word in annotated) {
		if (annotated.hasOwnProperty(word)) {
			if (word.toLowerCase().startsWith(query)) {
				resultsArray.push({ 'title': word });
			}
		}
	}

	return {
		'results': resultsArray
	};
}

function getAllSentences() {
	return sentences;
}

function removeWord(word, type) {
	delete dictionary[word.toLowerCase() + ':' + type];
	reloadData();
}

function insertWord(data) {
	dictionary[data["na'vi"].toLowerCase() + ':' + data["type"]] = data;
	reloadData();
}

function saveDictionary() {
	fs.writeFileSync(__dirname + "/words.json", JSON.stringify(dictionary));
}

function removeSentence(key) {
	delete sentences[key];
	reloadData();
}

function insertSentence(key, sentence) {
	sentences[key] = sentence;
	reloadData();
}

function hasSentence(key) {
	return sentences.hasOwnProperty(key);
}

function saveCorpus() {
	fs.writeFileSync(__dirname + "/corpus.json", JSON.stringify(sentences));
}

