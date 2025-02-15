/**
 * Functions to determine if sounds are vowels or consonants.
 *
 * These work on compressed words.
 */

let vowels = ["a", "ä", "e", "i", "ì", "o", "u", "ù"];

export function isVowel(char: string): boolean {
	return vowels.includes(char);
}

let diphthongs = ["1", "2", "3", "4"];

export function isDiphthong(char: string): boolean {
	return diphthongs.includes(char);
}

export function isConsonant(char: string): boolean {
	return !isVowel(char) && !isDiphthong(char);
}

function lastLetter(noun: string): string {
	return noun.slice(-1);
}

export function startsWithVowel(noun: string): boolean {
	return isVowel(noun[0]);
}

export function endsInVowel(noun: string): boolean {
	return isVowel(lastLetter(noun));
}

export function endsInConsonant(noun: string): boolean {
	return isConsonant(lastLetter(noun));
}

