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
	'getAllSentences': getAllSentences,
	'removeSentence': removeSentence,
	'insertSentence': insertSentence,
	'hasSentence': hasSentence,
	'saveCorpus': saveCorpus
}

const fs = require('fs');

const levenshtein = require('js-levenshtein');

const adjectives = require('./adjectives');
const affixList = require('./affixList');
const conjugatedTranslation = require('./conjugatedTranslation');
const conjugationString = require('./conjugationString');
const convert = require('./convert');
const dictionary = require('./dictionary');
const ipa = require('./ipa');
const nouns = require('./nouns');
const numbers = require('./numbers');
const output = require('./output');
const preprocess = require('./preprocess');
const pronouns = require('./pronouns');
const rhymes = require('./rhymes');
const verbs = require('./verbs');
const wordLinks = require('./wordLinks');

const matchAll = require('string.prototype.matchall');
matchAll.shim();

try {
	var sentences = JSON.parse(fs.readFileSync("./data/corpus.json"));
} catch (e) {
	output.warning('Corpus data not found');
	output.hint(`Reykunyu uses a JSON file called corpus.json containing the example
sentences. This file does not seem to be present. This warning is
harmless, but Reykunyu won't find any example sentences.`);
	var sentences = {};
}

var sentencesForWord = {};
var pronounForms = {};

// list of all words, for randomization
var allWords = [];
var allWordsOfType = {};

reloadData();

function reloadData() {
	pronounForms = pronouns.getConjugatedForms(dictionary);

	sentencesForWord = [];

	// preprocess all words
	for (let word of dictionary.getAll()) {
		// pronunciation
		if (word.hasOwnProperty('pronunciation')) {
			for (let pronunciation of word['pronunciation']) {
				pronunciation['ipa'] = {
					'FN': ipa.generateIpa(pronunciation, word['type'], 'FN'),
					'RN': ipa.generateIpa(pronunciation, word['type'], 'RN')
				};
			}
		}
		
		// conjugation tables
		if (word['type'] === 'n' || word['type'] === 'n:pr') {
			word['conjugation'] = {
				'forms': createNounConjugation(word['na\'vi'], word['type'])
			};
		}
		if (word['type'] === 'adj') {
			word['conjugation'] = {
				'forms': createAdjectiveConjugation(word)
			};
		}

		// etymology and derived words
		if (word.hasOwnProperty('etymology')) {
			word['etymology'] = wordLinks.enrichWordLinks(word['etymology'], dictionary);
			for (let piece of word['etymology']) {
				if (typeof piece === "string") {
					continue;
				}
				const navi = piece["na'vi"].toLowerCase()
					.replace(/[-\[\]]/g, '').replaceAll('/', '').replaceAll('ù', 'u');  // TODO replace by word_raw
				const type = piece["type"];
				const result = dictionary.getEditable(navi, type);
				if (result) {
					if (!result.hasOwnProperty('derived')) {
						result['derived'] = [];
					}
					result['derived'].push(wordLinks.stripToLinkData(word));
				} else {
					output.warning('Invalid reference to ' + navi + ':' + type + ' in etymology for ' + word);
					output.hint(`The etymology data for a word refers to a word/type that doesn't
exist. This etymology link will look broken in the word entry.`, 'invalid-etymology-reference');
				}
			}
		}

		// meaning notes
		if (word.hasOwnProperty('meaning_note')) {
			word['meaning_note'] = wordLinks.enrichWordLinks(word['meaning_note'], dictionary);
		}

		// see also
		if (word.hasOwnProperty('seeAlso')) {
			for (let i = 0; i < word['seeAlso'].length; i++) {
				let [navi, type] = splitWordAndType(word['seeAlso'][i]);
				let result = dictionary.getEditable(navi, type);
				if (result) {
					word['seeAlso'][i] = wordLinks.stripToLinkData(result);
				}
			}
		}
	}

	// sort derived words
	for (let word of dictionary.getAll()) {
		if (word.hasOwnProperty('derived')) {
			word['derived'].sort(function (a, b) {
				return a["na'vi"].localeCompare(b["na'vi"]);  // TODO use word_raw
			});
		}
	}

	// prepare sentence search data
	for (const sentenceKey of Object.keys(sentences)) {
		const sentence = sentences[sentenceKey];
		for (const a of sentence['na\'vi']) {
			const roots = a[1];
			for (const r of roots) {
				let [word, type] = splitWordAndType(r);
				let result = dictionary.getEditable(word, type);
				if (result) {
					if (!result.hasOwnProperty('sentences')) {
						result['sentences'] = [];
					}
					if (!result['sentences'].includes(sentences[sentenceKey])) {
						result['sentences'].push(sentences[sentenceKey]);
					}
				} else {
					output.warning('Invalid reference to ' + r + ' in sentence ' + sentenceKey);
					output.hint(`The sentence refers to a word/type that doesn't exist.`,
						'invalid-sentence-reference');
				}
			}
		}
	}

	allWords = [];
	for (let word of dictionary.getAll()) {
		allWords.push(word);
	}

	allWordsOfType = {};
	for (const type of ['n', 'adj', 'v:in', 'v:tr', 'adv', 'adp', 'aff:in']) {
		allWordsOfType[type] = getAllWordsOfType(type, false);
	}
	for (const type of ['v:']) {
		allWordsOfType[type] = getAllWordsOfType(type, true);
	}
}

