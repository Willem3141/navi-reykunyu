import { describe, test } from 'node:test';
import assert from 'node:assert';

import { conjugate, conjugateSimple } from '../src/nouns/conjugator';

// conjugation options:
// [fì/tsa/pe/fra-, me/pxe/ay-, fne-, (...), -tsyìp/fkeyk, -pe/o, -l/t/r/ä/ri/adp., -sì/to]

describe('noun conjugations', () => {

	describe('determiner prefixes', () => {
		test('are prepended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['fì', '', '', '', '', '', ''], 'FN'), 'fì----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', '', '', '', '', '', ''], 'FN'), 'tsa----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', '', '', '', '', '', ''], 'FN'), 'pe----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fra', '', '', '', '', '', ''], 'FN'), 'fra----fwampop-----');
		});

		test('in the case of pe+, lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['pe', '', '', '', '', '', ''], 'FN'), 'pe---h-elku-----');
		});

		test('in the case of other determiners, do not lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['fì', '', '', '', '', '', ''], 'FN'), 'fì----kelku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', '', '', '', '', '', ''], 'FN'), 'tsa----kelku-----');
			assert.strictEqual(conjugate('kelku', ['fra', '', '', '', '', '', ''], 'FN'), 'fra----kelku-----');
		});

		test('contract when the noun starts with the same letter', (t) => {
			assert.strictEqual(conjugate('ìlva', ['fì', '', '', '', '', '', ''], 'FN'), 'f----ìlva-----');
			assert.strictEqual(conjugate('atan', ['tsa', '', '', '', '', '', ''], 'FN'), 'ts----atan-----');
			assert.strictEqual(conjugate('ekxan', ['pe', '', '', '', '', '', ''], 'FN'), 'p----ekxan-----');
			assert.strictEqual(conjugate('atan', ['fra', '', '', '', '', '', ''], 'FN'), 'fr----atan-----');
		});

		test('in the case of pe+, also contract if the noun starts with e- after lenition', (t) => {
			assert.strictEqual(conjugate('\'eylan', ['pe', '', '', '', '', '', ''], 'FN'), 'p----eylan-----');
		});
	});

	describe('plural prefixes', () => {
		test('are prepended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', '', ''], 'FN'), '----fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'me', '', '', '', '', ''], 'FN'), '-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'pxe', '', '', '', '', ''], 'FN'), '-pxe---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['', 'ay', '', '', '', '', ''], 'FN'), '-ay---fwampop-----');
		});

		test('in the case of me+ and pxe+, drop their -e if the noun starts with e-', (t) => {
			assert.strictEqual(conjugate('ekxan', ['', '', '', '', '', '', ''], 'FN'), '----ekxan-----');
			assert.strictEqual(conjugate('ekxan', ['', 'me', '', '', '', '', ''], 'FN'), '-m---ekxan-----');
			assert.strictEqual(conjugate('ekxan', ['', 'pxe', '', '', '', '', ''], 'FN'), '-px---ekxan-----');
			assert.strictEqual(conjugate('ekxan', ['', 'ay', '', '', '', '', ''], 'FN'), '-ay---ekxan-----');
		});

		test('in the case of me+ and pxe+, drop their -e if the noun starts with ew-/ey-', (t) => {
			assert.strictEqual(conjugate('ewro', ['', '', '', '', '', '', ''], 'FN'), '----ewro-----');
			assert.strictEqual(conjugate('ewro', ['', 'me', '', '', '', '', ''], 'FN'), '-m---ewro-----');
			assert.strictEqual(conjugate('ewro', ['', 'pxe', '', '', '', '', ''], 'FN'), '-px---ewro-----');
			assert.strictEqual(conjugate('ewro', ['', 'ay', '', '', '', '', ''], 'FN'), '-ay---ewro-----');
			assert.strictEqual(conjugate('eyktan', ['', '', '', '', '', '', ''], 'FN'), '----eyktan-----');
			assert.strictEqual(conjugate('eyktan', ['', 'me', '', '', '', '', ''], 'FN'), '-m---eyktan-----');
			assert.strictEqual(conjugate('eyktan', ['', 'pxe', '', '', '', '', ''], 'FN'), '-px---eyktan-----');
			assert.strictEqual(conjugate('eyktan', ['', 'ay', '', '', '', '', ''], 'FN'), '-ay---eyktan-----');
		});

		test('in the case of me+ and pxe+, drop their -e if the noun starts with e- after lenition', (t) => {
			assert.strictEqual(conjugate('\'eylan', ['', '', '', '', '', '', ''], 'FN'), '----\'eylan-----');
			assert.strictEqual(conjugate('\'eylan', ['', 'me', '', '', '', '', ''], 'FN'), '-m---eylan-----');
			assert.strictEqual(conjugate('\'eylan', ['', 'pxe', '', '', '', '', ''], 'FN'), '-px---eylan-----');
			assert.strictEqual(conjugate('\'eylan', ['', 'ay', '', '', '', '', ''], 'FN'), '-(ay)---eylan-----');
		});

		test('lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['', '', '', '', '', '', ''], 'FN'), '----kelku-----');
			assert.strictEqual(conjugate('kelku', ['', 'me', '', '', '', '', ''], 'FN'), '-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['', 'pxe', '', '', '', '', ''], 'FN'), '-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['', 'ay', '', '', '', '', ''], 'FN'), '-(ay)--h-elku-----');
		});

		test('don\'t lenite the noun if it starts with \'ll/\'rr', (t) => {
			assert.strictEqual(conjugate('\'llngo', ['', 'me', '', '', '', '', ''], 'FN'), '-me---\'llngo-----');
			assert.strictEqual(conjugate('\'rrpxom', ['', 'pxe', '', '', '', '', ''], 'FN'), '-pxe---\'rrpxom-----');
		});

		test('preserve the initial uppercase letter of the noun', (t) => {
			assert.strictEqual(conjugate('Fwampop', ['', '', '', '', '', '', ''], 'FN'), '----Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'me', '', '', '', '', ''], 'FN'), '-me---Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'pxe', '', '', '', '', ''], 'FN'), '-pxe---Fwampop-----');
			assert.strictEqual(conjugate('Fwampop', ['', 'ay', '', '', '', '', ''], 'FN'), '-ay---Fwampop-----');
		});

		test('lenite the noun even if it starts with an uppercase letter', (t) => {
			assert.strictEqual(conjugate('Kelku', ['', '', '', '', '', '', ''], 'FN'), '----Kelku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'me', '', '', '', '', ''], 'FN'), '-me--H-elku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'pxe', '', '', '', '', ''], 'FN'), '-pxe--H-elku-----');
			assert.strictEqual(conjugate('Kelku', ['', 'ay', '', '', '', '', ''], 'FN'), '-(ay)--H-elku-----');
			assert.strictEqual(conjugate('Txon', ['', '', '', '', '', '', ''], 'FN'), '----Txon-----');
			assert.strictEqual(conjugate('Txon', ['', 'me', '', '', '', '', ''], 'FN'), '-me--T-on-----');
			assert.strictEqual(conjugate('Txon', ['', 'pxe', '', '', '', '', ''], 'FN'), '-pxe--T-on-----');
			assert.strictEqual(conjugate('Txon', ['', 'ay', '', '', '', '', ''], 'FN'), '-(ay)--T-on-----');
		});

		test('are placed after a determiner prefix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['fì', 'me', '', '', '', '', ''], 'FN'), 'fì-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', 'me', '', '', '', '', ''], 'FN'), 'tsa-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', 'me', '', '', '', '', ''], 'FN'), 'pe-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fra', 'me', '', '', '', '', ''], 'FN'), 'fra-me---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fì', 'ay', '', '', '', '', ''], 'FN'), 'f(ì)-ay---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', 'ay', '', '', '', '', ''], 'FN'), 'ts-ay---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', 'ay', '', '', '', '', ''], 'FN'), 'p-ay---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['fra', 'ay', '', '', '', '', ''], 'FN'), 'fr-ay---fwampop-----');
		});

		test('when combined with pe+, get lenited themselves', (t) => {
			assert.strictEqual(conjugate('fwampop', ['fì', 'pxe', '', '', '', '', ''], 'FN'), 'fì-pxe---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['tsa', 'pxe', '', '', '', '', ''], 'FN'), 'tsa-pxe---fwampop-----');
			assert.strictEqual(conjugate('fwampop', ['pe', 'pxe', '', '', '', '', ''], 'FN'), 'pe-pe---fwampop-----'); // note the extra lenition
			assert.strictEqual(conjugate('fwampop', ['fra', 'pxe', '', '', '', '', ''], 'FN'), 'fra-pxe---fwampop-----');
			assert.strictEqual(conjugate('eylan', ['fì', 'pxe', '', '', '', '', ''], 'FN'), 'fì-px---eylan-----');
			assert.strictEqual(conjugate('eylan', ['tsa', 'pxe', '', '', '', '', ''], 'FN'), 'tsa-px---eylan-----');
			assert.strictEqual(conjugate('eylan', ['pe', 'pxe', '', '', '', '', ''], 'FN'), 'pe-p---eylan-----'); // note the extra lenition
			assert.strictEqual(conjugate('eylan', ['fra', 'pxe', '', '', '', '', ''], 'FN'), 'fra-px---eylan-----');
		});

		test('when combined with a determiner, still lenite the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['fì', 'me', '', '', '', '', ''], 'FN'), 'fì-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', 'me', '', '', '', '', ''], 'FN'), 'tsa-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['pe', 'me', '', '', '', '', ''], 'FN'), 'pe-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fra', 'me', '', '', '', '', ''], 'FN'), 'fra-me--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fì', 'pxe', '', '', '', '', ''], 'FN'), 'fì-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', 'pxe', '', '', '', '', ''], 'FN'), 'tsa-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['pe', 'pxe', '', '', '', '', ''], 'FN'), 'pe-pe--h-elku-----'); // note the extra lenition
			assert.strictEqual(conjugate('kelku', ['fra', 'pxe', '', '', '', '', ''], 'FN'), 'fra-pxe--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fì', 'ay', '', '', '', '', ''], 'FN'), 'f(ì)-ay--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['tsa', 'ay', '', '', '', '', ''], 'FN'), 'ts-ay--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['pe', 'ay', '', '', '', '', ''], 'FN'), 'p-ay--h-elku-----');
			assert.strictEqual(conjugate('kelku', ['fra', 'ay', '', '', '', '', ''], 'FN'), 'fr-ay--h-elku-----');
		});
	});

	describe('stem prefixes', () => {
		test('are prepended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', 'fne', '', '', '', ''], 'FN'), '--fne--fwampop-----');
		});

		test('are placed after a plural prefix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', 'me', 'fne', '', '', '', ''], 'FN'), '-me-fne--fwampop-----');
		});

		test('do not cause lenition', (t) => {
			assert.strictEqual(conjugate('kelku', ['', '', 'fne', '', '', '', ''], 'FN'), '--fne--kelku-----');
		});

		test('block earlier leniting prefixes from leniting the noun', (t) => {
			assert.strictEqual(conjugate('kelku', ['pe', '', 'fne', '', '', '', ''], 'FN'), 'pe--fne--kelku-----');
			assert.strictEqual(conjugate('kelku', ['', 'ay', 'fne', '', '', '', ''], 'FN'), '-ay-fne--kelku-----');
		});

		test('contract when the noun starts with the same letter', (t) => {
			assert.strictEqual(conjugate('ekxan', ['', '', 'fne', '', '', '', ''], 'FN'), '--fn--ekxan-----');
		});
	});

	describe('stem suffixes', () => {
		test('are appended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', 'fkeyk', '', '', ''], 'FN'), '----fwampop--fkeyk---');
			assert.strictEqual(conjugate('fwampop', ['', '', '', 'tsyìp', '', '', ''], 'FN'), '----fwampop--tsyìp---');
		});

		test('are placed before a determiner suffix', (t) => {
			assert.strictEqual(conjugate('ya', ['', '', '', 'fkeyk', 'pe', '', ''], 'FN'), '----ya--fkeyk-pe--');
		});

		test('determine the form of a following case suffix', (t) => {
			assert.strictEqual(conjugate('ya', ['', '', '', 'fkeyk', '', 't', ''], 'FN'), '----ya--fkeyk--it/ti-');
			assert.strictEqual(conjugate('ya', ['', '', '', 'tsyìp', '', 'r', ''], 'FN'), '----ya--tsyìp--ur-');
		});
	});

	describe('determiner suffixes', () => {
		test('are appended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'pe', '', ''], 'FN'), '----fwampop---pe--');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'o', '', ''], 'FN'), '----fwampop---o--');
		});

		test('are placed before a case suffix', (t) => {
			assert.strictEqual(conjugate('ya', ['', '', '', '', 'pe', 'l', ''], 'FN'), '----ya---pe-l-');
		});

		test('determine the form of a following case suffix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'pe', 't', ''], 'FN'), '----fwampop---pe-t(i)-');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', 'o', 'r', ''], 'FN'), '----fwampop---o-r(u)-');
		});
	});

	describe('case suffixes', () => {
		describe('the agentive suffix', () => {
			test('is -ìl for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'l', ''], 'FN'), '----fwampop----ìl-');
			});

			test('is -l for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'l', ''], 'FN'), '----kelku----l-');
			});

			test('is -ìl for nouns ending in a diphthong', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'l', ''], 'FN'), '----taw----ìl-');
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'l', ''], 'FN'), '----pay----ìl-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'l', ''], 'FN'), '----fahew----ìl-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'l', ''], 'FN'), '----kxeyey----ìl-');
			});

			test('is -ìl for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'l', ''], 'FN', true), '----Keln----ìl-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'l', ''], 'FN', true), '----Kerìsmìs----ìl-');
			});
		});

		describe('the patientive suffix', () => {
			test('is -it/-ti for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 't', ''], 'FN'), '----fwampop----it/ti-');
			});

			test('is -t(i) for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 't', ''], 'FN'), '----kelku----t(i)-');
			});

			test('is -it/-ti for nouns ending in the diphthongs -aw/-ew', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 't', ''], 'FN'), '----taw----it/ti-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 't', ''], 'FN'), '----fahew----it/ti-');
			});

			test('is -(i)t/-ti for nouns ending in the diphthong -ay', (t) => {
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 't', ''], 'FN'), '----pay----it/t(i)-');
			});

			test('is -t/-ti for nouns ending in the diphthong -ey', (t) => {
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 't', ''], 'FN'), '----kxeyey----t(i)-');
			});

			test('is -it for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 't', ''], 'FN', true), '----Keln----it-');
			});

			test('is -it/-ti for loanwords ending in -ì with preceding f/s/ts, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 't', ''], 'FN', true), '----Kerìsmìs----it/ti-');
			});
		});

		describe('the dative suffix', () => {
			test('is -ur for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'r', ''], 'FN'), '----fwampop----ur-');
			});

			test('is -ur/-ru for nouns ending in \'', (t) => {
				assert.strictEqual(conjugate('olo\'', ['', '', '', '', '', 'r', ''], 'FN'), '----olo\'----ur/ru-');
			});

			test('is -r(u) for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'r', ''], 'FN'), '----kelku----r(u)-');
			});

			test('is -ur/-ru for nouns ending in the diphthongs -ay/-ey', (t) => {
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'r', ''], 'FN'), '----pay----ur/ru-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'r', ''], 'FN'), '----kxeyey----ur/ru-');
			});

			test('is -(u)r/-ru for nouns ending in the diphthong -aw', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'r', ''], 'FN'), '----taw----ur/r(u)-');
			});

			test('is -r/-ru for nouns ending in the diphthong -ew', (t) => {
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'r', ''], 'FN'), '----fahew----r(u)-');
			});

			test('is -ur for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'r', ''], 'FN', true), '----Keln----ur-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'r', ''], 'FN', true), '----Kerìsmìs----ur-');
			});
		});

		describe('the genitive suffix', () => {
			test('is -ä for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ä', ''], 'FN'), '----fwampop----ä-');
			});

			test('is -ä for nouns ending in the vowels -o/-u', (t) => {
				assert.strictEqual(conjugate('alo', ['', '', '', '', '', 'ä', ''], 'FN'), '----alo----ä-');
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'ä', ''], 'FN'), '----kelku----ä-');
			});

			test('is -yä for nouns ending in vowels other than -o/-u', (t) => {
				assert.strictEqual(conjugate('\'ana', ['', '', '', '', '', 'ä', ''], 'FN'), '----\'ana----yä-');
				assert.strictEqual(conjugate('ftxozä', ['', '', '', '', '', 'ä', ''], 'FN'), '----ftxozä----yä-');
				assert.strictEqual(conjugate('fkxile', ['', '', '', '', '', 'ä', ''], 'FN'), '----fkxile----yä-');
				assert.strictEqual(conjugate('awaiei', ['', '', '', '', '', 'ä', ''], 'FN'), '----awaiei----yä-');
				assert.strictEqual(conjugate('vospxì', ['', '', '', '', '', 'ä', ''], 'FN'), '----vospxì----yä-');
			});

			test('is -iä for nouns ending in -ia, with the -ia dropping', (t) => {
				assert.strictEqual(conjugate('soaia', ['', '', '', '', '', 'ä', ''], 'FN'), '----soai----ä-');
			});

			test('is -ä for the word Omatikaya', (t) => {
				assert.strictEqual(conjugate('Omatikaya', ['', '', '', '', '', 'ä', ''], 'FN'), '----Omatikaya----ä-');
			});

			test('is -ä for nouns ending in a diphthong', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'ä', ''], 'FN'), '----taw----ä-');
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'ä', ''], 'FN'), '----pay----ä-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'ä', ''], 'FN'), '----fahew----ä-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'ä', ''], 'FN'), '----kxeyey----ä-');
			});

			test('is ä for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'ä', ''], 'FN', true), '----Keln----ä-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'ä', ''], 'FN', true), '----Kerìsmìs----ä-');
			});
		});

		describe('the topical suffix', () => {
			test('is -ìri for nouns ending in a consonant', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ri', ''], 'FN'), '----fwampop----ìri-');
			});

			test('is -ri for nouns ending in a vowel', (t) => {
				assert.strictEqual(conjugate('kelku', ['', '', '', '', '', 'ri', ''], 'FN'), '----kelku----ri-');
			});

			test('is -ri for nouns ending in a diphthong', (t) => {
				assert.strictEqual(conjugate('taw', ['', '', '', '', '', 'ri', ''], 'FN'), '----taw----ri-');
				assert.strictEqual(conjugate('pay', ['', '', '', '', '', 'ri', ''], 'FN'), '----pay----ri-');
				assert.strictEqual(conjugate('fahew', ['', '', '', '', '', 'ri', ''], 'FN'), '----fahew----ri-');
				assert.strictEqual(conjugate('kxeyey', ['', '', '', '', '', 'ri', ''], 'FN'), '----kxeyey----ri-');
			});

			test('is -ìri for loanwords ending in -ì, with the -ì dropping', (t) => {
				assert.strictEqual(conjugate('Kelnì', ['', '', '', '', '', 'ri', ''], 'FN', true), '----Keln----ìri-');
				assert.strictEqual(conjugate('Kerìsmìsì', ['', '', '', '', '', 'ri', ''], 'FN', true), '----Kerìsmìs----ìri-');
			});
		});

		describe('an adposition', () => {
			test('is appended to the noun', (t) => {
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'talun', ''], 'FN'), '----fwampop----talun-');
				assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'mì', ''], 'FN'), '----fwampop----mì-');
			});
		});
	});

	describe('stem prefixes', () => {
		test('are appended to the noun', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', '', 'sì'], 'FN'), '----fwampop-----sì');
		});
		test('are placed after a case suffix', (t) => {
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'l', 'sì'], 'FN'), '----fwampop----ìl-sì');
			assert.strictEqual(conjugate('fwampop', ['', '', '', '', '', 'ftu', 'to'], 'FN'), '----fwampop----ftu-to');
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
});
