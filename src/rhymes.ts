/**
 * Functions to determine if two Na'vi words rhyme.
 */

import * as phonology from "./phonology";

export function rhymeEnding(word: string): string {
	if (word.length === 0) {
		return '';
	}

	// ignore é and ù
	word = word.replace('é', 'e');
	word = word.replace('ù', 'u');

	let ending = '';
	while (word.length > 0 && !phonology.endsInVowel(word)) {
		ending = word[word.length - 1] + ending;
		word = word.substring(0, word.length - 1);
	}
	ending = word[word.length - 1] + ending;
	return ending;
}

export function rhymes(first: string, second: string): boolean {
	return rhymeEnding(first) === rhymeEnding(second);
}

