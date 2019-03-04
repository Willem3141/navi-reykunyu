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

var dictionary = {};
fs.readdirSync("aylì'u").forEach(file => {
	let wordData = (JSON.parse(fs.readFileSync("aylì'u/" + file, 'utf8')));
	dictionary[wordData["na'vi"] + ":" + wordData["type"]] = wordData;
});

app.use(express.static('fraporu'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/fraporu/txin.html');
});

app.get('/fwew', function(req, res) {
	res.json({
		"tìpawm": req.query["tìpawm"],
		"sì'eyng": getResponsesFor(req.query["tìpawm"])
	});
});

app.get('/conjugate', function(req, res) {
	res.json(
		nouns.conjugate(req.query["noun"], req.query["plural"], req.query["case"])
	);
});

app.get('/parse', function(req, res) {
	res.json(
		nouns.parse(req.query["word"])
	);
});

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

function getResponsesFor(query) {
	let results = [];
	
	// handle conjugated nouns
	let nounResults = nouns.parse(query);
	nounResults.forEach(function(result) {
		if (dictionary.hasOwnProperty(result[1] + ":n")) {
			let word = JSON.parse(JSON.stringify(dictionary[result[1] + ":n"]));
			word["conjugation"] = result;
			results.push(word);
		}
	});
	
	// then other word types
	for (word in dictionary) {
		if (dictionary.hasOwnProperty(word)) {
			if (dictionary[word]["na'vi"] === query && dictionary[word]["type"] !== "n") {
				results.push(dictionary[word]);
			}
		}
	}
	
	return results;
}
