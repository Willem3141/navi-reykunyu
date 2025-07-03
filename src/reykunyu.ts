import levenshtein from 'js-levenshtein';

import * as adjectives from './adjectives';
import * as affixList from './affixList';
import * as conjugatedTranslation from './conjugatedTranslation';
import * as conjugationString from './conjugationString';
import * as convert from './convert';
import Dictionary from './dictionary';
import * as ipa from './ipa';
import * as nounConjugator from './nouns/conjugator';
import * as nounParser from './nouns/parser';
import * as numbers from './numbers';
import * as preprocess from './preprocess';
import * as pronouns from './pronouns';
import ReverseDictionary from './reverseDictionary';
import * as rhymes from './rhymes';
import * as verbConjugator from './verbs/conjugator';
import * as verbParser from './verbs/parser';
import * as wordLinks from './wordLinks';

/*let sentences: {[key: string]: Sentence} = {};
try {
	sentences = JSON.parse(fs.readFileSync('./data/corpus.json', 'utf8'));
} catch (e) {
	output.warning('Corpus data not found');
	output.hint(`Reykunyu uses a JSON file called corpus.json containing the example
sentences. This file does not seem to be present. This warning is
harmless, but Reykunyu won't find any example sentences.`);
}*/

export default class Reykunyu {

	dictionary!: Dictionary;
	reverseDictionary!: ReverseDictionary;
	pronounForms!: { [form: string]: pronouns.ConjugatedPronoun };

	// list of all words, for randomization
	allWords!: WordData[];
	allWordsOfType!: { [type: string]: WordData[] };

	dataErrorList!: string[];

	constructor(dictionaryJSON: any) {
		this.loadData(dictionaryJSON);
	}
	
	loadData(dictionaryJSON: any) {
		this.dataErrorList = [];
		this.dictionary = new Dictionary(dictionaryJSON, this.dataErrorList);
		this.reverseDictionary = new ReverseDictionary(this.dictionary);

		// preprocess all words
		for (let word of this.dictionary.getAll()) {
			const wordKey = word['na\'vi'] + ':' + word['type'];
			// pronunciation
			if (word['pronunciation']) {
				for (let pronunciation of word['pronunciation']) {
					pronunciation['ipa'] = {
						'FN': ipa.generateIpa(pronunciation, word['type'], 'FN'),
						'RN': ipa.generateIpa(pronunciation, word['type'], 'RN')
					};
				}
			}

			// etymology and derived words
			if (word['etymology']) {
				wordLinks.addReferencesForLinkString(this.dictionary, word, word['etymology'], this.dataErrorList);
				wordLinks.visitLinkString(word['etymology'],
					() => {},
					(referencedWord: string, type: string) => {
						const editableData = this.dictionary.getEditable(referencedWord, type);
						if (editableData) {
							if (!editableData['derived']) {
								editableData['derived'] = [];
							}
							editableData['derived'].push(wordLinks.stripToLinkData(word));
						}
					}
				);
			}

			// meaning notes
			if (word['meaning_note']) {
				wordLinks.addReferencesForLinkString(this.dictionary, word, word['meaning_note'], this.dataErrorList);
			}
			if (word['conjugation_note']) {
				wordLinks.addReferencesForLinkString(this.dictionary, word, word['conjugation_note'], this.dataErrorList);
			}

			// see also
			if (word['seeAlso']) {
				for (let i = 0; i < word['seeAlso'].length; i++) {
					let [navi, type] = this.dictionary.splitWordAndType((word['seeAlso'] as unknown as string[])[i]);
					let result = this.dictionary.getEditable(navi, type);
					if (result) {
						word['seeAlso'][i] = wordLinks.stripToLinkData(result);
					}
				}
			}
			
			// conjugation tables
			if (word['conjugation']) {
				let conjugation = (word['conjugation'] as any)['forms'];
				word['conjugation'] = {
					'FN': conjugation,
					'combined': conjugation,
					'RN': conjugation
				};
			} else if (word['type'] === 'n' || word['type'] === 'n:pr') {
				word['conjugation'] = {
					'FN': this.createNounConjugation(word, 'FN'),
					'combined': this.createNounConjugation(word, 'combined'),
					'RN': this.createNounConjugation(word, 'RN')
				};
			} else if (word['type'] === 'adj') {
				word['conjugation'] = {
					'FN': this.createAdjectiveConjugation(word, 'FN'),
					'combined': this.createAdjectiveConjugation(word, 'combined'),
					'RN': this.createAdjectiveConjugation(word, 'RN')
				};
			}
		}

		// sort derived words
		for (let word of this.dictionary.getAll()) {
			if (word['derived']) {
				word['derived'].sort(function (a, b) {
					return a["na'vi"].localeCompare(b["na'vi"]);  // TODO use word_raw
				});
			}
		}

		// prepare sentence search data
		/*for (const sentenceKey of Object.keys(sentences)) {
			const sentence = sentences[sentenceKey];
			for (const a of sentence['na\'vi']) {
				const roots = a[1];
				for (const r of roots) {
					let [word, type] = dictionary.splitWordAndType(r);
					let result = dictionary.getEditable(word, type);
					if (result) {
						if (!result['sentences']) {
							result['sentences'] = [];
						}
						if (!result['sentences'].includes(sentences[sentenceKey])) {
							result['sentences'].push(sentences[sentenceKey]);
						}
					} else {
						// TODO For now, we ignore these errors
						//dataErrorList.push('Invalid reference to [' + r + '] in sentence ' + sentenceKey);
					}
				}
			}
		}*/

		this.pronounForms = pronouns.getConjugatedForms(this.dictionary);

		this.allWords = [];
		for (let word of this.dictionary.getAll()) {
			this.allWords.push(word);
		}

		this.allWordsOfType = { };
		for (const type of ['n', 'adj', 'v:in', 'v:tr', 'adv', 'adp', 'aff:in']) {
			this.allWordsOfType[type] = this.getAllWordsOfType(type, false);
		}
		for (const type of ['v:']) {
			this.allWordsOfType[type] = this.getAllWordsOfType(type, true);
		}
	}

