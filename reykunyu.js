/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

var fs = require('fs');

var express = require('express');
var app = express();
var http = require('http').Server(app);

var config = JSON.parse(fs.readFileSync('config.json'));

var adjectives = require('./adjectives');
var convert = require('./convert');
var nouns = require('./nouns');
var pronouns = require('./pronouns');
var verbs = require('./verbs');

var matchAll = require('string.prototype.matchall');
matchAll.shim();

var dictionary = {};
fs.readdirSync("aylì'u").forEach(file => {
	let wordData;
	try {
		wordData = (JSON.parse(fs.readFileSync("aylì'u/" + file, 'utf8')));
	} catch (e) {
		console.log("error when reading " + file + "; ignoring");
		return;
	}
	wordData["sentences"] = [];
	let type = '?';
	if (wordData['type']) {
		type = wordData['type'];
	}
	let key = wordData["na'vi"].toLowerCase() + ":" + type
	dictionary[key] = wordData;
});

var pronounForms = pronouns.getConjugatedForms(dictionary);

var lines = fs.readFileSync("aysìkenong/corpus.tsv", 'utf8').split("\n");
var sentences = [];
lines.forEach(line => {
	let fields = line.split("\t");
	let id = fields[0];
	let navi = fields[1];
	let naviWords = fields[2];
	let mapping = fields[3];
	let english = fields[4];
	let ownTranslation = fields[5];
	let source = fields[6];
	let sourceUrl = fields[7];
	let sentence = {
		"id": id,
		"navi": navi.split(/[ —]/),
		"naviWords": naviWords.split(/[ —]/),
		"mapping": mapping.split(/[ —]/),
		"english": english.split(/[ —]/),
		"ownTranslation": !(ownTranslation === ""),
		"source": source,
		"sourceUrl": sourceUrl
	};
	sentences.push(sentence);
	sentence["naviWords"].forEach(naviWord => {
		if (dictionary.hasOwnProperty(naviWord)) {
			dictionary[naviWord]["sentences"].push(sentence);
		}
	});
});

function simplifiedTranslation(translation) {
	let result = "";
	
	for (let i = 0; i < translation.length; i++) {
		if (i > 0) {
			result += "; ";
		}
		result += translation[i]["en"].split(",")[0];
	}
	
	return result;
}

for (word in dictionary) {
	if (dictionary.hasOwnProperty(word)) {
		
		let etymologyList = dictionary[word]["etymology"];
		if (etymologyList) {
			for (let i = 0; i < etymologyList.length; i++) {
				let word = dictionary[etymologyList[i]];
				if (word) {
					etymologyList[i] = {
						"na'vi": word["na'vi"],
						"translations": simplifiedTranslation(word["translations"])
					}
				}
			}
		}
		
		let seeAlsoList = dictionary[word]["seeAlso"];
		if (seeAlsoList) {
			for (let i = 0; i < seeAlsoList.length; i++) {
				let word = dictionary[seeAlsoList[i]];
				if (word) {
					seeAlsoList[i] = {
						"na'vi": word["na'vi"],
						"translations": simplifiedTranslation(word["translations"])
					}
				}
			}
		}
	}
}

app.use(express.static('fraporu'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/fraporu/txin.html');
});

app.get('/all', function(req, res) {
	res.sendFile(__dirname + '/fraporu/fralì\'u.html');
});

app.get('/edit', function(req, res) {
	res.sendFile(__dirname + '/fraporu/leykatem.html');
});

app.get('/api/fwew', function(req, res) {
	res.json(getResponsesFor(req.query["tìpawm"]));
});

app.get('/api/mok', function(req, res) {
	res.json(getSuggestionsFor(req.query["tìpawm"]));
});

app.get('/api/search', function(req, res) {
	res.json(getReverseResponsesFor(req.query["query"], req.query["language"]));
});

app.get('/api/frau', function(req, res) {
	res.json(dictionary);
});

app.get('/api/conjugate/adjective', function(req, res) {
	res.json(
		adjectives.conjugate(req.query["adjective"], req.query["form"])
	);
});

app.get('/api/conjugate/noun', function(req, res) {
	res.json(
		nouns.conjugate(req.query["noun"], req.query["plural"], req.query["case"])
	);
});

app.get('/api/conjugate/verb', function(req, res) {
	res.json(
		verbs.conjugate(req.query["verb"], [req.query["prefirst"], req.query["first"], req.query["second"]])
	);
});

app.get('/api/parse', function(req, res) {
	res.json(
		nouns.parse(req.query["word"])
	);
});

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

