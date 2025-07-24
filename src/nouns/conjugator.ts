/**
 * Functions to conjugate Na'vi nouns.
 *
 * A conjugated Na'vi noun has the following parts (which are all optional,
 * except of course the stem):
 *
 *  0. determiner prefix: "fì", "tsa", "pe", "fra"
 *  1. plural prefix: "me", "pxe", "ay", "(ay)"
 *  2. stem prefix: "fne"
 *     stem
 *  3. stem suffix: "tsyìp", "fkeyk"
 *  4. determiner suffix: "pe", "o"
 *  5. case suffix: "l", "t", "r", "ä", "ri", (any adposition)
 *  6. final suffix: "sì", "to"
 *
 * Here pe- (from 0) cannot be combined with -pe (from 4). The other
 * combinations should in theory all be possible, so you could make monster
 * words like
 *
 * pepefneutraltsyìpftusì
 * = utral + ["pe", "pxe", "fne", "tsyìp", "", "ftu", "sì"]
 * = "and from which three types of little trees"
 *
 * Some combinations may not make sense in practice, and in fact, the rules
 * about which combinations are allowed or not are not completely clear.
 *
 * The conjugate function takes a stem and an array with 7 elements, like the
 * one above, and returns the conjugated form. The conjugated form is not just
 * a single string, because there may be several possibilities for 2 and 6.
 * Therefore in fact we return an array with 9 arrays which represent the
 * possibilities for each part:
 *
 *  0. determiner prefix
 *  1. plural prefix
 *  2. stem prefix
 *  3. lenited consonant of the stem
 *  4. rest of the stem
 *  5. stem suffix
 *  6. determiner suffix
 *  7. case suffix
 *  8. final suffix
 *
 * (We separate the lenited consonant of the stem so that we can nicely
 * highlight it in the interface.)
 */

import { lenite, lower, startsWithVowel, endsInVowel, endsInConsonant } from "../phonology";

type Prefix = { text: string, lenites: boolean, optionalIfLenitable?: boolean };
type Suffix = { text: string, dropCount?: number };

type CaseFunction = (stem: string, dialect: Dialect, isLoanword?: boolean) => Suffix;

const caseFunctions: { [suffix: string]: CaseFunction } = {
	"": subjectiveSuffix,
	"l": agentiveSuffix,
	"t": patientiveSuffix,
	"r": dativeSuffix,
	"ä": genitiveSuffix,
	"ri": topicalSuffix
};

/**
 * Conjugates a noun. Returns a conjugation string with nine parts.
 *
 * noun - the noun stem
 * affixes - an array with seven affixes to be applied to the stem, as detailed
 *           above
 */
export function conjugate(noun: string, affixes: string[], dialect: Dialect, isLoanword?: boolean): string {

	noun = noun.replace(/[-\[\]]/g, '').replaceAll('/', '');

	// Apply the prefixes from inside out.
	noun = applyPrefix(noun, { text: affixes[2], lenites: false });
	noun = applyPrefix(noun, findDeterminerAndPluralPrefix(affixes[0], affixes[1]));

	// Apply the suffixes from inside out.
	noun = applySuffix(noun, { text: affixes[3] });
	noun = applySuffix(noun, { text: affixes[4] });
	if (caseFunctions.hasOwnProperty(affixes[5])) {
		noun = applySuffix(noun, caseFunctions[affixes[5]](noun, dialect, isLoanword));
	} else {
		noun = applySuffix(noun, { text: affixes[5] });
	}
	noun = applySuffix(noun, { text: affixes[6] });

	return noun;
}

export function conjugateSimple(noun: string, pluralPrefix: string, caseSuffix: string, dialect: Dialect, isLoanword?: boolean) {
	let conjugation = conjugate(noun, ['', pluralPrefix, '', '','', caseSuffix, ''], dialect, isLoanword);
	if (pluralPrefix === '') {
		conjugation = '-' + conjugation;
	} else {
		let conjugationPieces = conjugation.split('-');
		const [lenitedConsonant, _] = lenite(noun);
		if (lenitedConsonant) {
			conjugationPieces[1] = '{' + conjugationPieces[1].substring(0, lenitedConsonant.length) + '}' +
				conjugationPieces[1].substring(lenitedConsonant.length);
		}
		conjugation = conjugationPieces.join('-');
	}
	if (caseSuffix === '') {
		conjugation = conjugation + '-';
	}
	return conjugation;
}

function subjectiveSuffix(noun: string): Suffix {
	return { text: '' };
}

function agentiveSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): Suffix {
	if (isLoanword && noun.endsWith('ì')) {
		return { text: 'ìl', dropCount: 1 };
	}
	if (endsInVowel(noun)) {
		return { text: 'l' };
	} else {
		return { text: 'ìl' };
	}
}

function patientiveSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): Suffix {
	if (isLoanword && noun.endsWith('ì')) {
		// If the loanword ends in -fì, -sì, or -tsì, then phonologically we can
		// replace the -ì by -ti.
		if (['f', 's'].includes(noun[noun.length - 2])) {
			return { text: 'it/ti', dropCount: 1 };
		} else {
			return { text: 'it', dropCount: 1 };
		}
	}
	if (endsInVowel(noun)) {
		return { text: 't(i)' };
	} else {
		if (endsInConsonant(noun)) {
			return { text: 'it/ti' };
		} else {
			if (noun.endsWith('ay')) {
				return { text: 'it/t(i)' };
			} else if (noun.endsWith('ey')) {
				return { text: 't(i)' };
			} else {
				return { text: 'it/ti' };
			}
		}
	}
}

function dativeSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): Suffix {
	if (isLoanword && noun.endsWith('ì')) {
		return { text: 'ur', dropCount: 1 };
	}
	if (endsInVowel(noun)) {
		return { text: 'r(u)' };
	} else {
		if (endsInConsonant(noun)) {
			if (noun.endsWith('\'')) {
				return { text: 'ur/ru' };
			} else {
				return { text: 'ur' };
			}
		} else {
			if (noun.endsWith('aw')) {
				return { text: 'ur/r(u)' };
			} else if (noun.endsWith('ew')) {
				return { text: 'r(u)' };
			} else {
				return { text: 'ur/ru' };
			}
		}
	}
}

function genitiveSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): Suffix {
	if (isLoanword && noun.endsWith('ì')) {
		return { text: 'ä', dropCount: 1 };
	}
	if (endsInVowel(noun)) {
		if (noun.slice(-1) === "o" || noun.slice(-1) === "u") {
			return { text: 'ä' };
		} else {
			if (noun.slice(-2) === "ia") {
				return { text: 'ä', dropCount: 1 };
			} else {
				if (noun.toLowerCase() === "omatikaya") {
					return { text: 'ä' };
				} else {
					return { text: 'yä' };
				}
			}
		}
	} else {
		return { text: 'ä' };
	}
}

function topicalSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): Suffix {
	if (isLoanword && noun.endsWith('ì')) {
		return { text: 'ìri', dropCount: 1 };
	}
	if (endsInConsonant(noun)) {
		return { text: 'ìri' };
	} else {
		return { text: 'ri' };
	}
}

function findDeterminerAndPluralPrefix(determinerPrefix: string, pluralPrefix: string): Prefix {
	let prefixes = [
		['', 'me+', 'pxe+', 'ay+'],
		['fì', 'fìme+', 'fìpxe+', 'f(ì)ay+'],
		['tsa', 'tsame+', 'tsapxe+', 'tsay+'],
		['pe+', 'peme+', 'pepe+', 'pay+'],
		['fra', 'frame+', 'frapxe+', 'fray+'],
	];
	let determinerIndex = ['', 'fì', 'tsa', 'pe', 'fra'].indexOf(determinerPrefix);
	let pluralIndex = ['', 'me', 'pxe', 'ay'].indexOf(pluralPrefix);
	if (determinerIndex === -1) {
		throw new Error('Trying to conjugate a noun with invalid determiner prefix ' + determinerPrefix);
	}
	if (pluralIndex === -1) {
		throw new Error('Trying to conjugate a noun with invalid plural prefix ' + pluralPrefix);
	}
	let prefix = prefixes[determinerIndex][pluralIndex];
	if (prefix === 'ay+') {
		return { text: 'ay', lenites: true, optionalIfLenitable: true };
	} else if (prefix.endsWith('+')) {
		return { text: prefix.substring(0, prefix.length - 1), lenites: true };
	} else {
		return { text: prefix, lenites: false };
	}
}

function applyPrefix(noun: string, prefix: Prefix): string {
	let optional = false;
	if (prefix.lenites) {
		let lenited = lenite(noun).join('');
		if (prefix.optionalIfLenitable && noun !== lenited && noun !== '\'u') {
			optional = true;
		}
		noun = lenited;
	}
	if (endsInVowel(prefix.text) && noun.length > 0 && prefix.text[prefix.text.length - 1] === noun[0].toLowerCase()) {
		// TODO don't do this for RN
		prefix.text = prefix.text.substring(0, prefix.text.length - 1);
	}
	if (prefix.text === '') {
		return noun;
	}
	if (optional) {
		prefix.text = '(' + prefix.text + ')';
	}
	return prefix.text + '-' + noun;
}

function applySuffix(noun: string, suffix: Suffix): string {
	if (suffix.dropCount) {
		noun = noun.substring(0, noun.length - suffix.dropCount);
	}
	if (suffix.text === '') {
		return noun;
	}
	return noun + '-' + suffix.text;
}

let voicings: Record<string, string> = {
	"t": "d",
	"p": "b",
	"k": "g",
};

function voice(word: string): [string, string] {
	if (word[word.length - 1] !== 'x' || !(word[word.length - 2] in voicings)) {
		return [word, ''];
	}

	return [word.substring(0, word.length - 2), voicings[word[word.length - 2]]];
}
