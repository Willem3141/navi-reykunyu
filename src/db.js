// Reykunyu's user and session database
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const reykunyu = require('./reykunyu');

const db = new sqlite3.Database('./data/reykunyu.db');

const naviSortAlphabet = " 'aäeéfghiìklmnoprstuvwxyz";

// Compares Na'vi words a and b according to Na'vi ‘sorting rules’ (ä after a, ì
// after i, digraphs sorted as if they were two letters using English spelling,
// tìftang is sorted before everything else). A non-zero i specifies that the
// first i characters of both strings are to be ignored. Returns a negative
// value if a < b, a positive value if a > b, or 0 if a == b.
function compareNaviWords(a, b, i) {
	if (a.length <= i || b.length <= i) {
		return a.length - b.length;
	}
	const first = a[i].toLowerCase();
	const second = b[i].toLowerCase();
	if (first == second) {
		return compareNaviWords(a, b, i + 1);
	}
	return naviSortAlphabet.indexOf(first) - naviSortAlphabet.indexOf(second);
}

db.serialize(() => {
	// tables storing the lessons
	// (we regenerate these from lessons.json on each Reykunyu startup)
	db.run(`drop table if exists lesson`);
	db.run(`drop table if exists vocab_in_lesson`);
	db.run(`create table lesson (
		id integer primary key,
		name text not null,
		description text not null
	)`);
	db.run(`create table vocab_in_lesson (
		lesson_id integer,
		id integer,
		vocab text not null,
		primary key (lesson_id, id)
		foreign key (lesson_id) references lesson(id)
	)`);
	db.run(`begin transaction`);
	db.parallelize(() => {
		const lessonData = JSON.parse(fs.readFileSync("./data/lessons.json"));
		for (let i = 0; i < lessonData.length; i++) {
			const lesson = lessonData[i];
			db.run(`insert into lesson values (?, ?, ?)`, i, lesson['name'], lesson['description']);
			if (lesson.hasOwnProperty('words')) {
				words = lesson['words'];
			} else {
				words = reykunyu.getAllKeys();
				words.sort(function (a, b) {
					return compareNaviWords(a, b, 0);
				});
			}
			const vocabInsert = db.prepare(`insert into vocab_in_lesson values (?, ?, ?)`);
			for (let j = 0; j < words.length; j++) {
				vocabInsert.run(i, j, words[j]);
			}
			vocabInsert.finalize();
		}
	});
	db.run(`commit`);

	// table containing each vocab item studied by some user, storing the SRS
	// stage and when the next review will be
	db.run(`create table if not exists vocab_status (
		user text not null,
		vocab text not null,
		srs_stage integer,
		next_review integer,
		primary key (user, vocab)
	)`);
});

module.exports = db;
