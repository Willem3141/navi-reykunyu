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
 * This file provides a function that finds word links in a string and adds (an
 * abridged version of) the data for the corresponding word to the `references`
 * field of the word data. For example, for a word with the meaning_note above,
 * it'll add a `references` field like this:
 * 
 * ```
 * {
 *     ...,
 *     references: {
 *         "kaltxì:intj": {
 *             "na'vi": "kaltxì",
 *             "type": "intj",
 *             "translations": [...],
 *         }
 *     }
 * }
 * ```
 */

import Dictionary from './dictionary';

const wordLinkRegex = /\[([^:\]]+):([^\]]+)\]/g;

/**
 * Calls user-specified functions for each piece of text and each reference in
 * the given link string.
 * @param textVisitor Function that is called for each piece of text.
 * @param referenceVisitor Function that is called for each reference.
 */
export function visitLinkString(linkString: LinkString,
	                            textVisitor: (text: string) => void,
	                            referenceVisitor: (word: string, type: string) => void) {
	let pieces = linkString.split(wordLinkRegex);
	for (let i = 0; i < pieces.length; i++) {
		if (i % 3 === 0) {
			// string piece
			textVisitor(pieces[i]);
		} else {
			// regex-matched piece: get object from dictionary
			const word = pieces[i];
			const type = pieces[i + 1];
			referenceVisitor(word, type);
			i++;  // skip type
		}
	}
}

/**
 * Adds references for word links in the given string.
 * @param dataErrors A list of errors that (potential) errors will be appended
 * to.
 */
export function addReferencesForLinkString(d: Dictionary, word: WordData, linkString: LinkString, dataErrors: DataIssue[]): void {
	visitLinkString(linkString,
		(text: string) => {},
		(referencedWord: string, type: string) => {
			const data = d.get(referencedWord, type, 'FN');
			if (data !== null) {
				if (word['references'] === undefined) {
					word['references'] = {};
				}
				word['references'][referencedWord + ':' + type] = stripToLinkData(data);
			} else {
				dataErrors.push({word_id:word["id"], word:word['na\'vi'],type:'error', message: 'Invalid reference [' + referencedWord + ':' + type + ']'});
			}
		}
	);
}

/**
 * Given a word object, returns an object that contains only the word data
 * relevant when making a word link (Na'vi word, type, and translations).
 * Calling this function makes the returned data smaller, and avoids potential
 * infinite loops if two words happen to have word links to each other.
 */
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
