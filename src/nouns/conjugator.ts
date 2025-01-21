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

import * as convert from "../convert";
import * as phonology from "../phonology";

type CaseFunction = (stem: string, dialect: Dialect, isLoanword?: boolean) => CaseSuffix;
type CaseSuffix = string | { 'suffix': string, 'dropCount': number };

const caseFunctions: { [suffix: string]: CaseFunction } = {
	"": subjectiveSuffix,
	"l": agentiveSuffix,
	"t": patientiveSuffix,
	"r": dativeSuffix,
	"ä": genitiveSuffix,
	"ri": topicalSuffix
};

type PluralFunction = (stem: string, dialect: Dialect, determinerPrefix: string) => PluralPrefix;
type PluralPrefix = string;

let pluralFunctions: { [prefix: string]: PluralFunction } = {
	"me": dualPrefix,
	"Pe": trialPrefix,
	"2": pluralPrefix,
	"(2)": pluralPrefix
};

/**
 * Conjugates a noun. Returns a conjugation string with nine parts.
 *
 * noun - the noun stem
 * affixes - an array with seven affixes to be applied to the stem, as detailed
 *           above
 * simple - (boolean) if true, assumes that only plural and case affixes are
 *          present, and returns a simplified version of the conjugation string
 *          with only these parts.
 */
