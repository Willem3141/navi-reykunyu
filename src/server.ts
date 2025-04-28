/**
 * Reykunyu - Weptseng fte ralpiveng aylì'ut leNa'vi
 */

import * as fs from 'fs';

import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import session from 'express-session';
import connectSqlite from 'connect-sqlite3';
const sqliteSession = connectSqlite(session);
import passport from 'passport';

const app = express();
app.use(compression());

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

import * as dialect from './dialect';
import * as edit from './edit';
import * as output from './output';
import * as reykunyu from './reykunyu';
import * as zeykerokyu from './zeykerokyu';

import bodyParser from 'body-parser';
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
	store: new sqliteSession() as any,
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

import * as translations from './translations';
const translationsJson = JSON.parse(fs.readFileSync('./src/translations.json', 'utf8'));
const uiTranslationsJs = fs.readFileSync('./frontend/src/ui-translations.js').toString().replace('{}', JSON.stringify(translationsJson));

/**
 * Returns the standard template variables for the given request, which should
 * be available for all pages (user, translation function, et cetera). To add
 * custom variables to a given template, pass them via `toAdd`; these variables
 * are added to the standard ones.
 */
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
	if (req.user?.is_admin) {
		variables['dataErrorCount'] = reykunyu.getDataErrorCount();
	}
	return variables;
}

/**
 * Reads the `lang` cookie and sets the language (in the `translations` module)
 * accordingly.
 */
