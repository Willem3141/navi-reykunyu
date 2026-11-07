import { describe, test } from 'node:test';
import assert from 'node:assert';

import { setLanguage, _, PluralPattern } from '../src/translations';

describe('UI translations', () => {

	describe('the main translation function _', () => {
		test('outputs in the currently set language', (t) => {
			setLanguage('en');
			assert.strictEqual(_('language'), 'English');
			setLanguage('de');
			assert.strictEqual(_('language'), 'Deutsch');
		});

		test('outputs in English if the string doesn\'t exist in the requested language', (t) => {
			setLanguage('en');
			assert.strictEqual(_('language'), 'English');
			setLanguage('non-existing');
			assert.strictEqual(_('language'), 'English');
		});
	});

	describe('plurality patterns', () => {
		test('generating checkers', (t) => {
			assert.deepEqual(new PluralPattern('n == 1').checkerFor(0), ['n', 1, '==']);
			assert.deepEqual(new PluralPattern('n != 1').checkerFor(0), ['n', 1, '!=']);
			assert.deepEqual(new PluralPattern('n > 1').checkerFor(0), ['n', 1, '>']);
			assert.deepEqual(new PluralPattern('n >= 1').checkerFor(0), ['n', 1, '>=']);
			assert.deepEqual(new PluralPattern('n < 1').checkerFor(0), ['n', 1, '<']);
			assert.deepEqual(new PluralPattern('n <= 1').checkerFor(0), ['n', 1, '<=']);

			assert.deepEqual(new PluralPattern('n == 42').checkerFor(0), ['n', 42, '==']);
			assert.deepEqual(new PluralPattern('n == 42 % 3').checkerFor(0), ['n', 42, 3, '%', '==']);
			assert.deepEqual(new PluralPattern('n % 7 == 3').checkerFor(0), ['n', 7, '%', 3, '==']);

			assert.deepEqual(new PluralPattern('n > 13 && n % 8 < 4').checkerFor(0), ['n', 13, '>', 'n', 8, '%', 4, '<', '&&']);

			assert.deepEqual(new PluralPattern('n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)').checkerFor(0),
				['n', 10, '%', 2, '>=', 'n', 10, '%', 4, '<=', '&&', 'n', 100, '%', 10, '<', 'n', 100, '%', 20, '>=', '||', '&&']);
		});

		test('evaluating for number inputs', (t) => {
			let polishPattern = new PluralPattern('n == 1; n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)');
			assert.strictEqual(polishPattern.evaluate(0), 2);
			assert.strictEqual(polishPattern.evaluate(1), 0);
			assert.strictEqual(polishPattern.evaluate(2), 1);
			assert.strictEqual(polishPattern.evaluate(3), 1);
			assert.strictEqual(polishPattern.evaluate(4), 1);
			assert.strictEqual(polishPattern.evaluate(5), 2);
			assert.strictEqual(polishPattern.evaluate(10), 2);
			assert.strictEqual(polishPattern.evaluate(11), 2);
			assert.strictEqual(polishPattern.evaluate(12), 2);
			assert.strictEqual(polishPattern.evaluate(13), 2);
			assert.strictEqual(polishPattern.evaluate(14), 2);
			assert.strictEqual(polishPattern.evaluate(15), 2);
			assert.strictEqual(polishPattern.evaluate(20), 2);
			assert.strictEqual(polishPattern.evaluate(21), 2);
			assert.strictEqual(polishPattern.evaluate(22), 1);
			assert.strictEqual(polishPattern.evaluate(23), 1);
			assert.strictEqual(polishPattern.evaluate(24), 1);
			assert.strictEqual(polishPattern.evaluate(25), 2);
		});
	});
});
