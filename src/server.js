/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

var fs = require('fs');

var express = require('express');
var compression = require('compression');
var session = require('express-session');
var sqliteSession = require('connect-sqlite3')(session);
const passport = require('passport');

var app = express();
app.use(compression());
var http = require('http').Server(app);

var config = JSON.parse(fs.readFileSync('config.json'));

var reykunyu = require('./reykunyu');
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

app.use(require('body-parser').urlencoded({ extended: true }));

app.use(session({
	store: new sqliteSession(),
	secret: config["secret"],
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

const staticRoot = './frontend/dist';
app.use(express.static(staticRoot));

app.use('/ayrel', express.static('./data/ayrel'));
app.use('/fam', express.static('./data/fam'));

app.set('views', './frontend/templates');
app.set('view engine', 'ejs');

const translations = require('./translations');
const translationsJson = JSON.parse(fs.readFileSync('./src/translations.json'));
const uiTranslationsJs = fs.readFileSync('./frontend/src/ui-translations.js').toString().replace('{}', JSON.stringify(translationsJson));

function pageVariables(req, toAdd) {
	let variables = { ...toAdd };
	variables['user'] = req.user;
	variables['_'] = translations.span_;
	if (req.session.messages) {
		variables['messages'] = req.session.messages;
		req.session.messages = [];
	} else {
		variables['messages'] = [];
	}
	variables['development'] = config.hasOwnProperty('development') && config['development'];
	return variables;
}

app.use((req, res, next) => {
	setLanguage(req);
	next();
});

app.get('/', function(req, res) {
	res.render('index', pageVariables(req, { query: req.query['q'] }));
});

app.get('/help', function(req, res) {
	res.render('help', pageVariables(req));
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

app.get('/js/ui-translations.js', function(req, res) {
	res.setHeader('Content-Type', 'text/javascript');
	res.send(uiTranslationsJs);
});

app.get('/all', function(req, res) {
	res.render("fralì'u", pageVariables(req));
});

app.get('/add', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('leykatem', pageVariables(req, {
		'post_url': '/add',
		'word': {
			"na'vi": '',
			"translations": [{'en': ''}]
		}
	}));
});

app.post('/add', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
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
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
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
	res.render('leykatem', pageVariables(req, {
		'post_url': '/edit',
		'word': wordData
	}));
});

app.get('/edit/raw', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
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
	res.render('leykatem-yrr', pageVariables(req, {
		'post_url': '/edit',
		'word': wordData
	}));
});

app.post('/edit', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
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
	res.render('history', pageVariables(req, { history: historyData }));
});

app.get('/etymology-editor', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('etymologyEditor', pageVariables(req, {
		'post_url': '/edit',
		'words': edit.getAll()
	}));
});

app.get('/sources-editor', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('sourcesEditor', pageVariables(req, {
		'post_url': '/edit',
		'words': edit.getAll()
	}));
});

app.get('/corpus-editor', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('corpusEditor', pageVariables(req, {
		'sentences': reykunyu.getAllSentences()
	}));
});

app.get('/corpus-editor/add', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('corpusEditorAdd', pageVariables(req, {
		'post_url': '/corpus-editor/add'
	}));
});

app.get('/corpus-editor/edit', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	const key = req.query["sentence"];
	if (!key) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	const sentence = reykunyu.getAllSentences()[key];
	res.render('corpusEditorEdit', pageVariables(req, {
		'post_url': '/corpus-editor/edit',
		'key': key,
		'sentence': sentence
	}));
});

app.post('/corpus-editor/add', function(req, res) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
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
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
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
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	let untranslated = edit.getUntranslated(translations.getLanguage());
		
	res.render('untranslated', pageVariables(req, {
		untranslated: untranslated,
		language: translations.getLanguage()
	}));
});

app.get('/signup', function(req, res) {
	res.render('signup', pageVariables(req));
});

/*app.get('/study', function(req, res) {
	zeykerokyu.getCourses(req.user, (courseData) => {
		res.render('study', pageVariables(req, { courses: courseData }));
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
			res.render('study-course', pageVariables(req, { course: courseData, lessons: lessonData }));
		});
	});
});

app.get('/study/learn', function(req, res) {
	if (!req.query.hasOwnProperty('course') || !req.query.hasOwnProperty('lesson')) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	res.render('learn', pageVariables(req));
});*/

app.get('/words.json', function(req, res) {
	res.sendFile('words.json', { root: process.cwd() + '/data' });
});

const apiRouter = require('./api');
app.use('/api', apiRouter);

const authRouter = require('./auth');
app.use('/auth', authRouter);

app.use((req, res, next) => {
	res.status(404);
	res.render('404', pageVariables(req));
})

app.use((err, req, res, next) => {
	res.status(500);
	output.error('Uncaught exception when handling a request; responding with HTTP 500');
	console.log(err.stack);
	res.render('500', pageVariables(req, { error: err }));
})

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

