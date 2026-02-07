/**
 * Functions to conjugate Na'vi nouns.
 *
 * A conjugated Na'vi noun has the following parts (which are all optional,
 * except of course the stem):
 *
 *  0. determiner prefix: "fì", "tsa", "pe", "fra"
 *  1. plural prefix: "me", "pxe", "ay", "(ay)"
 *  2. stem prefix: "fne", "munsna"
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
 */

import { Word } from "../phonology";

/**
 * An Affix is a function that takes a word as input and produces a set of
 * result possibilities.
 */
type Affix = (w: Word, dialect?: Dialect, isLoanword?: boolean) => Word[];

function createPrefix(prefix: string) {
	let lenites = false;
	if (prefix.endsWith('+')) {
		prefix = prefix.substring(0, prefix.length - 1);
		lenites = true;
	}

	return (w: Word) => {
		if (lenites) {
			if (prefix.toString() === 'ay' && w.isLenitable()) {
				w = w.lenite();
				return [w.addPrefix(prefix), w];
			} else {
				w = w.lenite();
			}
		}
		// TODO don't merge vowels for RN
		return [w.addPrefix(prefix, true)];
	};
}

function createSuffix(suffix: string) {
	return (w: Word) => {
		return [w.addSuffix(suffix)];
	};
}

const subjectiveSuffix: Affix = (w: Word, dialect?: Dialect, isLoanword?: boolean) => {
	return [w];
}

const agentiveSuffix: Affix = (w: Word, dialect?: Dialect, isLoanword?: boolean) => {
	if (isLoanword && w.endsWith('ì')) {
		return [w.removeLastLetter().addSuffix('ìl')];
	}
	if (w.endsWithVowel()) {
		return [w.addSuffix('l')];
	} else {
		return [w.addSuffix('ìl')];
	}
};

const patientiveSuffix: Affix = (w: Word, dialect?: Dialect, isLoanword?: boolean) => {
	if (isLoanword && w.endsWith('ì')) {
		// If the loanword ends in -fì, -sì, or -tsì, then phonologically we can
		// replace the -ì by -ti.
		if (w.endsWith('fì') || w.endsWith('sì')) {
			return [w.removeLastLetter().addSuffix('it'), w.removeLastLetter().addSuffix('ti')];
		} else {
			return [w.removeLastLetter().addSuffix('it')];
		}

	} else if (w.endsWithVowel()) {
		return [w.addSuffix('t'), w.addSuffix('ti')];

	} else if (w.endsWithConsonant()) {
		return [w.addSuffix('it'), w.addSuffix('ti')];

	} else if (w.endsWith('ay')) {
		return [w.addSuffix('it'), w.addSuffix('t'), w.addSuffix('ti')];

	} else if (w.endsWith('ey')) {
		return [w.addSuffix('t'), w.addSuffix('ti')];

	} else {
		return [w.addSuffix('it'), w.addSuffix('ti')];
	}
}

const dativeSuffix: Affix = (w: Word, dialect?: Dialect, isLoanword?: boolean) => {
	if (isLoanword && w.endsWith('ì')) {
		return [w.removeLastLetter().addSuffix('ur')];

	} else if (w.endsWithVowel()) {
		return [w.addSuffix('r'), w.addSuffix('ru')];

	} else if (w.endsWith('\'')) {
		return [w.addSuffix('ur'), w.addSuffix('ru')];

	} else if (w.endsWithConsonant()) {
		return [w.addSuffix('ur')];

	} else if (w.endsWith('aw')) {
		return [w.addSuffix('ur'), w.addSuffix('r'), w.addSuffix('ru')];

	} else if (w.endsWith('ew')) {
		return [w.addSuffix('r'), w.addSuffix('ru')];

	} else {
		return [w.addSuffix('ur'), w.addSuffix('ru')];
	}
}

