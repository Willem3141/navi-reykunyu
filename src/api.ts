import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import cors from 'cors';
import fs from 'fs';

import * as annotatedDictionary from './annotatedDictionary';
import * as conjugationString from './conjugationString';
import * as reykunyu from './reykunyu';
import * as userdata from './userdata';
import * as verbs from './verbs/conjugator';
import * as zeykerokyu from './zeykerokyu';

router.get('/word',
	cors(),
	parseIntegerParameter('id', 'get'),
	(req, res) => {
		res.json(reykunyu.getWord(req.args!['id']));
	}
);

router.get('/fwew-search',
	cors(),
	parseStringParameter('query', 'get'),
	parseStringParameter('language', 'get'),
	parseDialectParameter('dialect', 'get'),
	async (req, res) => {
		let fromNaviResult = reykunyu.getResponsesFor(req.args!['query'], req.args!['dialect']);
		let toNaviResult = reykunyu.getReverseResponsesFor(req.args!['query'], req.args!['language'], req.args!['dialect']);
		if (req.user) {
			await userdata.augmentFromNaviResultWithUserData(req.user, fromNaviResult);
			await userdata.augmentToNaviResultWithUserData(req.user, toNaviResult);
		}
		res.json({
			'fromNa\'vi': fromNaviResult,
			'toNa\'vi': toNaviResult
		});
	}
);

router.get('/fwew',
	cors(),
	parseStringParameter('tìpawm', 'get'),
	parseDialectParameter('dialect', 'get'),
	async (req, res) => {
		let result = reykunyu.getResponsesFor(req.args!['tìpawm'], req.args!['dialect']);
		if (req.user) {
			await userdata.augmentFromNaviResultWithUserData(req.user, result);
		}
		res.json(result);
	}
);

router.get('/mok-suggest',
	cors(),
	parseStringParameter('query', 'get'),
	parseStringParameter('language', 'get'),
	parseDialectParameter('dialect', 'get'),
	(req, res) => {
		let suggestionsFrom = reykunyu.getSuggestionsFor(req.args!['query'], req.args!['language'], req.args!['dialect']);
		let suggestionsTo = reykunyu.getReverseSuggestionsFor(req.args!['query'], req.args!['language']);
		res.json({
			'results': suggestionsFrom['results'].concat(suggestionsTo['results'])
		});
	}
);

router.get('/mok',
	cors(),
	parseStringParameter('tìpawm', 'get'),
	parseStringParameter('language', 'get'),
	parseDialectParameter('dialect', 'get'),
	(req, res) => {
		res.json(reykunyu.getSuggestionsFor(req.args!['tìpawm'], req.args!['language'], req.args!['dialect']));
	}
);

router.get('/search',
	cors(),
	parseStringParameter('query', 'get'),
	parseStringParameter('language', 'get'),
	parseDialectParameter('dialect', 'get'),
	async (req, res) => {
		let result = reykunyu.getReverseResponsesFor(req.args!['query'], req.args!['language'], req.args!['dialect']);
		if (req.user) {
			await userdata.augmentToNaviResultWithUserData(req.user, result);
		}
		res.json(result);
	}
);

router.get('/suggest',
	parseStringParameter('query', 'get'),
	parseStringParameter('language', 'get'),
	(req, res) => {
		res.json(reykunyu.getReverseSuggestionsFor(req.args!['query'], req.args!['language']));
	}
);

router.get('/annotated/search', 
	parseStringParameter('query', 'get'),
	(req, res) => {
		res.json(annotatedDictionary.getResponsesFor(req.args!['query']));
	}
);

router.get('/annotated/suggest',
	parseStringParameter('query', 'get'),
	(req, res) => {
		res.json(annotatedDictionary.getSuggestionsFor(req.args!['query']));
	}
);

router.get('/conjugate/verb',
	cors(),
	parseStringParameter('verb', 'get'),
	parseStringParameter('prefirst', 'get'),
	parseStringParameter('first', 'get'),
	parseStringParameter('second', 'get'),
	(req, res) => {
		res.json(conjugationString.formsFromString(verbs.conjugate(
			req.args!['verb'], [req.args!['prefirst'], req.args!['first'], req.args!['second']])));
	}
);

