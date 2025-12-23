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
		etymology?: LinkString | undefined, dialect?: Dialect): string | null {
	if (form === "postnoun") {
		if (adjective === 'kea') {
			// Special case: kea doesn't have any postnoun form. It can only be used before the noun.
			return null;
		} else if (adjective.charAt(0) === "a" && dialect !== 'RN') {
			return "a:" + adjective.substring(1) + ":";
		} else if (etymology && isLeAdjective(etymology)) {
			return "(a):" + adjective + ":";
		} else {
			return "a:" + adjective + ":";
		}
	} else if (form === "prenoun") {
		if (adjective === 'kea') {
			// Special case: kea already has the -a "baked in".
			return ':ke:a';
		}  else if (adjective.charAt(adjective.length - 1) === "a" && dialect !== 'RN') {
			return ":" + adjective.slice(0, -1) + ":a";
		} else {
			return ":" + adjective + ":a";
		}
	} else {  // predicative
		return ":" + adjective + ":";
	}
}

function isLeAdjective(etymology: LinkString): boolean {
	return etymology.includes('[le:aff:pre]');
}

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
export function parse(word: string): AdjectiveConjugationStep[] {

	let candidates: Omit<AdjectiveConjugationStep, 'result'>[] = [{
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
		if (conjugation === null) {
			continue;
		}
		if (!conjugationString.stringAdmits(conjugation, word)) {
			candidate["correction"] = word;
		}
		result.push({
			'root': candidates[i]['root'],
			'form': candidates[i]['form'],
			'result': conjugationString.formsFromString(conjugation)
		});
	}

	return result;
}
