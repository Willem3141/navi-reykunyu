/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

var fs = require('fs');

var express = require('express');
var compression = require('compression');
var cors = require('cors');
var session = require('express-session');
var sqliteSession = require('connect-sqlite3')(session);

var user = require('./user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
	function (username, password, done) {
		const foundUser = user.findUser(username, password);
		if (foundUser) {
			return done(null, foundUser);
		} else {
			return done(null, false);
		}
	}
));

var app = express();
app.use(compression());
var http = require('http').Server(app);

var config = JSON.parse(fs.readFileSync('config.json'));

var reykunyu = require('./reykunyu');
var annotatedDictionary = require('./annotatedDictionary');
var conjugationString = require('./conjugationString');
var verbs = require('./verbs');
var edit = require('./edit');
var output = require('./output');
var dialect = require('./dialect');
var zeykerokyu = require('./zeykerokyu');

var tslamyu;
try {
	tslamyu = require('../../navi-tslamyu/tslamyu');
} catch (e) {
	output.warning('navi-tslamyu not found, continuing without parsing support');
	output.hint(`Reykunyu can use navi-tslamyu to parse sentences.`);
}


const ejs = require('ejs');

var translations = require('./translations');

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(session({
	store: new sqliteSession(),
	secret: config["secret"],
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, cb) {
	cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
	if (user.users.hasOwnProperty(id)) {
		cb(null, user.users[id]);
	} else {
		cb('User not found');
	}
});

const staticRoot = './fraporu';
app.use(express.static(staticRoot));

app.use('/ayrel', express.static('./data/ayrel'));
app.use('/fam', express.static('./data/fam'));

app.set('views', './fraporu');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
	setLanguage(req);
	res.render('txin', { user: req.user, query: req.query['q'], _: translations._ });
});

app.get('/help', function(req, res) {
	setLanguage(req);
	res.render('help', { user: req.user, _: translations._ });
});

function setLanguage(req) {
	var lang = 'en';
	if (req.headers.cookie) {
		for (let cookie of req.headers.cookie.split('; ')) {
			if (cookie.startsWith('lang=')) {
				lang = cookie.substring(5);
				break;
			}
		}
	}
	translations.setLanguage(lang);
}

app.get('/ayvefya/ui-translations.js', function(req, res) {
	res.render('ayvefya/ui-translations', { strings_json: translations.getStringsJSON() });
});

app.get('/all', function(req, res) {
	setLanguage(req);
	res.render("fralì'u", { user: req.user, _: translations._ });
});

app.get('/login', function(req, res) {
	res.render('login');
});

app.post('/login', passport.authenticate('local', {
	'successRedirect': '/',
	'failureRedirect': '/login'
}/*, function(err, user, info) {
	console.log(err, user, info);
}*/));

app.get('/logout', function(req, res, next) {
	req.logout(function(err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});

app.get('/add', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	res.render('leykatem', {
		'user': req.user,
		'post_url': '/add',
		'word': {
			"na'vi": '',
			"translations": [{'en': ''}]
		}
	});
});

app.post('/add', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}

	if (!req.body.hasOwnProperty('data')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}

	let data;
	try {
		data = JSON.parse(req.body["data"]);
	} catch (e) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}

	edit.insertWordData(data, req.user);
	reykunyu.reloadData();
	res.send({
		'url': '/?q=' + dialect.makeRaw(data["na'vi"])
	});
});

app.get('/edit', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	if (!req.query.hasOwnProperty('word')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const id = parseInt(req.query['word'], 10);
	if (isNaN(id)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const wordData = edit.getWordData(id);
	res.render('leykatem', {
		'user': req.user,
		'post_url': '/edit',
		'word': wordData
	});
});

app.get('/edit/raw', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	if (!req.query.hasOwnProperty('word')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const id = parseInt(req.query['word'], 10);
	if (isNaN(id)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const wordData = edit.getWordData(id);
	res.render('leykatem-yrr', {
		'user': req.user,
		'post_url': '/edit',
		'word': wordData
	});
});

app.post('/edit', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	if (!req.body.hasOwnProperty('id') || !req.body.hasOwnProperty('data')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const id = parseInt(req.body['id'], 10);
	if (isNaN(id)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	let data;
	try {
		data = JSON.parse(req.body['data']);
	} catch (e) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}

	edit.updateWordData(id, data, req.user);
	reykunyu.reloadData();
	res.send({
		'url': '/?q=' + dialect.makeRaw(data["na'vi"])
	});
});

app.get('/history', function(req, res) {
	let historyData = JSON.parse(fs.readFileSync("./data/history.json"));
	historyData = historyData.slice(Math.max(1, historyData.length - 50));  // 50 last elements
	historyData.reverse();
	res.render('history', { user: req.user, history: historyData });
});

app.get('/etymology-editor', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	res.render('etymologyEditor', {
		'user': req.user,
		'post_url': '/edit',
		'words': edit.getAll()
	});
});

app.get('/sources-editor', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	res.render('sourcesEditor', {
		'user': req.user,
		'post_url': '/edit',
		'words': edit.getAll()
	});
});

