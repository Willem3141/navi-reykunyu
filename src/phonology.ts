/**
 * Functions that have to do with Na'vi phonology: lenition, reverse lenition,
 * checking for vowels and consonants, et cetera.
 */

const vowels = ["a", "ä", "e", "i", "ì", "o", "u", "ù"];
const diphthongs = ["aw", "ay", "ew", "ey"];

export function isVowel(char: string): boolean {
	return vowels.includes(char);
}

export function isDiphthong(char: string): boolean {
	return diphthongs.includes(char);
}

export function isConsonant(char: string): boolean {
	return !isVowel(char) && !isDiphthong(char);
}

export function startsWithVowel(noun: string): boolean {
	return isVowel(noun[0]) && !startsWithDiphthong(noun);
}

export function startsWithDiphthong(noun: string): boolean {
	return isDiphthong(noun.substring(0, 2));
}

export function startsWithConsonant(noun: string): boolean {
	return !isVowel(noun[0]);
}

export function endsInVowel(noun: string): boolean {
	return isVowel(noun.slice(-1));
}

export function endsInDiphthong(noun: string): boolean {
	return isDiphthong(noun.slice(-2));
}

export function endsInConsonant(noun: string): boolean {
	return !endsInVowel(noun) && !endsInDiphthong(noun);
}

const lenitions: Record<string, string> = {
	"ts": "s",
	"t": "s",
	"p": "f",
	"k": "h",
	"tx": "t",
	"px": "p",
	"kx": "k",
	"d": "t",
	"b": "p",
	"g": "k",
	"'": ""
};

/**
 * Returns the lenited form of the given word. The return value is an array
 * containing first the actually lenited first consonant, and second the
 * (unchanged) rest of the word. If the given word is not lenitable, the first
 * element of the return value is an empty string, while the second element is
 * simply the entire word.
 */
export function lenite(word: string): [string, string] {
	// 'rr and 'll are not lenited, since rr and ll cannot start a syllable
	if (word.substring(0, 3) === "'ll" || word.substring(0, 3) === "'rr") {
		return ["", word];
	}

	if (word.substring(0, 2) in lenitions) {
		return [lenitions[word.substring(0, 2)], word.slice(2)];
	}
	if (word[0] in lenitions) {
		return [lenitions[word[0]], word.slice(1)];
	}

	return ["", word];
}
