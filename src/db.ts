// Reykunyu's user and session database
import fs from 'fs';
import sqlite3 from 'sqlite3';

import * as dictionary from './dictionary';
import * as output from './output';

const db = new sqlite3.Database('./data/reykunyu.db');

const naviSortAlphabet = " 'aäeéfghiìklmnoprstuvwxyz";

// Compares Na'vi words a and b according to Na'vi ‘sorting rules’ (ä after a, ì
// after i, digraphs sorted as if they were two letters using English spelling,
// tìftang is sorted before everything else). A non-zero i specifies that the
// first i characters of both strings are to be ignored. Returns a negative
// value if a < b, a positive value if a > b, or 0 if a == b.
function compareNaviWords(a: string, b: string, i: number): number {
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
	// tables storing the courses and lessons
	// (we regenerate these from courses.json on each Reykunyu startup)
	db.run(`drop table if exists course`);
	db.run(`drop table if exists lesson`);
	db.run(`drop table if exists vocab_in_lesson`);
	db.run(`create table course (
		id integer primary key,
		name text not null,
		description text not null
	)`);
	db.run(`create table lesson (
		course_id integer,
		id integer,
		name text not null,
		introduction text,
		conclusion text,
		primary key (course_id, id),
		foreign key (course_id) references course(id)
	)`);
	db.run(`create table vocab_in_lesson (
		course_id integer,
		lesson_id integer,
		order_in_lesson integer,
		vocab integer,
		comment string,
		primary key (course_id, lesson_id, order_in_lesson),
		foreign key (course_id, lesson_id) references lesson(course_id, id)
	)`);
	db.run(`begin transaction`);
	db.parallelize(() => {
		let coursesData: any = {};
		try {
			coursesData = JSON.parse(fs.readFileSync('./data/courses.json', 'utf8'));
		} catch (e) {
			output.warning('Courses data not found');
			output.hint(`Reykunyu uses a JSON file called courses.json that contains courses
for the vocab study tool. This file does not seem to be present. This
warning is harmless, but the vocab study tool won't work.`);
		}
		for (let i = 0; i < coursesData.length; i++) {
			const course = coursesData[i];
			db.run(`insert into course values (?, ?, ?)`, i, course['name'], course['description']);
			preprocessLessons(course);
			const lessons = course['lessons'];
			for (let j = 0; j < lessons.length; j++) {
				const lesson = lessons[j];
				db.run(`insert into lesson values (?, ?, ?, ?, ?)`,
					i, j, lesson['name'], lesson['introduction'], lesson['conclusion']);
				
				const vocabInsert = db.prepare(`insert into vocab_in_lesson values (?, ?, ?, ?, ?)`);
				for (let k = 0; k < lesson['words'].length; k++) {
					vocabInsert.run(i, j, k, lesson['words'][k]['id'], lesson['words'][k]['comment']);
				}
				vocabInsert.finalize();
			}
		}
	});
	db.run(`commit`);

	// table containing each vocab item studied by some user, storing the SRS
	// stage and when the next review will be
	db.run(`create table if not exists vocab_status (
		user text not null,
		vocab integer,
		srs_stage integer,
		next_review integer,
		primary key (user, vocab)
	)`);

	// table containing users
	db.run(`create table if not exists users (
		id integer primary key,
		username text unique not null,
		password_hash blob,
		salt blob,
		is_admin integer
	)`);

	// table containing favorite words for each user
	db.run(`create table if not exists favorite_words (
		user text not null,
		vocab integer,
		primary key (user, vocab)
	)`);
});

function preprocessLessons(course: any): void {
	if (course.hasOwnProperty('rule')) {
		let lessons = [];
		if (course['rule'] === 'all') {
			let words = dictionary.getAll().filter((w: WordData) => w['status'] !== 'unconfirmed' && w['status'] !== 'unofficial')
				.map((w: WordData) => { return { 'id': w['id'] } });
			words.sort((a: { 'id': number }, b: { 'id': number }) => {
				return compareNaviWords(
					dictionary.getById(a['id'])['word_raw']['FN'],
					dictionary.getById(b['id'])['word_raw']['FN'], 0);
			});
			// group into sets of 25 words
			for (let i = 0; i < words.length; i += 25) {
				const end = Math.min(i + 25, words.length);
				lessons.push({
					'name': dictionary.getById(words[i]['id'])['word_raw']['FN'] + ' – ' +
						dictionary.getById(words[end - 1]['id'])['word_raw']['FN'],
					'words': words.slice(i, end)
				});
			}
		}
		course['lessons'] = lessons;
		return;
	}

	for (let lesson of course['lessons']) {
		let words = [];
		if (lesson['words']) {
			words = lesson['words'];
			words = words.map((w: string | { 'word': string, 'comment'?: string }) => {
				if (typeof w === 'string') {
					w = { 'word': w };
				}
				const [word, type] = dictionary.splitWordAndType(w['word']);
				const entry = dictionary.get(word, type, 'FN');
				if (!entry) {
					output.warning('Lesson ' + lesson['name'] + ' refers to non-existing word ' + w['word']);
					process.exit(1);
				}
				return {
					'id': entry['id'],
					'comment': w['comment']
				};
			});
		}
		lesson['words'] = words;
	}
}

export default db;
