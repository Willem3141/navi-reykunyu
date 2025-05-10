/**
 * Handling of strings with word links in them.
 * 
 * In Reykunyu's data, fields (such as etymology and meaning_note) may contain
 * references to other words in the form of word links such as "[kaltxì:intj]".
 * The format is an open bracket, the word, a colon, the word type, and a close
 * bracket.
 * 
 * When displaying these fields it is useful to include the meaning, so that a
 * meaning_note like "See also [kaltxì:intj]." gets displayed as something like
 * "See also → kaltxì (hello)." including a link to the word kaltxì so that
 * can find more information if necessary.
 * 
 * This file provides a function that finds word links in a string and enriches
 * them with (an abridged version) of the data for the corresponding word. The
 * output is an array that contains strings (for textual parts of the original
 * string, which are not word links) and objects (the data corresponding to a
 * word link). For example:
 * 
 * ```
 * [
 *     "See also ",
 *     {
 *         "na'vi": "kaltxì",
 *         "type": "intj",
 *         "translations": [...],
 *     }
 *     ".",
 * ]
 * ```
 */

import Dictionary from './dictionary';
import * as output from './output';

// Replaces word links in the given string.
// \param originWord The word that contains the data we're calling this function
// for. This is for error reporting.
// \param dataErrors A list of errors that a (potential) error will be appended
// to.
export function enrichWordLinks(d: Dictionary, text: string, originWord: string, dataErrors: string[]): LinkString {

	// matches word links between brackets
	const wordLinkRegex = /\[([^:\]]+):([^\]]+)\]/g;
	let pieces = text.split(wordLinkRegex);

	let list: LinkString = [];
	for (let i = 0; i < pieces.length; i++) {
		if (i % 3 === 0) {
			// string piece: just place it into the list
			list.push(pieces[i]);
		} else {
			// regex-matched piece: get object from dictionary
			const navi = pieces[i];
			const type = pieces[i + 1];
			const key = navi + ':' + type;
			const word = d.get(navi, type, 'FN');
			if (word) {
				list.push(stripToLinkData(word));
			} else {
				list.push('[' + key + ']');
				dataErrors.push('Invalid reference to [' + key + '] in word link for [' + originWord + ']');
			}
			i++;  // skip type
		}
	}
	return list;
}

// Given a word object, returns an object that contains only the word data
// relevant when making a word link (Na'vi word, type, and translations).
// Calling this function makes the returned data smaller, and avoids potential
// infinite loops if two words happen to have word links to each other.
export function stripToLinkData(word: WordData): WordData {
	let result: WordData = {
		"id": word["id"],
		"word": word["word"],
		"word_raw": word["word_raw"],
		"na'vi": word["na'vi"],
		"type": word["type"],
		"translations": word["translations"]
	};
	if (word.hasOwnProperty("short_translation")) {
		result["short_translation"] = word["short_translation"];
	}
	return result;
}
