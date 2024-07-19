/**
 * Functions to convert numbers into written Na'vi words, and the other way
 * round.
 */

const dialect = require('./dialect')

module.exports = {
	conjugate: conjugate,
	parse: parse
}

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
function conjugate(number) {

	// special cases for numbers out of range
	if (number < 0 || number >= 8 ** 5) {
		return null;
	}
	if (number === 0) {
		return {
			"na'vi": "kew",
			"type": "num",
			"translations": [{ "en": "" + number }]
		}
	}

	const octal = number.toString(8);
	const n = octal.length;
	let result = "";

	for (let i = 0; i < n; i++) {
		const digit = octal[n - i - 1];
		if (digit === "0") {
			continue;
		}
		if (i === 0) {
			if (n === 1) {
				result = units[digit];
			} else {
				result = unitSuffixes[digit];
			}
		} else {
			const prefix = unitPrefixes[digit];
			const shortenPower = result.length > 0 && result[0] !== "a";
			const power = (shortenPower ? powersShortened : powers)[i];
			result = prefix + power + result;
		}
	}
	
	return {
		"na'vi": dialect.makeRaw(result),
		"word": {
			"FN": dialect.combinedToFN(result),
			"combined": result,
			"RN": dialect.combinedToRN(result)
		},
		"type": "num",
		"translations": [{ "en": "" + number }]
	}
}

/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
function parse(word) {
	let result = [];
	// TODO
	return result;
}

