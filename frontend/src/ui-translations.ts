type Strings = { [language: string]: { [key: string]: string } };
const strings: Strings = {/* filled out by the server */};

$(function () {
	// initialize the language dropdown
	const $dropdown = $('#language-dropdown');
	if ($dropdown.length) {
		$dropdown.dropdown();
		if (localStorage.getItem('reykunyu-language')) {
			$dropdown.dropdown('set selected',
				localStorage.getItem('reykunyu-language'));
		} else {
			localStorage.setItem('reykunyu-language', 'en');
			$dropdown.dropdown('set selected', 'en');
		}
		$dropdown.dropdown({
			onChange: setNewLanguage
		});
	}

	// If the page was loaded offline from the service worker, or it was loaded
	// from the browser cache after a tab unload, it may not have the correct
	// language. So we immediately trigger a language update, just in case. If
	// the language was already correct, this won't do anything.
	setNewLanguage(localStorage.getItem('reykunyu-language')!);
});

function setNewLanguage(value: string): void {
	localStorage.setItem('reykunyu-language', value);
	document.cookie = 'lang=' + value;  // note that this removes all other cookies (but we don't set any)
	$('.translation').each(function() {
		let $element = $(this);
		let args: number[] = [];
		for (let i = 1; $element.attr('data-arg-' + i); i++) {
			args.push(parseInt($element.attr('data-arg-' + i)!, 10));
		}
		$element.html(_($element.attr('data-key')!, ...args));
	});
	$('[data-content-key]').each(function() {
		let $element = $(this);
		$element.attr('data-content', _($element.attr('data-content-key')!));
	});
}

function getLanguage(): string {
	const languageFromLocalStorage = localStorage.getItem('reykunyu-language');
	if (languageFromLocalStorage) {
		return languageFromLocalStorage;
	} else {
		return 'en';
	}
}

// TODO This class is copied from src/translations.ts (the server-side
// translations code). This is clearly not ideal, but it turns out to be hard to
// make one TS file that works for both server- and client-side.
class PluralPattern {

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

function _(key: string, ...parameters: number[]): string {
	const lang = getLanguage();
	if (strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(key)) {
		return fillInParameters(strings[lang][key], lang, parameters);
	} else if (strings['en'].hasOwnProperty(key)) {
		return fillInParameters(strings['en'][key], 'en', parameters);
	} else {
		return '[' + key + ']';
	}
}

let pluralPatterns: { [language: string]: PluralPattern } = {};
for (let language in strings) {
	try {
		pluralPatterns[language] = new PluralPattern(strings[language]['plurality-pattern']);
	} catch (e) {
		console.log('Invalid plurality pattern \'' + strings[language]['plurality-pattern'] + '\' for language ' + language);
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
