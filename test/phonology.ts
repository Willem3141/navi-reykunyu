import { describe, test } from 'node:test';
import assert from 'node:assert';

import { Word, lower } from '../src/phonology';

function testLenition(input: string, expectedResult: string): void {
	const word = new Word(input);
	const lenited = word.lenite();
	assert.strictEqual(lenited.toString(), expectedResult);
}

describe('phonology functions', () => {

	describe('lower()', () => {
		test('returns the lowercase version of the input', (t) => {
			assert.strictEqual(lower('HI!'), 'hi!');
		});

		test('returns an empty string if the input is an empty string', (t) => {
			assert.strictEqual(lower(''), '');
		});

		test('returns undefined if the input is undefined', (t) => {
			assert.strictEqual(lower(undefined), undefined);
		});
	});

	describe('lenition', () => {
		test('is applied to words starting with an ejective (px/tx/kx)', (t) => {
			testLenition('pxir', 'pir');
			testLenition('txa', 'ta');
			testLenition('kxum', 'kum');
		});

		test('is applied to words starting with a stop (p/t/k/\')', (t) => {
			testLenition('pup', 'fup');
			testLenition('ta', 'sa');
			testLenition('kawng', 'hawng');
			testLenition('\'awkx', 'awkx');
		});

		test('is applied to words starting with an affricate (ts)', (t) => {
			testLenition('tseng', 'seng');
		});

		test('is not applied to words starting with a fricative (f/s/h)', (t) => {
			testLenition('few', 'few');
			testLenition('swok', 'swok');
			testLenition('hay', 'hay');
		});

		test('is not applied to words starting with another consonant', (t) => {
			testLenition('lor', 'lor');
			testLenition('mo', 'mo');
			testLenition('nga', 'nga');
			testLenition('nun', 'nun');
			testLenition('rel', 'rel');
			testLenition('vol', 'vol');
			testLenition('win', 'win');
			testLenition('zun', 'zun');
		});

		test('is not applied to words starting with a vowel', (t) => {
			testLenition('a/[u]/ngi/a', 'a/[u]/ngi/a');
			testLenition('ä/[txä]/le', 'ä/[txä]/le');
			testLenition('[el]/tu', '[el]/tu');
			testLenition('i/[o]/ang', 'i/[o]/ang');
			testLenition('ì/[he]/yu', 'ì/[he]/yu');
			testLenition('o/[a]/re', 'o/[a]/re');
			testLenition('[u]/ran', '[u]/ran');
		});

		test('is not applied to words starting with \'ll and \'rr', (t) => {
			testLenition('[\'ll]/ngo', '[\'ll]/ngo');
			testLenition('[\'rr]/ta', '[\'rr]/ta');
		});

		test('still works if the word starts with a stressed syllable', (t) => {
			testLenition('[pxun]/til', '[pun]/til');
			testLenition('[txo]/lar', '[to]/lar');
			testLenition('[kxe]/yey', '[ke]/yey');
		});

		test('still works if the word starts with an uppercase letter, and preserves the uppercase', (t) => {
			testLenition('Pxir', 'Pir');
			testLenition('[Tu]/te', '[Su]/te');
			testLenition('[Kel]/ku', '[Hel]/ku');
			testLenition('[Pi]/za/yu', '[Fi]/za/yu');
			testLenition('\'Awkx', 'Awkx');
			testLenition('Tseng', 'Seng');
		});
	});
});