app.get('/corpus-editor', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	res.render('corpusEditor', {
		'user': req.user,
		'sentences': reykunyu.getAllSentences()
	});
});

app.get('/corpus-editor/add', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	res.render('corpusEditorAdd', {
		'user': req.user,
		'post_url': '/corpus-editor/add'
	});
});

app.get('/corpus-editor/edit', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	const key = req.query["sentence"];
	if (!key) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const sentence = reykunyu.getAllSentences()[key];
	res.render('corpusEditorEdit', {
		'user': req.user,
		'post_url': '/corpus-editor/edit',
		'key': key,
		'sentence': sentence
	});
});

app.post('/corpus-editor/add', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	let key, sentence;
	try {
		key = req.body['key'];
		sentence = req.body['sentence'];
	} catch (e) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	let existing = reykunyu.hasSentence(key);
	if (existing) {
		res.status(400);
		res.json({'message': 'Sentence with this key already exists'});
		return;
	}

	const result = reykunyu.getResponsesFor(sentence);
	let words = [];
	for (let word of result) {
		let roots = [];
		for (let root of word['sì\'eyng']) {
			roots.push(root['na\'vi'] + ':' + root['type']);
		}
		words.push([word['tìpawm'], roots]);
	}

	const sentenceData = {
		"na'vi": words,
		"translations": { 'en': { 'translation': [], 'mapping': [] } },
		"source": []
	};

	reykunyu.insertSentence(key, sentenceData);
	reykunyu.saveCorpus();
	res.send();
});

app.post('/corpus-editor/edit', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	let key, sentence;
	try {
		key = req.body["key"];
		sentence = JSON.parse(req.body["sentence"]);
	} catch (e) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}

	reykunyu.removeSentence(key);
	reykunyu.insertSentence(key, sentence);
	reykunyu.saveCorpus();
	res.send();
});

app.get('/untranslated', function(req, res) {
	if (!req.user) {
		res.status(403);
		setLanguage(req);
		res.render('403', { user: req.user, _: translations._ });
		return;
	}
	setLanguage(req);
	let untranslated = edit.getUntranslated(translations.getLanguage());
	res.render('untranslated', { user: req.user, untranslated: untranslated, language: translations.getLanguage() });
});

app.get('/study', function(req, res) {
	zeykerokyu.getCourses(req.user, (courseData) => {
		res.render('study', { user: req.user, courses: courseData });
	});
});