export function conjugate(noun: string, affixes: string[], simple: boolean, dialect: Dialect, isLoanword?: boolean): string {

	const upperCase = noun.length > 0 && noun[0] !== noun[0].toLowerCase();
	noun = noun.toLowerCase();
	noun = noun.replace(/[-\[\]]/g, '').replaceAll('/', '');
	noun = convert.compress(noun);

	// first find the stem
	let plural = convert.compress(affixes[1]);
	let stemPrefix = convert.compress(affixes[2]);
	let stemSuffix = convert.compress(affixes[3]);
	let determinerSuffix = convert.compress(affixes[4]);

	// prefixes
	let determinerPrefix = convert.compress(affixes[0]);
	if (determinerPrefix !== "" && plural === "2") {  // ay
		// special case: fì- + ay- -> fay-, etc.
		if (determinerPrefix === "fì") {
			determinerPrefix = "f(ì)";  // Horen §3.3.1
		} else {
			determinerPrefix = determinerPrefix.substring(0, determinerPrefix.length - 1);
		}

	} else if (determinerPrefix[determinerPrefix.length - 1] === convert.decompress(noun)[0] &&
			plural === "" && stemPrefix === "") {
		// special case: tsa- + atan -> tsatan, etc.
		determinerPrefix = determinerPrefix.substring(0, determinerPrefix.length - 1);

	} else if (noun.length >= 2 && noun[0] === "'" &&
		determinerPrefix[determinerPrefix.length - 1] === convert.decompress(noun)[1] &&
			plural === "" && stemPrefix === "") {
		// special case: pe- + 'eveng -> peveng (combination of the case above and ' lenition)
		determinerPrefix = determinerPrefix.substring(0, determinerPrefix.length - 1);
	}

	let pluralPrefix = "";
	if (affixes[1] !== "") {
		pluralPrefix = pluralFunctions[plural](
			stemPrefix + noun, dialect, determinerPrefix);

		// special case: pe- can lenite pxe-
		if (determinerPrefix === "pe" && (pluralPrefix === "pxe" || pluralPrefix === "be")) {
			pluralPrefix = "pe";
		} else if (determinerPrefix === "pe" && (pluralPrefix === "px" || pluralPrefix === "b")) {
			pluralPrefix = "p";
		}
	}

	if (dialect !== 'RN' && stemPrefix[stemPrefix.length - 1] === convert.decompress(noun)[0]) {
		// special case: fne- + ekxan -> fnekxan, etc.
		stemPrefix = stemPrefix.substring(0, stemPrefix.length - 1);
	}

	// suffixes
	let caseSuffix: CaseSuffix = "";
	if (caseFunctions.hasOwnProperty(affixes[5])) {
		caseSuffix = caseFunctions[affixes[5]](noun + stemSuffix + determinerSuffix, dialect, isLoanword);
	} else {
		caseSuffix = affixes[5];
	}
	if (typeof caseSuffix !== 'string') {
		noun = noun.slice(0, -caseSuffix['dropCount']);
		caseSuffix = caseSuffix['suffix'];
	}

	let finalSuffix = convert.compress(affixes[6]);

	// if we are looking at a plural, do lenition
	// also do lenition if we have the pe- prefix (but not if
	// there is a plural prefix in between, blocking it)

	/* Note: we do not lenite if there is a stem prefix.
	 * This works only because the only stem prefix is fne-, which is
	 * non-lenitable anyway. If a lenitable stem prefix gets introduced,
	 * this will need to be updated to lenite the stem prefix (and keep the
	 * lenited letter of the stem prefix separate, and so on).
	 */
	let needsLenition =
		(plural !== "" || (plural === "" && (determinerPrefix === "pe" || determinerPrefix === "p"))) &&
		stemPrefix === "";

	let lenitedConsonant, restOfStem;
	if (needsLenition) {
		[lenitedConsonant, restOfStem] = lenite(noun);
		restOfStem = convert.decompress(restOfStem);
	} else {
		lenitedConsonant = '';
		restOfStem = convert.decompress(noun);
	}

	// for RN, we need to change a final ejective to a voiced stop if the
	// suffix starts with a vowel

	/* A problem here is that if the suffix is a case suffix, then it may
	 * have more than one form (e.g., -it/-ti) of which one starts with a vowel
	 * and the other one doesn't.
	 */
	let stemVoicingOptions = [];
	if (dialect === 'RN') {
		let [restOfStemWithoutVoiced, voicedConsonant] = voice(restOfStem);
		if (voicedConsonant !== '') {
			if (stemSuffix !== '' || determinerSuffix !== '') {
				if (phonology.startsWithVowel(stemSuffix + determinerSuffix)) {
					stemVoicingOptions.push([restOfStemWithoutVoiced, voicedConsonant, caseSuffix]);
				}
			} else if (caseSuffix !== '') {
				let vowelCaseSuffixOptions = [];
				let consonantCaseSuffixOptions = [];
				for (let suffix of caseSuffix.split('/')) {
					if (phonology.startsWithVowel(suffix)) {
						vowelCaseSuffixOptions.push(suffix);
					} else {
						consonantCaseSuffixOptions.push(suffix);
					}
				}
				if (consonantCaseSuffixOptions.length > 0) {
					stemVoicingOptions.push([restOfStem, '', consonantCaseSuffixOptions.join('/')]);
				}
				if (vowelCaseSuffixOptions.length > 0) {
					stemVoicingOptions.push([restOfStemWithoutVoiced, voicedConsonant, vowelCaseSuffixOptions.join('/')]);
				}
			}
		}
	}
	if (stemVoicingOptions.length === 0) {
		stemVoicingOptions.push([restOfStem, '', caseSuffix]);
	}

	// finally, output the results
	let options = [];
	for (let [stem, voiced, caseSuffix] of stemVoicingOptions) {
		if (simple) {
			options.push([
				pluralPrefix,
				(lenitedConsonant === '' ? '' : '{' + lenitedConsonant + '}') +
				stem +
				(voiced === '' ? '' : '{' + voiced + '}'),
				caseSuffix
			]);
		} else {
			options.push([
				convert.decompress(determinerPrefix),
				convert.decompress(pluralPrefix),
				convert.decompress(stemPrefix),
				lenitedConsonant,
				stem,
				voiced,
				convert.decompress(stemSuffix),
				convert.decompress(determinerSuffix),
				caseSuffix,
				convert.decompress(finalSuffix)
			]);
		}
	}

	if (upperCase) {
		applyUpperCase(options);
	}

	return options.map((option) => option.join('-')).join(';');
}

function applyUpperCase(options: any): void {
	for (let i = 0; i < options.length; i++) {
		let option = options[i];

		if (option.length === 3) {
			// find the first alphabetic character in option[1] and uppercase it
			option[1] = option[1].replace(/([^\{\}\[\]\/])/, (letter: string) => letter.toUpperCase());

		} else if (option.length === 10) {
			if (option[3] !== '') {
				option[3] = option[3].replace(/./, (letter: string) => letter.toUpperCase());
			} else {
				option[4] = option[4].replace(/./, (letter: string) => letter.toUpperCase());
			}
		}
	}
}

function subjectiveSuffix(noun: string): CaseSuffix {
	return '';
}

function agentiveSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): CaseSuffix {
	if (isLoanword && noun.endsWith('ì')) {
		return {
			'suffix': 'ìl',
			'dropCount': 1
		};
	}
	if (phonology.endsInVowel(noun)) {
		return 'l';
	} else {
		return 'ìl';
	}
}

function patientiveSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): CaseSuffix {
	if (isLoanword && noun.endsWith('ì')) {
		// if the loanword ends in -fì, -sì, or -tsì, then phonologically we can
		// replace the -ì by -ti
		if (['f', 's', 'c'].includes(noun[noun.length - 2])) {
			return {
				'suffix': 'it/ti',
				'dropCount': 1
			};
		} else {
			return {
				'suffix': 'it',
				'dropCount': 1
			};
		}
	}
	if (phonology.endsInVowel(noun)) {
		return 't(i)';
	} else {
		if (phonology.endsInConsonant(noun)) {
			return 'it/ti';
		} else {
			if (noun.slice(-1) === "2") {  // ay
				return 'it/t(i)';
			} else if (noun.slice(-1) === "4") {  // ey
				return 't(i)';
			} else {
				return 'it/ti';
			}
		}
	}
}

function dativeSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): CaseSuffix {
	if (isLoanword && noun.endsWith('ì')) {
		return {
			'suffix': 'ur',
			'dropCount': 1
		};
	}
	if (phonology.endsInVowel(noun)) {
		return 'r(u)';
	} else {
		if (phonology.endsInConsonant(noun)) {
			if (noun.slice(-1) === "'") {
				return 'ur/ru';
			} else {
				return 'ur';
			}
		} else {
			if (noun.slice(-1) === "1") {  // aw
				return 'ur/r(u)';
			} else if (noun.slice(-1) === "3") {  // ew
				return 'r(u)';
			} else {
				return 'ur/ru';
			}
		}
	}
}

function genitiveSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): CaseSuffix {
	const äOrE = dialect === 'RN' ? 'ä/e' : 'ä';
	const yäOrYe = dialect === 'RN' ? 'yä/ye' : 'yä';
	if (isLoanword && noun.endsWith('ì')) {
		return {
			'suffix': äOrE,
			'dropCount': 1
		};
	}
	if (phonology.endsInVowel(noun)) {
		if (noun.slice(-1) === "o" || noun.slice(-1) === "u") {
			return äOrE;
		} else {
			if (noun.slice(-2) === "ia") {
				return {
					suffix: äOrE,
					dropCount: 1
				};
			} else {
				if (noun === "omatik2a") {
					return äOrE;
				} else {
					return yäOrYe;
				}
			}
		}
	} else {
		return äOrE;
	}
}

function topicalSuffix(noun: string, dialect: Dialect, isLoanword?: boolean): CaseSuffix {
	if (isLoanword && noun.endsWith('ì')) {
		return {
			'suffix': 'ìri',
			'dropCount': 1
		};
	}
	if (phonology.endsInConsonant(noun)) {
		return 'ìri';
	} else {
		return 'ri';
	}
}

// Numbers

function dualPrefix(noun: string): PluralPrefix {
	let first = lenite(noun).join('')[0];
	if (first === "e" || first === "3" || first === "4") {  // e, ew, ey
		return 'm';
	} else {
		return 'me';
	}
}

function trialPrefix(noun: string, dialect: Dialect): PluralPrefix {
	let first = lenite(noun).join('')[0];
	if (first === "e" || first === "3" || first === "4") {  // e, ew, ey
		return dialect === 'RN' ? 'b' : 'px';
	} else {
		return dialect === 'RN' ? 'be' : 'pxe';
	}
}

function pluralPrefix(noun: string, dialect: Dialect, determinerPrefix: string): PluralPrefix {
	let lenited = lenite(noun).join('');
	if (lenited !== noun
		&& noun !== "'u"  // 'u doesn't have short plural
		&& determinerPrefix === "") {  // no short plural with fì- etc.
		return '(ay)';
	} else {
		return 'ay';
	}
}

let lenitions: Record<string, string> = {
	"c": "s",
	"t": "s",
	"p": "f",
	"k": "h",
	"T": "t",
	"P": "p",
	"K": "k",
	"d": "t",
	"b": "p",
	"g": "k",
	"'": ""
};

function lenite(word: string): [string, string] {
	// 'rr and 'll are not lenited, since rr and ll cannot start a syllable
	if (word.substring(0, 2) === "'L" || word.substring(0, 2) === "'R") {
		return ["", word];
	}

	if (!(word[0] in lenitions)) {
		return ["", word];
	}

	return [lenitions[word[0]], word.slice(1)];
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
