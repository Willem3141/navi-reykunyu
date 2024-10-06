const express = require('express');
const router = express.Router();
module.exports = router;

var annotatedDictionary = require('./annotatedDictionary');
var conjugationString = require('./conjugationString');
var cors = require('cors');
var reykunyu = require('./reykunyu');
var verbs = require('./verbs');
var zeykerokyu = require('./zeykerokyu');

router.get('/word', cors(), function(req, res) {
	res.json(reykunyu.getWord(req.query['id']));
});

router.get('/fwew-search', cors(), function(req, res) {
	if (!req.query.hasOwnProperty('query') || !req.query.hasOwnProperty('language')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	let dialect = 'combined';
	if (req.query.hasOwnProperty('dialect')) {
		dialect = req.query['dialect'];
	}
	res.json({
		'fromNa\'vi': reykunyu.getResponsesFor(req.query['query'], dialect),
		'toNa\'vi': reykunyu.getReverseResponsesFor(req.query['query'], req.query['language'])
	});
});

router.get('/fwew', cors(), function(req, res) {
	if (!req.query.hasOwnProperty('tìpawm')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	let dialect = 'combined';
	if (req.query.hasOwnProperty('dialect')) {
		dialect = req.query['dialect'];
	}
	res.json(reykunyu.getResponsesFor(req.query['tìpawm'], dialect));
});

router.get('/mok-suggest', cors(), function (req, res) {
	let suggestionsFrom = reykunyu.getSuggestionsFor(req.query["query"], req.query["language"], req.query["dialect"]);
	let suggestionsTo = reykunyu.getReverseSuggestionsFor(req.query["query"], req.query["language"]);
	res.json({
		'results': suggestionsFrom['results'].concat(suggestionsTo['results'])
	});
});

router.get('/mok', cors(), function(req, res) {
	res.json(reykunyu.getSuggestionsFor(req.query["tìpawm"], req.query["language"], req.query["dialect"]));
});

router.get('/search', cors(), function(req, res) {
	if (!req.query.hasOwnProperty('query') || !req.query.hasOwnProperty('language')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	res.json(reykunyu.getReverseResponsesFor(req.query['query'], req.query['language']));
});

router.get('/suggest', function(req, res) {
	res.json(reykunyu.getReverseSuggestionsFor(req.query["query"], req.query["language"]));
});

router.get('/annotated/search', function(req, res) {
	res.json(annotatedDictionary.getResponsesFor(req.query["query"]));
});

router.get('/annotated/suggest', function(req, res) {
	res.json(annotatedDictionary.getSuggestionsFor(req.query["query"]));
});

router.get('/conjugate/verb', cors(), function(req, res) {
	res.json(conjugationString.formsFromString(verbs.conjugate(
		req.query["verb"], [req.query["prefirst"], req.query["first"], req.query["second"]])));
});

router.get('/history/all', function(req, res) {
	let historyData = JSON.parse(fs.readFileSync("./data/history.json"));
	res.json(historyData);
});

router.get('/history/major-changes', function(req, res) {
	let historyData = [];
	for (let entry of JSON.parse(fs.readFileSync("./data/history.json"))) {
		if (!entry.hasOwnProperty('old')) {
			historyData.push({
				'date': entry['date'],
				'new': [entry['data']["na'vi"], entry['data']['type']]
			});
		} else {
			if (entry['old']["na'vi"] !== entry['data']["na'vi"] ||
				entry['old']['type'] !== entry['data']['type']) {
				historyData.push({
					'date': entry['date'],
					'old': [entry['old']["na'vi"], entry['old']['type']],
					'new': [entry['data']["na'vi"], entry['data']['type']]
				});
			}
		}
	}
	res.json(historyData);
});

router.get('/list/all', function(req, res) {
	res.json(reykunyu.getAll());
});

router.get('/sound', function(req, res) {
	const file = req.query["word"] + "-" + req.query["type"] + '.mp3';
	if (fs.existsSync(file)) {
		res.sendFile(file, { root: process.cwd() + '/data/fam' });
	} else {
		res.sendStatus(404);
	}
});

router.get('/parse', function(req, res) {
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

router.get('/random', cors(), function(req, res) {
	res.json(reykunyu.getRandomWords(req.query["holpxay"], req.query["fnel"]));
});

router.get('/rhymes', cors(), function(req, res) {
	res.json(reykunyu.getRhymes(req.query["tìpawm"], req.query['dialect']));
});

router.get('/srs/courses', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	zeykerokyu.getCourses((courses) => {
		res.json(courses);
	});
});

router.get('/srs/lessons', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const courseId = getIntegerArgumentOr400('courseId', req.query, res) - 1;
	zeykerokyu.getLessons(req.user, courseId, (lessons) => {
		res.json(lessons);
	});
});

router.get('/srs/lesson', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const courseId = getIntegerArgumentOr400('courseId', req.query, res) - 1;
	const lessonId = getIntegerArgumentOr400('lessonId', req.query, res) - 1;
	zeykerokyu.getLessonData(courseId, lessonId, (lessons) => {
		res.json(lessons);
	});
});

router.get('/srs/items', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const courseId = getIntegerArgumentOr400('courseId', req.query, res) - 1;
	const lessonId = getIntegerArgumentOr400('lessonId', req.query, res) - 1;
	zeykerokyu.getItemsForLesson(courseId, lessonId, req.user, (items) => {
		res.json(items);
	});
});

router.get('/srs/learnable', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const courseId = getIntegerArgumentOr400('courseId', req.query, res) - 1;
	const lessonId = getIntegerArgumentOr400('lessonId', req.query, res) - 1;
	zeykerokyu.getLearnableItemsForLesson(courseId, lessonId, req.user, (items) => {
		res.json(items);
	});
});

router.get('/srs/reviewable', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const courseId = getIntegerArgumentOr400('courseId', req.query, res) - 1;
	const lessonId = getIntegerArgumentOr400('lessonId', req.query, res) - 1;
	zeykerokyu.getReviewableItemsForLesson(courseId, lessonId, req.user, (items) => {
		res.json(items);
	});
});

router.post('/srs/mark-correct', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const vocab = getIntegerArgumentOr400('vocab', req.body, res);
	zeykerokyu.processCorrectAnswer(req.user, vocab, (items) => {
		res.send();
	});
});

router.post('/srs/mark-incorrect', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const vocab = getIntegerArgumentOr400('vocab', req.body, res);
	zeykerokyu.processIncorrectAnswer(req.user, vocab, (items) => {
		res.send();
	});
});

router.post('/srs/mark-known', function(req, res) {
	if (!req.user) {
		send403(res);
		return;
	}
	const vocab = getIntegerArgumentOr400('vocab', req.body, res);
	zeykerokyu.processKnownAnswer(req.user, vocab, (items) => {
		res.send();
	});
});

function send403(res) {
	res.status(403);
	res.send('403 Forbidden');
}

/// Retrieves an integer argument from the query or body arguments.
///
/// Sends a HTTP 400 response if the argument does not exist or is not an
/// integer.
function getIntegerArgumentOr400(name, args, res) {
	if (!args.hasOwnProperty(name)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const arg = parseInt(args[name], 10);
	if (isNaN(arg)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	return arg;
}
