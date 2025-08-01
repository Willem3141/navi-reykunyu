/// Unit tests for the noun conjugator and parser

import { describe, test } from 'node:test';
import assert from 'node:assert';

import { conjugate, conjugateSimple } from '../src/nouns/conjugator';
import { parse } from '../src/nouns/parser';
import * as conjugationString from '../src/conjugationString';
import { count } from 'node:console';

/**
 * Performs one noun conjugation and noun parsing test.
 * 
 * Firstly, tests if conjugating the given root with the given affixes results
 * in the exact expected result (conjugation string).
 * 
 * Then, tests if throwing the possibilities generated by the conjugation string
 * into the noun parser actually retrieves the original root and affixes. Noun
 * parsing may result in a lot of possible results, and we are in fact not
 * really interested in testing whether the parser returns _superfluous_
 * results; we only want to ensure that the correct answer is in the result set.
 * Therefore this method merely tests if the expected root/affix combination is
 * in the result set.
 */
function testConjugation(root: string, affixes: string[], expectedResult: string[], loanword?: boolean): void {
	let dialect = 'FN';
	const conjugationResult = conjugationString.formsFromString(conjugate(root, affixes, dialect, loanword));
	if (!areArraysEqual(conjugationResult, expectedResult)) {
		assert.fail('Conjugation result didn\'t match expected value: ' +
			JSON.stringify(conjugationResult) + ' != ' + JSON.stringify(expectedResult));
	}

	for (const conjugatedForm of expectedResult) {
		const parseResult = parse(conjugatedForm.toLowerCase(), dialect, loanword);
		let found = false;
		for (const possibility of parseResult) {
			// ignore corrections; the parse result should be exact
			if (possibility.correction) {
				continue;
			}
			// special case for omitted (ay): the parser returns "(ay)" for
			// that, but the conjugator just expects "ay"
			if (possibility.affixes[1] === '(ay)') {
				possibility.affixes[1] = 'ay';
			}
			if (possibility.root === root.toLowerCase() && JSON.stringify(possibility.affixes) === JSON.stringify(affixes)) {
				found = true;
			}
		}
		if (!found) {
			assert.fail('"' + root + '" with affixes ' + JSON.stringify(affixes) +
				' was not in the parsing result set for "' + conjugatedForm + '"');
		}
	}
}

/** Determines whether two arrays have identical elements. */
function areArraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	a = a.sort();
	b = b.sort();
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