	getAllWordsOfType(type: string, allowSubtype: boolean): WordData[] {
		let result = [];
		for (let word of this.dictionary.getAll()) {
			if (word['type'] == type ||
				(allowSubtype && word['type'].startsWith(type))) {
				result.push(word);
			}
		}
		return result;
	}

	simplifiedTranslation(translation: Translated<string>[], language: string) {
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

	getWord(id: number): WordData {
		return this.dictionary.getById(id);
	}

	getResponsesFor(query: string, dialect: Dialect): FromNaviResult {
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
				[wordCount, wordResults] = this.lookUpWordOrPhrase(queryArray, dialect);

			} else {
				// the complicated case: figure out which words this query word
				// could possibly be lenited from, and look all of these up
				let unlenitedWords = this.unlenite(queryWord);
				for (let j = 0; j < unlenitedWords.length; j++) {
					let wordResult = this.lookUpWord(unlenitedWords[j], dialect);
					for (let k = 0; k < wordResult.length; k++) {
						if (!this.forbiddenByExternalLenition(wordResult[k])) {
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
				let scoreA = this.resultScore(a, queryWord, dialect);
				let scoreB = this.resultScore(b, queryWord, dialect);
				return scoreA - scoreB;
			});

			this.deduplicateResults(wordResults);

			// the next word will be externally lenited if this word is an adp:len
			// note that there are no adp:lens with several meanings, so we just
			// check the first element of the results array
			externalLenition = wordResults.length > 0 && wordResults[0]['type'] === 'adp:len';

			let suggestionsWithDistances: [string, number][] = [];
			let suggestions: string[] = [];

			if (wordResults.length === 0) {
				let minDistance = queryWord.length / 3 + 1;  // allow more leeway with longer queries
				for (let word of this.dictionary.getAll()) {
					const distance = levenshtein(word['word_raw'][dialect], queryWord);
					minDistance = Math.min(minDistance, distance);
					if (distance <= minDistance) {
						suggestionsWithDistances.push([word['word_raw'][dialect] + (word["type"] === "n:si" ? " si" : ""), distance]);
					}
				}
				suggestions = suggestionsWithDistances.filter(a => a[1] === minDistance)
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

		this.postprocessResults(results, dialect);

		return results;
	}

	private unlenitions: Record<string, string[]> = {
		"s": ["ts", "t", "s"],
		"f": ["p", "f"],
		"h": ["k", "h"],
		"t": ["tx", "d"],
		"p": ["px", "b"],
		"k": ["kx", "g"]
	};

	private unlenite(word: string): string[] {

		// word starts with vowel
		if (["a", "ä", "e", "i", "ì", "o", "u", "ù"].includes(word[0])) {
			return [word, "'" + word];
		}

		// word starts with ejective or ts
		if (word[1] === "x" || word.substring(0, 2) === "ts" || ['b', 'd', 'g'].includes(word[0])) {
			return [];
		}

		// word starts with constant that could not have been lenited
		if (!(word[0] in this.unlenitions)) {
			return [word];
		}

		// word starts with constant that could have been lenited
		let initials = this.unlenitions[word[0]];
		let result = [];
		for (let i = 0; i < initials.length; i++) {
			result.push(initials[i] + word.slice(1));
		}
		return result;
	}

	// figures out if a result cannot be valid if the query word was externally
	// lenited; this is the case for nouns in the short plural
	// (i.e., "mì hilvan" cannot be parsed as "mì + (ay)hilvan")
	private forbiddenByExternalLenition(result: WordData): boolean {
		if (!result["conjugated"]) {
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

	private lookUpWordOrPhrase(queryWord: string[], dialect: Dialect): [number, WordData[]] {
		// phrases
		for (let length = 8; length > 1; length--) {
			let phrase = queryWord.slice(0, length).join(' ');
			let key = phrase + ':phr';
			let result = this.dictionary.get(phrase, 'phr', dialect);
			if (result) {
				return [length, [result]];
			}
		}
		return [1, this.lookUpWord(queryWord[0], dialect)];
	}

	// Looks up a single word; returns a list of results.
	//
	// This method ensures that the data returned is a deep copy (i.e., we can
	// safely change it without changing the dictionary data itself).
	private lookUpWord(queryWord: string, dialect: Dialect): WordData[] {
		let wordResults: WordData[] = [];
		this.lookUpNoun(queryWord, wordResults, dialect);
		this.lookUpVerb(queryWord, wordResults, dialect);
		this.lookUpAdjective(queryWord, wordResults, dialect);
		this.lookUpProductiveAdverb(queryWord, wordResults, dialect);
		this.lookUpOtherType(queryWord, wordResults, dialect);
		return wordResults;
	}

	private lookUpNoun(queryWord: string, wordResults: WordData[], dialect: Dialect): void {
		// handles conjugated nouns and pronouns
		let nounResults = nounParser.parse(queryWord, dialect);
		nounResults.forEach((nounResult) => {
			let nouns = this.dictionary.getOfTypes(nounResult["root"], ['n', 'n:pr'], dialect);
			for (let noun of nouns) {
				if (noun['status'] !== 'loan') {  // loanwords are handled later
					let conjugated: ConjugationStep[] = [{
						"type": "n",
						"conjugation": nounResult
					}];
					wordResults.push(noun);
					noun["conjugated"] = conjugated;
				}
			}
			const suffixes = ['yu', 'tswo'];
			for (const suffix of suffixes) {
				if (nounResult["root"].endsWith(suffix)) {
					let possibleVerb = nounResult["root"].slice(0, -suffix.length);
					let verbResults: WordData[] = [];
					this.lookUpVerb(possibleVerb, verbResults, dialect);
					verbResults.forEach(function (verb) {
						// don't allow this on the auxiliary verb si
						if (verb["type"] === 'v:si') {
							return;
						}
						const conjugated = verb["conjugated"]!;
						const infixes = (conjugated[conjugated.length - 1]["conjugation"] as VerbConjugationStep)["infixes"];
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
							wordResults.push(verb);
						}
					});
				}
			}
			const siVerbSuffixes = ['siyu', 'tswo'];
			for (const suffix of siVerbSuffixes) {
				if (nounResult["root"].endsWith(suffix)) {
					let possibleSiVerb = nounResult["root"].slice(0, -4);
					let siVerbResult = this.dictionary.get(possibleSiVerb, 'n:si', dialect);
					if (siVerbResult) {
						siVerbResult["conjugated"] = [{
							"type": "v_to_n",
							"conjugation": {
								"result": [nounResult["root"]],
								"root": possibleSiVerb + ' si',
								"affixes": [suffix === 'siyu' ? 'yu' : 'tswo']
							}
						}, {
							"type": "n",
							"conjugation": nounResult
						}];
						wordResults.push(siVerbResult);
					}
				}
			}

			if (this.pronounForms.hasOwnProperty(nounResult["root"])) {
				let foundForm = this.pronounForms[nounResult["root"]];
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
						wordResults.push(word);
					}
				}
			}

			// verb gerunds (tì-<us>)
			if (nounResult["root"].startsWith('tì')) {
				let possibleVerb = nounResult["root"].slice(2);  // cut off tì-
				let verbResults: WordData[] = [];
				this.lookUpVerb(possibleVerb, verbResults, dialect, true);
				verbResults.forEach(function (verb) {
					// don't allow this on the auxiliary verb si
					if (verb["type"] === 'v:si') {
						return;
					}
					const conjugated = verb["conjugated"]!;
					const infixes = (conjugated[conjugated.length - 1]["conjugation"] as VerbConjugationStep)["infixes"];
					// we're only interested in a word starting with tì- if its
					// verb also has an <us> infix; other tì-words are in the
					// dictionary already
					// also, ignore the word if it has other infixes added, as this
					// is not allowed
					if (infixes[0] === '' && infixes[1] === 'us' && infixes[2] === '') {
						let infixesWithoutFirst: [string, string, string] = ['', '', ''];
						let conjugatedWithoutFirst = conjugationString.formsFromString(verbConjugator.conjugate(verb["infixes"]!, infixesWithoutFirst));
						conjugated[0]['conjugation']['result'] = conjugatedWithoutFirst;
						(conjugated[0]['conjugation'] as VerbConjugationStep)['infixes'] = infixesWithoutFirst;
						conjugated.push({
							"type": "gerund",
							"conjugation": {
								"result": [nounResult["root"]],
								"root": conjugatedWithoutFirst[0]
							}
						});
						conjugated.push({
							"type": "n",
							"conjugation": nounResult
						});
						wordResults.push(verb);
					}
				});
			}
		});

		// finally, handle loanwords
		let nounLoanResults = nounParser.parse(queryWord, dialect, true);
		nounLoanResults.forEach((nounResult) => {
			let nouns = this.dictionary.getOfTypes(nounResult["root"], ['n', 'n:pr'], dialect);
			for (let noun of nouns) {
				if (noun['status'] === 'loan') {
					noun["conjugated"] = [{
						"type": "n",
						"conjugation": nounResult
					}];
					wordResults.push(noun);
				}
			}
		});
	}

	private lookUpVerb(queryWord: string, wordResults: WordData[], dialect: Dialect, allowParticiples?: boolean): void {
		// handles conjugated verbs
		let verbResults = verbParser.parse(queryWord);
		verbResults.forEach((result) => {
			const infixes = result['infixes'];
			if (!allowParticiples && (infixes[1] === 'us' || infixes[1] === 'awn')) {
				// these are handled as adjectives; see lookUpAdjective()
				return;
			}
			let results = this.dictionary.getOfTypes(result["root"], ['v:in', 'v:tr', 'v:cp', 'v:m', 'v:si', 'v:?'], dialect);
			for (let verb of results) {
				let conjugation = conjugationString.formsFromString(
					verbConjugator.conjugate(verb["infixes"]!, result["infixes"]));
				let resultCopy = JSON.parse(JSON.stringify(result));
				if (conjugation.indexOf(queryWord) === -1) {
					resultCopy["correction"] = queryWord;
				}
				resultCopy["result"] = conjugation;
				verb["conjugated"] = [{
					"type": "v",
					"conjugation": resultCopy
				}];
				wordResults.push(verb);
			}
		});
	}

	private lookUpAdjective(queryWord: string, wordResults: WordData[], dialect: Dialect): void {
		// handles conjugated adjectives
		let adjectiveResults = adjectives.parse(queryWord);
		adjectiveResults.forEach((adjResult) => {
			let results = this.dictionary.getOfTypes(adjResult['root'], ['adj', 'num'], dialect);
			for (let adjective of results) {
				let conjugation = conjugationString.formsFromString(
					adjectives.conjugate(adjResult["root"], adjResult["form"], adjective["etymology"]));
				let adjResultCopy = JSON.parse(JSON.stringify(adjResult));
				adjResultCopy["result"] = conjugation;
				adjective["conjugated"] = [{
					"type": "adj",
					"conjugation": adjResultCopy
				}];
				wordResults.push(adjective);
			}

			// verb participles (somewhat hacky as the <us>/<awn> is parsed by the
			// verb parser, so we have to take that out again...)
			let verbResults: WordData[] = [];
			this.lookUpVerb(adjResult["root"], verbResults, dialect, true);
			verbResults.forEach((verb) => {
				const infixes = (verb['conjugated']![0]['conjugation'] as VerbConjugationStep)['infixes'];
				if (infixes[1] !== 'us' && infixes[1] !== 'awn') {
					return;
				}
				if (infixes[2] !== '') {
					// can't combine participles with other infixes
					return;
				}
				if (infixes[1] === 'awn' && (infixes[0] === 'äp' || infixes[0] === 'äpeyk')) {
					return;
				}
				let infixesWithoutFirst: [string, string, string] = [infixes[0], '', infixes[2]];
				let conjugatedWithoutFirst = conjugationString.formsFromString(verbConjugator.conjugate(verb["infixes"]!, infixesWithoutFirst));
				const newConjugated: ConjugationStep[] =  [
					{
						"type": "v",
						"conjugation": {
							"result": conjugatedWithoutFirst,
							"root": verb['conjugated']![0]['conjugation']['root'],
							"infixes": infixesWithoutFirst
						}
					},
					{
						"type": "v_to_part",
						"conjugation": {
							"result": verb['conjugated']![0]['conjugation']['result'],
							"root": conjugatedWithoutFirst[0],
							"affixes": [infixes[1]]
						}
					},
					{
						"type": "adj",
						"conjugation": adjResult
					}
				];
				if (verb['conjugated']![0]['conjugation'].hasOwnProperty('correction')) {
					newConjugated[1]['conjugation']['correction'] = verb['conjugated']![0]['conjugation']['correction'];
				}
				verb["conjugated"] = newConjugated;
				wordResults.push(verb);
			});

			// (ke)tsuk- + <verb>
			const prefixes = ['tsuk', 'ketsuk'];
			for (const prefix of prefixes) {
				if (adjResult["root"].startsWith(prefix)) {
					let possibleVerb = adjResult["root"].substring(prefix.length);
					let verbResults: WordData[] = [];
					this.lookUpVerb(possibleVerb, verbResults, dialect);
					verbResults.forEach((verb) => {
						verb["conjugated"]!.push({
							"type": "v_to_adj",
							"conjugation": {
								"result": [adjResult["root"]],
								"root": possibleVerb,
								"affixes": [prefix]
							}
						});
						verb["conjugated"]!.push({
							"type": "adj",
							"conjugation": adjResult
						});
						wordResults.push(verb);
					});
				}
			}
		});
	}

	private lookUpProductiveAdverb(queryWord: string, wordResults: WordData[], dialect: Dialect): void {
		// handles adverbs made from nì- + adjectives
		if (queryWord.startsWith('nì')) {
			let possibleAdjective = queryWord.substring(2);
			let adjective = this.dictionary.get(possibleAdjective, 'adj', dialect);
			if (adjective) {
				adjective["conjugated"] = [{
					"type": "adj_to_adv",
					"conjugation": {
						"result": ['nì' + possibleAdjective],
						"root": possibleAdjective,
						"affixes": ['nì']
					}
				}];
				wordResults.push(adjective);
			}
		}
	}

	private lookUpOtherType(queryWord: string, wordResults: WordData[], dialect: Dialect): void {
		// handles other word types
		let ignoredTypes = ['n', 'n:pr', 'adj', 'v:in', 'v:tr', 'v:cp', 'v:m', 'v:si', 'v:?'];
		for (let word of this.dictionary.getNotOfTypes(queryWord, ignoredTypes, dialect)) {
			if (!word.hasOwnProperty('conjugation')) {
				wordResults.push(JSON.parse(JSON.stringify(word)));
			}
		}
	}

	private resultScore(result: WordData, queryWord: string, dialect: Dialect): number {
		let score = 0;

		if (result['word_raw'][dialect].toLowerCase() !== queryWord) {
			// if this was an incorrect conjugation, sort it further down
			if (result["conjugated"]) {
				for (let conjugation of result["conjugated"]) {
					if (conjugation["conjugation"] &&
						conjugation["conjugation"]["correction"]) {
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
			score += 100 - result['word_raw'][dialect].length;
		}

		return score;
	}

	/**
	 * Removes any duplicated results from the results array. If duplicates occur,
	 * the first one is retained and the others are removed.
	 */
	private deduplicateResults(results: WordData[]): void {
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
	private postprocessResults(results: FromNaviResult, dialect: Dialect): void {
		this.mergeSiVerbs(results);

		for (let word of results) {
			for (let result of word['sì\'eyng']) {
				this.postprocessResult(result, dialect);
			}
		}
	}

	private postprocessResult(result: WordData, dialect: Dialect): void {
		if (result['conjugated']) {
			affixList.addAffixList(this.dictionary, result, dialect);
			// retain the last conjugated item that has a translation
			for (let conjugated of result['conjugated']) {
				conjugatedTranslation.addTranslations(result);
				result['short_translation_conjugated'] = conjugated['translation'];
			}
		}
	}

	private createNounConjugation(word: WordData, dialect: Dialect): NounConjugation {

		let conjugation = [];
		let cases = ['', 'l', 't', 'r', 'ä', 'ri'];
		let plurals = ['', 'me', 'pxe', 'ay'];

		for (let j = 0; j < 4; j++) {
			let row = [];
			if (word['type'] !== 'n:pr' || j === 0) {
				for (let i = 0; i < 6; i++) {
					let conjugated = nounConjugator.conjugateSimple(word['word_raw'][dialect],
						plurals[j], cases[i], dialect,
						word['status'] === 'loan');
					row.push(conjugated);
				}
			}
			conjugation.push(row);
		}

		return conjugation;
	}

	private createAdjectiveConjugation(word: WordData, dialect: Dialect): AdjectiveConjugation {
		const conjugation = {
			"prefixed": adjectives.conjugate(word['word_raw'][dialect], 'postnoun', word["etymology"], dialect),
			"suffixed": adjectives.conjugate(word['word_raw'][dialect], 'prenoun', word["etymology"], dialect)
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
	private mergeSiVerbs(results: FromNaviResult): void {
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
			let newResult: FromNaviResultPiece = {
				"tìpawm": first["tìpawm"] + " " + second["tìpawm"],
				"sì'eyng": [],
				"aysämok": []
			};

			for (let answer of first["sì'eyng"]) {
				if (answer["type"] === "n:si") {
					let newAnswer: WordData = JSON.parse(JSON.stringify(answer));
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

	getSuggestionsFor(query: string, language: string, dialect: Dialect): Suggestions {
		if (query.length < 3) {
			return { 'results': [] };
		}
		query = preprocess.preprocessQuery(query, dialect);
		query = query.toLowerCase();
		let results = [];
		for (let word of this.dictionary.getAll()) {
			let key = word['word_raw'][dialect].toLowerCase();
			if (dialect === 'combined') {
				key = key.replaceAll('ù', 'u');
			}
			if (key.startsWith(query)) {
				let wordHTML = word['word'][dialect] + (word['type'] === 'n:si' ? ' si' : '');
				wordHTML = wordHTML.replaceAll('/', '');
				wordHTML = wordHTML.replace(/\[([^\]]*)\]/g, '<span class="stressed">$1</span>');
				results.push({
					"title": wordHTML,
					"description": '<div class="ui horizontal label">' + this.typeName(word['type'], language) +
						'</div> ' + this.simplifiedTranslation(word["translations"], language)
				});
			}
		}
		return {
			'results': results
		};
	}

	getReverseSuggestionsFor(query: string, language: string): Suggestions {
		if (query.length < 3) {
			return { 'results': [] };
		}

		let results = [];

		if (!language) {
			language = "en";
		}

		query = query.toLowerCase();

		wordLoop:
		for (let word of this.dictionary.getAll()) {
			let translation = word['translations'][0][language];
			if (translation) {
				// split translation into words
				translation = translation.replace(/[.,:;\(\)\[\]\<\>/\\-]/g, ' ');
				let translationWords = translation.split(' ');
				for (const w of translationWords) {
					if (w.toLowerCase().startsWith(query)) {
						results.push({
							"title": word["na'vi"] + (word['type'] === 'n:si' ? ' si' : ''),
							"description": '<div class="ui horizontal label">' + this.typeName(word['type'], language) +
								'</div> ' + this.simplifiedTranslation(word["translations"], language)
						});
						continue wordLoop;
					}
				}
			}
		}

		return {
			'results': results
		};
	}

	typeName(type: string, language: string): string {
		const types: Record<string, string> = {
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

	getReverseResponsesFor(query: string, language: string, dialect: Dialect): ToNaviResult {
		if (query === "") {
			return [];
		}

		if (!language) {
			language = "en";
		}

		query = query.trim();
		query = query.toLowerCase();

		let results = this.reverseDictionary.search(query, language);

		// special case: numbers
		if (/^\d+$/.test(query)) {
			const number = parseInt(query, 10);
			const result = numbers.conjugate(number);
			if (result !== null) {
				results.push(result);
			}
		}

		for (let result of results) {
			this.postprocessResult(result, dialect);
		}

		// sort on result relevancy
		// higher scores result in being sorted lower
		let resultScore = (result: WordData) => {
			let score = 0;
			for (let translation of result['translations']) {
				if (!translation.hasOwnProperty(language)) {
					continue;
				}
				const t = translation[language].toLowerCase();
				if (!t.includes(query)) {
					continue;
				}

				// is the query completely equal to the translation?
				if (t.replace(/^to /, '') === query) {
					score -= 1;
					continue;
				}

				// is the query at least a part of the "main part" of the
				// translation, i.e., not in a parenthesized part?
				let mainPart = t.replace(/\([^)]+\)/g, '');
				if (mainPart.includes(query)) {
					score -= 0.25;
				}

				// if we cut up the translation into pieces separated by commas,
				// is our query one of these pieces
				// (this is to rank "be, am, is, are" over "be quiet")
				let pieces = mainPart.split(/[,;!?"\/]/);
				let shortestPiece = Infinity;
				for (let piece of pieces) {
					piece = piece.replace(/^to /, '').trim();
					if (piece.includes(query)) {
						shortestPiece = Math.min(shortestPiece, piece.length);
						if (piece === query) {
							score -= 0.5;
						}
					}
				}

				// the longer the translation, the lower it should be sorted because
				// in long translations, it is likely that the searched word is only
				// a small, irrelevant part of the translation
				if (shortestPiece < Infinity) {
					score += shortestPiece / 1000;
				} else {
					score += t.length / 1000;
				}
			}

			return score;
		}

		results.sort((a, b) => {
			let scoreA = resultScore(a);
			let scoreB = resultScore(b);
			return scoreA - scoreB;
		});

		return results;
	}

	getRandomWords(number: number, dialect: Dialect, type?: string): WordData[] {
		let results = [];
		let wordList = this.allWords;
		if (type && this.allWordsOfType[type]) {
			wordList = this.allWordsOfType[type];
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
			this.postprocessResult(result, dialect);
		}

		return results;
	}

	getAll(): WordData[] {
		return this.dictionary.getAll();
	}

	getRhymes(query: string, dialect: Dialect): RhymesResult {
		query = query.toLowerCase();

		let words: WordData[][][] = [];

		for (const word of this.dictionary.getAll()) {
			if (word['pronunciation'] && word['pronunciation'].length > 0) {
				if (rhymes.rhymes(word['pronunciation'][0]['syllables'], query)) {
					let key = 0;
					key = word['pronunciation'][0]['syllables'].split('-').length;
					if (!words[key]) {
						words[key] = [];
					}
					let subKey = 0;
					if (word.hasOwnProperty('pronunciation')) {
						subKey = word['pronunciation'][0]['stressed'];
					}
					if (!words[key][subKey]) {
						words[key][subKey] = [];
					}
					words[key][subKey].push(word);
				}
			}
		}

		for (const s of words) {
			if (s) {
				for (const s2 of s) {
					if (s2) {
						s2.sort(function (a, b) {
							return a['word_raw'][dialect].localeCompare(b['word_raw'][dialect]);
						});
					}
				}
			}
		}

		return {'results': words};
	}

	/*export function getAllSentences(): { [key: string]: Sentence } {
		return sentences;
	}

	export function removeSentence(key: string): void {
		delete sentences[key];
		reloadData();
	}

	export function insertSentence(key: string, sentence: Sentence): void {
		sentences[key] = sentence;
		reloadData();
	}

	export function hasSentence(key: string): boolean {
		return sentences.hasOwnProperty(key);
	}

	export function saveCorpus(): void {
		fs.writeFileSync('./data/corpus.json', JSON.stringify(sentences));
	}*/

	getDataErrors(): string[] {
		return this.dataErrorList;
	}

	getDataErrorCount(): number {
		return this.dataErrorList.length;
	}
}
