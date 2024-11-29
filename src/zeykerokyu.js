/**
 * Zeykerokyu is Reykunyu's module for managing SRS items. It has a number of
 * lessons, which are just subsets of words to learn, and may potentially
 * overlap each other. Furthermore it maintains in a database which words are
 * already known by which user.
 * 
 * SRS stages:
 * 0: unseen (not stored in DB)
 * 1: just learned, revise immediately
 * 2: revise in 4h
 * 3: revise in 1d
 * 4: revise in 7d
 * 5: revise in 30d
 * 6: revise in 365d
 */

module.exports = {
	'getCourses': getCourses,
	'getCourseData': getCourseData,
	'getLessons': getLessons,
	'getLessonData': getLessonData,
	'getItemsForLesson': getItemsForLesson,
	'getLearnableItemsForLesson': getLearnableItemsForLesson,
	'getReviewableItems': getReviewableItems,
	'getReviewableCount': getReviewableCount,
	'getReviewableItemsForCourse': getReviewableItemsForCourse,
	'getReviewableCountForCourse': getReviewableCountForCourse,
	'getReviewableItemsForLesson': getReviewableItemsForLesson,
	'getReviewableCountForLesson': getReviewableCountForLesson,
	'processCorrectAnswer': processCorrectAnswer,
	'processIncorrectAnswer': processIncorrectAnswer,
	'processKnownAnswer': processKnownAnswer
}

const fs = require('fs');

const db = require('./db');
const reykunyu = require('./reykunyu');

/// Returns (in a callback) a list of available courses.
function getCourses(cb) {
	db.all(`select c.id, c.name, c.description,
		(select count() from lesson l where l.course_id == c.id) as lesson_count
	from course c`, (err, courses) => {
		if (err) {
			console.log(err);
		}
		cb(courses);
	});
}

function getCourseData(courseId, cb) {
	db.get(`select id, name, description
	from course
	where id == ?`, courseId, (err, courses) => {
		if (err) {
			console.log(err);
		}
		cb(courses);
	});
}

/// Returns (in a callback) a list of available lessons in a course, with
/// statistics for the given user.
function getLessons(user, courseId, cb) {
	if (user) {
		db.all(`select l.id, l.name, l.introduction, l.conclusion,
			(select count() from vocab_in_lesson v
				where l.course_id == v.course_id and l.id == v.lesson_id) as total_count,
			(select count() from vocab_in_lesson v, vocab_status s
				where l.course_id == v.course_id and l.id == v.lesson_id
				and v.vocab == s.vocab and s.user == ?1) as known_count,
			(select count() from vocab_in_lesson v, vocab_status s
				where l.course_id == v.course_id and l.id == v.lesson_id
				and v.vocab == s.vocab and s.user == ?1 and s.next_review <= current_timestamp) as reviewable_count
		from lesson l
		where l.course_id = ?2`, user.username, courseId, (err, lessons) => {
			if (err) {
				console.log(err);
			}
			cb(lessons);
		});

	} else {
		db.all(`select l.id, l.name, l.description,
			(select count() from vocab_in_lesson v where l.id == v.lesson_id) as total_count,
		from lesson l
		where l.course_id = ?`, courseId, (err, lessons) => {
			cb(lessons);
		});
	}
}

function getLessonData(courseId, lessonId, cb) {
	db.get(`select course_id, id, name, introduction, conclusion
	from lesson
	where course_id == ? and id == ?`, courseId, lessonId, (err, courses) => {
		if (err) {
			console.log(err);
		}
		cb(courses);
	});
}

function getItemsForLesson(courseId, lessonId, user, cb) {
	if (!user) {
		cb([]);
	}
	db.all(`select v.vocab, v.comment from vocab_in_lesson v
		where v.course_id == ? and v.lesson_id == ?
		`, courseId, lessonId, (err, items) => {
			if (err) {
				cb([]);
				console.log(err);
			} else {
				vocabIDsToWordData(items);
				cb(items);
			}
		}
	);
}

function vocabIDsToWordData(items) {
	for (let item of items) {
		item['vocab'] = reykunyu.getWord(item['vocab']);
	}
}

function getLearnableItemsForLesson(courseId, lessonId, user, cb) {
	if (!user) {
		cb([]);
	}
	db.all(`select v.vocab, v.comment from vocab_in_lesson v
		where v.course_id == ? and v.lesson_id == ?
			and v.vocab not in (
				select vocab
				from vocab_status
				where user == ?
			)
		`, courseId, lessonId, user.username, (err, items) => {
			if (err) {
				cb([]);
				console.log(err);
			} else {
				vocabIDsToWordData(items);
				cb(items);
			}
		}
	);
}

function getReviewableItems(user, cb) {
	if (!user) {
		cb([]);
	}
	db.all(`select distinct v.vocab
		from vocab_status s, vocab_in_lesson v
		where s.user == ?
			and s.next_review <= current_timestamp
			and v.vocab == s.vocab
		order by random()
		`, user.username, (err, items) => {
			if (err) {
				cb([]);
				console.log(err);
			} else {
				vocabIDsToWordData(items);
				cb(items);
			}
		}
	);
}

function getReviewableCount(user, cb) {
	if (!user) {
		cb(0);
	}
	db.get(`select count(distinct v.vocab)
		from vocab_status s, vocab_in_lesson v
		where s.user == ?
			and s.next_review <= current_timestamp
			and v.vocab == s.vocab
		`, user.username, (err, result) => {
			if (err) {
				cb(0);
				console.log(err);
			} else {
				cb(result['count(distinct v.vocab)']);
			}
		}
	);
}

