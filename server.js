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

const di = require('discord-interactions');

const discord = require('./discord');

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
	res.json(reykunyu.getAll());
});

app.get('/api/list/all', function(req, res) {
	res.json(reykunyu.getAll());
});

app.get('/api/list/verbs', function(req, res) {
	res.json(reykunyu.getVerbs());
});

app.get('/api/list/transitivity', function(req, res) {
	res.json(reykunyu.getTransitivityList());
});

app.get('/api/sound', function(req, res) {
	const file = __dirname + '/fam/' + req.query["word"] + "-" + req.query["type"] + '.mp3';
	if (fs.existsSync(file)) {
		res.sendFile(file);
	} else {
		res.sendStatus(404);
	}
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

app.use('/ayrel', express.static('ayrel'));

app.post('/api/discord/interactions', di.verifyKeyMiddleware('7cf7cb6385a26d7257e359bbf47d56b6824fda941dffa0bc629347c34c56d1d5'), function(req, res) {
	const message = req.body;

	if (message.type === di.InteractionType.COMMAND) {
		// message['data']['name'] should be 'run' (TODO check that)
		const query = message['data']['options'][0]['value'];
		console.log(query);
		res.json({
			"type": di.InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			"data": {
				"content": discord.makeMessage(reykunyu.getResponsesFor(query), reykunyu.getSuggestionsFor(query))
			}
		});
	}
});

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