function splitWordAndType(wordType) {
	let i = wordType.indexOf(':');
	return [wordType.substring(0, i), wordType.substring(i + 1)];
}

function getAllWordsOfType(type, allowSubtype) {
	let result = [];
	for (let word of dictionary.getAll()) {
		if (word['type'] == type ||
			(allowSubtype && word['type'].startsWith(type))) {
			result.push(word);
		}
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

function getWord(id) {
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

function getResponsesFor(query, dialect) {
	query = preprocess.preprocessQuery(query, dialect);
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
			[wordCount, wordResults] = lookUpWordOrPhrase(queryArray, dialect);

		} else {
			// the complicated case: figure out which words this query word
			// could possibly be lenited from, and look all of these up
			let unlenitedWords = unlenite(queryWord);
			for (let j = 0; j < unlenitedWords.length; j++) {
				let wordResult = lookUpWord(unlenitedWords[j], dialect);
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
			scoreA = resultScore(a, queryWord);
			scoreB = resultScore(b, queryWord);
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
			for (let word of dictionary.getAll()) {
				const distance = levenshtein(word["na'vi"], queryWord);
				minDistance = Math.min(minDistance, distance);
				if (distance <= minDistance) {
					suggestions.push([word["na'vi"] + (word["type"] === "n:si" ? " si" : ""), distance]);
				}
			}
			suggestions = suggestions.filter(a => a[1] === minDistance)
				.map(a => a[0]).sort()
				.filter((a, i, array) => i === 0 || array[i - 1] !== a);
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
	"t": ["tx", "d"],
	"p": ["px", "b"],
	"k": ["kx", "g"]
};

function unlenite(word) {

	// word starts with vowel
	if (["a", "ä", "e", "i", "ì", "o", "u", "ù"].includes(word[0])) {
		return [word, "'" + word];
	}

	// word starts with ejective or ts
	if (word[1] === "x" || word.substring(0, 2) === "ts" || ['b', 'd', 'g'].includes(word[0])) {
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

function lookUpWordOrPhrase(queryWord, dialect) {
	// phrases
	for (let length = 8; length > 1; length--) {
		let phrase = queryWord.slice(0, length).join(' ');
		let key = phrase + ':phr';
		let result = dictionary.get(phrase, 'phr', dialect);
		if (result) {
			return [length, [result]];
		}
	}
	return [1, lookUpWord(queryWord[0], dialect)];
}

// Looks up a single word; returns a list of results.
//
// This method ensures that the data returned is a deep copy (i.e., we can
// safely change it without changing the dictionary data itself).
function lookUpWord(queryWord, dialect) {
	let wordResults = [];
	lookUpNoun(queryWord, wordResults, dialect);
	lookUpVerb(queryWord, wordResults, dialect);
	lookUpAdjective(queryWord, wordResults, dialect);
	lookUpProductiveAdverb(queryWord, wordResults, dialect);
	lookUpOtherType(queryWord, wordResults, dialect);
	return wordResults;
}

function lookUpNoun(queryWord, wordResults, dialect) {
	// handles conjugated nouns and pronouns
	let nounResults = nouns.parse(queryWord);
	nounResults.forEach(function (nounResult) {
		let nouns = dictionary.getOfTypes(nounResult["root"], ['n', 'n:pr'], dialect);
		for (let noun of nouns) {
			noun["conjugated"] = [{
				"type": "n",
				"conjugation": nounResult
			}];
			affixList.addAffixList(noun, dictionary);
			wordResults.push(noun);
		}
		const suffixes = ['yu', 'tswo'];
		for (const suffix of suffixes) {
			if (nounResult["root"].endsWith(suffix)) {
				let possibleVerb = nounResult["root"].slice(0, -suffix.length);
				let verbResults = [];
				lookUpVerb(possibleVerb, verbResults, dialect);
				verbResults.forEach(function (verb) {
					const conjugated = verb["conjugated"];
					const infixes = conjugated[conjugated.length - 1]["conjugation"]["infixes"];
					// allow these affixes only if there are no infixes in the verb
					// (see https://naviteri.org/2011/09/%e2%80%9cby-the-way-what-are-you-reading%e2%80%9d/#comment-1117)
					if (infixes[0] === '' && infixes[1] === '' && infixes[2] === '') {
						conjugated.push({
							"type": "v_to_n",
							"conjugation": {
								"result": [nounResult["root"]],
								"root": possibleVerb,
								"affixes": [suffix]
							}
						});
						conjugated.push({
							"type": "n",
							"conjugation": nounResult
						});
						affixList.addAffixList(verb, dictionary);
						wordResults.push(verb);
					}
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
					let resultCopy = JSON.parse(JSON.stringify(nounResult));
					resultCopy["root"] = word["na'vi"];
					resultCopy["affixes"][1] = foundForm["plural"];
					if (foundForm["case"] !== "") {
						resultCopy["affixes"][5] = foundForm["case"];
					}
					word["conjugated"] = [{
						"type": "n",
						"conjugation": resultCopy
					}];
					affixList.addAffixList(word, dictionary);
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
					affixList.addAffixList(word, dictionary);
					wordResults.push(word);
				}
			}
		}

		// verb gerunds (tì-<us>)
		if (nounResult["root"].startsWith('tì')) {
			let possibleVerb = nounResult["root"].slice(2);  // cut off tì-
			let verbResults = [];
			lookUpVerb(possibleVerb, verbResults, dialect, true);
			verbResults.forEach(function (verb) {
				const conjugated = verb["conjugated"];
				const infixes = conjugated[conjugated.length - 1]["conjugation"]["infixes"];
				// we're only interested in a word starting with tì- if its
				// verb also has an <us> infix; other tì-words are in the
				// dictionary already
				// also, ignore the word if it has other infixes added, as this
				// is not allowed
				if (infixes[0] === '' && infixes[1] === 'us' && infixes[2] === '') {
					let infixesWithoutFirst = ['', '', ''];
					let conjugatedWithoutFirst = conjugationString.formsFromString(verbs.conjugate(verb["infixes"], infixesWithoutFirst));
					conjugated[0]['conjugation']['result'] = conjugatedWithoutFirst;
					conjugated[0]['conjugation']['infixes'] = infixesWithoutFirst;
					conjugated.push({
						"type": "gerund",
						"conjugation": {
							"result": [nounResult["root"]],
							"root": conjugatedWithoutFirst[0],
							"affixes": ['tì', 'us']
						}
					});
					conjugated.push({
						"type": "n",
						"conjugation": nounResult
					});
					affixList.addAffixList(verb, dictionary);
					wordResults.push(verb);
				}
			});
		}
	});
}

function lookUpVerb(queryWord, wordResults, dialect, allowParticiples) {
	// handles conjugated verbs
	let verbResults = verbs.parse(queryWord);
	verbResults.forEach(function (result) {
		const infixes = result['infixes'];
		if (!allowParticiples && (infixes[1] === 'us' || infixes[1] === 'awn')) {
			// these are handled as adjectives; see lookUpAdjective()
			return;
		}
		let results = dictionary.getOfTypes(result["root"], ['v:in', 'v:tr', 'v:cp', 'v:m', 'v:si', 'v:?'], dialect);
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
			affixList.addAffixList(verb, dictionary);
			wordResults.push(verb);
		}
	});
}

function lookUpAdjective(queryWord, wordResults, dialect) {
	// handles conjugated adjectives
	let adjectiveResults = adjectives.parse(queryWord);
	adjectiveResults.forEach(function (adjResult) {
		let adjective = dictionary.get(adjResult['root'], 'adj', dialect);
		if (adjective) {
			let conjugation = conjugationString.formsFromString(
				adjectives.conjugate(adjResult["root"], adjResult["form"], adjective["etymology"]));
			let adjResultCopy = JSON.parse(JSON.stringify(adjResult));
			adjResultCopy["result"] = conjugation;
			adjective["conjugated"] = [{
				"type": "adj",
				"conjugation": adjResultCopy
			}];
			affixList.addAffixList(adjective, dictionary);
			wordResults.push(adjective);
		}

		// verb participles (somewhat hacky as the <us>/<awn> is parsed by the
		// verb parser, so we have to take that out again...)
		let verbResults = [];
		lookUpVerb(adjResult["root"], verbResults, dialect, true);
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
				affixList.addAffixList(verb, dictionary);
				wordResults.push(verb);
			}
		});

		// (ke)tsuk- + <verb>
		const prefixes = ['tsuk', 'ketsuk'];
		for (const prefix of prefixes) {
			if (adjResult["root"].startsWith(prefix)) {
				let possibleVerb = adjResult["root"].substring(prefix.length);
				let verbResults = [];
				lookUpVerb(possibleVerb, verbResults, dialect);
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
					affixList.addAffixList(verb, dictionary);
					wordResults.push(verb);
				});
			}
		}
	});
}

function lookUpProductiveAdverb(queryWord, wordResults, dialect) {
	// handles adverbs made from nì- + adjectives
	if (queryWord.startsWith('nì')) {
		let possibleAdjective = dictionary.get(queryWord.substring(2), 'adj', dialect);
		if (possibleAdjective) {
			const adjective = JSON.parse(JSON.stringify(possibleAdjective));
			adjective["conjugated"] = [{
				"type": "adj_to_adv",
				"conjugation": {
					"result": ['nì' + possibleAdjective],
					"root": possibleAdjective,
					"affixes": ['nì']
				}
			}];
			affixList.addAffixList(adjective, dictionary);
			wordResults.push(adjective);
		}
	}
}

function lookUpOtherType(queryWord, wordResults, dialect) {
	// handles other word types
	let ignoredTypes = ['n', 'n:pr', 'adj', 'v:in', 'v:tr', 'v:cp', 'v:m', 'v:si', 'v:?'];
	for (let word of dictionary.getNotOfTypes(queryWord, ignoredTypes, dialect)) {
		if (!word.hasOwnProperty('conjugation')) {
			wordResults.push(JSON.parse(JSON.stringify(word)));
		}
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
	if (result.hasOwnProperty('conjugated')) {
		// retain the last conjugated item that has a translation
		for (let conjugated of result['conjugated']) {
			conjugatedTranslation.addTranslations(result, dictionary);
			result['short_translation_conjugated'] = conjugated['translation'];
		}
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
				newAnswer["affixes"] = secondAnswer["affixes"];
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
	query = preprocess.preprocessQuery(query);
	query = query.toLowerCase();
	let results = [];
	for (let word of dictionary.getAll()) {
		if (word["na'vi"].toLowerCase().startsWith(query)) {
			results.push({
				"title": word["na'vi"] + (word['type'] === 'n:si' ? ' si' : ''),
				"description": '<div class="ui horizontal label">' + typeName(word['type'], language) + '</div> ' + simplifiedTranslation(word["translations"], language)
			});
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
		'aff:pre:len': 'pref.',
		'aff:in': 'inf.',
		'aff:suf': 'suff.',
		'nv:si': 'vin.',
	};

	return types[type];
}

function getReverseResponsesFor(query, language) {
	if (query === "") {
		return [];
	}

	let results = [];

	if (!language) {
		language = "en";
	}

	query = query.trim();
	query = query.toLowerCase();

	for (let word of dictionary.getAll()) {
		for (let translation of word['translations']) {
			if (translation[language]) {
				// split translation into words
				let t = translation[language].replace(/[.,:;\(\)\[\]\<\>/\\-]/g, ' ');
				t = t.split(' ').map((v) => v.toLowerCase());
				if (t.includes(query)) {
					let result = JSON.parse(JSON.stringify(word));
					results.push(result);
				}
				break;
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
	return dictionary.getAll();
}

function getAllKeys() {
	let result = [];
	for (let word of words) {
		if (word !== null) {
			result.push(word['key']);
		}
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
			if (dictionary[word].hasOwnProperty('pronunciation') &&
			    dictionary[word]['pronunciation'].length > 0) {
				if (rhymes.rhymes(dictionary[word]['pronunciation'][0]['syllables'], query)) {
					let key = 0;
					key = dictionary[word]['pronunciation'][0]['syllables'].split('-').length;
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

function getAllSentences() {
	return sentences;
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
	fs.writeFileSync("./data/corpus.json", JSON.stringify(sentences));
}
