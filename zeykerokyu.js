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
	'getLessons': getLessons,
	'getLessonItems': getLessonItems,
	'getLearnableItemsForLesson': getLearnableItemsForLesson,
	'getReviewableItemsForLesson': getReviewableItemsForLesson
}

const fs = require('fs');
const lessons = JSON.parse(fs.readFileSync(__dirname + "/lessons.json"));

const db = require('./db');

/// Returns (in a callback) a list of available lessons, with statistics for the
/// given user.
function getLessons(user, cb) {
	if (user) {
		db.all(`select l.name, l.description,
			(select count() from vocab_in_lesson v where l.id == v.lesson_id) as total_count,
			(select count() from vocab_in_lesson v, vocab_status s where l.id == v.lesson_id
				and v.vocab == s.vocab and s.user == ?) as known_count,
			(select count() from vocab_in_lesson v, vocab_status s where l.id == v.lesson_id
				and v.vocab == s.vocab and s.user == ? and s.next_review <= current_timestamp) as reviewable_count
		from lesson l`, user.username, (err, lessons) => {
			cb(lessons);
		});

	} else {
		db.all(`select l.name, l.description,
			(select count() from vocab_in_lesson v where l.id == v.lesson_id) as total_count,
		from lesson l`, (err, lessons) => {
			cb(lessons);
		});
	}
}

function getLessonItems() {
	// TODO
}

function getLearnableItemsForLesson(lessonId, user, cb) {
	if (!user) {
		cb([]);
	}
	db.all(`select v.vocab from vocab_in_lesson v
		where v.lesson_id == ?
			and v.vocab not in (
				select vocab
				from vocab_status
				where user == ?
			)
		limit 10
		`, lessonId, user.username, (err, lessons) => {
			if (err) {
				cb([]);
				console.log(err);
			} else {
				cb(lessons);
			}
		}
	);
}

function getReviewableItemsForLesson(lessonId, user, cb) {
	if (!user) {
		cb([]);
	}
	db.all(`select v.vocab
		from vocab_status s, vocab_in_lesson v
		where s.user == ?
			and s.next_review <= current_timestamp
			and v.vocab == s.vocab
			and v.lesson_id == ?
		limit 50
		`, user.username, lessonId, (err, lessons) => {
			if (err) {
				cb([]);
				console.log(err);
			} else {
				cb(lessons);
			}
		}
	);
}
