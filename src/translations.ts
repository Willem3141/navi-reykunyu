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
type Strings = { [language: string]: { [key: string]: string } };
const strings: Strings = JSON.parse(stringsJSON);

/**
 * A plural pattern is a function that maps an input number (which is to be
 * inserted into a translated string) to the index of its plurality form. For
 * example, for English `n == 1` results in 0 (= singular), while any other `n`
 * results in 1 (= plural). Other languages may have different behavior.
 */
export class PluralPattern {

	private checkers: (string|number)[][] = [];

	/**
	 * Generates a plural pattern based on a string representation such as
	 * "n == 1; n == 2; n == 3".
	 */
	constructor(pattern: string) {
		const forms = pattern.split(';').map((s: string) => s.trim());
		for (let form of forms) {
			this.checkers.push(this.parseForm(form));
		}
	}

	private lexerRegex = / |\d+|n|&&|\|\||==|!=|<=|>=|[()<>%]/g;

	/**
	 * Lexes the input string into tokens.
	 */
	private *tokenize(form: string): Generator<string> {
		let matches = form.matchAll(this.lexerRegex);
		if (!matches) {
			return;
		}
		let i = 0;
		for (let match of matches) {
			if (match.index !== i) {
				throw Error('invalid plural pattern ' + form + ' (position ' + i + ')');
			}
			i += match[0].length;
			if (match[0] !== ' ') {
				yield match[0];
			}
		}
	}

	private operatorPrecedence: Record<string, number> = {
		'%': 2,
		'==': 1, '!=': 1, '<': 1, '>': 1, '<=': 1, '>=': 1,
		'&&': 0, '||': 0
	};

	private parseForm(form: string): (string|number)[] {
		// Use a simple shunting yard parser to turn the string into RPN.
		let spur: (string|number)[] = ['('];
		let output: (string | number)[] = [];

		for (let token of this.tokenize(form)) {
			let integer: number;
			if (token === 'n') {
				output.push('n');
			} else if (!Number.isNaN(integer = parseInt(token, 10))) {
				output.push(integer);
			} else if (token === '(') {
				spur.push('(');
			} else if (token === ')') {
				while (spur[spur.length - 1] !== '(') {
					output.push(spur.pop()!);
				}
				spur.pop();
			} else {  // token is an operator
				while (spur[spur.length - 1] !== '(' &&
						this.operatorPrecedence[token] <= this.operatorPrecedence[spur[spur.length - 1]]) {
					output.push(spur.pop()!);
				}
				spur.push(token);
			}
		}

		while (spur.length > 1) {  // leave the sentinel '('
			output.push(spur.pop()!);
		}

		return output;
	}

	checkerFor(i: number): (string | number)[] {
		return this.checkers[i];
	}

	evaluate(n: number): number {
		for (let i = 0; i < this.checkers.length; i++) {
			if (this.evaluateStackCode(n, this.checkers[i])) {
				return i;
			}
		}
		return this.checkers.length;
	}

	private evaluateStackCode(n: number, code: (string|number)[]): boolean {
		let stack: number[] = [];
		for (let i = 0; i < code.length; i++) {
			let op = code[i];
			if (op === 'n') {
				stack.push(n);
			} else if (typeof op === 'number') {
				stack.push(op);
			} else {
				let i2 = stack.pop()!;
				let i1 = stack.pop()!;
				if (op === '%') {
					stack.push(i1 % i2);
				} else {
					let result =
						op === '==' ? i1 === i2 :
						op === '!=' ? i1 !== i2 :
						op === '<' ? i1 < i2 :
						op === '>' ? i1 > i2 :
						op === '<=' ? i1 <= i2 :
						op === '>=' ? i1 >= i2 :
						op === '&&' ? i1 && i2 : i1 || i2;
					stack.push(result ? 1 : 0);
				}
			}
		}
		return stack.pop() != 0;
	}
}

let pluralPatterns: { [language: string]: PluralPattern } = {};
for (let language in strings) {
	try {
		pluralPatterns[language] = new PluralPattern(strings[language]['plurality-pattern']);
	} catch (e) {
		output.warning('Invalid plurality pattern \'' + strings[language]['plurality-pattern'] + '\' for language ' + language);
		output.hint('Reykunyu expects, for each UI language, a value \'plurality-pattern\'\n' +
			'that specifies the plural forms the language has. This value is either\n' +
			'not present or syntactically invalid.',
			'invalid-plurality-pattern');
	}
}

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
export function _(key: string, ...parameters: number[]): string {
	if (strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(key)) {
		return fillInParameters(strings[lang][key], lang, parameters);
	} else if (strings['en'].hasOwnProperty(key)) {
		return fillInParameters(strings['en'][key], 'en', parameters);
	} else {
		return '[' + key + ']';
	}
}

let substitutionRegex = /\[\[((?:(?!\]\]).)*)\]\]/g;

function fillInParameters(text: string, language: string, parameters: number[]): string {
	let result = text;
	result = result.replace(substitutionRegex, (match: string, inside: string) => {
		let percentIndex = inside.indexOf('%');
		if (percentIndex === -1 || percentIndex === inside.length - 1) {
			return match;
		}
		let digit = parseInt(inside[percentIndex + 1], 10) - 1;
		if (isNaN(digit) || digit < 0 || digit >= parameters.length) {
			return match;
		}
		let parameter = parameters[digit];
		let pluralPattern = pluralPatterns[language];
		if (!pluralPattern) {
			return match;
		}
		let pluralIndex = pluralPattern.evaluate(parameter);
		let result = inside.split('|')[pluralIndex];
		return result ?? match;
	});
	for (let i = 0; i < parameters.length; i++) {
		result = result.replaceAll('%' + (i + 1), '' + parameters[i]);
	}
	return result;
}

/** Returns a translation with a translation <span> around it. */
export function span_(key: string, ...parameters: number[]): string {
	return '<span class="translation" data-key="' + key + '"' +
		parameters.map((n: number, i: number) => ' data-parameter-' + i + '="' + n + '"').join()
		+ '>' + _(key, ...parameters) + '</span>';
}

function escapeHTMLAttribute(attribute: string) {
	return attribute.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('&', '&amp;');
}

/**
 * Returns an HTML snippet with two attributes: data-content containing the
 * translation, and data-content-key with the key. This is meant for tooltips.
 */
export function data_(key: string): string {
	return 'data-content-key="' + key + '" data-content="' + escapeHTMLAttribute(_(key)) + '"';
}

/** Returns the JSON with the translations. */
export function getStringsJSON(): string {
	return stringsJSON;
}
