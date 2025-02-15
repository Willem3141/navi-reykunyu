/**
 * Reykunyu's UI translation system. Reykunyu renders its templates server-side
 * but it also needs to have access to translations in the client-side JS,
 * because parts of the UI are rendered client-side. This also allows language
 * changes to be handled without a page reload.
 * 
 * The translations are loaded from a simple JSON file, `src/translations.json`,
 * which for each language contains a set of keys and strings.
 * 
 * On the server-side, use the function `_` to get a translation, or `span_`
 * when inserting something in HTML that needs to be re-rendered on the
 * client-side when the user changes the language.
 * 
 * On the client-side, there also is a function `_` available, which is used the
 * same way. This function is provided by `ui-translations.js`. The server
 * pastes the translation JSON into this JS file, so that the exact same
 * translations are available, no matter if things are rendered server- or
 * client-side.
 */

import fs from 'fs';

import * as output from './output';

let stringsJSON: string;
try {
	stringsJSON = fs.readFileSync('./src/translations.json', 'utf8');
} catch (e) {
	output.error('translations.json not found, exiting');
	process.exit(1);
}
const strings: { [language: string]: { [key: string]: string } } = JSON.parse(stringsJSON);

/** The active language. */
let lang = 'en';

/** Sets the active language to the given ISO code. */
export function setLanguage(l: string): void {
	lang = l;
}

/** Returns the ISO code of the active language. */
export function getLanguage(): string {
	return lang;
}

/** Returns the translation for the active language for the given key. */
export function _(key: string): string {
	if (strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(key)) {
		return strings[lang][key];
	} else if (strings['en'].hasOwnProperty(key)) {
		return strings['en'][key];
	} else {
		return '[' + key + ']';
	}
}

/** Returns a translation with a translation <span> around it. */
export function span_(key: string): string {
	return '<span class="translation" data-key="' + key + '">' + _(key) + '</span>';
}

/** Returns the JSON with the translations. */
export function getStringsJSON(): string {
	return stringsJSON;
}