app.get('/study/course', function(req, res) {
	if (!req.query.hasOwnProperty('course')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const courseId = parseInt(req.query['course'], 10);
	if (isNaN(courseId)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.getCourseData(req.user, courseId, (courseData) => {
		zeykerokyu.getLessons(req.user, courseId, (lessonData) => {
			res.render('study-course', { user: req.user, course: courseData, lessons: lessonData });
		});
	});
});

app.get('/words.json', function(req, res) {
	res.sendFile('words.json', { root: process.cwd() + '/data' });
});

app.get('/api/word', cors(), function(req, res) {
	res.json(reykunyu.getWord(req.query['id']));
});

app.get('/api/fwew-search', cors(), function(req, res) {
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

app.get('/api/fwew', cors(), function(req, res) {
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

app.get('/api/mok-suggest', cors(), function (req, res) {
	let suggestionsFrom = reykunyu.getSuggestionsFor(req.query["query"], req.query["language"], req.query["dialect"]);
	let suggestionsTo = reykunyu.getReverseSuggestionsFor(req.query["query"], req.query["language"]);
	res.json({
		'results': suggestionsFrom['results'].concat(suggestionsTo['results'])
	});
});

app.get('/api/mok', cors(), function(req, res) {
	res.json(reykunyu.getSuggestionsFor(req.query["tìpawm"], req.query["language"], req.query["dialect"]));
});

app.get('/api/search', cors(), function(req, res) {
	if (!req.query.hasOwnProperty('query') || !req.query.hasOwnProperty('language')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	res.json(reykunyu.getReverseResponsesFor(req.query['query'], req.query['language']));
});

app.get('/api/suggest', function(req, res) {
	res.json(reykunyu.getReverseSuggestionsFor(req.query["query"], req.query["language"]));
});

app.get('/api/annotated/search', function(req, res) {
	res.json(annotatedDictionary.getResponsesFor(req.query["query"]));
});

app.get('/api/annotated/suggest', function(req, res) {
	res.json(annotatedDictionary.getSuggestionsFor(req.query["query"]));
});

app.get('/api/conjugate/verb', cors(), function(req, res) {
	res.json(conjugationString.formsFromString(verbs.conjugate(
		req.query["verb"], [req.query["prefirst"], req.query["first"], req.query["second"]])));
});

app.get('/api/history/all', function(req, res) {
	let historyData = JSON.parse(fs.readFileSync("./data/history.json"));
	res.json(historyData);
});

app.get('/api/history/major-changes', function(req, res) {
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

app.get('/api/list/all', function(req, res) {
	res.json(reykunyu.getAll());
});

app.get('/api/sound', function(req, res) {
	const file = req.query["word"] + "-" + req.query["type"] + '.mp3';
	if (fs.existsSync(file)) {
		res.sendFile(file, { root: process.cwd() + '/data/fam' });
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

app.get('/api/random', cors(), function(req, res) {
	res.json(reykunyu.getRandomWords(req.query["holpxay"], req.query["fnel"]));
});

app.get('/api/rhymes', cors(), function(req, res) {
	res.json(reykunyu.getRhymes(req.query["tìpawm"], req.query['dialect']));
});

app.get('/api/srs/learnable', function(req, res) {
	if (!req.user) {
		res.status(403);
		res.send('403 Forbidden');
		return;
	}
	if (!req.query.hasOwnProperty('courseId') || !req.query.hasOwnProperty('lessonId')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const courseId = parseInt(req.query['courseId'], 10);
	const lessonId = parseInt(req.query['lessonId'], 10);
	if (isNaN(courseId) || isNaN(lessonId)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.getLearnableItemsForLesson(courseId, lessonId, req.user, (items) => {
		res.json(items);
	});
});

app.get('/api/srs/reviewable', function(req, res) {
	if (!req.user) {
		res.status(403);
		res.send('403 Forbidden');
		return;
	}
	if (!req.query.hasOwnProperty('courseId') || !req.query.hasOwnProperty('lessonId')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const courseId = parseInt(req.query['courseId'], 10);
	const lessonId = parseInt(req.query['lessonId'], 10);
	if (isNaN(courseId) || isNaN(lessonId)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.getReviewableItemsForLesson(courseId, lessonId, req.user, (items) => {
		res.json(items);
	});
});

app.post('/api/srs/mark-correct', function(req, res) {
	if (!req.user) {
		res.status(403);
		res.send('403 Forbidden');
		return;
	}
	if (!req.body.hasOwnProperty('vocab')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const vocab = parseInt(req.body['vocab'], 10);
	if (isNaN(vocab)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.processCorrectAnswer(req.user, vocab, (items) => {
		res.send();
	});
});

app.post('/api/srs/mark-incorrect', function(req, res) {
	if (!req.user) {
		res.status(403);
		res.send('403 Forbidden');
		return;
	}
	if (!req.body.hasOwnProperty('vocab')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const vocab = parseInt(req.body['vocab'], 10);
	if (isNaN(vocab)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.processIncorrectAnswer(req.user, vocab, (items) => {
		res.send();
	});
});

app.post('/api/srs/mark-known', function(req, res) {
	if (!req.user) {
		res.status(403);
		res.send('403 Forbidden');
		return;
	}
	if (!req.body.hasOwnProperty('vocab')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const vocab = parseInt(req.body['vocab'], 10);
	if (isNaN(vocab)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.processKnownAnswer(req.user, vocab, (items) => {
		res.send();
	});
});

app.use((req, res, next) => {
	res.status(404);
	setLanguage(req);
	res.render('404', { user: req.user, _: translations._ });
})

app.use((err, req, res, next) => {
	res.status(500);
	setLanguage(req);
	output.error('Uncaught exception when handling a request; responding with HTTP 500');
	console.log(err.stack);
	res.render('500', { user: req.user, _: translations._, error: err });
})

app.get('/api/message-stats', function(req, res) {
	let query = req.query['query'];
	if (req.query['type'] === 'discord') {
		// filter out spoilers and emoji
		query = query.replace(/(\|\|[^|]+\|\||:[^ :]+:)/g, '');
	}
	const responses = reykunyu.getResponsesFor(query);
	let naviWordCount = 0;
	let totalWordCount = 0;
	let naviLetterCount = 0;
	let totalLetterCount = 0;
	for (let response of responses) {
		responseWords = response['tìpawm'].split(' ').length;
		responseLetters = response['tìpawm'].length;
		totalWordCount += responseWords;
		totalLetterCount += responseLetters;
		if (response["sì'eyng"].length > 0) {
			naviWordCount += responseWords;
			naviLetterCount += responseLetters;
		}
	}
	res.json({
		'naviWordCount': naviWordCount,
		'totalWordCount': totalWordCount,
		'naviLetterCount': naviLetterCount,
		'totalLetterCount': totalLetterCount
	});
});

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

