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

var dictionary = [];
fs.readdirSync("aylì'u").forEach(file => {
	dictionary.push(JSON.parse(fs.readFileSync("aylì'u/" + file, 'utf8')));
});

app.use(express.static('fraporu'))

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
	
	for (let i = 0; i < dictionary.length; i++) {
		if (dictionary[i]["na'vi"] === query) {
			results.push(dictionary[i]);
		}
	}
	
	return results;
}
