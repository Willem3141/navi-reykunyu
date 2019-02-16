/**
 * Functions to conjugate Na'vi nouns.
 * 
 * These work on the compressed spelling (see convert.js).
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
			if (noun.slice(-1) === "y") {
				if (noun.slice(-2) === "ey") {
					return ["t", "ti"];
				} else {
					return ["it", "t", "ti"];
				}
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
			if (noun.slice(-2) === "3") {  // ew
				return ["r", "ru"];
			} else if (noun.slice(-2) === "4") {  // ey
				return ["ur", "r", "ru"];
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
		return word;
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

function getCandidates(word) {
	candidates = [];
	
	candidates.push([word, word, "", ""]);
	// endings first
	let tryEnding = function (ending, caseSuffix) {
		if (word.endsWith(ending)) {
			candidates.push([word, word.slice(0, -ending.length), "", caseSuffix]);
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
		candidates.push([word, word.slice(0, -1) + "a", "", "-ä"]);
	}
	
	// now try non-singular forms
	// TODO
	
	return candidates;
}

/**
 * Tests if a given word is a correct conjugation for the given form.
 */
function checkCandidate(word, noun, plural, caseSuffix) {
	let conjugation = conjugate(noun, plural, caseSuffix);
	console.log(word, noun, plural, caseSuffix, conjugation);
	
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
