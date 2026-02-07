/*
 * Functions that have to do with Na'vi phonology: lenition, reverse lenition,
 * checking for vowels and consonants, et cetera.
 *
 * Reykunyu represents syllable splits with slashes, and encloses the stressed
 * syllable in brackets, like in [ta]/ron/yu or so/le/i/[a]. Single-syllable
 * words don't get stressed syllable brackets.
 */

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

class Syllable {
	text: string;
	stressed: boolean;

	constructor(text: string, stressed: boolean) {
		this.text = text;
		this.stressed = stressed;
	}

	startsWith(text: string): boolean {
		return this.text.startsWith(text);
	}

	endsWith(text: string): boolean {
		return this.text.endsWith(text);
	}

	lenited(): Syllable {
		let result = new Syllable(this.text, this.stressed);

		if (!this.isLenitable()) {
			return result;

		} else if (lower(this.text.substring(0, 2)) in lenitions) {
			result.text = lenitions[lower(this.text.substring(0, 2))] + this.text.slice(2);

		} else if (lower(this.text[0]) in lenitions) {
			result.text = lenitions[lower(this.text[0])] + this.text.slice(1);
		}

		// preserve initial uppercase letter
		if (this.text[0] !== lower(this.text[0])) {
			result.text = result.text[0].toUpperCase() + result.text.slice(1);
		}

		return result;
	}

	isLenitable(): boolean {
		if (lower(this.text.substring(0, 3)) === "'ll" ||
			lower(this.text.substring(0, 3)) === "'rr") {
			// 'rr and 'll are not lenited, since rr and ll cannot start a syllable
			return false;

		} else if (lower(this.text.substring(0, 2)) in lenitions) {
			return true;

		} else if (lower(this.text[0]) in lenitions) {
			return true;

		} else {
			return false;
		}
	}
}

export class Word {
	private syllables: Syllable[];

	constructor(word: string) {
		this.syllables = word.split('/').map((s) => {
			if (s.startsWith('[') && s.endsWith(']')) {
				return new Syllable(s.substring(1, s.length - 1), true);
			} else {
				return new Syllable(s, false);
			}
		});
		if (this.syllables.length === 1) {
			this.syllables[0].stressed = true;
		}
	}

	toString(): string {
		return this.syllables.map((s) => {
			if (s.stressed && this.syllables.length > 1) {
				return '[' + s.text + ']';
			} else {
				return s.text;
			}
		}).join('/');
	}

	toRawString(): string {
		return this.syllables.map((s) => {
			return s.text;
		}).join('');
	}

	firstSyllable(): Syllable {
		return this.syllables[0];
	}

	lastSyllable(): Syllable {
		return this.syllables[this.syllables.length - 1];
	}

	startsWithVowel(): boolean {
		return isVowel(this.firstSyllable().text[0]) && !this.startsWithDiphthong();
	}

	startsWithDiphthong(): boolean {
		return this.firstSyllable().text.length >= 2 &&
			isDiphthong(this.firstSyllable().text.substring(0, 2));
	}

	startsWithConsonant(): boolean {
		return !isVowel(this.firstSyllable().text[0]);
	}

	endsWithVowel(): boolean {
		return isVowel(this.lastSyllable().text.slice(-1));
	}

	endsWithDiphthong(): boolean {
		return this.lastSyllable().text.length >= 2 &&
			isDiphthong(this.lastSyllable().text.slice(-2));
	}

	endsWithConsonant(): boolean {
		return !this.endsWithVowel() && !this.endsWithDiphthong();
	}

	startsWith(text: string): boolean {
		return this.toRawString().startsWith(text);
	}

	endsWith(text: string): boolean {
		return this.toRawString().endsWith(text);
	}

	private clone(): Word {
		return new Word(this.toString());
	}

	unstressed(): Word {
		let result = this.clone();
		for (let syllable of result.syllables) {
			syllable.stressed = false;
		}
		return result;
	}

	addPrefix(prefix: string, mergeVowelsIfEqual?: boolean): Word {
		if (prefix === '') {
			return this;
		}
		let prefixWord = new Word(prefix).unstressed();
		let result = this.clone();

		if (mergeVowelsIfEqual && prefixWord.endsWithVowel() &&
			lower(prefixWord.lastSyllable().text[prefixWord.lastSyllable().text.length - 1]) === lower(this.firstSyllable().text[0])) {
			result.syllables[0].text =
				prefixWord.lastSyllable().text.substring(0, prefixWord.lastSyllable().text.length - 1) +
				result.syllables[0].text;  // TODO blegh, what a mess
			result.syllables = prefixWord.syllables.slice(0, -1).concat(result.syllables);
			return result;
		}

		result.syllables = prefixWord.syllables.concat(result.syllables);
		return result;
	}

	addSuffix(suffix: string): Word {
		if (suffix === '') {
			return this;
		}
		return new Word(this.toString() + '/' + suffix.toString());  // TODO handle syllables
	}

	removeLastLetter(): Word {
		let result = this.clone();
		result.lastSyllable().text = result.lastSyllable().text.substring(result.lastSyllable().text.length - 1);
		return result;
	}

	lenite(): Word {
		let result = this.clone();
		result.syllables[0] = this.firstSyllable().lenited();
		return result;
	}

	isLenitable(): boolean {
		return this.firstSyllable().isLenitable();
	}
}

/**
 * Lowercases the input and returns the result.
 *
 * If the input is undefined, this returns undefined (as opposed to doing
 * `input.toLowerCase()`, which crashes). This is useful for handling corner
 * cases, e.g. `word[0].toLowerCase()` could crash if `word` is empty, while
 * `lower(word[0])` always works.
 */
export function lower<T extends string | undefined>(word: T): T {
	if (word === undefined) {
		return undefined as T;
	}
	return word.toLowerCase() as T;
}

const vowels = ["a", "ä", "e", "é", "i", "ì", "o", "u", "ù"];

function isVowel(char: string): boolean {
	return vowels.includes(lower(char));
}

const diphthongs = ["aw", "ay", "ew", "ey"];

function isDiphthong(char: string): boolean {
	return diphthongs.includes(lower(char));
}

function isConsonant(char: string): boolean {
	return !isVowel(char) && !isDiphthong(char);
}
