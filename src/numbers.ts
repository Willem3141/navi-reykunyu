/**
 * Functions to convert numbers into written Na'vi words, and the other way
 * round.
 */

import { makeRaw, combinedToFN, combinedToRN } from './dialect';

const units = ["", "'aw", "mune", "pxey", "tsìng", "mrr", "pukap", "kinä"];
const unitSuffixes = ["", "aw", "mun", "pey", "sìng", "mrr", "fu", "hin"];
const unitPrefixes = ["", "", "me/", "pxe/", "tsì/", "mrr/", "pu/", "ki/"];
const powers = ["", "vo/l", "za/m", "vo/za/m", "za/za/m"];
const powersShortened = ["", "vo/", "za/", "vo/za/", "za/za/"];

/**
 * Generates a Na'vi number.
 * 
 * number - The number to convert.
 */
export function conjugate(number: number): WordData | null {

	// special cases for numbers out of range
	if (number < 0 || number >= 8 ** 5) {
		return null;
	}
	if (number === 0) {
		return generateNumberEntry(number, "kew");
	}

	const octal = number.toString(8);
	const n = octal.length;
	let result = "";

	for (let i = 0; i < n; i++) {
		const digit = octal[n - i - 1];
		if (digit === "0") {
			continue;
		}
		const d = parseInt(digit, 10);
		if (i === 0) {
			if (n === 1) {
				result = units[d];
			} else {
				result = unitSuffixes[d];
			}
		} else {
			const prefix = unitPrefixes[d];
			const shortenPower = result.length > 0 && result[0] !== "a";
			const power = (shortenPower ? powersShortened : powers)[i];
			result = prefix + power + result;
		}
	}

	return generateNumberEntry(number, result);
}

function generateNumberEntry(number: number, result: string): WordData {
	return {
		"id": -1,
		"na'vi": makeRaw(result),
		"word": {
			"FN": combinedToFN(result),
			"combined": result,
			"RN": combinedToRN(result)
		},
		"word_raw": {
			"FN": makeRaw(combinedToFN(result)),
			"combined": makeRaw(result),
			"RN": makeRaw(combinedToRN(result)),
		},
		"type": "num",
		"translations": [{ "en": "" + number }]
	}
}

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
export function parse(word: string): unknown {
	let result: unknown[] = [];
	// TODO
	return result;
}

