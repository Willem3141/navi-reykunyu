/**
 * Functions to conjugate and parse Na'vi verbs.
 * 
 * Na'vi verbs have three infix locations.
 */

module.exports = {
	conjugate: conjugate//,
	//parse: parse
}

/**
 * Conjugates a verb. Returns an array with six elements as detailed
 * above.
 *
 * verb - the verb stem in which infix positions are marked by two dots
 * infixes - an array with three infixes
 */
function conjugate(verb, infixes) {

	let prefirst = infixes[0];
	let first = infixes[1];
	let second = infixes[2];

	// find the two dots
	let firstPos = root.indexOf(".");
	let secondPos = root.indexOf(".", firstPos + 1);

	// find the text between the dots
	let beforeFirst = root.substring(0, firstPos);
	let between = root.substring(firstPos + 1, secondPos);
	let afterSecond = root.substring(secondPos + 1);

	// a special case for "zenke"
	if (afterSecond.substring(0, 3) === "(e)") {
		if (second === "uy" || second === "ats") {
			afterSecond = "e" + afterSecond.substring(3);
		} else {
			afterSecond = afterSecond.substring(3);
		}
	}

	// TODO: handle verbs like plltxe -> poltxe

	return [beforeFirst, prefirst, first, between, second, afterSecond];
}

