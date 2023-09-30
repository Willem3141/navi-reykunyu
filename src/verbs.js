/**
 * Functions to conjugate and parse Na'vi verbs.
 *
 * Na'vi verbs have three infix locations.
 *
 * tolängul
 * = t..ul + ["", "ol", "äng"]
 */

module.exports = {
	conjugate: conjugate,
	parse: parse
}

/**
 * Conjugates a verb and returns a conjugation string with six parts:
 *
 * * the part before the prefirst-position infix;
 * * the prefirst-position infix;
 * * the first-position infix;
 * * the part between the first- and second-position infixes;
 * * the second-position infix;
 * * the part after the second-position infix.
 *
 * verb - the verb stem in which infix positions are marked by two dots
 * infixes - an array with three infixes
 */
function conjugate(verb, infixes) {

	let prefirst = infixes[0];
	let first = infixes[1];
	let second = infixes[2];

	// find the two dots
	let firstPos = verb.indexOf(".");
	let secondPos = verb.indexOf(".", firstPos + 1);

	// find the text between the dots
	let beforeFirst = verb.substring(0, firstPos);
	let between = verb.substring(firstPos + 1, secondPos);
	let afterSecond = verb.substring(secondPos + 1);

	if (first === "ìyev") {
		first = "ìyev/iyev";
	}

	// special cases for second infix
	// Horen §2.3.3
	if (second === "ei") {
		if (afterSecond.charAt(0) === "i" || afterSecond.charAt(0) === "ì" ||
				afterSecond.startsWith("ll") || afterSecond.startsWith("rr") ||
				afterSecond.startsWith("(ll)") || afterSecond.startsWith("(rr)")) {
			second = "eiy";
		}
	}
	// Horen §2.3.5.2
	if (second === "äng") {
		if (afterSecond.charAt(0) === "i") {
			second = "äng/eng";
		}
	}

	// http://naviteri.org/2016/07/interviews-questions-comments/
	if (second === "uy") {
		if (between.length && between.charAt(between.length - 1) === "u") {
			second = "y";
		}
	}

	// a special case for "zenke"
	if (afterSecond.substring(0, 3) === "(e)") {
		if (second === "uy" || second === "ats") {
			afterSecond = "e" + afterSecond.substring(3);
		} else {
			afterSecond = afterSecond.substring(3);
		}
	}

	// pseudovowel contraction:
	// * (stressed) ferrrfen -> frrfen
	// * (unstressed) pollltxe -> poltxe (marked as p.(ll)tx.e)
	// Horen §2.3.2
	function handlePseudovowelContraction(pseudovowel, infix) {
		if (between.startsWith('(' + pseudovowel + ')')) {
			if (first === infix) {
				between = between.substring(4);
			} else {
				between = pseudovowel + between.substring(4);
			}
		} else if (between.startsWith(pseudovowel)) {
			if (first === infix) {
				first = '';
			}
		} else if (between === '') {
			if (afterSecond.startsWith('(' + pseudovowel + ')')) {
				if (first === infix && second == '') {
					afterSecond = afterSecond.substring(4);
				} else {
					afterSecond = pseudovowel + afterSecond.substring(4);
				}
			} else if (afterSecond.startsWith(pseudovowel)) {
				if (first === infix && second == '') {
					first = '';
				}
			}
		}
	};

	handlePseudovowelContraction('ll', 'ol');
	handlePseudovowelContraction('rr', 'er');

	return [beforeFirst, prefirst, first, between, second, afterSecond].join('-');
}

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
function parse(word) {
	let candidates = getCandidates(word);
	return candidates;
}

function tryPrefirstInfixes(candidate) {
	let candidates = [];

	candidates.push({...candidate});
	let tryInfix = function (infix, name) {
		let matches = candidate["root"].matchAll(new RegExp(infix, 'g'));
		for (let match of matches) {
			let index = match.index;
			let newInfixes = [...candidate["infixes"]];
			newInfixes[0] = name;
			candidates.push({
				"result": candidate["result"],
				"root": candidate["root"].slice(0, index) + candidate["root"].slice(index + infix.length),
				"infixes": newInfixes
			});
		}
	};

	tryInfix("äp", "äp");
	tryInfix("eyk", "eyk");
	tryInfix("äpeyk", "äpeyk");

	return candidates;
}

function tryFirstInfixes(candidate) {
	let candidates = [];

	candidates.push({...candidate});
	let tryInfix = function (infix, name, replacement) {
		if (!replacement) {
			replacement = '';
		}
		let matches = candidate["root"].matchAll(new RegExp(infix, 'g'));
		for (let match of matches) {
			let index = match.index;
			let newInfixes = [...candidate["infixes"]];
			newInfixes[1] = name;
			candidates.push({
				"result": candidate["result"],
				"root": candidate["root"].slice(0, index) + replacement + candidate["root"].slice(index + infix.length),
				"infixes": newInfixes
			});
		}
	};

	tryInfix("us", "us");
	tryInfix("awn", "awn");

	tryInfix("am", "am");
	tryInfix("ìm", "ìm");
	tryInfix("ìy", "ìy");
	tryInfix("ìsy", "ìsy");
	tryInfix("ay", "ay");
	tryInfix("asy", "asy");

	tryInfix("ol", "ol");
	tryInfix("ol", "ol", "ll");
	tryInfix("ll", "ol", "ll");
	tryInfix("alm", "alm");
	tryInfix("ìlm", "ìlm");
	tryInfix("ìly", "ìly");
	tryInfix("aly", "aly");

	tryInfix("er", "er");
	tryInfix("er", "er", "rr");
	tryInfix("rr", "er", "rr");
	tryInfix("arm", "arm");
	tryInfix("ìrm", "ìrm");
	tryInfix("ìry", "ìry");
	tryInfix("ary", "ary");

	tryInfix("iv", "iv");
	tryInfix("imv", "imv");
	tryInfix("ìyev", "ìyev");
	tryInfix("iyev", "ìyev");

	tryInfix("ilv", "ilv");
	tryInfix("irv", "irv");

	return candidates;
}

function trySecondInfixes(candidate) {
	let candidates = [];

	candidates.push({...candidate});
	let tryInfix = function (infix, name) {
		let matches = candidate["root"].matchAll(new RegExp(infix, 'g'));
		for (let match of matches) {
			let index = match.index;
			let newInfixes = [...candidate["infixes"]];
			newInfixes[2] = name;
			candidates.push({
				"result": candidate["result"],
				"root": candidate["root"].slice(0, index) + candidate["root"].slice(index + infix.length),
				"infixes": newInfixes
			});
		}
	};

	tryInfix("ei", "ei");
	tryInfix("eiy", "ei");
	tryInfix("äng", "äng");
	tryInfix("eng", "äng");
	tryInfix("uy", "uy");
	tryInfix("uye", "uy");  // for z.en.(e)ke
	tryInfix("y", "uy");  // for verbs like nui
	tryInfix("ats", "ats");
	tryInfix("atse", "ats");  // for z.en.(e)ke

	return candidates;
}

function getCandidates(word) {
	let functions = [
		tryPrefirstInfixes,
		tryFirstInfixes,
		trySecondInfixes,
	];

	let candidates = [];
	candidates.push({
		"result": word,
		"root": word,
		"infixes": ["", "", ""]
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

/**
 * Tests if a given word is a correct conjugation for the given form.
 */
function checkCandidate(word, verb, infixes) {
	let conjugation = conjugate(verb, infixes);

	let possibility = conjugation.join('');
	if (word === possibility) {
		return true;
	}

	return false;
}