function setLanguage(req: Request): void {
	let lang = 'en';
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

// automatically set the language for all requests
app.use((req, res, next) => {
	setLanguage(req);
	next();
});

app.get('/',
	async (req, res, next) => {
		try {
			if (req.user) {
				const count = await zeykerokyu.getReviewableCount(req.user);
				res.render('index', pageVariables(req, { query: req.query['q'], reviewableCount: count }));
			} else {
				res.render('index', pageVariables(req, { query: req.query['q'] }));
			}
		} catch (e) {
			next(e);
		}
	}
);

app.get('/help',
	(req, res) => {
		res.render('help', pageVariables(req));
	}
);

app.get('/js/ui-translations.js',
	(req, res) => {
		res.setHeader('Content-Type', 'text/javascript');
		res.send(uiTranslationsJs);
	}
);

app.get('/all',
	(req, res) => {
		res.render("fralì'u", pageVariables(req));
	}
);

app.get('/add',
	(req, res) => {
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
	}
);

app.post('/add',
	(req, res) => {
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
	}
);

app.get('/edit',
	(req, res) => {
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
	}
);

app.get('/edit/raw',
	(req, res) => {
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
	}
);

app.get('/delete', (req,res)=> {
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
	console.log("setting up page for deletion",id,wordData);
	res.render('delete',pageVariables(req,{
		'post_url': '/delete',
		'word': wordData
		})
	)
})

app.post('/delete', (req,res)=> {
	const id = parseInt(req.query['word'] as string, 10);
	console.log("deleting",id);
	//edit.deleteWordData(id, req.user);
	res.send({'url':'/history'});
})

app.post('/edit',
	(req, res) => {
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
	}
);

app.get('/history',
	(req, res) => {
		let historyData = JSON.parse(fs.readFileSync('./data/history.json', 'utf8'));
		historyData = historyData.slice(Math.max(1, historyData.length - 50));  // 50 last elements
		historyData.reverse();
		res.render('history', pageVariables(req, { history: historyData }));
	}
);

app.get('/etymology-editor',
	(req, res) => {
		if (!req.user || !req.user['is_admin']) {
			res.status(403);
			res.render('403', pageVariables(req));
			return;
		}
		res.render('etymologyEditor', pageVariables(req, {
			'post_url': '/edit',
			'words': edit.getAll()
		}));
	}
);

app.get('/sources-editor',
	(req, res) => {
		if (!req.user || !req.user['is_admin']) {
			res.status(403);
			res.render('403', pageVariables(req));
			return;
		}
		res.render('sourcesEditor', pageVariables(req, {
			'post_url': '/edit',
			'words': edit.getAll()
		}));
	}
);

app.get('/corpus-editor',
	(req, res) => {
		if (!req.user || !req.user['is_admin']) {
			res.status(403);
			res.render('403', pageVariables(req));
			return;
		}
		res.render('corpusEditor', pageVariables(req, {
			'sentences': reykunyu.getAllSentences()
		}));
	}
);

app.get('/corpus-editor/add',
	(req, res) => {
		if (!req.user || !req.user['is_admin']) {
			res.status(403);
			res.render('403', pageVariables(req));
			return;
		}
		res.render('corpusEditorAdd', pageVariables(req, {
			'post_url': '/corpus-editor/add'
		}));
	}
);

app.get('/corpus-editor/edit',
	(req, res) => {
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
	}
);

app.post('/corpus-editor/add',
	(req, res) => {
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

		const result = reykunyu.getResponsesFor(sentence, 'FN');
		let words: [string, string[]][] = [];
		for (let word of result) {
			let roots = [];
			for (let root of word['sì\'eyng']) {
				roots.push(root['na\'vi'] + ':' + root['type']);
			}
			words.push([word['tìpawm'], roots]);
		}

		const sentenceData: Sentence = {
			"na'vi": words,
			"translations": { 'en': { 'translation': [], 'mapping': [] } },
			"source": []
		};

		reykunyu.insertSentence(key, sentenceData);
		reykunyu.saveCorpus();
		res.send();
	}
);

app.post('/corpus-editor/edit',
	(req, res) => {
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
	}
);

app.get('/untranslated',
	(req, res) => {
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
	}
);

app.get('/data-errors',
	(req, res) => {
		if (!req.user || !req.user['is_admin']) {
			res.status(403);
			res.render('403', pageVariables(req));
			return;
		}
		res.render('data-errors', pageVariables(req));
	}
);

app.get('/signup',
	(req, res) => {
		res.render('signup', pageVariables(req));
	}
);

app.get('/study',
	async (req, res, next) => {
		try {
			const courses = await zeykerokyu.getCourses();
			if (req.user) {
				const count = await zeykerokyu.getReviewableCount(req.user);
				res.render('study', pageVariables(req, { courses: courses, reviewableCount: count }));
			} else {
				res.render('study-landing', pageVariables(req, { courses: courses }));
			};
		} catch (e) {
			next(e);
		}
	}
);

app.get('/study/course',
	async (req, res, next) => {
		try {
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
			let user = req.user;
			const course = await zeykerokyu.getCourse(courseId - 1);
			const lessons = await zeykerokyu.getLessons(user, courseId - 1);
			const count = await zeykerokyu.getReviewableCountForCourse(courseId - 1, user);
			res.render('study-course', pageVariables(req, { course: course, lessons: lessons, reviewableCount: count }));
		} catch (e) {
			next(e);
		}
	}
);

app.get('/study/lesson',
	async (req, res, next) => {
		try {
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
			const course = await zeykerokyu.getCourse(courseId - 1);
			const lesson = await zeykerokyu.getLesson(courseId - 1, lessonId - 1);
			res.render('study-session', pageVariables(req, { course: course, lesson: lesson }));
		} catch (e) {
			next(e);
		}
	}
);

app.get('/study/review',
	(req, res) => {
		if (!req.user) {
			res.status(403);
			res.render('403', pageVariables(req));
			return;
		}
		res.render('study-review', pageVariables(req));
	}
);

app.get('/words.json',
	(req, res) => {
		res.sendFile('words.json', { root: process.cwd() + '/data' });
	}
);

import apiRouter from './api';
app.use('/api', apiRouter);

import authRouter from './auth';
app.use('/auth', authRouter);

app.use((req, res) => {
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

