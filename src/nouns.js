/**
 * Functions to conjugate and parse Na'vi nouns.
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
 *
 * The parse function takes a string, and returns all possible (valid) input
 * arrays that, when given to the conjugate function, result in that string
 * being a possibility.
 */

const conjugationString = require("./conjugationString");
const convert = require("./convert");
const phonology = require("./phonology");

module.exports = {
	conjugate: conjugate,
	parse: parse
}

function lastLetter(noun) {
	return noun.slice(-1);
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
function conjugate(noun, affixes, simple, dialect) {

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
			determinerPrefix = "fì/f";  // Horen §3.3.1
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
	let caseSuffix = "";
	if (caseFunctions.hasOwnProperty(affixes[5])) {
		caseSuffix = caseFunctions[affixes[5]](noun + stemSuffix + determinerSuffix, dialect);
	} else {
		caseSuffix = affixes[5];
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
		(plural !== "" || (plural === "" && (determinerPrefix === "pe" || determinerPrefix === "p"))) &&
		stemPrefix === "";

	let lenitedConsonant, restOfStem;
	if (needsLenition) {
		[lenitedConsonant, restOfStem] = lenite(noun);
		restOfStem = convert.decompress(restOfStem);
		if (upperCase) {
			lenitedConsonant = lenitedConsonant.toUpperCase();
		}
	} else {
		lenitedConsonant = '';
		restOfStem = convert.decompress(noun);
		if (upperCase) {
			noun = noun[0].toUpperCase() + noun.slice(1);
		}
	}

	// finally, output the results
	if (simple) {
		return pluralPrefix + '-' +
			(lenitedConsonant === '' ? '' : '{' + lenitedConsonant + '}') +
			restOfStem + '-' + caseSuffix;
	} else {
		return [
			convert.decompress(determinerPrefix),
			convert.decompress(pluralPrefix),
			convert.decompress(stemPrefix),
			lenitedConsonant,
			restOfStem,
			convert.decompress(stemSuffix),
			convert.decompress(determinerSuffix),
			caseSuffix,
			convert.decompress(finalSuffix)
		].join('-');
	}
}

function subjectiveSuffix(noun) {
	return '';
}

function agentiveSuffix(noun) {
	if (phonology.endsInVowel(noun)) {
		return 'l';
	} else {
		return 'ìl';
	}
}

function patientiveSuffix(noun) {
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

function dativeSuffix(noun) {
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

function genitiveSuffix(noun, dialect) {
	const äOrE = dialect === 'RN' ? 'ä/e' : 'ä';
	const yäOrYe = dialect === 'RN' ? 'yä/ye' : 'yä';
	if (phonology.endsInVowel(noun)) {
		if (noun.slice(-1) === "o" || noun.slice(-1) === "u") {
			return äOrE;
		} else {
			if (noun.slice(-2) === "ia") {
				return äOrE;  // note: in this case, drop the a from the stem
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

function topicalSuffix(noun) {
	if (phonology.endsInConsonant(noun)) {
		return 'ìri';
	} else {
		return 'ri';
	}
}

// Numbers

function dualPrefix(noun, dialect) {
	let first = lenite(noun).join('')[0];
	if (first === "e" || first === "3" || first === "4") {  // e, ew, ey
		return 'm';
	} else {
		return 'me';
	}
}

function trialPrefix(noun, dialect) {
	let first = lenite(noun).join('')[0];
	if (first === "e" || first === "3" || first === "4") {  // e, ew, ey
		return dialect === 'RN' ? 'b' : 'px';
	} else {
		return dialect === 'RN' ? 'be' : 'pxe';
	}
}

function pluralPrefix(noun, dialect, determinerPrefix) {
	let lenited = lenite(noun).join('');
	if (lenited !== noun
		&& noun !== "'u"  // 'u doesn't have short plural
		&& determinerPrefix === "") {  // no short plural with fì- etc.
		return '(ay)';
	} else {
		return 'ay';
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
	"d": "t",
	"b": "p",
	"g": "k",
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
		const candidate = candidates[i];
		if (!candidatePossible(candidate)) {
			continue;
		}
		let conjugation = conjugate(candidate["root"], candidate["affixes"]);
		if (!conjugationString.stringAdmits(conjugation, candidate["result"])) {
			candidate["correction"] = candidate["result"];
		}
		candidate["result"] = conjugationString.formsFromString(conjugation);
		result.push(candidates[i]);
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
	let candidates = [];

	candidates.push({ ...candidate });
	let tryPrefix = function (prefix, name) {
		if (candidate["root"].startsWith(prefix)) {
			let stems = unlenite(candidate["root"].slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...candidate["affixes"]];
				newAffixes[0] = name;
				candidates.push({
					"result": candidate["result"],
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

function tryPluralPrefixes(candidate) {
	let candidates = [];

	// singular
	candidates.push({ ...candidate });

	// plural forms
	// need to try all possible initial consonants that could have lenited to our form
	let tryPrefix = function (prefix, name) {
		if (candidate["root"].startsWith(prefix)) {
			let stems = unlenite(candidate["root"].slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...candidate["affixes"]];
				newAffixes[1] = name;
				candidates.push({
					"result": candidate["result"],
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
	tryPrefix("ay", "ay");
	tryPrefix("", "(ay)");

	return candidates;
}

function tryStemPrefixes(candidate) {
	let candidates = [];

	candidates.push({ ...candidate });

	let tryPrefix = function (prefix, name) {
		if (candidate["root"].startsWith(prefix)) {
			let stems = unlenite(candidate["root"].slice(prefix.length));
			for (let i = 0; i < stems.length; i++) {
				let newAffixes = [...candidate["affixes"]];
				newAffixes[2] = name;
				candidates.push({
					"result": candidate["result"],
					"root": stems[i],
					"affixes": newAffixes
				});
			}
		}
	};
	tryPrefix("fne", "fne");
	tryPrefix("fn", "fne");

	return candidates;
}

function tryStemSuffixes(candidate) {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = function (suffix, name) {
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[3] = name;
			candidates.push({
				"result": candidate["result"],
				"root": candidate["root"].slice(0, -suffix.length),
				"affixes": newAffixes
			});
		}
	};
	tryEnding("tsyìp", "tsyìp");
	tryEnding("fkeyk", "fkeyk");

	return candidates;
}

function tryDeterminerSuffixes(candidate) {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = function (suffix, name) {
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[4] = name;
			candidates.push({
				"result": candidate["result"],
				"root": candidate["root"].slice(0, -suffix.length),
				"affixes": newAffixes
			});
		}
	};
	tryEnding("pe", "pe");
	tryEnding("o", "o");

	return candidates;
}

let adpositions = [
	"äo", "eo", "fa", "few", "fkip", "fpi", "ftu", "ftumfa", "ftuopa", "hu",
	"ìlä", "io", "ka", "kam", "kay", "kip", "krrka", "kxamlä", "lisre", "lok",
	"luke", "maw", "mì", "mìkam", "mungwrr", "na", "ne", "nemfa", "nuä",
	"pxaw", "pxel", "pximaw", "pxisre", "raw", "ro", "rofa", "sìn", "sko",
	"sre", "ta", "tafkip", "takip", "talun", "teri", "uo", "vay", "wä", "yoa"
];

function tryCaseSuffixes(candidate) {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = function (suffix, name) {
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[5] = name;
			candidates.push({
				"result": candidate["result"],
				"root": candidate["root"].slice(0, -suffix.length),
				"affixes": newAffixes
			});
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
	if (candidate["root"].endsWith("iä")) {
		let newAffixes = [...candidate["affixes"]];
		newAffixes[5] = "ä";
		candidates.push({
			"result": candidate["result"],
			"root": candidate["root"].slice(0, -1) + "a",
			"affixes": newAffixes
		});
	}

	for (let i = 0; i < adpositions.length; i++) {
		tryEnding(adpositions[i], adpositions[i]);
	}

	return candidates;
}

function tryFinalSuffixes(candidate) {
	let candidates = [];

	candidates.push({ ...candidate });
	let tryEnding = function (suffix, name) {
		if (candidate["root"].endsWith(suffix)) {
			let newAffixes = [...candidate["affixes"]];
			newAffixes[6] = name;
			candidates.push({
				"result": candidate["result"],
				"root": candidate["root"].slice(0, -suffix.length),
				"affixes": newAffixes
			});
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
	candidates.push({
		"result": word,
		"root": word,
		"affixes": ["", "", "", "", "", "", ""]
	});

	for (let i = 0; i < functions.length; i++) {
		let newCandidates = [];
		for (let j = 0; j < candidates.length; j++) {
			newCandidates = newCandidates.concat(functions[i](candidates[j]));
		}
		candidates = newCandidates;
	}

	return candidates;
}

function candidatePossible(candidate) {
	const affixes = candidate["affixes"];
	if (affixes[0] !== "" && affixes[1] === "(ay)") {
		return false;
	}
	return true;
}
