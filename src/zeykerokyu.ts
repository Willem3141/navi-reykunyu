/**
 * Zeykerokyu is Reykunyu's module for managing SRS items. It has a number of
 * lessons, which are just subsets of words to learn, and may potentially
 * overlap each other. Furthermore it maintains in a database which words are
 * already known by which user.
 */

import db from './db';

import * as output from './output';
import Reykunyu from './reykunyu';

/** LearnableItem as it comes out of the database, with a word ID instead of WordData. */
type UnprocessedLearnableItem = { 'vocab': number, 'comment'?: string };

export default class Zeykerokyu {
	reykunyu: Reykunyu;

	constructor(coursesJSON: any, reykunyu: Reykunyu) {
		this.reykunyu = reykunyu;
		this.initializeDatabase(coursesJSON);
	}

	/// Truncate the course, lesson, and vocab_in_lesson database tables, and refill
	/// them using the given JSON data.
	private async initializeDatabase(coursesJSON: any) {
		db.serialize(() => {
			db.run(`delete from vocab_in_lesson`);
			db.run(`delete from lesson`);
			db.run(`delete from course`);
			db.run(`begin transaction`);
			for (let i = 0; i < coursesJSON.length; i++) {
				const course = coursesJSON[i];
				db.run(`insert into course values (?, ?, ?)`, i, course['name'], course['description']);
				this.preprocessLessons(course);
				const lessons = course['lessons'];
				for (let j = 0; j < lessons.length; j++) {
					const lesson = lessons[j];
					db.run(`insert into lesson values (?, ?, ?, ?, ?)`,
						i, j, lesson['name'], lesson['introduction'], lesson['conclusion']);
					
					const vocabInsert = db.prepare(`insert into vocab_in_lesson values (?, ?, ?, ?, ?)`);
					for (let k = 0; k < lesson['words'].length; k++) {
						if (lesson['words'][k] !== null) {
							vocabInsert.run(i, j, k, lesson['words'][k]['id'], lesson['words'][k]['comment']);
						}
					}
					vocabInsert.finalize();
				}
			}
			db.run(`commit`);
		});
	}

