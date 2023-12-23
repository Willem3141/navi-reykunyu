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

module.exports = {
	enrichWordLinks: enrichWordLinks,
	stripToLinkData: stripToLinkData
}

// Replaces word links in a string by dictionary objects.
function enrichWordLinks(text, dictionary) {

	// matches word links between brackets
	const wordLinkRegex = /\[([^:\]]+):([^\]]+)\]/g;
	pieces = text.split(wordLinkRegex);

	let list = [];
	for (let i = 0; i < pieces.length; i++) {
		if (i % 3 === 0) {
			// string piece: just place it into the list
			list.push(pieces[i]);
		} else {
			// regex-matched piece: get object from dictionary
			const navi = pieces[i];
			const type = pieces[i + 1];
			const key = navi + ':' + type;
			if (dictionary.hasOwnProperty(key)) {
				list.push(stripToLinkData(dictionary[key]));
			} else {
				console.log('Invalid reference to [' + key + ']');
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
function stripToLinkData(word) {
	let result = {
		"na'vi": word["na'vi"],
		"type": word["type"],
		"translations": word["translations"]
	};
	if (word.hasOwnProperty("short_translation")) {
		result["short_translation"] = word["short_translation"];
	}
	return result;
}
