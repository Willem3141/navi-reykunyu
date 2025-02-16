/**
 * Support for having users store their own custom information about words. In
 * particular, whether the word is a favorite. In the future, also support for
 * custom notes et cetera is planned.
 */

import db from './db';

export async function augmentFromNaviResultWithUserData(user: Express.User, result: FromNaviResult): Promise<void> {
	const favorites = await getUserFavorites(user);
	for (let piece of result) {
		for (let word of piece['sì\'eyng']) {
			if (favorites.includes(word.id)) {
				word.favorite = true;
			}
		}
	}
}

export async function augmentToNaviResultWithUserData(user: Express.User, result: ToNaviResult): Promise<void> {
	const favorites = await getUserFavorites(user);
	for (let word of result) {
		if (favorites.includes(word.id)) {
			word.favorite = true;
		}
	}
}

async function getUserFavorites(user: Express.User): Promise<number[]> {
	return new Promise((fulfill, reject) => {
		db.all(`select vocab from favorite_words
			where user=?`,
			user.username, (err: any, result: Record<'vocab', number>[]) => {
				if (err) {
					reject(err);
				} else {
					fulfill(result.map((v) => v.vocab));
				}
			}
		);
	});
}

/// Marks a word as the user's favorite.
export async function markFavorite(user: Express.User, vocab: number): Promise<void> {
	return new Promise((fulfill, reject) => {
		db.run(`insert into favorite_words
			values (?, ?)
			on conflict do nothing`,
			user.username, vocab, (err: any) => {
				if (err) {
					reject(err);
				} else {
					fulfill();
				}
			}
		);
	});
}

/// Unmarks a word as the user's favorite.
export async function unmarkFavorite(user: Express.User, vocab: number): Promise<void> {
	return new Promise((fulfill, reject) => {
		db.run(`delete from favorite_words
			where user=? and vocab=?`,
			user.username, vocab, (err: any) => {
				if (err) {
					reject(err);
				} else {
					fulfill();
				}
			}
		);
	});
}
