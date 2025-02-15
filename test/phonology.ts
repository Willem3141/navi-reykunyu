import { describe, test } from 'node:test';
import assert from 'node:assert';

import * as phonology from '../src/phonology';

function testLenition(input: string, expectedLenitedConsonant: string, expectedRest: string): void {
	const [lenitedConsonant, rest] = phonology.lenite(input);
	assert.strictEqual(lenitedConsonant, expectedLenitedConsonant);
	assert.strictEqual(rest, expectedRest);
}

describe('phonology functions', () => {

	describe('lenition', () => {
		test('is applied to words starting with an ejective (px/tx/kx)', (t) => {
			testLenition('pxir', 'p', 'ir');
			testLenition('txele', 't', 'ele');
			testLenition('kxumpay', 'k', 'umpay');
		});

		test('is applied to words starting with a stop (p/t/k/\')', (t) => {
			testLenition('pizayu', 'f', 'izayu');
			testLenition('tute', 's', 'ute');
			testLenition('kelku', 'h', 'elku');
			testLenition('\'awkx', '', 'awkx');
		});

		test('is applied to words starting with an affricate (ts)', (t) => {
			testLenition('tseng', 's', 'eng');
		});

		test('is not applied to words starting with a fricative (f/s/h)', (t) => {
			testLenition('fahew', '', 'fahew');
			testLenition('swirä', '', 'swirä');
			testLenition('haway', '', 'haway');
		});

		test('is not applied to words starting with another consonant', (t) => {
			testLenition('loreyu', '', 'loreyu');
			testLenition('mo', '', 'mo');
			testLenition('ngoa', '', 'ngoa');
			testLenition('numtseng', '', 'numtseng');
			testLenition('rel', '', 'rel');
			testLenition('vitra', '', 'vitra');
			testLenition('wion', '', 'wion');
			testLenition('zoplo', '', 'zoplo');
		});

		test('is not applied to words starting with a vowel', (t) => {
			testLenition('aungia', '', 'aungia');
			testLenition('ätxäle', '', 'ätxäle');
			testLenition('eltu', '', 'eltu');
			testLenition('ioang', '', 'ioang');
			testLenition('ìheyu', '', 'ìheyu');
			testLenition('oare', '', 'oare');
			testLenition('uran', '', 'uran');
		});

		test('is not applied to words starting with \'ll and \'rr', (t) => {
			testLenition('\'llngo', '', '\'llngo');
			testLenition('\'rrta', '', '\'rrta');
		});

		test('still works if the word starts with an uppercase letter, and preserves the uppercase', (t) => {
			testLenition('Pxir', 'P', 'ir');
			testLenition('Tute', 'S', 'ute');
			testLenition('Kelku', 'H', 'elku');
			testLenition('Pizayu', 'F', 'izayu');
			testLenition('Tute', 'S', 'ute');
			testLenition('Kelku', 'H', 'elku');
			testLenition('\'Awkx', '', 'Awkx');
			testLenition('Tseng', 'S', 'eng');
		});
	});
});
