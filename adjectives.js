/**
 * Functions to conjugate and parse Na'vi adjectives.
 * 
 * Na'vi adjectives are very simple: they can have three forms, the predicative
 * (= dictionary) form, the prenoun form (with the suffix -a), and the postnoun
 * form (with the prefix a-).
 */

module.exports = {
	conjugate: conjugate,
	parse: parse
}

/**
 * Conjugates an adjective.
 * 
 * adjective - the adjective stem
 * form - the form to conjugate into: "predicative", "prenoun", or "postnoun"
 */
function conjugate(adjective, form) {
	if (form === "predicative") {
		return "-" + adjective + "-";
	} else if (form === "postnoun") {
		if (adjective.charAt(0) === "a") {
			return "a-" + adjective.substring(1) + "-";
		} else if (adjective.substring(0, 2) === "le" && adjective.length >= 4) {
			return "(a-)" + adjective + "-";
		} else {
			return "a-" + adjective + "-";
		}
	} else if (form === "prenoun") {
		if (adjective.charAt(adjective.length - 1) === "a") {
			return "-" + adjective.slice(0, -1) + "-a";
		} else {
			return "-" + adjective + "-a";
		}
	}
}

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
function parse(word) {

	let result = [{
		"result": word,
		"root": word,
		"form": 'predicative'
	}];

	if (word.charAt(0) === "a") {
		result.push({
			"result": word,
			"root": word.substring(1),
			"form": 'postnoun'
		});
		result.push({
			"result": word,
			"root": word,
			"form": 'postnoun'
		});
	} else if (word.substring(0, 2) === "le") {
		result.push({
			"result": word,
			"root": word,
			"form": 'postnoun'
		});
	}

	if (word.charAt(word.length - 1) === "a") {
		result.push({
			"result": word,
			"root": word.slice(0, -1),
			"form": 'prenoun'
		});
		result.push({
			"result": word,
			"root": word,
			"form": 'prenoun'
		});
	}

	return result;
}

