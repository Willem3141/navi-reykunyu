/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

var fs = require('fs');

var express = require('express');
var app = express();
var http = require('http').Server(app);

var config = JSON.parse(fs.readFileSync('config.json'));

var reykunyu = require('./reykunyu');

var tslamyu;
try {
	tslamyu = require('../navi-tslamyu/tslamyu');
} catch (e) {
	console.log('Warning: navi-tslamyu not found, continuing without parsing support');
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
	res.json(reykunyu.getResponsesFor(req.query["tìpawm"]));
});

app.get('/api/mok', function(req, res) {
	res.json(reykunyu.getSuggestionsFor(req.query["tìpawm"]));
});

app.get('/api/search', function(req, res) {
	res.json(reykunyu.getReverseResponsesFor(req.query["query"], req.query["language"]));
});

app.get('/api/frau', function(req, res) {
	res.json(reykunyu.dictionary);
});

app.get('/api/parse', function(req, res) {
	let parseOutput = tslamyu.doParse(reykunyu.getResponsesFor(req.query["tìpawm"]))
	let result = [];
	for (let i = 0; i < parseOutput.length; i++) {
		result.push({
			'parseTree': parseOutput[i],
			'translation': parseOutput[i].translate(),
			'errors': parseOutput[i].getErrors(),
			'penalty': parseOutput[i].getPenalty()
		});
	}
	res.json(result);
});

app.get('/api/random', function(req, res) {
	res.json(reykunyu.getRandomWord());
});

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

