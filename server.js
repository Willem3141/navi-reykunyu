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

app.get('/api/list/all', function(req, res) {
	res.json(reykunyu.dictionary);
});

app.get('/api/list/verbs', function(req, res) {
	res.json(reykunyu.getVerbs());
});

app.get('/api/parse', function(req, res) {
	let parseOutput = tslamyu.doParse(reykunyu.getResponsesFor(req.query["tìpawm"]));
	let output = {};
	output['lexingErrors'] = parseOutput['lexingErrors'];
	if (parseOutput['results']) {
		output['results'] = [];
		for (let i = 0; i < parseOutput['results'].length; i++) {
			output['results'].push({
				'parseTree': parseOutput['results'][i],
				'translation': parseOutput['results'][i].translate(),
				'errors': parseOutput['results'][i].getErrors(),
				'penalty': parseOutput['results'][i].getPenalty()
			});
		}
	}
	res.json(output);
});

app.get('/api/random', function(req, res) {
	res.json(reykunyu.getRandomWords(req.query["holpxay"]));
});

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

