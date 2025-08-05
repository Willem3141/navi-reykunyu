/**
 * The parse function takes a string, and returns all possible (valid) input
 * arrays that, when given to the conjugate function, result in that string
 * being a possibility.
 */

import * as conjugationString from "../conjugationString";
import { conjugate } from "./conjugator";

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
export function parse(word: string, dialect: Dialect, assumeLoanword?: boolean): NounConjugationStep[] {

	// step 1: generate a set of candidates
	let candidates = getCandidates(word, dialect);

	// step 2: for each candidate, check if it is indeed correct
	let result: NounConjugationStep[] = [];
	for (let i = 0; i < candidates.length; i++) {
		let candidate = candidates[i] as NounConjugationStep;
		if (!candidatePossible(candidate)) {
			continue;
		}
		let conjugation = conjugate(candidate["root"], candidate["affixes"], dialect, assumeLoanword);
		if (!conjugationString.stringAdmits(conjugation, word)) {
			candidate["correction"] = word;
		}
		candidate["result"] = conjugationString.formsFromString(conjugation);
		result.push(candidate);
	}

	return result;
}

let unlenitions: Record<string, string[]> = {
	"s": ["ts", "t"],
	"f": ["p"],
	"h": ["k"],
	"t": ["tx", "d"],
	"p": ["px", "b"],
	"k": ["kx", "g"]
};

/**
 * Returns a superset of the possible words that would be lenited to the
 * given word.
 */
function unlenite(word: string): string[] {
	let result = [word, "'" + word];

	if (!(word[0] in unlenitions)) {
		return result;
	}

	let initials = unlenitions[word[0]];
	for (let i = 0; i < initials.length; i++) {
		result.push(initials[i] + word.slice(1));
	}

	return result;
}

function tryDeterminerPrefixes(candidate: Omit<NounConjugationStep, 'result'>): Omit<NounConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryPrefix = (prefix: string, name: string) => {
		if (candidate["root"].startsWith(prefix)) {
			let stems = unlenite(candidate["root"].slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...candidate["affixes"]];
				newAffixes[0] = name;
				candidates.push({
					"root": stems[i],
					"affixes": newAffixes
				});
			}
		}
	};
	tryPrefix("fì", "fì");
	tryPrefix("f", "fì");  // for combination fay-
	tryPrefix("tsa", "tsa");
	tryPrefix("ts", "tsa");  // for combination fay-
	tryPrefix("pe", "pe");
	tryPrefix("p", "pe");  // for combination pay-
	tryPrefix("fra", "fra");
	tryPrefix("fr", "fra");  // for combination fray-

	return candidates;
}

function tryPluralPrefixes(candidate: Omit<NounConjugationStep, 'result'>): Omit<NounConjugationStep, 'result'>[] {
	let candidates = [];

	// singular
	candidates.push({ ...candidate });

	// plural forms
	// need to try all possible initial consonants that could have lenited to our form
	let tryPrefix = (prefix: string, name: string) => {
		if (candidate["root"].startsWith(prefix)) {
			let stems = unlenite(candidate["root"].slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...candidate["affixes"]];
				newAffixes[1] = name;
				candidates.push({
					"root": stems[i],
					"affixes": newAffixes
				});
			}
		}
	};
	tryPrefix("me", "me");
	tryPrefix("m", "me");
	tryPrefix("pxe", "pxe");
	tryPrefix("px", "pxe");
	tryPrefix("pe", "pxe");  // lenited pxe- (as in pepesute)
	tryPrefix("p", "pxe");  // lenited pxe- (as in pepeylan)
	tryPrefix("be", "pxe");
	tryPrefix("b", "pxe");
	tryPrefix("ay", "ay");
	tryPrefix("", "ay");

	return candidates;
}

function tryStemPrefixes(candidate: Omit<NounConjugationStep, 'result'>): Omit<NounConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({ ...candidate });

	let tryPrefix = (prefix: string, name: string) => {
		if (candidate["root"].startsWith(prefix)) {
			let stems = unlenite(candidate["root"].slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...candidate["affixes"]];
				newAffixes[2] = name;
				candidates.push({
					"root": stems[i],
					"affixes": newAffixes
				});
			}
		}
	};
	tryPrefix("fne", "fne");
	tryPrefix("fn", "fne");
	tryPrefix("munsna", "munsna");

	return candidates;
}

function tryLastConsonantUnvoicing(candidate: Omit<NounConjugationStep, 'result'>, dialect: Dialect): Omit<NounConjugationStep, 'result'>[] {
	if (dialect !== 'RN') {
		return [candidate];
	}

	let candidates = [];
	candidates.push({ ...candidate });
	let tryUnvoicing = (voiced: string, ejective: string) => {
		if (candidate["root"].endsWith(voiced)) {
			candidates.push({
				"root": candidate["root"].slice(0, -voiced.length) + ejective,
				"affixes": candidate['affixes']
			});
		}
	};
	tryUnvoicing("b", "px");
	tryUnvoicing("d", "tx");
	tryUnvoicing("g", "kx");
	if (candidates.length === 0) {
		candidates.push({ ...candidate });
	}

	return candidates;
}

