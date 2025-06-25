import { describe, test } from 'node:test';
import assert from 'node:assert';

import * as rhymes from '../src/rhymes';

describe('rhymes', () => {

	describe('the rhyme ending', () => {
		test('includes only the last vowel, if the noun ends in a vowel', (t) => {
			assert.strictEqual(rhymes.rhymeEnding('a'), 'a');
			assert.strictEqual(rhymes.rhymeEnding('tute'), 'e');
			assert.strictEqual(rhymes.rhymeEnding('kaltxì'), 'ì');
			assert.strictEqual(rhymes.rhymeEnding('meoauniaea'), 'a');
		});

		test('includes only the last diphthong, if the noun ends in a diphthong', (t) => {
			assert.strictEqual(rhymes.rhymeEnding('pxaw'), 'aw');
			assert.strictEqual(rhymes.rhymeEnding('hayalovay'), 'ay');
		});

		test('includes only the last pseudovowel, if the noun ends in a pseudovowel', (t) => {
			assert.strictEqual(rhymes.rhymeEnding('trr'), 'rr');
			assert.strictEqual(rhymes.rhymeEnding('\'ewll'), 'll');
		});

		test('is e even for nouns ending with é', (t) => {
			assert.strictEqual(rhymes.rhymeEnding('tuté'), 'e');
		});

		test('is u even for nouns ending with ù', (t) => {
			assert.strictEqual(rhymes.rhymeEnding('kaltxù'), 'u');
		});

		test('includes the last vowel and consonant, if the noun ends in a vowel and a consonant', (t) => {
			assert.strictEqual(rhymes.rhymeEnding('om'), 'om');
			assert.strictEqual(rhymes.rhymeEnding('\'o\''), 'o\'');
			assert.strictEqual(rhymes.rhymeEnding('lor'), 'or');
			assert.strictEqual(rhymes.rhymeEnding('sngap'), 'ap');
			assert.strictEqual(rhymes.rhymeEnding('kxitx'), 'itx');
		});

		test('includes the last diphthong and consonant, if the noun ends in a diphthong and a consonant', (t) => {
			assert.strictEqual(rhymes.rhymeEnding('teyr'), 'eyr');
			assert.strictEqual(rhymes.rhymeEnding('lawk'), 'awk');
			assert.strictEqual(rhymes.rhymeEnding('\'awkx'), 'awkx');
		});
	});
});