const genitiveSuffix: Affix = (w: Word, dialect?: Dialect, isLoanword?: boolean) => {
	if (isLoanword && w.endsWith('ì')) {
		return [w.removeLastLetter().addSuffix('ä')];

	} else if (w.endsWith('o') || w.endsWith('u')) {
		return [w.addSuffix('ä')];

	} else if (w.endsWith('ia')) {
		return [w.removeLastLetter().addSuffix('ä')];

	} else if (w.toRawString() === "omatikaya") {
		return [w.addSuffix('ä')];

	} else if (w.endsWithVowel()) {
		return [w.addSuffix('yä')];

	} else {
		return [w.addSuffix('ä')];
	}
}

const topicalSuffix: Affix = (w: Word, dialect?: Dialect, isLoanword?: boolean) => {
	if (isLoanword && w.endsWith('ì')) {
		return [w.removeLastLetter().addSuffix('ì/ri')];

	} else if (w.endsWithConsonant()) {
		return [w.addSuffix('ì/ri')];

	} else {
		return [w.addSuffix('ri')];
	}
}

const caseFunctions: { [suffix: string]: Affix } = {
	"": subjectiveSuffix,
	"l": agentiveSuffix,
	"t": patientiveSuffix,
	"r": dativeSuffix,
	"ä": genitiveSuffix,
	"ri": topicalSuffix
};

/**
 * Conjugates a noun.
 *
 * noun - the noun stem
 * affixes - an array with seven affixes to be applied to the stem, as detailed
 *           above
 */
export function conjugate(noun: string, affixes: string[], dialect: Dialect, isLoanword?: boolean): Word[] {
	let possibilities = [new Word(noun)];

	let applyAffix = (affix: Affix) => {
		let newPossibilities: Word[] = [];
		for (let possibility of possibilities) {
			newPossibilities = newPossibilities.concat(affix(possibility, dialect, isLoanword));
		}
		possibilities = newPossibilities;
	}

	// Apply the prefixes from inside out.
	applyAffix(createPrefix(affixes[2]));
	applyAffix(findDeterminerAndPluralPrefix(affixes[0], affixes[1]));

	// Apply the suffixes from inside out.
	applyAffix(createSuffix(affixes[3]));
	applyAffix(createSuffix(affixes[4]));
	if (caseFunctions.hasOwnProperty(affixes[5])) {
		applyAffix(caseFunctions[affixes[5]]);
	} else {
		applyAffix(createSuffix(affixes[5]));
	}
	applyAffix(createSuffix(affixes[6]));

	return possibilities;
}

export function conjugateSimple(noun: string, pluralPrefix: string, caseSuffix: string, dialect: Dialect, isLoanword?: boolean) {
	let conjugation = conjugate(noun, ['', pluralPrefix, '', '','', caseSuffix, ''], dialect, isLoanword);
	/*if (pluralPrefix === '') {
		conjugation = '-' + conjugation;
	} else {
		// TODO
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
	return conjugation;*/
	return conjugation.join(';');  // TODO
}

function findDeterminerAndPluralPrefix(determinerPrefix: string, pluralPrefix: string): Affix {
	let prefixes = [
		['', 'me+', 'pxe+', 'ay+'],
		['fì', 'fì/me+', 'fì/pxe+', 'f(ì/)ay+'],
		['tsa', 'tsa/me+', 'tsa/pxe+', 'tsay+'],
		['pe+', 'pe/me+', 'pe/pe+', 'pay+'],
		['fra', 'fra/me+', 'fra/pxe+', 'fray+'],
	];
	let determinerIndex = ['', 'fì', 'tsa', 'pe', 'fra'].indexOf(determinerPrefix);
	let pluralIndex = ['', 'me', 'pxe', 'ay'].indexOf(pluralPrefix);
	if (determinerIndex === -1) {
		throw new Error('Trying to conjugate a noun with invalid determiner prefix ' + determinerPrefix);
	}
	if (pluralIndex === -1) {
		throw new Error('Trying to conjugate a noun with invalid plural prefix ' + pluralPrefix);
	}
	return createPrefix(prefixes[determinerIndex][pluralIndex]);
}
