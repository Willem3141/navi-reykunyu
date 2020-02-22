/**
 * Functions to conjugate and parse Na'vi nouns.
 * 
 * A conjugated Na'vi noun has the following parts (which are all optional,
 * except of course the stem):
 * 
 *  0. determiner prefix: "fì", "tsa", "pe", "fra"
 *  1. plural prefix: "me", "pxe", "ay"
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
 * 
 * The parse function takes a string, and returns all possible (valid) input
 * arrays that, when given to the conjugate function, result in that string
 * being a possibility.
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
	"l": agentiveSuffix,
	"t": patientiveSuffix,
	"r": dativeSuffix,
	"ä": genitiveSuffix,
	"ri": topicalSuffix
};

let pluralFunctions = {
	"me": dualPrefix,
	"Pe": trialPrefix,
	"2": pluralPrefix
};

/**
 * Conjugates a noun. Returns an array with nine arrays as detailed above.
 * 
 * noun - the noun stem
 * affixes - an array with seven affixes to be applied to the stem, as detailed
 *           above
 */
function conjugate(noun, affixes) {
	
	noun = convert.compress(noun);

	// first find the stem
	let plural = convert.compress(affixes[1]);
	let stemPrefix = convert.compress(affixes[2]);
	let stemSuffix = convert.compress(affixes[3]);
	let determinerSuffix = convert.compress(affixes[4]);
	
	// prefixes
	let determinerPrefix = convert.compress(affixes[0]);
	if (determinerPrefix !== "" && plural === "2") {  // ay
		determinerPrefix = determinerPrefix[0];  // fì- + ay- -> fay-, etc.
	}
	
	let pluralPrefix = [""];
	if (affixes[1] !== "") {
		pluralPrefix = pluralFunctions[plural](
							stemPrefix + noun, determinerPrefix);

		// special case: pe- can lenite pxe-
		if (determinerPrefix === "pe" && pluralPrefix[0] === "Pe") {
			pluralPrefix[0] = "pe";
		}
	}

	// suffixes
	let caseSuffix = affixes[5];
	if (caseFunctions.hasOwnProperty(caseSuffix)) {
		caseSuffix = caseFunctions[affixes[5]](noun + stemSuffix + determinerSuffix);
	}
	
	// special case for genitive -ia -> -iä - see genitiveSuffix()
	if (noun.slice(-2) === "ia" && affixes[5] === "ä") {
		noun = noun.slice(0, -1);
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
		(plural !== "" || (plural === "" && determinerPrefix === "pe")) &&
		stemPrefix === "";
	
	if (needsLenition) {
		
		let lenited = lenite(noun);
		return convert.decompressAll([
				determinerPrefix, pluralPrefix,
				stemPrefix, lenited[0], lenited[1], stemSuffix,
				determinerSuffix, caseSuffix, finalSuffix]);
	} else {
		// else, no lenition
		return convert.decompressAll([
				determinerPrefix, pluralPrefix,
				stemPrefix, "", noun, stemSuffix,
				determinerSuffix, caseSuffix, finalSuffix]);
	}
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

function pluralPrefix(noun, determinerPrefix) {
	let lenited = lenite(noun).join('');
	if (lenited !== noun
			&& noun !== "'u"  // 'u doesn't have short plural
			&& determinerPrefix === "") {  // no short plural with fì- etc.
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
	"s": ["ts", "t"],
	"f": ["p"],
	"h": ["k"],
	"t": ["tx"],
	"p": ["px"],
	"k": ["kx"]
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

function tryDeterminerPrefixes(candidate) {
	let word = candidate[1];
	let affixes = candidate[2];
	let candidates = [];

	// singular
	candidates.push([candidate[0], word, affixes]);

	let tryPrefix = function (prefix, name) {
		if (word.startsWith(prefix)) {
			let stems = unlenite(word.slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...affixes];
				newAffixes[0] = name;
				candidates.push([candidate[0], stems[i], newAffixes]);
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

function tryPluralPrefixes(candidate) {
	let word = candidate[1];
	let affixes = candidate[2];
	let candidates = [];

	// singular
	candidates.push([candidate[0], word, affixes]);

	// plural forms
	// need to try all possible initial consonants that could have lenited to our form
	let tryPrefix = function (prefix, name) {
		if (word.startsWith(prefix)) {
			let stems = unlenite(word.slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...affixes];
				newAffixes[1] = name;
				candidates.push([candidate[0], stems[i], newAffixes]);
			}
		}
	};
	tryPrefix("me", "me");
	tryPrefix("m", "me");
	tryPrefix("pxe", "pxe");
	tryPrefix("px", "pxe");
	tryPrefix("pe", "pxe");  // lenited pxe- (as in pepesute)
	tryPrefix("p", "pxe");  // lenited pxe- (as in pepeylan)
	tryPrefix("ay", "ay");
	tryPrefix("", "ay");

	return candidates;
}

function tryStemPrefixes(candidate) {
	let word = candidate[1];
	let affixes = candidate[2];
	let candidates = [];

	// singular
	candidates.push([candidate[0], word, affixes]);

	let tryPrefix = function (prefix, name) {
		if (word.startsWith(prefix)) {
			let stems = unlenite(word.slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...affixes];
				newAffixes[2] = name;
				candidates.push([candidate[0], stems[i], newAffixes]);
			}
		}
	};
	tryPrefix("fne", "fne");

	return candidates;
}

function tryStemSuffixes(candidate) {
	let word = candidate[1];
	let affixes = candidate[2];
	let candidates = [];

	candidates.push([candidate[0], word, affixes]);
	let tryEnding = function (suffix, name) {
		if (word.endsWith(suffix)) {
			let newAffixes = [...affixes];
			newAffixes[3] = name;
			candidates.push([candidate[0], word.slice(0, -suffix.length), newAffixes]);
		}
	};
	tryEnding("tsyìp", "tsyìp");
	tryEnding("fkeyk", "fkeyk");

	return candidates;
}

function tryDeterminerSuffixes(candidate) {
	let word = candidate[1];
	let affixes = candidate[2];
	let candidates = [];

	candidates.push([candidate[0], word, affixes]);
	let tryEnding = function (suffix, name) {
		if (word.endsWith(suffix)) {
			let newAffixes = [...affixes];
			newAffixes[4] = name;
			candidates.push([candidate[0], word.slice(0, -suffix.length), newAffixes]);
		}
	};
	tryEnding("pe", "pe");
	tryEnding("o", "o");

	return candidates;
}

function tryCaseSuffixes(candidate) {
	let word = candidate[1];
	let affixes = candidate[2];
	let candidates = [];

	candidates.push([candidate[0], word, affixes]);
	let tryEnding = function (suffix, name) {
		if (word.endsWith(suffix)) {
			let newAffixes = [...affixes];
			newAffixes[5] = name;
			candidates.push([candidate[0], word.slice(0, -suffix.length), newAffixes]);
		}
	};
	tryEnding("l", "l");
	tryEnding("ìl", "l");
	tryEnding("t", "t");
	tryEnding("it", "t");
	tryEnding("ti", "t");
	tryEnding("r", "r");
	tryEnding("ur", "r");
	tryEnding("ru", "r");
	tryEnding("ä", "ä");
	tryEnding("yä", "ä");
	tryEnding("ri", "ri");
	tryEnding("ìri", "ri");
	if (word.endsWith("iä")) {
		let newAffixes = [...affixes];
		newAffixes[5] = "ä";
		candidates.push([candidate[0], word.slice(0, -1) + "a", newAffixes]);
	}

	return candidates;
}

function tryFinalSuffixes(candidate) {
	let word = candidate[1];
	let affixes = candidate[2];
	let candidates = [];

	candidates.push([candidate[0], word, affixes]);
	let tryEnding = function (suffix, name) {
		if (word.endsWith(suffix)) {
			let newAffixes = [...affixes];
			newAffixes[6] = name;
			candidates.push([candidate[0], word.slice(0, -suffix.length), newAffixes]);
		}
	};
	tryEnding("sì", "sì");
	tryEnding("to", "to");

	return candidates;
}

function getCandidates(word) {
	let functions = [
		tryDeterminerPrefixes,
		tryPluralPrefixes,
		tryStemPrefixes,
		tryFinalSuffixes,
		tryCaseSuffixes,
		tryDeterminerSuffixes,
		tryStemSuffixes
	];

	let candidates = [];
	candidates.push([word, word, ["", "", "", "", "", "", ""]]);

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
function checkCandidate(word, noun, affixes) {
	//console.log([word, noun, affixes]);
	let conjugation = conjugate(noun, affixes);
	
	for (let i = 0; i < conjugation[1].length; i++) {
		for (let j = 0; j < conjugation[7].length; j++) {
			let possibility = conjugation[0] + conjugation[1][i] +
			                  conjugation[2] + conjugation[3] +
			                  conjugation[4] + conjugation[5] +
			                  conjugation[6] + conjugation[7][j] +
			                  conjugation[8];
			if (word === possibility) {
				//console.log("candidate:", word, "=", noun, "+", affixes,
				//            " -> ", conjugation, " ->  ✔");
				return true;
			}
		}
	}
	
	//console.log("candidate:", word, "=", noun, "+", affixes,
	//            " -> ", conjugation, " ->  ✘");
	return false;
}
