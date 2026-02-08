import { describe, test } from 'node:test';
import assert from 'node:assert';

import * as translations from '../src/translations';

describe('UI translations', () => {

	describe('the main translation function _', () => {
		test('outputs in the currently set language', (t) => {
			translations.setLanguage('en');
			assert.strictEqual(translations._('language'), 'English');
			translations.setLanguage('de');
			assert.strictEqual(translations._('language'), 'Deutsch');
		});

		test('outputs in English if the string doesn\'t exist in the requested language', (t) => {
			translations.setLanguage('en');
			assert.strictEqual(translations._('language'), 'English');
			translations.setLanguage('non-existing');
			assert.strictEqual(translations._('language'), 'English');
		});
	});
});
