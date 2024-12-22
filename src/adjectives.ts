/**
 * Functions to conjugate and parse Na'vi adjectives.
 *
 * Na'vi adjectives are very simple: they can have three forms, the predicative
 * (= dictionary) form, the prenoun form (with the suffix -a), and the postnoun
 * form (with the prefix a-).
 */

import * as conjugationString from "./conjugationString";

/**
 * Conjugates an adjective.
 *
 * adjective - the adjective stem
 * form - the form to conjugate into: "predicative", "prenoun", or "postnoun"
 * etymology - (optional) the etymology string, used to determine if the
 * adjective starts with the le- prefix
 */
export function conjugate(adjective: string, form: 'predicative' | 'prenoun' | 'postnoun',
		etymology?: string, dialect?: Dialect): string {
	if (form === "postnoun") {
		if (adjective.charAt(0) === "a" && dialect !== 'RN') {
			return "a-" + adjective.substring(1) + "-";
		} else if (etymology && etymology.indexOf('[le:aff:pre]') !== -1) {
			return "(a)-" + adjective + "-";
		} else {
			return "a-" + adjective + "-";
		}
	} else if (form === "prenoun") {
		if (adjective.charAt(adjective.length - 1) === "a" && dialect !== 'RN') {
			return "-" + adjective.slice(0, -1) + "-a";
		} else {
			return "-" + adjective + "-a";
		}
	} else {  // predicative
		return "-" + adjective + "-";
	}
}

type ParsedAdjective = {
	'result'?: string[],
	'root': string,
	'form': 'predicative' | 'prenoun' | 'postnoun',
	'correction'?: string
};

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
export function parse(word: string): ParsedAdjective[] {

	let candidates: ParsedAdjective[] = [{
		"root": word,
		"form": 'predicative'
	}];

	if (word.charAt(0) === "a") {
		candidates.push({
			"root": word.substring(1),
			"form": 'postnoun'
		});
		candidates.push({
			"root": word,
			"form": 'postnoun'
		});
	} else if (word.substring(0, 2) === "le") {
		candidates.push({
			"root": word,
			"form": 'postnoun'
		});
	}

	if (word.charAt(word.length - 1) === "a") {
		candidates.push({
			"root": word.slice(0, -1),
			"form": 'prenoun'
		});
		candidates.push({
			"root": word,
			"form": 'prenoun'
		});
	}

	let result = [];
	for (let i = 0; i < candidates.length; i++) {
		const candidate = candidates[i];
		let conjugation = conjugate(candidate["root"], candidate["form"]);
		if (!conjugationString.stringAdmits(conjugation, word)) {
			candidate["correction"] = word;
		}
		candidate["result"] = conjugationString.formsFromString(conjugation);
		result.push(candidates[i]);
	}

	return result;
}

