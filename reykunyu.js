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
		type = wordData['type'].split(':')[0];
	}
	dictionary[wordData["na'vi"].toLowerCase() + ":" + type] = wordData;
});

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
	let results = [];
	
	// first split query on spaces to get individual words
	const spacesRegex = /\s+/g;
	let queryWords = query.split(spacesRegex);
	
	for (let i = 0; i < queryWords.length; i++) {
		let wordResults = [];
		let queryWord = queryWords[i];
		queryWord = queryWord.replace(/[ .,!?]+/g, "");
		queryWord = queryWord.toLowerCase();

		// handle conjugated nouns
		let nounResults = nouns.parse(queryWord);
		nounResults.forEach(function(result) {
			if (dictionary.hasOwnProperty(result[1] + ":n")) {
				let word = JSON.parse(JSON.stringify(dictionary[result[1] + ":n"]));
				word["conjugated"] = result;
				wordResults.push(word);
			}
		});

		// handle conjugated verbs
		let verbResults = verbs.parse(queryWord);
		verbResults.forEach(function(result) {
			if (dictionary.hasOwnProperty(result[1] + ":v")) {
				let word = JSON.parse(JSON.stringify(dictionary[result[1] + ":v"]));
				word["conjugated"] = result;
				if (verbs.conjugate(word['infixes'], result[2]).indexOf(queryWord) !== -1) {
					wordResults.push(word);
				}
			}
		});
		
		// then other word types
		for (word in dictionary) {
			if (dictionary.hasOwnProperty(word)) {
				let type = dictionary[word]['type'];
				if (dictionary[word]["na'vi"] === queryWord && type !== "n" && type.indexOf("v:") === -1) {
					wordResults.push(dictionary[word]);
				}
			}
		}

		results.push({
			"tìpawm": queryWord,
			"sì'eyng": wordResults
		});
	}
	
	return results;
}

function getSuggestionsFor(query) {
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