function getResponsesFor(query) {
	query = preprocessQuery(query);
	let results = [];
	
	// first split query on spaces to get individual words
	const spacesRegex = /\s+/g;
	let queryWords = query.split(spacesRegex);

	// maintains if the previous word was a leniting adposition
	let externalLenition = false;
	
	for (let i = 0; i < queryWords.length; i++) {
		let queryWord = queryWords[i];
		queryWord = queryWord.replace(/[ .,!?:;]+/g, "");
		queryWord = queryWord.toLowerCase();

		if (queryWord === "") {
			continue;
		}

		let wordResults = [];

		if (!externalLenition) {
			// the simple case: no external lenition, so just look up the
			// query word
			wordResults = lookUpWord(queryWord);

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

		// the next word will be externally lenited if this word is an adp:len
		// note that there are no adp:lens with several meanings, so we just
		// check the first element of the results array
		externalLenition = wordResults.length > 0 && wordResults[0]['type'] === 'adp:len';

		results.push({
			"tìpawm": queryWord,
			"sì'eyng": wordResults
		});
	}
	
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
	let isNoun = result["type"] === "n";
	if (!isNoun) {
		return false;
	}
	let isShortPlural = result["conjugated"][2][1] === "(ay)";
	if (!isShortPlural) {
		return false;
	}
	let hasNoDeterminer = result["conjugated"][2][0] === "";
	return hasNoDeterminer;
}

function lookUpWord(queryWord) {
	let wordResults = [];

	// handle conjugated nouns and pronouns
	let nounResults = nouns.parse(queryWord);
	nounResults.forEach(function(result) {
		let noun = findNoun(result[1]);
		if (noun) {
			noun["conjugated"] = result;
			wordResults.push(noun);
		}

		if (pronounForms.hasOwnProperty(result[1])) {
			let foundForm = pronounForms[result[1]];
			let word = JSON.parse(JSON.stringify(foundForm["word"]));

			if (word["type"] === "pn") {
				// pronouns use the same parser as nouns, however we only
				// consider the possibilities where the plural and case affixes
				// are empty (because in pronounForms, all plural- and
				// case-affixed forms are already included)
				if (result[2][1] === "" &&
						result[2][2] === "" &&
						(result[2][3] === "" || foundForm["case"] === "") &&
						result[2][4] === "" &&
						(result[2][5] === "" || (result[2][3] !== "" && foundForm["case"] === ""))) {
					result[1] = word["na'vi"];
					result[2][1] = foundForm["plural"];
					if (foundForm["case"] !== "") {
						result[2][5] = foundForm["case"];
					}
					word["conjugated"] = result;
					wordResults.push(word);
				}

			} else {
				// for non-pronouns, we allow no pre- and suffixes whatsoever
				if (result[0] === result[1]) {
					result[1] = word["na'vi"];
					result[2][1] = foundForm["plural"];
					result[2][5] = foundForm["case"];
					word["conjugated"] = result;
					wordResults.push(word);
				}
			}
		}
	});

	// handle conjugated verbs
	let verbResults = verbs.parse(queryWord);
	verbResults.forEach(function(result) {
		let verb = findVerb(result[1]);
		if (verb) {
			verb["conjugated"] = result;
			if (verbs.conjugate(verb['infixes'], result[2]).indexOf(queryWord) !== -1) {
				wordResults.push(verb);
			}
		}
	});

	// handle conjugated adjectives
	let adjectiveResults = adjectives.parse(queryWord);
	adjectiveResults.forEach(function(result) {
		if (dictionary.hasOwnProperty(result[1] + ":adj")) {
			adjective = JSON.parse(JSON.stringify(dictionary[result[1] + ":adj"]));
			adjective["conjugated"] = result;
			let conjugation = pronouns.formsFromString(
					adjectives.conjugate(adjective["na'vi"], result[2]));
			if (conjugation.indexOf(queryWord) !== -1) {
				wordResults.push(adjective);
			}
		}
	});

	// then other word types
	for (word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			let type = dictionary[word]['type'];
			if (dictionary[word]["na'vi"].toLowerCase() === queryWord &&
					type !== "n" && type !== "n:pr" &&
					type !== "adj" &&
					!dictionary[word].hasOwnProperty('conjugation') &&
					type.indexOf("v:") === -1) {
				wordResults.push(dictionary[word]);
			}
		}
	}

	return wordResults;
}

// fwew frafnetstxolì'ut lì'upukmì
function findNoun(word) {
	if (dictionary.hasOwnProperty(word + ":n")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":n"]));
	}
	if (dictionary.hasOwnProperty(word + ":n:pr")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":n:pr"]));
	}
	if (dictionary.hasOwnProperty(word + ":n:si")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":n:si"]));
	}
	return null;
}

// fwew frafnekemlì'ut lì'upukmì
function findVerb(word) {
	if (dictionary.hasOwnProperty(word + ":v:in")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":v:in"]));
	}
	if (dictionary.hasOwnProperty(word + ":v:tr")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":v:tr"]));
	}
	if (dictionary.hasOwnProperty(word + ":v:cp")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":v:cp"]));
	}
	if (dictionary.hasOwnProperty(word + ":v:m")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":v:m"]));
	}
	if (dictionary.hasOwnProperty(word + ":v:si")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":v:si"]));
	}
	if (dictionary.hasOwnProperty(word + ":v:?")) {
		return JSON.parse(JSON.stringify(dictionary[word + ":v:?"]));
	}
	return null;
}

function getSuggestionsFor(query) {
	query = preprocessQuery(query);
	query = query.toLowerCase();
	let results = [];
	for (let w in dictionary) {
		if (dictionary.hasOwnProperty(w)) {
			let word = dictionary[w];
			if (word["na'vi"].toLowerCase().startsWith(query)) {
				results.push({
					"title": word["na'vi"],
					"description": '<div class="ui horizontal label">' + word['type'] + '</div> ' + simplifiedTranslation(word["translations"])
				});
			}
		}
	}
	return {
		'results': results
	};
}

// normalizes a query by replacing weird Unicode tìftang variations by
// normal ASCII '
function preprocessQuery(query) {
	query = query.replace(/’/g, "'");
	query = query.replace(/‘/g, "'");
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
					results.push(dictionary[word]);
				}
			}
		}
	}

	return results;
}