	private preprocessLessons(course: any): void {
		if (course.hasOwnProperty('rule')) {
			let lessons = [];
			if (course['rule'] === 'all') {
				let words = this.reykunyu.dictionary.getAll()
					.filter((w: WordData) => w['status'] !== 'unconfirmed' && w['status'] !== 'unofficial')
					.map((w: WordData) => { return { 'id': w['id'] } });
				words.sort((a: { 'id': number }, b: { 'id': number }) => {
					return this.compareNaviWords(
						this.reykunyu.dictionary.getById(a['id'])['word_raw']['FN'],
						this.reykunyu.dictionary.getById(b['id'])['word_raw']['FN'], 0);
				});
				// group into sets of 25 words
				for (let i = 0; i < words.length; i += 25) {
					const end = Math.min(i + 25, words.length);
					lessons.push({
						'name': this.reykunyu.dictionary.getById(words[i]['id'])['word_raw']['FN'] + ' – ' +
							this.reykunyu.dictionary.getById(words[end - 1]['id'])['word_raw']['FN'],
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
					const [word, type] = this.reykunyu.dictionary.splitWordAndType(w['word']);
					const entry = this.reykunyu.dictionary.get(word, type, 'FN');
					if (!entry) {
						output.warning('Lesson ' + lesson['name'] + ' refers to non-existing word ' + w['word']);
						return null;
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

	// Compares Na'vi words a and b according to Na'vi ‘sorting rules’ (ä after a, ì
	// after i, digraphs sorted as if they were two letters using English spelling,
	// tìftang is sorted before everything else). A non-zero i specifies that the
	// first i characters of both strings are to be ignored. Returns a negative
	// value if a < b, a positive value if a > b, or 0 if a == b.
	private compareNaviWords(a: string, b: string, i: number): number {
		const naviSortAlphabet = " 'aäeéfghiìklmnoprstuvwxyz";

		if (a.length <= i || b.length <= i) {
			return a.length - b.length;
		}
		const first = a[i].toLowerCase();
		const second = b[i].toLowerCase();
		if (first == second) {
			return this.compareNaviWords(a, b, i + 1);
		}
		return naviSortAlphabet.indexOf(first) - naviSortAlphabet.indexOf(second);
	}

	/// Returns (in a callback) a list of available courses.
	async getCourses(): Promise<Course[]> {
		return new Promise((fulfill, reject) => {
			db.all(`select c.id, c.name, c.description,
				(select count() from lesson l where l.course_id == c.id) as lesson_count
			from course c`, (err, courses: Course[]) => {
				if (err) {
					reject(err);
				}
				fulfill(courses);
			});
		});
	}

	async getCourse(courseId: number): Promise<Course> {
		return new Promise((fulfill, reject) => {
			db.get(`select id, name, description
			from course
			where id == ?1`, courseId, (err, course: Course) => {
				if (err) {
					reject(err);
				}
				fulfill(course);
			});
		});
	}

	/// SQL fragment that defines vocab_in_lesson_combined as vocab_in_lesson,
	/// which is assumed not to have any entries for the Your Favorites course,
	/// with these entries for the current user (assumed to be in ?1).
	readonly vocabInLessonCombinedDefinition = `
	with vocab_in_lesson_combined as (
		select * from vocab_in_lesson
		union
		select 2, 0, row_number() over (), vocab, ""
			from favorite_words
			where user == ?1
	)\n`;

	/// Returns a list of available lessons in a course, with statistics for the
	/// given user.
	async getLessons(user: Express.User, courseId: number): Promise<Lesson[]> {
		if (user) {
			return new Promise((fulfill, reject) => {
				db.all(this.vocabInLessonCombinedDefinition +
					`select l.id, l.name, l.introduction, l.conclusion,
						(select count() from vocab_in_lesson_combined v
							where l.course_id == v.course_id and l.id == v.lesson_id) as total_count,
						(select count() from vocab_in_lesson_combined v, vocab_status s
							where l.course_id == v.course_id and l.id == v.lesson_id
							and v.vocab == s.vocab and s.user == ?1) as known_count,
						(select count() from vocab_in_lesson_combined v, vocab_status s
							where l.course_id == v.course_id and l.id == v.lesson_id
							and v.vocab == s.vocab and s.user == ?1 and s.next_review <= current_timestamp) as reviewable_count
						from lesson l
						where l.course_id = ?2
					`, user.username, courseId, (err: Error | null, lessons: Lesson[]) => {
					if (err) {
						reject(err);
					}
					fulfill(lessons);
				});
			});

		} else {
			return new Promise((fulfill, reject) => {
				db.all(`select l.id, l.name, l.description,
					(select count() from vocab_in_lesson v where l.id == v.lesson_id) as total_count,
				from lesson l
				where l.course_id = ?1`, courseId, (err, lessons: Lesson[]) => {
					if (err) {
						reject(err);
					}
					fulfill(lessons);
				});
			});
		}
	}

	async getLesson(courseId: number, lessonId: number): Promise<Lesson> {
		return new Promise((fulfill, reject) => {
			db.get(`select course_id, id, name, introduction, conclusion
			from lesson
			where course_id == ?1 and id == ?2`, courseId, lessonId, (err: Error | null, lesson: Lesson) => {
				if (err) {
					reject(err);
				}
				fulfill(lesson);
			});
		});
	}

	async getItemsForLesson(courseId: number, lessonId: number, user: Express.User): Promise<LearnableItem[]> {
		return new Promise((fulfill, reject) => {
			db.all(this.vocabInLessonCombinedDefinition +
				`select v.vocab, v.comment from vocab_in_lesson_combined v
					where v.course_id == ?2 and v.lesson_id == ?3
				`, user.username, courseId, lessonId, (err: Error | null, items: UnprocessedLearnableItem[]) => {
					if (err) {
						reject(err);
					}
					fulfill(this.vocabIDsToWordData(items));
				}
			);
		});
	}

	private vocabIDsToWordData(items: UnprocessedLearnableItem[]): LearnableItem[] {
		let result: LearnableItem[] = [];
		for (let item of items) {
			let resultItem: LearnableItem = { 
				'vocab': this.reykunyu.getWord(item['vocab'])
			};
			if (item['comment']) {
				resultItem['comment'] = item['comment'];
			}
			result.push(resultItem);
		}
		return result;
	}

	async getLearnableItemsForLesson(courseId: number, lessonId: number, user: Express.User): Promise<LearnableItem[]> {
		return new Promise((fulfill, reject) => {
			db.all(this.vocabInLessonCombinedDefinition +
				`select v.vocab, v.comment from vocab_in_lesson_combined v
					where v.course_id == ?2 and v.lesson_id == ?3
						and v.vocab not in (
							select vocab
							from vocab_status
							where user == ?1
						)
				`, user.username, courseId, lessonId, (err: Error | null, items: UnprocessedLearnableItem[]) => {
					if (err) {
						reject(err);
					}
					fulfill(this.vocabIDsToWordData(items));
				}
			);
		});
	}

	async getReviewableItems(user: Express.User): Promise<LearnableItem[]> {
		return new Promise((fulfill, reject) => {
			db.all(this.vocabInLessonCombinedDefinition +
				`select distinct v.vocab
					from vocab_status s, vocab_in_lesson_combined v
					where s.user == ?1
						and s.next_review <= current_timestamp
						and v.vocab == s.vocab
					order by random()
				`, user.username, (err: Error | null, items: UnprocessedLearnableItem[]) => {
					if (err) {
						reject(err);
					}
					fulfill(this.vocabIDsToWordData(items));
				}
			);
		});
	}

	async getReviewableCount(user: Express.User): Promise<number> {
		return new Promise((fulfill, reject) => {
			db.get(this.vocabInLessonCombinedDefinition +
				`select count(distinct v.vocab)
					from vocab_status s, vocab_in_lesson_combined v
					where s.user == ?1
						and s.next_review <= current_timestamp
						and v.vocab == s.vocab
				`, user.username, (err, result: Record<'count(distinct v.vocab)', number>) => {
					if (err) {
						reject(err);
					}
					fulfill(result['count(distinct v.vocab)']);
				}
			);
		});
	}

	async getReviewableItemsForCourse(courseId: number, user: Express.User): Promise<LearnableItem[]> {
		return new Promise((fulfill, reject) => {
			db.all(this.vocabInLessonCombinedDefinition +
				`select distinct v.vocab
					from vocab_status s, vocab_in_lesson_combined v
					where s.user == ?1
						and s.next_review <= current_timestamp
						and v.vocab == s.vocab
						and v.course_id == ?2
					order by random()
				`, user.username, courseId, (err: Error | null, items: UnprocessedLearnableItem[]) => {
					if (err) {
						reject(err);
					}
					fulfill(this.vocabIDsToWordData(items));
				}
			);
		});
	}

	async getReviewableCountForCourse(courseId: number, user: Express.User): Promise<number> {
		return new Promise((fulfill, reject) => {
			db.get(this.vocabInLessonCombinedDefinition +
				`select count(distinct v.vocab)
					from vocab_status s, vocab_in_lesson_combined v
					where s.user == ?1
						and s.next_review <= current_timestamp
						and v.vocab == s.vocab
						and v.course_id == ?2
				`, user.username, courseId, (err: Error | null, result: Record<'count(distinct v.vocab)', number>) => {
					if (err) {
						reject(err);
					}
					fulfill(result['count(distinct v.vocab)']);
				}
			);
		});
	}

	async getReviewableItemsForLesson(courseId: number, lessonId: number, user: Express.User): Promise<LearnableItem[]> {
		return new Promise((fulfill, reject) => {
			db.all(this.vocabInLessonCombinedDefinition +
				`select distinct v.vocab
					from vocab_status s, vocab_in_lesson_combined v
					where s.user == ?1
						and s.next_review <= current_timestamp
						and v.vocab == s.vocab
						and v.course_id == ?2 and v.lesson_id == ?3
					order by random()
				`, user.username, courseId, lessonId, (err: Error | null, items: UnprocessedLearnableItem[]) => {
					if (err) {
						reject(err);
					}
					fulfill(this.vocabIDsToWordData(items));
				}
			);
		});
	}

	async getReviewableCountForLesson(courseId: number, lessonId: number, user: Express.User): Promise<number> {
		return new Promise((fulfill, reject) => {
			db.get(this.vocabInLessonCombinedDefinition +
				`select count(distinct v.vocab)
					from vocab_status s, vocab_in_lesson_combined v
					where s.user == ?1
						and s.next_review <= current_timestamp
						and v.vocab == s.vocab
						and v.course_id == ?2 and v.lesson_id == ?3
				`, user.username, courseId, lessonId, (err: Error | null, result: Record<'count(distinct v.vocab)', number>) => {
					if (err) {
						reject(err);
					}
					fulfill(result['count(distinct v.vocab)']);
				}
			);
		});
	}

	/// If an item is put into stage i, then its next review should be scheduled
	/// after time intervalDuration[i].
	readonly intervalDuration = [
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
	async processCorrectAnswer(user: Express.User, vocab: number): Promise<void> {
		return new Promise((fulfill, reject) => {
			// get current SRS stage
			db.get(`select srs_stage from vocab_status
				where user == ?1
					and vocab == ?2`,
				user.username, vocab, (err: any, result: Record<'srs_stage', number>) => {
					if (err) {
						reject(err);
					} else if (!result) {
						// if not in database (= stage 0), insert it
						db.run(`insert into vocab_status
							values (?1, ?2, 1, current_timestamp)`,
							user.username, vocab, (err: any) => {
								if (err) {
									reject(err);
								} else {
									fulfill();
								}
							}
						);
					} else {
						// otherwise update the SRS stage and next review time in the
						// database
						const stage = result['srs_stage'];
						const newStage = Math.min(stage + 1, this.intervalDuration.length - 1);
						db.run(`update vocab_status
							set (srs_stage, next_review) = (?1, datetime(current_timestamp, "+" || ?2))
							where user == ?3
								and vocab == ?4`,
							newStage, this.intervalDuration[newStage], user.username, vocab, (err: any) => {
								if (err) {
									reject(err);
								} else {
									fulfill();
								}
							}
						);
					}
				}
			);
		});
	}

	/// Decreases the SRS stage for an item and schedules the next review for the
	/// item. Can be called only for vocab whose status is already stored in the
	/// database, i.e., not for newly learned items.
	async processIncorrectAnswer(user: Express.User, vocab: number): Promise<void> {
		return new Promise((fulfill, reject) => {
			// get current SRS stage
			db.get(`select srs_stage from vocab_status
				where user == ?1
					and vocab == ?2`,
				user.username, vocab, (err: any, result: Record<'srs_stage', number>) => {
					if (err) {
						reject(err);
					} else if (!result) {
						reject('Tried to decrease SRS level for [' + vocab + '] which is not in the database');
					} else {
						// otherwise update the SRS stage and next review time in the
						// database
						let stage = result['srs_stage'];
						const newStage = 1;
						db.run(`update vocab_status
							set (srs_stage, next_review) = (?1, datetime(current_timestamp, "+" || ?2))
							where user == ?3
								and vocab == ?4`,
							newStage, this.intervalDuration[newStage], user.username, vocab, (err: any) => {
								if (err) {
									reject(err);
								} else {
									fulfill();
								}
							}
						);
					}
				}
			);
		});
	}

	/// Increases the SRS stage for an item to the maximum level, *and* schedules it
	/// for immediate review. Can be called only for items that are not yet in the
	/// database.
	async processKnownAnswer(user: Express.User, vocab: number): Promise<void> {
		return new Promise((fulfill, reject) => {
			db.run(`insert into vocab_status
				values (?1, ?2, ?3, current_timestamp)`,
				user.username, vocab, this.intervalDuration.length - 1, (err: any) => {
					if (err) {
						reject(err);
					} else {
						fulfill();
					}
				}
			);
		});
	}
}
