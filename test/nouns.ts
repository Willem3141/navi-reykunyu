import { describe, test } from 'node:test';
import assert from 'node:assert';

import { conjugate } from '../src/nouns/conjugator';

// conjugation options:
// [fì/tsa/pe/fra-, me/pxe/ay-, fne-, (...), -tsyìp/fkeyk, -pe/o, -l/t/r/ä/ri/adp., -sì/to]

describe('noun conjugations', () => {

	describe('determiners', () => {
		test('are applied', (t) => {
			assert.strictEqual(conjugate('fwampop', ['fì', '', '', '', '', '', ''], false, 'FN'), 'fì----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', '', '', '', '', '', ''], false, 'FN'), 'tsa----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', '', '', '', '', '', ''], false, 'FN'), 'pe----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fra', '', '', '', '', '', ''], false, 'FN'), 'fra----fwampop-----');
		});

		test('in the case of pe+, lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['pe', '', '', '', '', '', ''], false, 'FN'), 'pe---h-elku-----');
		});

		test('in the case of other determiners, do not lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['fì', '', '', '', '', '', ''], false, 'FN'), 'fì----kelku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', '', '', '', '', '', ''], false, 'FN'), 'tsa----kelku-----');
			assert.strictEqual(conjugate('kelku', ['fra', '', '', '', '', '', ''], false, 'FN'), 'fra----kelku-----');
		});
	});

	describe('plural prefixes', () => {
		test('are applied', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', '', ''], false, 'FN'), '----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-ay---fwampop-----');
		});

		test('lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', '', ''], false, 'FN'), '----kelku-----');
			assert.strictEqual(conjugate('kelku', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-(ay)--h-elku-----');
		});

		test('preserve the initial capital of the noun', (t) => {
			assert.strictEqual(conjugate('Fwampop', ['', '', '', '', '', '', ''], false, 'FN'), '----Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me---Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe---Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-ay---Fwampop-----');
		});

		test('lenite the noun even if it starts with a capital', (t) => {
			assert.strictEqual(conjugate('Kelku', ['', '', '', '', '', '', ''], false, 'FN'), '----Kelku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me--H-elku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe--H-elku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-(ay)--H-elku-----');
			assert.strictEqual(conjugate('Txon', ['', '', '', '', '', '', ''], false, 'FN'), '----Txon-----');
			assert.strictEqual(conjugate('Txon', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me--T-on-----');
			assert.strictEqual(conjugate('Txon', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe--T-on-----');
			assert.strictEqual(conjugate('Txon', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-(ay)--T-on-----');
		});

		test('can combine with determiners', (t) => {
			assert.strictEqual(conjugate('fwampop', ['fì', 'me', '', '', '', '', ''], false, 'FN'), 'fì-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', 'me', '', '', '', '', ''], false, 'FN'), 'tsa-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', 'me', '', '', '', '', ''], false, 'FN'), 'pe-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fra', 'me', '', '', '', '', ''], false, 'FN'), 'fra-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fì', 'ay', '', '', '', '', ''], false, 'FN'), 'f(ì)-ay---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', 'ay', '', '', '', '', ''], false, 'FN'), 'ts-ay---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', 'ay', '', '', '', '', ''], false, 'FN'), 'p-ay---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fra', 'ay', '', '', '', '', ''], false, 'FN'), 'fr-ay---fwampop-----');
		});

		test('when combined with pe+, get lenited themselves', (t) => {
			assert.strictEqual(conjugate('fwampop', ['fì', 'pxe', '', '', '', '', ''], false, 'FN'), 'fì-pxe---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', 'pxe', '', '', '', '', ''], false, 'FN'), 'tsa-pxe---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', 'pxe', '', '', '', '', ''], false, 'FN'), 'pe-pe---fwampop-----'); // note the extra lenition
			assert.strictEqual(conjugate('fwampop', ['fra', 'pxe', '', '', '', '', ''], false, 'FN'), 'fra-pxe---fwampop-----');
		});

		test('when combined with a determiner, still lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['fì', 'me', '', '', '', '', ''], false, 'FN'), 'fì-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', 'me', '', '', '', '', ''], false, 'FN'), 'tsa-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['pe', 'me', '', '', '', '', ''], false, 'FN'), 'pe-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fra', 'me', '', '', '', '', ''], false, 'FN'), 'fra-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fì', 'pxe', '', '', '', '', ''], false, 'FN'), 'fì-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', 'pxe', '', '', '', '', ''], false, 'FN'), 'tsa-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['pe', 'pxe', '', '', '', '', ''], false, 'FN'), 'pe-pe--h-elku-----'); // note the extra lenition
			assert.strictEqual(conjugate('kelku', ['fra', 'pxe', '', '', '', '', ''], false, 'FN'), 'fra-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fì', 'ay', '', '', '', '', ''], false, 'FN'), 'f(ì)-ay--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', 'ay', '', '', '', '', ''], false, 'FN'), 'ts-ay--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['pe', 'ay', '', '', '', '', ''], false, 'FN'), 'p-ay--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fra', 'ay', '', '', '', '', ''], false, 'FN'), 'fr-ay--h-elku-----');
		});
	});

	describe('stem prefixes', () => {
		test('are applied', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', 'fne', '', '', '', ''], false, 'FN'), '--fne--fwampop-----');
		});

		test('do not cause lenition', (t) => {
			assert.strictEqual(conjugate('kelku', ['', '', 'fne', '', '', '', ''], false, 'FN'), '--fne--kelku-----');
		});

		test('block earlier leniting prefixes from leniting the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['pe', '', 'fne', '', '', '', ''], false, 'FN'), 'pe--fne--kelku-----');
			assert.strictEqual(conjugate('kelku', ['', 'ay', 'fne', '', '', '', ''], false, 'FN'), '-ay-fne--kelku-----');
		});
	});

	describe('case suffixes', () => {
		test('are correctly applied to a noun ending in a consonant', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', '', ''], false, 'FN'), '----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'l', ''], false, 'FN'), '----fwampop----ìl-');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 't', ''], false, 'FN'), '----fwampop----it/ti-');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'r', ''], false, 'FN'), '----fwampop----ur-');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----fwampop----ä-');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----fwampop----ìri-');
		});

		test('are correctly applied to a noun ending in a vowel', (t) => {
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', '', ''], false, 'FN'), '----kelku-----');
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'l', ''], false, 'FN'), '----kelku----l-');
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 't', ''], false, 'FN'), '----kelku----t(i)-');
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'r', ''], false, 'FN'), '----kelku----r(u)-');
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----kelku----ä-');
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----kelku----ri-');
		});

		test('are correctly applied to a noun ending in -aw', (t) => {
			assert.strictEqual(conjugate('taw', ['', '', '', '', '', '', ''], false, 'FN'), '----taw-----');
			assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'l', ''], false, 'FN'), '----taw----ìl-');
			assert.strictEqual(conjugate('taw', ['', '', '', '', '', 't', ''], false, 'FN'), '----taw----it/ti-');
			assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'r', ''], false, 'FN'), '----taw----ur/r(u)-');
			assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----taw----ä-');
			assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----taw----ri-');
		});

		test('are correctly applied to a noun ending in -ay', (t) => {
			assert.strictEqual(conjugate('pay', ['', '', '', '', '', '', ''], false, 'FN'), '----pay-----');
			assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'l', ''], false, 'FN'), '----pay----ìl-');
			assert.strictEqual(conjugate('pay', ['', '', '', '', '', 't', ''], false, 'FN'), '----pay----it/t(i)-');
			assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'r', ''], false, 'FN'), '----pay----ur/ru-');
			assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----pay----ä-');
			assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----pay----ri-');
		});

		test('are correctly applied to a noun ending in -ew', (t) => {
			assert.strictEqual(conjugate('fahew', ['', '', '', '', '', '', ''], false, 'FN'), '----fahew-----');
			assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'l', ''], false, 'FN'), '----fahew----ìl-');
			assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 't', ''], false, 'FN'), '----fahew----it/ti-');
			assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'r', ''], false, 'FN'), '----fahew----r(u)-');
			assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----fahew----ä-');
			assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----fahew----ri-');
		});

		test('are correctly applied to a noun ending in -ey', (t) => {
			assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', '', ''], false, 'FN'), '----kxeyey-----');
			assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'l', ''], false, 'FN'), '----kxeyey----ìl-');
			assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 't', ''], false, 'FN'), '----kxeyey----t(i)-');
			assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'r', ''], false, 'FN'), '----kxeyey----ur/ru-');
			assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----kxeyey----ä-');
			assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----kxeyey----ri-');
		});

		test('are correctly applied to a loanword ending in ì', (t) => {
			assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', '', ''], false, 'FN', true), '----Kelnì-----');
			assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'l', ''], false, 'FN', true), '----Keln----ìl-');
			assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 't', ''], false, 'FN', true), '----Keln----it-');
			assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'r', ''], false, 'FN', true), '----Keln----ur-');
			assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'ä', ''], false, 'FN', true), '----Keln----ä-');
			assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'ri', ''], false, 'FN', true), '----Keln----ìri-');
		});

		test('are correctly applied to a loanword ending in ì, with preceding f/s/ts', (t) => {
			assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', '', ''], false, 'FN', true), '----Kerìsmìsì-----');
			assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'l', ''], false, 'FN', true), '----Kerìsmìs----ìl-');
			assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 't', ''], false, 'FN', true), '----Kerìsmìs----it/ti-');
			assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'r', ''], false, 'FN', true), '----Kerìsmìs----ur-');
			assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'ä', ''], false, 'FN', true), '----Kerìsmìs----ä-');
			assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'ri', ''], false, 'FN', true), '----Kerìsmìs----ìri-');
		});
	});

	describe('simplified conjugation output', () => {
		test('with a case ending', (t) => {
			assert.strictEqual(conjugate('tute', ['', '', '', '', '', 'l', ''], true, 'FN'), '-tute-l');
		});
		test('with a plural prefix', (t) => {
			assert.strictEqual(conjugate('tute', ['', 'ay', '', '', '', '', ''], true, 'FN'), '(ay)-{s}ute-');
		});
		test('with a plural prefix and a case ending', (t) => {
			assert.strictEqual(conjugate('tute', ['', 'ay', '', '', '', 'l', ''], true, 'FN'), '(ay)-{s}ute-l');
		});
	});
});
