import { describe, test } from 'node:test';
import assert from 'node:assert';

import { conjugate } from '../src/nouns/conjugator';

// conjugation options:
// [fì/tsa/pe/fra-, me/pxe/ay-, fne-, (...), -tsyìp/fkeyk, -pe/o, -l/t/r/ä/ri/adp., -sì/to]

describe('noun conjugations', () => {

	describe('determiner prefixes', () => {
		test('are prepended to the noun', (t) => {
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

		test('contract when the noun starts with the same letter', (t) => {
			assert.strictEqual(conjugate('ìlva', ['fì', '', '', '', '', '', ''], false, 'FN'), 'f----ìlva-----');
			assert.strictEqual(conjugate('atan', ['tsa', '', '', '', '', '', ''], false, 'FN'), 'ts----atan-----');
			assert.strictEqual(conjugate('ekxan', ['pe', '', '', '', '', '', ''], false, 'FN'), 'p----ekxan-----');
			assert.strictEqual(conjugate('atan', ['fra', '', '', '', '', '', ''], false, 'FN'), 'fr----atan-----');
		});

		test('in the case of pe+, also contract if the noun starts with e- after lenition', (t) => {
			assert.strictEqual(conjugate('\'eylan', ['pe', '', '', '', '', '', ''], false, 'FN'), 'p----eylan-----');
		});
	});

	describe('plural prefixes', () => {
		test('are prepended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', '', ''], false, 'FN'), '----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-ay---fwampop-----');
		});

		test('in the case of me+ and pxe+, drop their -e if the noun starts with e-', (t) => {
			assert.strictEqual(conjugate('ekxan', ['', '', '', '', '', '', ''], false, 'FN'), '----ekxan-----');
			assert.strictEqual(conjugate('ekxan', ['', 'me', '', '', '', '', ''], false, 'FN'), '-m---ekxan-----');
			assert.strictEqual(conjugate('ekxan', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-px---ekxan-----');
			assert.strictEqual(conjugate('ekxan', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-ay---ekxan-----');
		});

		test('in the case of me+ and pxe+, drop their -e if the noun starts with ew-/ey-', (t) => {
			assert.strictEqual(conjugate('ewro', ['', '', '', '', '', '', ''], false, 'FN'), '----ewro-----');
			assert.strictEqual(conjugate('ewro', ['', 'me', '', '', '', '', ''], false, 'FN'), '-m---ewro-----');
			assert.strictEqual(conjugate('ewro', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-px---ewro-----');
			assert.strictEqual(conjugate('ewro', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-ay---ewro-----');
			assert.strictEqual(conjugate('eyktan', ['', '', '', '', '', '', ''], false, 'FN'), '----eyktan-----');
			assert.strictEqual(conjugate('eyktan', ['', 'me', '', '', '', '', ''], false, 'FN'), '-m---eyktan-----');
			assert.strictEqual(conjugate('eyktan', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-px---eyktan-----');
			assert.strictEqual(conjugate('eyktan', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-ay---eyktan-----');
		});

		test('in the case of me+ and pxe+, drop their -e if the noun starts with e- after lenition', (t) => {
			assert.strictEqual(conjugate('\'eylan', ['', '', '', '', '', '', ''], false, 'FN'), '----\'eylan-----');
			assert.strictEqual(conjugate('\'eylan', ['', 'me', '', '', '', '', ''], false, 'FN'), '-m---eylan-----');
			assert.strictEqual(conjugate('\'eylan', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-px---eylan-----');
			assert.strictEqual(conjugate('\'eylan', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-(ay)---eylan-----');
		});

		test('lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', '', ''], false, 'FN'), '----kelku-----');
			assert.strictEqual(conjugate('kelku', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-(ay)--h-elku-----');
		});

		test('don\'t lenite the noun if it starts with \'ll/\'rr', (t) => {
			assert.strictEqual(conjugate('\'llngo', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me---\'llngo-----');
			assert.strictEqual(conjugate('\'rrpxom', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe---\'rrpxom-----');
		});

		test('preserve the initial uppercase letter of the noun', (t) => {
			assert.strictEqual(conjugate('Fwampop', ['', '', '', '', '', '', ''], false, 'FN'), '----Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me---Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe---Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-ay---Fwampop-----');
		});

		test('lenite the noun even if it starts with an uppercase letter', (t) => {
			assert.strictEqual(conjugate('Kelku', ['', '', '', '', '', '', ''], false, 'FN'), '----Kelku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me--H-elku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe--H-elku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-(ay)--H-elku-----');
			assert.strictEqual(conjugate('Txon', ['', '', '', '', '', '', ''], false, 'FN'), '----Txon-----');
			assert.strictEqual(conjugate('Txon', ['', 'me', '', '', '', '', ''], false, 'FN'), '-me--T-on-----');
			assert.strictEqual(conjugate('Txon', ['', 'pxe', '', '', '', '', ''], false, 'FN'), '-pxe--T-on-----');
			assert.strictEqual(conjugate('Txon', ['', 'ay', '', '', '', '', ''], false, 'FN'), '-(ay)--T-on-----');
		});

		test('are placed after a determiner prefix', (t) => {
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
			assert.strictEqual(conjugate('eylan', ['fì', 'pxe', '', '', '', '', ''], false, 'FN'), 'fì-px---eylan-----');
			assert.strictEqual(conjugate('eylan', ['tsa', 'pxe', '', '', '', '', ''], false, 'FN'), 'tsa-px---eylan-----');
			assert.strictEqual(conjugate('eylan', ['pe', 'pxe', '', '', '', '', ''], false, 'FN'), 'pe-p---eylan-----'); // note the extra lenition
			assert.strictEqual(conjugate('eylan', ['fra', 'pxe', '', '', '', '', ''], false, 'FN'), 'fra-px---eylan-----');
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
		test('are prepended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', 'fne', '', '', '', ''], false, 'FN'), '--fne--fwampop-----');
		});

		test('are placed after a plural prefix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', 'me', 'fne', '', '', '', ''], false, 'FN'), '-me-fne--fwampop-----');
		});

		test('do not cause lenition', (t) => {
			assert.strictEqual(conjugate('kelku', ['', '', 'fne', '', '', '', ''], false, 'FN'), '--fne--kelku-----');
		});

		test('block earlier leniting prefixes from leniting the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['pe', '', 'fne', '', '', '', ''], false, 'FN'), 'pe--fne--kelku-----');
			assert.strictEqual(conjugate('kelku', ['', 'ay', 'fne', '', '', '', ''], false, 'FN'), '-ay-fne--kelku-----');
		});

		test('contract when the noun starts with the same letter', (t) => {
			assert.strictEqual(conjugate('ekxan', ['', '', 'fne', '', '', '', ''], false, 'FN'), '--fn--ekxan-----');
		});
	});

	describe('stem suffixes', () => {
		test('are appended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', 'fkeyk', '', '', ''], false, 'FN'), '----fwampop--fkeyk---');
			assert.strictEqual(conjugate('fwampop', ['', '', '', 'tsyìp', '', '', ''], false, 'FN'), '----fwampop--tsyìp---');
		});

		test('are placed before a determiner suffix', (t) => {
			assert.strictEqual(conjugate('ya', ['', '', '', 'fkeyk', 'pe', '', ''], false, 'FN'), '----ya--fkeyk-pe--');
		});

		test('determine the form of a following case suffix', (t) => {
			assert.strictEqual(conjugate('ya', ['', '', '', 'fkeyk', '', 't', ''], false, 'FN'), '----ya--fkeyk--it/ti-');
			assert.strictEqual(conjugate('ya', ['', '', '', 'tsyìp', '', 'r', ''], false, 'FN'), '----ya--tsyìp--ur-');
		});
	});

	describe('determiner suffixes', () => {
		test('are appended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'pe', '', ''], false, 'FN'), '----fwampop---pe--');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'o', '', ''], false, 'FN'), '----fwampop---o--');
		});

		test('are placed before a case suffix', (t) => {
			assert.strictEqual(conjugate('ya', ['', '', '', '', 'pe', 'l', ''], false, 'FN'), '----ya---pe-l-');
		});

		test('determine the form of a following case suffix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'pe', 't', ''], false, 'FN'), '----fwampop---pe-t(i)-');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'o', 'r', ''], false, 'FN'), '----fwampop---o-r(u)-');
		});
	});

	describe('case suffixes', () => {
		describe('the agentive suffix', () => {
			test('is -ìl for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'l', ''], false, 'FN'), '----fwampop----ìl-');
			});

			test('is -l for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'l', ''], false, 'FN'), '----kelku----l-');
			});

			test('is -ìl for nouns ending in a diphthong', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'l', ''], false, 'FN'), '----taw----ìl-');
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'l', ''], false, 'FN'), '----pay----ìl-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'l', ''], false, 'FN'), '----fahew----ìl-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'l', ''], false, 'FN'), '----kxeyey----ìl-');
			});

			test('is -ìl for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'l', ''], false, 'FN', true), '----Keln----ìl-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'l', ''], false, 'FN', true), '----Kerìsmìs----ìl-');
			});
		});

		describe('the patientive suffix', () => {
			test('is -it/-ti for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 't', ''], false, 'FN'), '----fwampop----it/ti-');
			});

			test('is -t(i) for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 't', ''], false, 'FN'), '----kelku----t(i)-');
			});

			test('is -it/-ti for nouns ending in the diphthongs -aw/-ew', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 't', ''], false, 'FN'), '----taw----it/ti-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 't', ''], false, 'FN'), '----fahew----it/ti-');
			});

			test('is -(i)t/-ti for nouns ending in the diphthong -ay', (t) => {
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 't', ''], false, 'FN'), '----pay----it/t(i)-');
			});

			test('is -t/-ti for nouns ending in the diphthong -ey', (t) => {
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 't', ''], false, 'FN'), '----kxeyey----t(i)-');
			});

			test('is -it for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 't', ''], false, 'FN', true), '----Keln----it-');
			});

			test('is -it/-ti for loanwords ending in -ì with preceding f/s/ts, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 't', ''], false, 'FN', true), '----Kerìsmìs----it/ti-');
			});
		});

		describe('the dative suffix', () => {
			test('is -ur for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'r', ''], false, 'FN'), '----fwampop----ur-');
			});

			test('is -ur/-ru for nouns ending in \'', (t) => {
				assert.strictEqual(conjugate('olo\'', ['', '', '', '', '', 'r', ''], false, 'FN'), '----olo\'----ur/ru-');
			});

			test('is -r(u) for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'r', ''], false, 'FN'), '----kelku----r(u)-');
			});

			test('is -ur/-ru for nouns ending in the diphthongs -ay/-ey', (t) => {
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'r', ''], false, 'FN'), '----pay----ur/ru-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'r', ''], false, 'FN'), '----kxeyey----ur/ru-');
			});

			test('is -(u)r/-ru for nouns ending in the diphthong -aw', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'r', ''], false, 'FN'), '----taw----ur/r(u)-');
			});

			test('is -r/-ru for nouns ending in the diphthong -ew', (t) => {
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'r', ''], false, 'FN'), '----fahew----r(u)-');
			});

			test('is -ur for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'r', ''], false, 'FN', true), '----Keln----ur-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'r', ''], false, 'FN', true), '----Kerìsmìs----ur-');
			});
		});

		describe('the genitive suffix', () => {
			test('is -ä for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----fwampop----ä-');
			});

			test('is -ä for nouns ending in the vowels -o/-u', (t) => {
				assert.strictEqual(conjugate('alo', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----alo----ä-');
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----kelku----ä-');
			});

			test('is -yä for nouns ending in vowels other than -o/-u', (t) => {
				assert.strictEqual(conjugate('\'ana', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----\'ana----yä-');
				assert.strictEqual(conjugate('ftxozä', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----ftxozä----yä-');
				assert.strictEqual(conjugate('fkxile', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----fkxile----yä-');
				assert.strictEqual(conjugate('awaiei', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----awaiei----yä-');
				assert.strictEqual(conjugate('vospxì', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----vospxì----yä-');
			});

			test('is -iä for nouns ending in -ia, with the -ia dropping', (t) => {
				assert.strictEqual(conjugate('soaia', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----soai----ä-');
			});

			test('is -ä for the word Omatikaya', (t) => {
				assert.strictEqual(conjugate('Omatikaya', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----Omatikaya----ä-');
			});

			test('is -ä for nouns ending in a diphthong', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----taw----ä-');
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----pay----ä-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----fahew----ä-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'ä', ''], false, 'FN'), '----kxeyey----ä-');
			});

			test('is ä for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'ä', ''], false, 'FN', true), '----Keln----ä-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'ä', ''], false, 'FN', true), '----Kerìsmìs----ä-');
			});
		});

		describe('the topical suffix', () => {
			test('is -ìri for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----fwampop----ìri-');
			});

			test('is -ri for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----kelku----ri-');
			});

			test('is -ri for nouns ending in a diphthong', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----taw----ri-');
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----pay----ri-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----fahew----ri-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'ri', ''], false, 'FN'), '----kxeyey----ri-');
			});

			test('is -ìri for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'ri', ''], false, 'FN', true), '----Keln----ìri-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'ri', ''], false, 'FN', true), '----Kerìsmìs----ìri-');
			});
		});

		describe('an adposition', () => {
			test('is appended to the noun', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'talun', ''], false, 'FN'), '----fwampop----talun-');
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'mì', ''], false, 'FN'), '----fwampop----mì-');
			});
		});
	});

	describe('stem prefixes', () => {
		test('are appended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', '', 'sì'], false, 'FN'), '----fwampop-----sì');
		});
		test('are placed after a case suffix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'l', 'sì'], false, 'FN'), '----fwampop----ìl-sì');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ftu', 'to'], false, 'FN'), '----fwampop----ftu-to');
		});
	});

	describe('simplified conjugation output', () => {
		test('behaves correctly with a case ending', (t) => {
			assert.strictEqual(conjugate('tute', ['', '', '', '', '', 'l', ''], true, 'FN'), '-tute-l');
		});
		test('behaves correctly with a plural prefix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', 'me', '', '', '', '', ''], true, 'FN'), 'me-fwampop-');
			assert.strictEqual(conjugate('fwampop', ['', 'pxe', '', '', '', '', ''], true, 'FN'), 'pxe-fwampop-');
			assert.strictEqual(conjugate('fwampop', ['', 'ay', '', '', '', '', ''], true, 'FN'), 'ay-fwampop-');
			assert.strictEqual(conjugate('tute', ['', 'me', '', '', '', '', ''], true, 'FN'), 'me-{s}ute-');
			assert.strictEqual(conjugate('tute', ['', 'pxe', '', '', '', '', ''], true, 'FN'), 'pxe-{s}ute-');
			assert.strictEqual(conjugate('tute', ['', 'ay', '', '', '', '', ''], true, 'FN'), '(ay)-{s}ute-');
		});
		test('behaves correctly with a plural prefix and a case ending', (t) => {
			assert.strictEqual(conjugate('tute', ['', 'ay', '', '', '', 'l', ''], true, 'FN'), '(ay)-{s}ute-l');
		});
		test('behaves correctly for nouns starting with an uppercase letter', (t) => {
			assert.strictEqual(conjugate('Iknimaya', ['', 'ay', '', '', '', 'l', ''], true, 'FN'), 'ay-Iknimaya-l');
			assert.strictEqual(conjugate('Kelutral', ['', 'ay', '', '', '', 'l', ''], true, 'FN'), '(ay)-{H}elutral-ìl');
		});
	});
});
