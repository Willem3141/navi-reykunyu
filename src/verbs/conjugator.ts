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
export function conjugate(verb: string, infixes: [string, string, string]) {

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
	function handlePseudovowelContraction(pseudovowel: string, infix: string): void {
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
