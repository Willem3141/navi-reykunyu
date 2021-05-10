/**
 * Functions to determine if two Na'vi words rhyme.
 */

const convert = require("./convert");
const phonology = require("./phonology");

module.exports = {
	rhymes: rhymes
}

function rhymes(first, second) {
	if (first === second) {
		return false;
	}

	first = convert.compress(first);
	second = convert.compress(second);

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

