/**
 * Functions to determine if sounds are vowels or consonants.
 *
 * These work on compressed words.
 */

module.exports = {
	isVowel: isVowel,
	isConsonant: isConsonant,
	isDiphthong: isDiphthong,
	endsInVowel: endsInVowel,
	endsInConsonant: endsInConsonant
}

let vowels = ["a", "ä", "e", "i", "ì", "o", "u"];

function isVowel(char) {
	return vowels.includes(char);
}

let diphthongs = ["1", "2", "3", "4"];

function isDiphthong(char) {
	return diphthongs.includes(char);
}

function isConsonant(char) {
	return !isVowel(char) && !isDiphthong(char);
}

function lastLetter(noun) {
	return noun.slice(-1);
}

function endsInVowel(noun) {
	return isVowel(lastLetter(noun));
}

function endsInConsonant(noun) {
	return isConsonant(lastLetter(noun));
}

