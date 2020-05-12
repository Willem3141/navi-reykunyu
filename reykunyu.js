/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

var fs = require('fs');

var express = require('express');
var app = express();
var http = require('http').Server(app);

var config = JSON.parse(fs.readFileSync('config.json'));

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

app.get('/api/frau', function(req, res) {
	res.json(dictionary);
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

		let unlenitedWords;
		if (externalLenition) {
			unlenitedWords = nouns.unlenite(queryWord);
		} else {
			unlenitedWords = [queryWord];
		}

		let wordResults = [];
		for (let j = 0; j < unlenitedWords.length; j++) {
			wordResults = wordResults.concat(lookUpWord(unlenitedWords[j]));
		}

		externalLenition = wordResults.length > 0 && wordResults[0]['type'] === 'adp:len';

		results.push({
			"tìpawm": queryWord,
			"sì'eyng": wordResults
		});
	}
	
	return results;
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

		// pronouns use the same parser as nouns, however we only
		// consider the possibilities where the plural and case affixes
		// are empty (because in pronounForms, all plural- and
		// case-affixed forms are already included)
		if (result[2][1] === "" && result[2][5] === "") {
			if (pronounForms.hasOwnProperty(result[1])) {
				let foundForm = pronounForms[result[1]];
				let word = JSON.parse(JSON.stringify(foundForm["word"]));
				result[1] = word["na'vi"];
				result[2][1] = foundForm["plural"];
				result[2][5] = foundForm["case"];
				word["conjugated"] = result;
				wordResults.push(word);
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

	// then other word types
	for (word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			let type = dictionary[word]['type'];
			if (dictionary[word]["na'vi"].toLowerCase() === queryWord && type !== "n" && type !== "n:pr" && type !== "pn" && type.indexOf("v:") === -1) {
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
	return query;
}