router.get('/history/all',
	(req, res) => {
		let historyData = JSON.parse(fs.readFileSync('./data/history.json', 'utf8'));
		res.json(historyData);
	}
);

router.get('/history/major-changes',
	(req, res) => {
		let historyData = [];
		for (let entry of JSON.parse(fs.readFileSync('./data/history.json', 'utf8'))) {
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
	}
);

router.get('/list/all',
	(req, res) => {
		res.json(reykunyu.getAll());
	}
);

router.get('/sound', 
	parseStringParameter('word', 'get'),
	parseStringParameter('type', 'get'),
	(req, res) => {
		const file = req.args!['word'] + '-' + req.args!['type'] + '.mp3';
		if (fs.existsSync(file)) {
			res.sendFile(file, { root: process.cwd() + '/data/fam' });
		} else {
			res.sendStatus(404);
		}
	}
);

router.get('/random',
	cors(),
	parseIntegerParameter('holpxay', 'get'),
	parseStringParameter('fnel', 'get', true),
	parseDialectParameter('dialect', 'get'),
	(req, res) => {
		res.json(reykunyu.getRandomWords(req.args!['holpxay'], req.args!['dialect'], req.args!['fnel']));
	}
);

router.get('/rhymes',
	cors(),
	parseStringParameter('tìpawm', 'get'),
	parseDialectParameter('dialect', 'get'),
	(req, res) => {
		res.json(reykunyu.getRhymes(req.args!['tìpawm'], req.args!['dialect']));
	}
);

router.post('/user/mark-favorite',
	checkLoggedIn(),
	parseIntegerParameter('vocab', 'post'),
	(req, res) => {
		userdata.markFavorite(req.user!, req.args!['vocab'], () => {
			res.status(204).send();
		});
	}
);

router.post('/user/unmark-favorite',
	checkLoggedIn(),
	parseIntegerParameter('vocab', 'post'),
	(req, res) => {
		userdata.unmarkFavorite(req.user!, req.args!['vocab'], () => {
			res.status(204).send();
		});
	}
);

router.get('/srs/courses',
	checkLoggedIn(),
	(req, res) => {
		zeykerokyu.getCourses((courses: Course[]) => {
			res.json(courses);
		});
	}
);

router.get('/srs/lessons',
	checkLoggedIn(),
	parseIntegerParameter('courseId', 'get'),
	(req, res) => {
		zeykerokyu.getLessons(req.user!, req.args!['courseId'] - 1, (lessons: Lesson[]) => {
			res.json(lessons);
		});
	}
);

router.get('/srs/lesson',
	checkLoggedIn(),
	parseIntegerParameter('courseId', 'get'),
	parseIntegerParameter('lessonId', 'get'),
	(req, res) => {
		zeykerokyu.getLessonData(req.args!['courseId'] - 1, req.args!['lessonId'] - 1, (lessons: Lesson) => {
			res.json(lessons);
		});
	}
);

router.get('/srs/items',
	checkLoggedIn(),
	parseIntegerParameter('courseId', 'get'),
	parseIntegerParameter('lessonId', 'get'),
	(req, res) => {
		zeykerokyu.getItemsForLesson(req.args!['courseId'] - 1, req.args!['lessonId'] - 1, req.user!, (items: LearnableItem[]) => {
			res.json(items);
		});
	}
);

router.get('/srs/learnable',
	checkLoggedIn(),
	parseIntegerParameter('courseId', 'get'),
	parseIntegerParameter('lessonId', 'get'),
	(req, res) => {
		zeykerokyu.getLearnableItemsForLesson(req.args!['courseId'] - 1, req.args!['lessonId'] - 1, req.user!, (items: LearnableItem[]) => {
			res.json(items);
		});
	}
);

router.get('/srs/reviewable',
	checkLoggedIn(),
	(req, res) => {
		const courseId = parseInt(req.query['courseId'] as string, 10) - 1;
		const lessonId = parseInt(req.query['lessonId'] as string, 10) - 1;
		if (isNaN(courseId)) {
			zeykerokyu.getReviewableItems(req.user!, (items: LearnableItem[]) => {
				res.json(items);
			});
		} else if (isNaN(lessonId)) {
			zeykerokyu.getReviewableItemsForCourse(courseId, req.user!, (items: LearnableItem[]) => {
				res.json(items);
			});
		} else {
			zeykerokyu.getReviewableItemsForLesson(courseId, lessonId, req.user!, (items: LearnableItem[]) => {
				res.json(items);
			});
		}
	}
);

router.get('/srs/reviewable-count',
	checkLoggedIn(),
	(req, res) => {
		const courseId = parseInt(req.query['courseId'] as string, 10) - 1;
		const lessonId = parseInt(req.query['lessonId'] as string, 10) - 1;
		if (isNaN(courseId)) {
			zeykerokyu.getReviewableCount(req.user!, (count: number) => {
				res.json(count);
			});
		} else if (isNaN(lessonId)) {
			zeykerokyu.getReviewableCountForCourse(courseId, req.user!, (count: number) => {
				res.json(count);
			});
		} else {
			zeykerokyu.getReviewableCountForLesson(courseId, lessonId, req.user!, (count: number) => {
				res.json(count);
			});
		}
	}
);

router.post('/srs/mark-correct',
	checkLoggedIn(),
	parseIntegerParameter('vocab', 'post'),
	(req, res) => {
		zeykerokyu.processCorrectAnswer(req.user!, req.args!['vocab'], (items) => {
			res.status(204).send();
		});
	}
);

router.post('/srs/mark-incorrect',
	checkLoggedIn(),
	parseIntegerParameter('vocab', 'post'),
	(req, res) => {
		zeykerokyu.processIncorrectAnswer(req.user!, req.args!['vocab'], () => {
			res.status(204).send();
		});
	}
);

router.post('/srs/mark-known',
	checkLoggedIn(),
	parseIntegerParameter('vocab', 'post'),
	(req, res) => {
		zeykerokyu.processKnownAnswer(req.user!, req.args!['vocab'], () => {
			res.status(204).send();
		});
	}
);

function checkLoggedIn() {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(403);
			res.send('403 Forbidden');
			return;
		}
		next();
	}
}

