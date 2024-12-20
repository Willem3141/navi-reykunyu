/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

const fs = require('fs');

import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import session from 'express-session';
const sqliteSession = require('connect-sqlite3')(session);
import passport from 'passport';

const app = express();
app.use(compression());

const config = JSON.parse(fs.readFileSync('config.json'));

const reykunyu = require('./reykunyu');
const edit = require('./edit');
const output = require('./output');
const dialect = require('./dialect');
const zeykerokyu = require('./zeykerokyu');

// TODO is this necessary?
//import ejs from 'ejs';

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

function pageVariables(req: Request, toAdd?: any) {
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

app.use((req: Request, res: Response, next: NextFunction) => {
	setLanguage(req);
	next();
});

app.get('/', function(req: Request, res: Response) {
	if (req.user) {
		zeykerokyu.getReviewableCount(req.user, (count: number) => {
			res.render('index', pageVariables(req, { query: req.query['q'], reviewableCount: count }));
		});
	} else {
		res.render('index', pageVariables(req, { query: req.query['q'] }));
	}
});

app.get('/help', function(req: Request, res: Response) {
	res.render('help', pageVariables(req));
});

function setLanguage(req: Request) {
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

app.get('/js/ui-translations.js', function(req: Request, res: Response) {
	res.setHeader('Content-Type', 'text/javascript');
	res.send(uiTranslationsJs);
});

app.get('/all', function(req: Request, res: Response) {
	res.render("fralì'u", pageVariables(req));
});

app.get('/add', function(req: Request, res: Response) {
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

app.post('/add', function(req: Request, res: Response) {
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

app.get('/edit', function(req: Request, res: Response) {
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
	const id = parseInt(req.query['word'] as string, 10);
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

app.get('/edit/raw', function(req: Request, res: Response) {
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
	const id = parseInt(req.query['word'] as string, 10);
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

app.post('/edit', function(req: Request, res: Response) {
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

app.get('/history', function(req: Request, res: Response) {
	let historyData = JSON.parse(fs.readFileSync("./data/history.json"));
	historyData = historyData.slice(Math.max(1, historyData.length - 50));  // 50 last elements
	historyData.reverse();
	res.render('history', pageVariables(req, { history: historyData }));
});

app.get('/etymology-editor', function(req: Request, res: Response) {
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

app.get('/sources-editor', function(req: Request, res: Response) {
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

app.get('/corpus-editor', function(req: Request, res: Response) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('corpusEditor', pageVariables(req, {
		'sentences': reykunyu.getAllSentences()
	}));
});

app.get('/corpus-editor/add', function(req: Request, res: Response) {
	if (!req.user || !req.user['is_admin']) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('corpusEditorAdd', pageVariables(req, {
		'post_url': '/corpus-editor/add'
	}));
});

app.get('/corpus-editor/edit', function(req: Request, res: Response) {
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
	const sentence = reykunyu.getAllSentences()[key as string];
	res.render('corpusEditorEdit', pageVariables(req, {
		'post_url': '/corpus-editor/edit',
		'key': key,
		'sentence': sentence
	}));
});

app.post('/corpus-editor/add', function(req: Request, res: Response) {
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

app.post('/corpus-editor/edit', function(req: Request, res: Response) {
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

app.get('/untranslated', function(req: Request, res: Response) {
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

app.get('/signup', function(req: Request, res: Response) {
	res.render('signup', pageVariables(req));
});

app.get('/study', function(req: Request, res: Response) {
	zeykerokyu.getCourses((courses: Course[]) => {
		if (req.user) {
			zeykerokyu.getReviewableCount(req.user, (count: number) => {
				res.render('study', pageVariables(req, { courses: courses, reviewableCount: count }));
			});
		} else {
			res.render('study-landing', pageVariables(req, { courses: courses }));
		}
	});
});

app.get('/study/course', function(req: Request, res: Response) {
	if (!req.user) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	const courseId = parseInt(req.query['c'] as string, 10);
	if (isNaN(courseId)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.getCourseData(courseId - 1, (courseData: Course) => {
		zeykerokyu.getLessons(req.user, courseId - 1, (lessons: Lesson[]) => {
			zeykerokyu.getReviewableCountForCourse(courseId - 1, req.user, (count: number) => {
				res.render('study-course', pageVariables(req, { course: courseData, lessons: lessons, reviewableCount: count }));
			});
		});
	});
});

app.get('/study/lesson', function(req: Request, res: Response) {
	if (!req.user) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	const courseId = parseInt(req.query['c'] as string, 10);
	const lessonId = parseInt(req.query['l'] as string, 10);
	if (isNaN(courseId) || isNaN(lessonId)) {
		res.status(400);
		res.send('400 Bad Request');
		return;
	}
	zeykerokyu.getCourseData(courseId - 1, (courseData: Course) => {
		zeykerokyu.getLessonData(courseId - 1, lessonId - 1, (lesson: Lesson[]) => {
			res.render('study-session', pageVariables(req, { course: courseData, lesson: lesson }));
		});
	});
});

app.get('/study/review', function(req: Request, res: Response) {
	if (!req.user) {
		res.status(403);
		res.render('403', pageVariables(req));
		return;
	}
	res.render('study-review', pageVariables(req));
});

app.get('/words.json', function(req: Request, res: Response) {
	res.sendFile('words.json', { root: process.cwd() + '/data' });
});

import apiRouter from './api';
app.use('/api', apiRouter);

const authRouter = require('./auth');
app.use('/auth', authRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
	res.status(404);
	res.render('404', pageVariables(req));
})

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	res.status(500);
	output.error('Uncaught exception when handling a request; responding with HTTP 500');
	console.log(err.stack);
	res.render('500', pageVariables(req, { error: err }));
})

app.listen(config["port"], function() {
	console.log('listening on *:' + config["port"]);
});

