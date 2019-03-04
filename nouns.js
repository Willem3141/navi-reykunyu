/**
 * Functions to conjugate Na'vi nouns.
 * 
 * A conjugated noun consists of four parts:
 * 
 * [plural prefix] [lenited consonant] [rest of stem] [case ending]
 * 
 * Examples:
 *   * pxeutral ->  [pxe] [] [utral] []
 *   * tute ->      [] [] [tute] []
 *   * aysutel ->   [ay] [s] [ute] [l]
 *   * sutet ->     [] [s] [ute] [t]
 *   * meylanìri -> [m] [eylan] [ìri]
 * 
 * When conjugating, there may be more than one option for the plural prefix or
 * for the case ending. Therefore, those are returned as arrays.
 */

var convert = require("./convert");

module.exports = {
	conjugate: conjugate,
	parse: parse
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

let caseFunctions = {
	"": subjectiveSuffix,
	"-l": agentiveSuffix,
	"-t": patientiveSuffix,
	"-r": dativeSuffix,
	"-ä": genitiveSuffix,
	"-ri": topicalSuffix
};

let pluralFunctions = {
	"me-": dualPrefix,
	"pxe-": trialPrefix,
	"ay-": pluralPrefix
};

/**
 * Conjugates a noun. Returns an array with four strings as detailed above.
 * 
 * plural - "", "me-", "pxe-" or "ay-"
 * caseSuffix - "", "-l", "-t", "-r", "-ä" or "-ri"
 */
function conjugate(noun, plural, caseSuffix) {

	// first find the case suffix
	let caseEnding = caseFunctions[caseSuffix](noun);
	
	// special case for genitive -ia -> -iä - see genitiveSuffix()
	if (noun.slice(-2) === "ia" && caseSuffix === "-ä") {
		noun = noun.slice(0, -1);
	}
	
	if (plural === "") {
		return [[""], "", noun, caseEnding];
	}
	
	// if we are looking at a plural, do lenition
	let lenited = lenite(noun);
	let consonant = lenited[0];
	let stem = lenited[1];
	let pluralPrefix = pluralFunctions[plural](noun);
	
	return [pluralPrefix, consonant, stem, caseEnding];
}

function subjectiveSuffix(noun) {
	return [""];
}

function agentiveSuffix(noun) {
	if (endsInVowel(noun)) {
		return ["l"];
	} else {
		return ["ìl"];
	}
}

function patientiveSuffix(noun) {
	if (endsInVowel(noun)) {
		return ["t", "ti"];
	} else {
		if (endsInConsonant(noun)) {
			return ["it", "ti"];
		} else {
			if (noun.slice(-1) === "2") {  // ay
				return ["it", "t", "ti"];
			} else if (noun.slice(-1) === "4") {  // ey
				return ["t", "ti"];
			} else {
				return ["it", "ti"];
			}
		}
	}
}

function dativeSuffix(noun) {
	if (endsInVowel(noun)) {
		return ["r", "ru"];
	} else {
		if (endsInConsonant(noun)) {
			return ["ur"];
		} else {
			if (noun.slice(-1) === "1") {  // aw
				return ["ur", "r", "ru"];
			} else if (noun.slice(-1) === "3") {  // ew
				return ["r", "ru"];
			} else {
				return ["ru", "ur"];
			}
		}
	}
}

function genitiveSuffix(noun) {
	if (endsInVowel(noun)) {
		if (noun.slice(-1) === "o" || noun.slice(-1) === "u") {
			return ["ä"];
		} else {
			if (noun.slice(-2) === "ia") {
				return ["ä"];  // note: in this case, drop the a from the stem
			} else {
				if (noun === "omatikaya") {
					return ["ä"];
				} else {
					return ["yä"];
				}
			}
		}
	} else {
		return ["ä"];
	}
}

function topicalSuffix(noun) {
	if (endsInConsonant(noun)) {
		return ["ìri"];
	} else {
		return ["ri"];
	}
}

// Numbers

function dualPrefix(noun) {
	let first = lenite(noun).join('')[0];
	if (first === "e" || first === "3" || first === "4") {  // e, ew, ey
		return ["m"];
	} else {
		return ["me"];
	}
}

function trialPrefix(noun) {
	let first = lenite(noun).join('')[0];
	if (first === "e" || first === "3" || first === "4") {  // e, ew, ey
		return ["P"];
	} else {
		return ["Pe"];
	}
}

function pluralPrefix(noun) {
	let lenited = lenite(noun).join('');
	if (lenited !== noun && noun !== "'u") {  // 'u doesn't have short plural
		return ["2", ""];
	} else {
		return ["2"];
	}
}

let lenitions = {
	"c": "s",
	"t": "s",
	"p": "f",
	"k": "h",
	"T": "t",
	"P": "p",
	"K": "k",
	"'": ""
};

function lenite(word) {
	// 'rr and 'll are not lenited, since rr and ll cannot start a syllable
	if (word.substring(0, 2) === "'L" || word.substring(0, 2) === "'R") {
		return ["", word];
	}
	
	if (!(word[0] in lenitions)) {
		return ["", word];
	}
	
	return [lenitions[word[0]], word.slice(1)];
}

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
function parse(word) {

	// step 1: generate a set of candidates
	let candidates = getCandidates(word);
	
	// step 2: for each candidate, check if it is indeed correct
	let result = [];
	for (let i = 0; i < candidates.length; i++) {
		if (checkCandidate(...candidates[i])) {
			result.push(candidates[i]);
		}
	}

	return result;
}

let unlenitions = {
	"s": ["c", "t"],
	"f": ["p"],
	"h": ["k"],
	"t": ["T"],
	"p": ["P"],
	"k": ["K"]
};

/**
 * Returns a superset of the possible words that would be lenited to the
 * given word.
 */
function unlenite(word) {
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

function tryPluralPrefixes(candidate) {
	let word = candidate[1];
	let candidates = [];

	// singular
	candidates.push([candidate[0], word, "", candidate[3]]);

	// plural forms
	// need to try all possible initial consonants that could have lenited to our form
	let tryPrefix = function (prefix, name) {
		if (word.startsWith(prefix)) {
			let stems = unlenite(word.slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				candidates.push([candidate[0], stems[i], name, candidate[3]]);
			}
		}
	};
	tryPrefix("me", "me-");
	tryPrefix("m", "me-");
	tryPrefix("Pe", "pxe-");
	tryPrefix("P", "pxe-");
	tryPrefix("2", "ay-");
	tryPrefix("", "ay-");

	return candidates;
}

function tryCaseSuffixes(candidate) {
	let word = candidate[1];
	let candidates = [];

	candidates.push([candidate[0], word, candidate[2], ""]);
	let tryEnding = function (ending, caseSuffix) {
		if (word.endsWith(ending)) {
			candidates.push([candidate[0], word.slice(0, -ending.length), candidate[2], caseSuffix]);
		}
	};
	tryEnding("l", "-l");
	tryEnding("ìl", "-l");
	tryEnding("t", "-t");
	tryEnding("it", "-t");
	tryEnding("ti", "-t");
	tryEnding("r", "-r");
	tryEnding("ur", "-r");
	tryEnding("ru", "-r");
	tryEnding("ä", "-ä");
	tryEnding("yä", "-ä");
	tryEnding("ri", "-ri");
	tryEnding("ìri", "-ri");
	if (word.endsWith("iä")) {
		candidates.push([candidate[0], word.slice(0, -1) + "a", candidate[2], "-ä"]);
	}

	return candidates;
}

function getCandidates(word) {
	let functions = [tryPluralPrefixes, tryCaseSuffixes];

	let candidates = [];
	candidates.push([word, word, null, null]);

	for (let i = 0; i < functions.length; i++) {
		let newCandidates = [];
		for (let j = 0; j < candidates.length; j++) {
			newCandidates = newCandidates.concat(functions[i](candidates[j]));
		}
		candidates = newCandidates;
	}
	
	return candidates;
}

/**
 * Tests if a given word is a correct conjugation for the given form.
 */
function checkCandidate(word, noun, plural, caseSuffix) {
	console.log(word, noun, plural, caseSuffix);
	let conjugation = conjugate(noun, plural, caseSuffix);
	console.log(" -> ", conjugation);
	
	for (let i = 0; i < conjugation[0].length; i++) {
		for (let j = 0; j < conjugation[3].length; j++) {
			let possibility = conjugation[0][i] + conjugation[1] +
			                  conjugation[2] + conjugation[3][j];
			if (word === possibility) {
				return true;
			}
		}
	}
	
	return false;
}
