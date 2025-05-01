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

import db from './db';
import * as reykunyu from './reykunyu';

/// Returns (in a callback) a list of available courses.
export async function getCourses(): Promise<Course[]> {
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

export async function getCourse(courseId: number): Promise<Course> {
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
const vocabInLessonCombinedDefinition = `
with vocab_in_lesson_combined as (
	select * from vocab_in_lesson
	union
	select 2, 0, row_number() over (), vocab, ""
		from favorite_words
		where user == ?1
)\n`;

/// Returns a list of available lessons in a course, with statistics for the
/// given user.
export async function getLessons(user: Express.User, courseId: number): Promise<Lesson[]> {
	if (user) {
		return new Promise((fulfill, reject) => {
			db.all(vocabInLessonCombinedDefinition +
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

export async function getLesson(courseId: number, lessonId: number): Promise<Lesson> {
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

/** LearnableItem as it comes out of the database, with a word ID instead of WordData. */
type UnprocessedLearnableItem = { 'vocab': number, 'comment'?: string };

export async function getItemsForLesson(courseId: number, lessonId: number, user: Express.User): Promise<LearnableItem[]> {
	return new Promise((fulfill, reject) => {
		db.all(vocabInLessonCombinedDefinition +
			`select v.vocab, v.comment from vocab_in_lesson_combined v
				where v.course_id == ?2 and v.lesson_id == ?3
			`, user.username, courseId, lessonId, (err: Error | null, items: UnprocessedLearnableItem[]) => {
				if (err) {
					reject(err);
				}
				fulfill(vocabIDsToWordData(items));
			}
		);
	});
}

function vocabIDsToWordData(items: UnprocessedLearnableItem[]): LearnableItem[] {
	let result: LearnableItem[] = [];
	for (let item of items) {
		try {
			let resultItem: LearnableItem = { 
				'vocab': reykunyu.getWord(item['vocab'])
			};
			if (item['comment']) {
				resultItem['comment'] = item['comment'];
			}
			result.push(resultItem);
		} catch (err){
			console.log(err);
		}
	}
	return result;
}

export async function getLearnableItemsForLesson(courseId: number, lessonId: number, user: Express.User): Promise<LearnableItem[]> {
	return new Promise((fulfill, reject) => {
		db.all(vocabInLessonCombinedDefinition +
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
				fulfill(vocabIDsToWordData(items));
			}
		);
	});
}

export async function getReviewableItems(user: Express.User): Promise<LearnableItem[]> {
	return new Promise((fulfill, reject) => {
		db.all(vocabInLessonCombinedDefinition +
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
				fulfill(vocabIDsToWordData(items));
			}
		);
	});
}

export async function getReviewableCount(user: Express.User): Promise<number> {
	return new Promise((fulfill, reject) => {
		db.get(vocabInLessonCombinedDefinition +
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

export async function getReviewableItemsForCourse(courseId: number, user: Express.User): Promise<LearnableItem[]> {
	return new Promise((fulfill, reject) => {
		db.all(vocabInLessonCombinedDefinition +
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
				fulfill(vocabIDsToWordData(items));
			}
		);
	});
}

export async function getReviewableCountForCourse(courseId: number, user: Express.User): Promise<number> {
	return new Promise((fulfill, reject) => {
		db.get(vocabInLessonCombinedDefinition +
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

export async function getReviewableItemsForLesson(courseId: number, lessonId: number, user: Express.User): Promise<LearnableItem[]> {
	return new Promise((fulfill, reject) => {
		db.all(vocabInLessonCombinedDefinition +
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
				fulfill(vocabIDsToWordData(items));
			}
		);
	});
}

export async function getReviewableCountForLesson(courseId: number, lessonId: number, user: Express.User): Promise<number> {
	return new Promise((fulfill, reject) => {
		db.get(vocabInLessonCombinedDefinition +
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
export async function processCorrectAnswer(user: Express.User, vocab: number): Promise<void> {
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
					const newStage = Math.min(stage + 1, intervalDuration.length - 1);
					db.run(`update vocab_status
						set (srs_stage, next_review) = (?1, datetime(current_timestamp, "+" || ?2))
						where user == ?3
							and vocab == ?4`,
						newStage, intervalDuration[newStage], user.username, vocab, (err: any) => {
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
export async function processIncorrectAnswer(user: Express.User, vocab: number): Promise<void> {
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
						newStage, intervalDuration[newStage], user.username, vocab, (err: any) => {
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
export async function deleteVocab( table:string, vocab:number): Promise<void> {
	const tables = ['vocab_status','favorite_words'];
	if ( !tables.includes(table) ){
		throw(`deleteVocab: illegal table ${table}. Should be one of ${tables}`);
	}
	const cmd = `delete from ${table} where vocab = ${vocab}`;
	return new Promise((fulfill, reject) => {
		db.run(cmd, (err: any) => {
			if (err) {
				reject(err);
			} else {
				fulfill();
			}
		});
	});
}

/// Increases the SRS stage for an item to the maximum level, *and* schedules it
/// for immediate review. Can be called only for items that are not yet in the
/// database.
export async function processKnownAnswer(user: Express.User, vocab: number): Promise<void> {
	return new Promise((fulfill, reject) => {
		db.run(`insert into vocab_status
			values (?1, ?2, ?3, current_timestamp)`,
			user.username, vocab, intervalDuration.length - 1, (err: any) => {
				if (err) {
					reject(err);
				} else {
					fulfill();
				}
			}
		);
	});
}
