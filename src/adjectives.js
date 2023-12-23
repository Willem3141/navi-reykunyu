/**
 * Functions to conjugate and parse Na'vi adjectives.
 *
 * Na'vi adjectives are very simple: they can have three forms, the predicative
 * (= dictionary) form, the prenoun form (with the suffix -a), and the postnoun
 * form (with the prefix a-).
 */

const conjugationString = require("./conjugationString");

module.exports = {
	conjugate: conjugate,
	parse: parse
}

/**
 * Conjugates an adjective.
 *
 * adjective - the adjective stem
 * form - the form to conjugate into: "predicative", "prenoun", or "postnoun"
 * etymology - (optional) the etymology string, used to determine if the
 * adjective starts with the le- prefix
 */
function conjugate(adjective, form, etymology) {
	if (form === "predicative") {
		return "-" + adjective + "-";
	} else if (form === "postnoun") {
		if (adjective.charAt(0) === "a") {
			return "a-" + adjective.substring(1) + "-";
		} else if (etymology && etymology.indexOf('[le:aff:pre]') !== -1) {
			return "(a)-" + adjective + "-";
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

	let candidates = [{
		"result": word,
		"root": word,
		"form": 'predicative'
	}];

	if (word.charAt(0) === "a") {
		candidates.push({
			"result": word,
			"root": word.substring(1),
			"form": 'postnoun'
		});
		candidates.push({
			"result": word,
			"root": word,
			"form": 'postnoun'
		});
	} else if (word.substring(0, 2) === "le") {
		candidates.push({
			"result": word,
			"root": word,
			"form": 'postnoun'
		});
	}

	if (word.charAt(word.length - 1) === "a") {
		candidates.push({
			"result": word,
			"root": word.slice(0, -1),
			"form": 'prenoun'
		});
		candidates.push({
			"result": word,
			"root": word,
			"form": 'prenoun'
		});
	}

	let result = [];
	for (let i = 0; i < candidates.length; i++) {
		const candidate = candidates[i];
		let conjugation = conjugate(candidate["root"], candidate["form"]);
		if (!conjugationString.stringAdmits(conjugation, candidate["result"])) {
			candidate["correction"] = candidate["result"];
		}
		candidate["result"] = conjugationString.formsFromString(conjugation);
		result.push(candidates[i]);
	}

	return result;
}