function getReviewableItemsForCourse(courseId, user, cb) {
	if (!user) {
		cb([]);
	}
	db.all(`select distinct v.vocab
		from vocab_status s, vocab_in_lesson v
		where s.user == ?
			and s.next_review <= current_timestamp
			and v.vocab == s.vocab
			and v.course_id == ?
		order by random()
		`, user.username, courseId, (err, items) => {
			if (err) {
				cb([]);
				console.log(err);
			} else {
				vocabIDsToWordData(items);
				cb(items);
			}
		}
	);
}

function getReviewableCountForCourse(courseId, user, cb) {
	if (!user) {
		cb(0);
	}
	db.get(`select count(distinct v.vocab)
		from vocab_status s, vocab_in_lesson v
		where s.user == ?
			and s.next_review <= current_timestamp
			and v.vocab == s.vocab
			and v.course_id == ?
		`, user.username, courseId, (err, result) => {
			if (err) {
				cb(0);
				console.log(err);
			} else {
				cb(result['count(distinct v.vocab)']);
			}
		}
	);
}

function getReviewableItemsForLesson(courseId, lessonId, user, cb) {
	if (!user) {
		cb([]);
	}
	db.all(`select distinct v.vocab
		from vocab_status s, vocab_in_lesson v
		where s.user == ?
			and s.next_review <= current_timestamp
			and v.vocab == s.vocab
			and v.course_id == ? and v.lesson_id == ?
		order by random()
		`, user.username, courseId, lessonId, (err, items) => {
			if (err) {
				cb([]);
				console.log(err);
			} else {
				vocabIDsToWordData(items);
				cb(items);
			}
		}
	);
}

function getReviewableCountForLesson(courseId, lessonId, user, cb) {
	if (!user) {
		cb(0);
	}
	db.get(`select count(distinct v.vocab)
		from vocab_status s, vocab_in_lesson v
		where s.user == ?
			and s.next_review <= current_timestamp
			and v.vocab == s.vocab
			and v.course_id == ? and v.lesson_id == ?
		`, user.username, courseId, lessonId, (err, result) => {
			if (err) {
				cb(0);
				console.log(err);
			} else {
				cb(result['count(distinct v.vocab)']);
			}
		}
	);
}

/// If an item is put into stage i, then its next review should be scheduled
/// after time intervalDuration[i].
const intervalDuration = [
	'0 hours',
	'0 hours',
	'4 hours',
	'8 hours',
	'1 day',
	'2 days',
	'4 days',
	'7 days',
	'14 days',
	'30 days',
	'90 days',
	'365 days'
];

/// Increases the SRS stage for an item and schedules the next review for the
/// item. This can also be called for items that have not been learned yet; in
/// this case they will move from stage 0 (which is not in the database) to 1
/// and scheduled for immediate review.
function processCorrectAnswer(user, vocab, cb) {
	if (!user || !vocab) {
		cb(false);
	}

	// get current SRS stage
	db.get(`select srs_stage from vocab_status
		where user == ?
			and vocab == ?`,
		user.username, vocab, (err, result) => {
			if (err) {
				cb();
				console.log(err);
			} else if (!result) {
				// if not in database (= stage 0), insert it
				db.run(`insert into vocab_status
					values (?, ?, ?, current_timestamp)`,
					user.username, vocab, 1, (err) => {
						if (err) {
							cb();
							console.log(err);
						} else {
							cb();
						}
					}
				);
			} else {
				// otherwise update the SRS stage and next review time in the
				// database
				const stage = result['srs_stage'];
				const newStage = Math.min(stage + 1, 6);
				db.run(`update vocab_status
					set (srs_stage, next_review) = (?, datetime(current_timestamp, "+" || ?))
					where user == ?
						and vocab == ?`,
					newStage, intervalDuration[newStage], user.username, vocab, (err) => {
						if (err) {
							cb();
							console.log(err);
						} else {
							cb();
						}
					}
				);
			}
		}
	);
}

/// Decreases the SRS stage for an item and schedules the next review for the
/// item. Can be called only for vocab whose status is already stored in the
/// database, i.e., not for newly learned items.
function processIncorrectAnswer(user, vocab, cb) {
	if (!user || !vocab) {
		cb(false);
	}

	// get current SRS stage
	db.get(`select srs_stage from vocab_status
		where user == ?
			and vocab == ?`,
		user.username, vocab, (err, result) => {
			if (err) {
				cb();
				console.log(err);
			} else if (!result) {
				cb();
				console.log('Tried to decrease SRS level for [' + vocab + '] which is not in the database yet');
			} else {
				// otherwise update the SRS stage and next review time in the
				// database
				let stage = result['srs_stage'];
				const newStage = 1;
				db.run(`update vocab_status
					set (srs_stage, next_review) = (?, datetime(current_timestamp, "+" || ?))
					where user == ?
						and vocab == ?`,
					newStage, intervalDuration[newStage], user.username, vocab, (err) => {
						if (err) {
							cb();
							console.log(err);
						} else {
							cb();
						}
					}
				);
			}
		}
	);
}

/// Increases the SRS stage for an item to the maximum level, *and* schedules it
/// for immediate review. Can be called only for items that are not yet in the
/// database.
function processKnownAnswer(user, vocab, cb) {
	if (!user || !vocab) {
		cb(false);
	}

	db.run(`insert into vocab_status
		values (?, ?, ?, current_timestamp)`,
		user.username, vocab, 11, (err) => {
			if (err) {
				cb();
				console.log(err);
			} else {
				cb();
			}
		}
	);
}