describe('noun conjugations', () => {

	describe('determiner prefixes', () => {
		test('are prepended to the noun', (t) => {
			testConjugation('fwampop', ['fì', '', '', '', '', '', ''], ['fìfwampop']);
			testConjugation('fwampop', ['tsa', '', '', '', '', '', ''], ['tsafwampop']);
			testConjugation('fwampop', ['pe', '', '', '', '', '', ''], ['pefwampop']);
			testConjugation('fwampop', ['fra', '', '', '', '', '', ''], ['frafwampop']);
		});

		test('in the case of pe+, lenite the noun', (t) => {
			testConjugation('kelku', ['pe', '', '', '', '', '', ''], ['pehelku']);
		});

		test('in the case of other determiners, do not lenite the noun', (t) => {
			testConjugation('kelku', ['fì', '', '', '', '', '', ''], ['fìkelku']);
			testConjugation('kelku', ['tsa', '', '', '', '', '', ''], ['tsakelku']);
			testConjugation('kelku', ['fra', '', '', '', '', '', ''], ['frakelku']);
		});

		test('contract when the noun starts with the same letter', (t) => {
			testConjugation('ìlva', ['fì', '', '', '', '', '', ''], ['fìlva']);
			testConjugation('atan', ['tsa', '', '', '', '', '', ''], ['tsatan']);
			testConjugation('ekxan', ['pe', '', '', '', '', '', ''], ['pekxan']);
			testConjugation('atan', ['fra', '', '', '', '', '', ''], ['fratan']);
		});

		test('contract when the noun starts with the capitalized same letter', (t) => {
			testConjugation('Ìlva', ['fì', '', '', '', '', '', ''], ['fÌlva']);
			testConjugation('Atan', ['tsa', '', '', '', '', '', ''], ['tsAtan']);
			testConjugation('Ekxan', ['pe', '', '', '', '', '', ''], ['pEkxan']);
			testConjugation('Atan', ['fra', '', '', '', '', '', ''], ['frAtan']);
		});

		test('in the case of pe+, also contract if the noun starts with -e after lenition', (t) => {
			testConjugation('\'eylan', ['pe', '', '', '', '', '', ''], ['peylan']);
		});
	});

	describe('plural prefixes', () => {
		describe('the dual prefix', () => {
			test('is prepended to the noun', (t) => {
				testConjugation('fwampop', ['', 'me', '', '', '', '', ''], ['mefwampop']);
			});

			test('preserves the initial uppercase letter of the noun', (t) => {
				testConjugation('Fwampop', ['', 'me', '', '', '', '', ''], ['meFwampop']);
			});

			test('drops its -e if the noun starts with e-', (t) => {
				testConjugation('ekxan', ['', 'me', '', '', '', '', ''], ['mekxan']);
				testConjugation('Ekxan', ['', 'me', '', '', '', '', ''], ['mEkxan']);
			});

			test('drops its -e if the noun starts with ew-/ey-', (t) => {
				testConjugation('ewro', ['', 'me', '', '', '', '', ''], ['mewro']);
				testConjugation('Ewro', ['', 'me', '', '', '', '', ''], ['mEwro']);
				testConjugation('eyktan', ['', 'me', '', '', '', '', ''], ['meyktan']);
				testConjugation('Eyktan', ['', 'me', '', '', '', '', ''], ['mEyktan']);
			});

			test('drops its -e if the noun starts with e- after lenition', (t) => {
				testConjugation('\'eylan', ['', 'me', '', '', '', '', ''], ['meylan']);
				testConjugation('\'Eylan', ['', 'me', '', '', '', '', ''], ['mEylan']);
			});

			test('lenites the noun', (t) => {
				testConjugation('kelku', ['', 'me', '', '', '', '', ''], ['mehelku']);
			});

			test('doesn\'t lenite the noun if it starts with \'ll/\'rr', (t) => {
				testConjugation('\'llngo', ['', 'me', '', '', '', '', ''], ['me\'llngo']);
				testConjugation('\'rrpxom', ['', 'me', '', '', '', '', ''], ['me\'rrpxom']);
			});

			test('lenites the noun even if it starts with an uppercase letter', (t) => {
				testConjugation('Kelku', ['', 'me', '', '', '', '', ''], ['meHelku']);
				testConjugation('Txon', ['', 'me', '', '', '', '', ''], ['meTon']);
			});

			test('is placed after a determiner prefix', (t) => {
				testConjugation('fwampop', ['fì', 'me', '', '', '', '', ''], ['fìmefwampop']);
				testConjugation('fwampop', ['tsa', 'me', '', '', '', '', ''], ['tsamefwampop']);
				testConjugation('fwampop', ['pe', 'me', '', '', '', '', ''], ['pemefwampop']);
				testConjugation('fwampop', ['fra', 'me', '', '', '', '', ''], ['framefwampop']);
			});

			test('when combined with a determiner, still lenites the noun', (t) => {
				testConjugation('kelku', ['fì', 'me', '', '', '', '', ''], ['fìmehelku']);
				testConjugation('kelku', ['tsa', 'me', '', '', '', '', ''], ['tsamehelku']);
				testConjugation('kelku', ['pe', 'me', '', '', '', '', ''], ['pemehelku']);
				testConjugation('kelku', ['fra', 'me', '', '', '', '', ''], ['framehelku']);
			});
		});

		describe('the trial prefix', () => {
			test('is prepended to the noun', (t) => {
				testConjugation('fwampop', ['', 'pxe', '', '', '', '', ''], ['pxefwampop']);
			});

			test('preserves the initial uppercase letter of the noun', (t) => {
				testConjugation('Fwampop', ['', 'pxe', '', '', '', '', ''], ['pxeFwampop']);
			});

			test('drops its -e if the noun starts with e-', (t) => {
				testConjugation('ekxan', ['', 'pxe', '', '', '', '', ''], ['pxekxan']);
				testConjugation('Ekxan', ['', 'pxe', '', '', '', '', ''], ['pxEkxan']);
			});

			test('drops its -e if the noun starts with ew-/ey-', (t) => {
				testConjugation('ewro', ['', 'pxe', '', '', '', '', ''], ['pxewro']);
				testConjugation('Ewro', ['', 'pxe', '', '', '', '', ''], ['pxEwro']);
				testConjugation('eyktan', ['', 'pxe', '', '', '', '', ''], ['pxeyktan']);
				testConjugation('Eyktan', ['', 'pxe', '', '', '', '', ''], ['pxEyktan']);
			});

			test('drops its -e if the noun starts with e- after lenition', (t) => {
				testConjugation('\'eylan', ['', 'pxe', '', '', '', '', ''], ['pxeylan']);
				testConjugation('\'Eylan', ['', 'pxe', '', '', '', '', ''], ['pxEylan']);
			});

			test('lenites the noun', (t) => {
				testConjugation('kelku', ['', 'pxe', '', '', '', '', ''], ['pxehelku']);
			});

			test('doesn\'t lenite the noun if it starts with \'ll/\'rr', (t) => {
				testConjugation('\'llngo', ['', 'pxe', '', '', '', '', ''], ['pxe\'llngo']);
				testConjugation('\'rrpxom', ['', 'pxe', '', '', '', '', ''], ['pxe\'rrpxom']);
			});

			test('lenites the noun even if it starts with an uppercase letter', (t) => {
				testConjugation('Kelku', ['', 'pxe', '', '', '', '', ''], ['pxeHelku']);
				testConjugation('Txon', ['', 'pxe', '', '', '', '', ''], ['pxeTon']);
			});

			test('is placed after a determiner prefix', (t) => {
				testConjugation('fwampop', ['fì', 'pxe', '', '', '', '', ''], ['fìpxefwampop']);
				testConjugation('fwampop', ['tsa', 'pxe', '', '', '', '', ''], ['tsapxefwampop']);
				testConjugation('fwampop', ['fra', 'pxe', '', '', '', '', ''], ['frapxefwampop']);
			});

			test('when combined with pe+, gets lenited itself', (t) => {
				testConjugation('fwampop', ['pe', 'pxe', '', '', '', '', ''], ['pepefwampop']);
			});

			test('when combined with a determiner, still lenites the noun', (t) => {
				testConjugation('kelku', ['fì', 'pxe', '', '', '', '', ''], ['fìpxehelku']);
				testConjugation('kelku', ['tsa', 'pxe', '', '', '', '', ''], ['tsapxehelku']);
				testConjugation('kelku', ['pe', 'pxe', '', '', '', '', ''], ['pepehelku']);
				testConjugation('kelku', ['fra', 'pxe', '', '', '', '', ''], ['frapxehelku']);
			});
		});

		describe('the general plural prefix', () => {
			test('is prepended to the noun', (t) => {
				testConjugation('fwampop', ['', 'ay', '', '', '', '', ''], ['ayfwampop']);
			});

			test('preserves the initial uppercase letter of the noun', (t) => {
				testConjugation('Fwampop', ['', 'ay', '', '', '', '', ''], ['ayFwampop']);
			});

			test('lenites the noun', (t) => {
				testConjugation('kelku', ['', 'ay', '', '', '', '', ''], ['ayhelku', 'helku']);
			});

			test('doesn\'t lenite the noun if it starts with \'ll/\'rr', (t) => {
				testConjugation('\'llngo', ['', 'ay', '', '', '', '', ''], ['ay\'llngo']);
				testConjugation('\'rrpxom', ['', 'ay', '', '', '', '', ''], ['ay\'rrpxom']);
			});

			test('lenites the noun even if it starts with an uppercase letter', (t) => {
				testConjugation('Kelku', ['', 'ay', '', '', '', '', ''], ['ayHelku', 'Helku']);
				testConjugation('Txon', ['', 'ay', '', '', '', '', ''], ['ayTon', 'Ton']);
			});

			test('is optional if the noun underwent lenition', (t) => {
				testConjugation('tute', ['', 'ay', '', '', '', '', ''], ['aysute', 'sute']);
				testConjugation('pxen', ['', 'ay', '', '', '', '', ''], ['aypen', 'pen']);
				testConjugation('\'eylan', ['', 'ay', '', '', '', '', ''], ['ayeylan', 'eylan']);
			});

			test('is not optional if the noun did not undergo lenition', (t) => {
				testConjugation('lun', ['', 'ay', '', '', '', '', ''], ['aylun']);
				testConjugation('sngel', ['', 'ay', '', '', '', '', ''], ['aysngel']);
				testConjugation('zum', ['', 'ay', '', '', '', '', ''], ['ayzum']);
			});

			test('is not optional in the case of \'u', (t) => {
				testConjugation('\'u', ['', 'ay', '', '', '', '', ''], ['ayu']);
			});

			test('is placed after a determiner prefix', (t) => {
				testConjugation('fwampop', ['fì', 'ay', '', '', '', '', ''], ['fìayfwampop', 'fayfwampop']);
				testConjugation('fwampop', ['tsa', 'ay', '', '', '', '', ''], ['tsayfwampop']);
				testConjugation('fwampop', ['pe', 'ay', '', '', '', '', ''], ['payfwampop']);
				testConjugation('fwampop', ['fra', 'ay', '', '', '', '', ''], ['frayfwampop']);
			});

			test('when combined with a determiner, still lenites the noun', (t) => {
				testConjugation('kelku', ['fì', 'ay', '', '', '', '', ''], ['fìayhelku', 'fayhelku']);
				testConjugation('kelku', ['tsa', 'ay', '', '', '', '', ''], ['tsayhelku']);
				testConjugation('kelku', ['pe', 'ay', '', '', '', '', ''], ['payhelku']);
				testConjugation('kelku', ['fra', 'ay', '', '', '', '', ''], ['frayhelku']);
			});
		});
	});

	describe('stem prefixes', () => {
		test('are prepended to the noun', (t) => {
			testConjugation('fwampop', ['', '', 'fne', '', '', '', ''], ['fnefwampop']);
		});

		test('are placed after a plural prefix', (t) => {
			testConjugation('fwampop', ['', 'me', 'fne', '', '', '', ''], ['mefnefwampop']);
		});

		test('do not cause lenition', (t) => {
			testConjugation('kelku', ['', '', 'fne', '', '', '', ''], ['fnekelku']);
		});

		test('block earlier leniting prefixes from leniting the noun', (t) => {
			testConjugation('kelku', ['pe', '', 'fne', '', '', '', ''], ['pefnekelku']);
			testConjugation('kelku', ['', 'ay', 'fne', '', '', '', ''], ['ayfnekelku']);
		});

		test('contract when the noun starts with the same letter', (t) => {
			testConjugation('ekxan', ['', '', 'fne', '', '', '', ''], ['fnekxan']);
		});
	});

	describe('stem suffixes', () => {
		test('are appended to the noun', (t) => {
			testConjugation('fwampop', ['', '', '', 'fkeyk', '', '', ''], ['fwampopfkeyk']);
			testConjugation('fwampop', ['', '', '', 'tsyìp', '', '', ''], ['fwampoptsyìp']);
		});

		test('are placed before a determiner suffix', (t) => {
			testConjugation('ya', ['', '', '', 'fkeyk', 'pe', '', ''], ['yafkeykpe']);
		});

		test('determine the form of a following case suffix', (t) => {
			testConjugation('ya', ['', '', '', 'fkeyk', '', 't', ''], ['yafkeykit', 'yafkeykti']);
			testConjugation('ya', ['', '', '', 'tsyìp', '', 'r', ''], ['yatsyìpur']);
		});
	});

	describe('determiner suffixes', () => {
		test('are appended to the noun', (t) => {
			testConjugation('fwampop', ['', '', '', '', 'pe', '', ''], ['fwampoppe']);
			testConjugation('fwampop', ['', '', '', '', 'o', '', ''], ['fwampopo']);
		});

		test('are placed before a case suffix', (t) => {
			testConjugation('ya', ['', '', '', '', 'pe', 'l', ''], ['yapel']);
		});

		test('determine the form of a following case suffix', (t) => {
			testConjugation('fwampop', ['', '', '', '', 'pe', 't', ''], ['fwampoppet', 'fwampoppeti']);
			testConjugation('fwampop', ['', '', '', '', 'o', 'r', ''], ['fwampopor', 'fwampoporu']);
		});
	});

	describe('case suffixes', () => {
		describe('the agentive suffix', () => {
			test('is -ìl for nouns ending in a consonant', (t) => {
				testConjugation('fwampop', ['', '', '', '', '', 'l', ''], ['fwampopìl']);
			});

			test('is -ìl for nouns ending in a pseudovowel', (t) => {
				testConjugation('\'ewll', ['', '', '', '', '', 'l', ''], ['\'ewllìl']);
				testConjugation('trr', ['', '', '', '', '', 'l', ''], ['trrìl']);
			});

			test('is -l for nouns ending in a vowel', (t) => {
				testConjugation('tute', ['', '', '', '', '', 'l', ''], ['tutel']);
				testConjugation('tuté', ['', '', '', '', '', 'l', ''], ['tutél']);
				testConjugation('kelku', ['', '', '', '', '', 'l', ''], ['kelkul']);
			});

			test('is -ìl for nouns ending in a diphthong', (t) => {
				testConjugation('taw', ['', '', '', '', '', 'l', ''], ['tawìl']);
				testConjugation('pay', ['', '', '', '', '', 'l', ''], ['payìl']);
				testConjugation('fahew', ['', '', '', '', '', 'l', ''], ['fahewìl']);
				testConjugation('kxeyey', ['', '', '', '', '', 'l', ''], ['kxeyeyìl']);
			});

			test('is -ìl for loanwords ending in -ì, with the -ì dropping', (t) => {
				testConjugation('Kelnì', ['', '', '', '', '', 'l', ''], ['Kelnìl'], true);
				testConjugation('Kerìsmìsì', ['', '', '', '', '', 'l', ''], ['Kerìsmìsìl'], true);
			});
		});

		describe('the patientive suffix', () => {
			test('is -it/-ti for nouns ending in a consonant', (t) => {
				testConjugation('fwampop', ['', '', '', '', '', 't', ''], ['fwampopit', 'fwampopti']);
			});

			test('is -it/-ti for nouns ending in a pseudovowel', (t) => {
				testConjugation('\'ewll', ['', '', '', '', '', 't', ''], ['\'ewllit', '\'ewllti']);
				testConjugation('trr', ['', '', '', '', '', 't', ''], ['trrit', 'trrti']);
			});

			test('is -t(i) for nouns ending in a vowel', (t) => {
				testConjugation('tute', ['', '', '', '', '', 't', ''], ['tutet', 'tuteti']);
				testConjugation('tuté', ['', '', '', '', '', 't', ''], ['tutét', 'tutéti']);
				testConjugation('kelku', ['', '', '', '', '', 't', ''], ['kelkut', 'kelkuti']);
			});

			test('is -it/-ti for nouns ending in the diphthongs -aw/-ew', (t) => {
				testConjugation('taw', ['', '', '', '', '', 't', ''], ['tawit', 'tawti']);
				testConjugation('fahew', ['', '', '', '', '', 't', ''], ['fahewit', 'fahewti']);
			});

			test('is -(i)t/-ti for nouns ending in the diphthong -ay', (t) => {
				testConjugation('pay', ['', '', '', '', '', 't', ''], ['payit', 'payt', 'payti']);
			});

			test('is -t/-ti for nouns ending in the diphthong -ey', (t) => {
				testConjugation('kxeyey', ['', '', '', '', '', 't', ''], ['kxeyeyt', 'kxeyeyti']);
			});

			test('is -it for loanwords ending in -ì, with the -ì dropping', (t) => {
				testConjugation('Kelnì', ['', '', '', '', '', 't', ''], ['Kelnit'], true);
			});

			test('is -it/-ti for loanwords ending in -ì with preceding f/s/ts, with the -ì dropping', (t) => {
				testConjugation('Kerìsmìsì', ['', '', '', '', '', 't', ''], ['Kerìsmìsit', 'Kerìsmìsti'], true);
			});
		});

		describe('the dative suffix', () => {
			test('is -ur for nouns ending in a consonant', (t) => {
				testConjugation('fwampop', ['', '', '', '', '', 'r', ''], ['fwampopur']);
			});

			test('is -ur for nouns ending in a pseudovowel', (t) => {
				testConjugation('\'ewll', ['', '', '', '', '', 'r', ''], ['\'ewllur']);
				testConjugation('trr', ['', '', '', '', '', 'r', ''], ['trrur']);
			});

			test('is -ur/-ru for nouns ending in \'', (t) => {
				testConjugation('olo\'', ['', '', '', '', '', 'r', ''], ['olo\'ur', 'olo\'ru']);
			});

			test('is -r(u) for nouns ending in a vowel', (t) => {
				testConjugation('tute', ['', '', '', '', '', 'r', ''], ['tuter', 'tuteru']);
				testConjugation('tuté', ['', '', '', '', '', 'r', ''], ['tutér', 'tutéru']);
				testConjugation('kelku', ['', '', '', '', '', 'r', ''], ['kelkur', 'kelkuru']);
			});

			test('is -ur/-ru for nouns ending in the diphthongs -ay/-ey', (t) => {
				testConjugation('pay', ['', '', '', '', '', 'r', ''], ['payur', 'payru']);
				testConjugation('kxeyey', ['', '', '', '', '', 'r', ''], ['kxeyeyur', 'kxeyeyru']);
			});

			test('is -(u)r/-ru for nouns ending in the diphthong -aw', (t) => {
				testConjugation('taw', ['', '', '', '', '', 'r', ''], ['tawur', 'tawr', 'tawru']);
			});

			test('is -r/-ru for nouns ending in the diphthong -ew', (t) => {
				testConjugation('fahew', ['', '', '', '', '', 'r', ''], ['fahewr', 'fahewru']);
			});

			test('is -ur for loanwords ending in -ì, with the -ì dropping', (t) => {
				testConjugation('Kelnì', ['', '', '', '', '', 'r', ''], ['Kelnur'], true);
				testConjugation('Kerìsmìsì', ['', '', '', '', '', 'r', ''], ['Kerìsmìsur'], true);
			});
		});

		describe('the genitive suffix', () => {
			test('is -ä for nouns ending in a consonant', (t) => {
				testConjugation('fwampop', ['', '', '', '', '', 'ä', ''], ['fwampopä']);
			});

			test('is -ä for nouns ending in a pseudovowel', (t) => {
				testConjugation('\'ewll', ['', '', '', '', '', 'ä', ''], ['\'ewllä']);
				testConjugation('trr', ['', '', '', '', '', 'ä', ''], ['trrä']);
			});

			test('is -ä for nouns ending in the vowels -o/-u', (t) => {
				testConjugation('alo', ['', '', '', '', '', 'ä', ''], ['aloä']);
				testConjugation('kelku', ['', '', '', '', '', 'ä', ''], ['kelkuä']);
			});

			test('is -yä for nouns ending in vowels other than -o/-u', (t) => {
				testConjugation('\'ana', ['', '', '', '', '', 'ä', ''], ['\'anayä']);
				testConjugation('ftxozä', ['', '', '', '', '', 'ä', ''], ['ftxozäyä']);
				testConjugation('tute', ['', '', '', '', '', 'ä', ''], ['tuteyä']);
				testConjugation('tuté', ['', '', '', '', '', 'ä', ''], ['tutéyä']);
				testConjugation('awaiei', ['', '', '', '', '', 'ä', ''], ['awaieiyä']);
				testConjugation('vospxì', ['', '', '', '', '', 'ä', ''], ['vospxìyä']);
			});

			test('is -iä for nouns ending in -ia, with the -ia dropping', (t) => {
				testConjugation('soaia', ['', '', '', '', '', 'ä', ''], ['soaiä']);
			});

			test('is -ä for the word Omatikaya', (t) => {
				testConjugation('Omatikaya', ['', '', '', '', '', 'ä', ''], ['Omatikayaä']);
			});

			test('is -ä for nouns ending in a diphthong', (t) => {
				testConjugation('taw', ['', '', '', '', '', 'ä', ''], ['tawä']);
				testConjugation('pay', ['', '', '', '', '', 'ä', ''], ['payä']);
				testConjugation('fahew', ['', '', '', '', '', 'ä', ''], ['fahewä']);
				testConjugation('kxeyey', ['', '', '', '', '', 'ä', ''], ['kxeyeyä']);
			});

			test('is -ä for loanwords ending in -ì, with the -ì dropping', (t) => {
				testConjugation('Kelnì', ['', '', '', '', '', 'ä', ''], ['Kelnä'], true);
				testConjugation('Kerìsmìsì', ['', '', '', '', '', 'ä', ''], ['Kerìsmìsä'], true);
			});
		});

		describe('the topical suffix', () => {
			test('is -ìri for nouns ending in a consonant', (t) => {
				testConjugation('fwampop', ['', '', '', '', '', 'ri', ''], ['fwampopìri']);
			});

			test('is -ìri for nouns ending in a pseudovowel', (t) => {
				testConjugation('\'ewll', ['', '', '', '', '', 'ri', ''], ['\'ewllìri']);
				testConjugation('trr', ['', '', '', '', '', 'ri', ''], ['trrìri']);
			});

			test('is -ri for nouns ending in a vowel', (t) => {
				testConjugation('tute', ['', '', '', '', '', 'ri', ''], ['tuteri']);
				testConjugation('tuté', ['', '', '', '', '', 'ri', ''], ['tutéri']);
				testConjugation('kelku', ['', '', '', '', '', 'ri', ''], ['kelkuri']);
			});

			test('is -ri for nouns ending in a diphthong', (t) => {
				testConjugation('taw', ['', '', '', '', '', 'ri', ''], ['tawri']);
				testConjugation('pay', ['', '', '', '', '', 'ri', ''], ['payri']);
				testConjugation('fahew', ['', '', '', '', '', 'ri', ''], ['fahewri']);
				testConjugation('kxeyey', ['', '', '', '', '', 'ri', ''], ['kxeyeyri']);
			});

			test('is -ìri for loanwords ending in -ì, with the -ì dropping', (t) => {
				testConjugation('Kelnì', ['', '', '', '', '', 'ri', ''], ['Kelnìri'], true);
				testConjugation('Kerìsmìsì', ['', '', '', '', '', 'ri', ''], ['Kerìsmìsìri'], true);
			});
		});

		describe('an adposition', () => {
			test('is appended to the noun', (t) => {
				testConjugation('fwampop', ['', '', '', '', '', 'talun', ''], ['fwampoptalun']);
				testConjugation('fwampop', ['', '', '', '', '', 'mì', ''], ['fwampopmì']);
			});
		});
	});

	describe('final suffixes', () => {
		test('are appended to the noun', (t) => {
			testConjugation('fwampop', ['', '', '', '', '', '', 'sì'], ['fwampopsì']);
		});
		test('are placed after a case suffix', (t) => {
			testConjugation('fwampop', ['', '', '', '', '', 'l', 'sì'], ['fwampopìlsì']);
			testConjugation('fwampop', ['', '', '', '', '', 'ftu', 'to'], ['fwampopftuto']);
		});
	});

	describe('simplified conjugation output', () => {
		test('behaves correctly with a case ending', (t) => {
			assert.strictEqual(conjugateSimple('tute', '', 'l', 'FN'), '-tute-l');
		});

		test('behaves correctly with a plural prefix', (t) => {
			assert.strictEqual(conjugateSimple('fwampop', 'me', '', 'FN'), 'me-fwampop-');
			assert.strictEqual(conjugateSimple('fwampop', 'pxe', '', 'FN'), 'pxe-fwampop-');
			assert.strictEqual(conjugateSimple('fwampop', 'ay', '', 'FN'), 'ay-fwampop-');
			assert.strictEqual(conjugateSimple('tute', 'me', '', 'FN'), 'me-{s}ute-');
			assert.strictEqual(conjugateSimple('tute', 'pxe', '', 'FN'), 'pxe-{s}ute-');
			assert.strictEqual(conjugateSimple('tute', 'ay', '', 'FN'), '(ay)-{s}ute-');
		});

		test('behaves correctly with a plural prefix and a case ending', (t) => {
			assert.strictEqual(conjugateSimple('tute', 'ay', 'l', 'FN'), '(ay)-{s}ute-l');
		});

		test('behaves correctly for nouns starting with an uppercase letter', (t) => {
			assert.strictEqual(conjugateSimple('Iknimaya', 'ay', 'l', 'FN'), 'ay-Iknimaya-l');
			assert.strictEqual(conjugateSimple('Kelutral', 'ay', 'l', 'FN'), '(ay)-{H}elutral-ìl');
		});
	});

	describe('tricky parsing cases: the parser', (t) => {
		test('should never return empty roots', (t) => {
			const result = parse('be', 'FN');
			for (const possibility of result) {
				if (possibility.root === '') {
					assert.fail('parser returned empty root');
				}
			}
		});

		test('shouldn\'t crash on empty or short inputs', (t) => {
			parse('', 'FN');
			parse('a', 'FN');
			parse('be', 'FN');
		});
	});
});