function tryStemSuffixes(candidate: Omit<NounConjugationStep, 'result'>): Omit<NounConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = (suffix: string, name: string) => {
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[3] = name;
			candidates.push({
				"root": candidate["root"].slice(0, -suffix.length),
				"affixes": newAffixes
			});
		}
	};
	tryEnding("tsyìp", "tsyìp");
	tryEnding("fkeyk", "fkeyk");

	return candidates;
}

function tryDeterminerSuffixes(candidate: Omit<NounConjugationStep, 'result'>): Omit<NounConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = (suffix: string, name: string) => {
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[4] = name;
			candidates.push({
				"root": candidate["root"].slice(0, -suffix.length),
				"affixes": newAffixes
			});
		}
	};
	tryEnding("pe", "pe");
	tryEnding("o", "o");

	return candidates;
}

let adpositions = {
	'FN': [
		"äo", "eo", "fa", "few", "fkip", "fpi", "ftu", "ftumfa", "ftuopa", "hu",
		"ìlä", "io", "ka", "kam", "kay", "kip", "krrka", "kxamlä", "lisre", "lok",
		"luke", "maw", "mì", "mìkam", "mungwrr", "na", "ne", "nemfa", "nuä",
		"pxaw", "pxel", "pximaw", "pxisre", "raw", "ro", "rofa", "sìn", "sko",
		"sre", "ta", "tafkip", "takip", "talun", "teri", "uo", "vay", "wä", "yoa"
	],
	'RN': [
		"äo", "eo", "fa", "few", "fkip", "fpi", "ftu", "ftumfa", "ftuopa", "hu",
		"ìlä", "ile", "io", "ka", "kam", "kay", "kip", "krrka", "gamlä", "gamle", "lisre", "lok",
		"luke", "maw", "mì", "mìkam", "mùngwrr", "na", "ne", "nemfa", "nuä",
		"baw", "bel", "bimaw", "bisre", "raw", "ro", "rofa", "sìn", "sko",
		"sre", "ta", "tafkip", "takip", "talun", "teri", "uo", "vay", "wä", "yoa"
	],
};

function tryCaseSuffixes(candidate: Omit<NounConjugationStep, 'result'>, dialect: Dialect): Omit<NounConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = (suffix: string, name: string, replacement?: string) => {
		if (!replacement) {
			replacement = '';
		}
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[5] = name;
			candidates.push({
				"root": candidate["root"].slice(0, -suffix.length) + replacement,
				"affixes": newAffixes
			});
		}
	};
	tryEnding("l", "l");
	tryEnding("ìl", "l");
	tryEnding("t", "t");
	tryEnding("it", "t");
	tryEnding("it", "t", "ì");
	tryEnding("ti", "t");
	tryEnding("ti", "t", "ì");
	tryEnding("r", "r");
	tryEnding("ur", "r");
	tryEnding("ur", "r", "ì");
	tryEnding("ru", "r");
	tryEnding("ä", "ä");
	tryEnding("ä", "ä", "ì");
	tryEnding("yä", "ä");
	tryEnding("iä", "ä", "ia");
	tryEnding("e", "ä");
	tryEnding("e", "ä", "ì");
	tryEnding("ye", "ä");
	tryEnding("ie", "ä", "ia");
	tryEnding("ri", "ri");
	tryEnding("ìri", "ri");

	if (dialect === 'combined') {
		dialect = 'FN';
	}
	for (let i = 0; i < adpositions[dialect].length; i++) {
		tryEnding(adpositions[dialect][i], adpositions[dialect][i]);
	}

	return candidates;
}

function tryFinalSuffixes(candidate: Omit<NounConjugationStep, 'result'>): Omit<NounConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = (suffix: string, name: string) => {
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[6] = name;
			candidates.push({
				"root": candidate["root"].slice(0, -suffix.length),
				"affixes": newAffixes
			});
		}
	};
	tryEnding("sì", "sì");
	tryEnding("to", "to");

	return candidates;
}

function getCandidates(word: string, dialect: Dialect): Omit<NounConjugationStep, 'result'>[] {
	let functions: ((candidate: Omit<NounConjugationStep, 'result'>, dialect: Dialect) =>
			Omit<NounConjugationStep, 'result'>[])[] = [
		tryDeterminerPrefixes,
		tryPluralPrefixes,
		tryStemPrefixes,
		tryFinalSuffixes,
		tryCaseSuffixes,
		tryDeterminerSuffixes,
		tryStemSuffixes,
		tryLastConsonantUnvoicing
	];

	let candidates: Omit<NounConjugationStep, 'result'>[] = [];
	candidates.push({
		"root": word,
		"affixes": ["", "", "", "", "", "", ""]
	});

	for (let i = 0; i < functions.length; i++) {
		let newCandidates: Omit<NounConjugationStep, 'result'>[] = [];
		for (let j = 0; j < candidates.length; j++) {
			newCandidates = newCandidates.concat(functions[i](candidates[j], dialect));
		}
		candidates = newCandidates;
	}

	return candidates;
}

function candidatePossible(candidate: Omit<NounConjugationStep, 'result'>): boolean {
	if (candidate['root'] === '') {
		return false;
	}
	const affixes = candidate["affixes"];
	if (affixes[0] !== "" && affixes[1] === "(ay)") {
		return false;
	}
	return true;
}
