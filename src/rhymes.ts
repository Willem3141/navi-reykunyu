/**
 * Functions to determine if two Na'vi words rhyme.
 */

import * as convert from "./convert";
import * as phonology from "./phonology";

export function rhymes(first: string, second: string): boolean {
	if (first === second) {
		return false;
	}

	first = convert.compress(first).replace('u', 'ù');
	second = convert.compress(second).replace('u', 'ù');

	// find last vowel of first
	const n = first.length;
	let lastVowel = null;
	for (let i = 0; i < first.length; i++) {
		if (phonology.isVowel(first[n - i - 1]) ||
				phonology.isDiphthong(first[n - i - 1])) {
			lastVowel = i;
			break;
		}
	}
	if (lastVowel === null) {
		return false;
	}

	// then check if first and second are identical until the last vowel
	const m = second.length;
	for (let i = 0; i <= lastVowel; i++) {
		if (first[n - i - 1] !== second[m - i - 1]) {
			return false;
		}
	}

	return true;
}

