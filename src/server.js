/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

var fs = require('fs');

var express = require('express');
var compression = require('compression');
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

const apiRouter = require('./api');
app.use('/api', apiRouter);

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

http.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