function parseStringParameter(name: string, type: 'get' | 'post', optional?: boolean) {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.args) {
			req.args = {};
		}
		const args = type === 'get' ? req.query : req.body;
		if (!args.hasOwnProperty(name)) {
			if (!optional) {
				res.status(400);
				res.send('400 Bad Request');
				return;
			} else {
				next();
				return;
			}
		}
		req.args[name] = args[name];
		next();
	}
}

/**
 * Retrieves a dialect parameter. If the parameter doesn't exist, defaults to
 * combined.
 */
function parseDialectParameter(name: string, type: 'get' | 'post') {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.args) {
			req.args = {};
		}
		const args = type === 'get' ? req.query : req.body;
		if (!args.hasOwnProperty(name)) { 
			req.args[name] = 'combined';
			next();
			return;
		} else if (args[name] !== 'FN' && args[name] !== 'RN' && args[name] !== 'combined') {
			res.status(400);
			res.send('400 Bad Request');
			return;
		}
		req.args[name] = args[name];
		next();
	}
}

/**
 * Retrieves an integer argument from the query or body arguments.
 * Sends a HTTP 400 response if the argument does not exist or is not an
 * integer.
 */
function parseIntegerParameter(name: string, type: 'get' | 'post') {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.args) {
			req.args = {};
		}
		const args = type === 'get' ? req.query : req.body;
		if (!args.hasOwnProperty(name) || isNaN(req.args[name] = parseInt(args[name], 10))) {
			res.status(400);
			res.send('400 Bad Request');
			return;
		}
		next();
	}
}

export default router;
