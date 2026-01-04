// Reykunyu's user and session database
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/reykunyu.db');

db.serialize(() => {
	// tables storing the courses and lessons (we regenerate these from
	// courses.json on each Reykunyu startup; see zeykerokyu.ts)
	db.run(`create table if not exists course (
		id integer primary key,
		name text not null,
		description text not null
	)`);
	db.run(`create table if not exists lesson (
		course_id integer,
		id integer,
		name text not null,
		introduction text,
		conclusion text,
		primary key (course_id, id),
		foreign key (course_id) references course(id)
	)`);
	db.run(`create table if not exists vocab_in_lesson (
		course_id integer,
		lesson_id integer,
		order_in_lesson integer,
		vocab integer,
		comment string,
		primary key (course_id, lesson_id, order_in_lesson),
		foreign key (course_id, lesson_id) references lesson(course_id, id)
	)`);

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

export default db;
