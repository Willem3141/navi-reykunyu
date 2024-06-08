const test = require('node:test');
const assert = require('node:assert');

const dialect = require('../src/dialect');

test('converting words to FN', (t) => {
	assert.strictEqual(dialect.combinedToFN('kal/[txì]'), 'kal/[txì]');
	assert.strictEqual(dialect.combinedToFN('tsun'), 'tsun');
	assert.strictEqual(dialect.combinedToFN('tsùn'), 'tsun');
});

test('converting words to RN', (t) => {
	assert.strictEqual(dialect.combinedToRN('kal/[txì]'), 'kal/[dì]');
	assert.strictEqual(dialect.combinedToRN('tsun'), 'tsun');
	assert.strictEqual(dialect.combinedToRN('tsùn'), 'tsùn');

	// syllable-initial ejectives become voiced stops
	assert.strictEqual(dialect.combinedToRN('kxor'), 'gor');
	assert.strictEqual(dialect.combinedToRN('pxor'), 'bor');
	assert.strictEqual(dialect.combinedToRN('txon'), 'don');

	// non-syllable-initial ejectives do not become voiced stops
	assert.strictEqual(dialect.combinedToRN('skxom'), 'skxom');
	assert.strictEqual(dialect.combinedToRN('spxam'), 'spxam');
	assert.strictEqual(dialect.combinedToRN('stxong'), 'stxong');

	// syllable-initial ejectives become voiced stops if followed by another
	// ejective
	assert.strictEqual(dialect.combinedToRN('ekx/[txu]'), 'eg/[du]');
	assert.strictEqual(dialect.combinedToRN('atx/[kxe]'), 'ad/[ge]');

	// tìftang between unequal vowels gets dropped
	assert.strictEqual(dialect.combinedToRN("['i]/'a"), "['i]/a");
	assert.strictEqual(dialect.combinedToRN("['i']/a"), "['i]/a");
	assert.strictEqual(dialect.combinedToRN("tì/['i']/a"), "tì/[i]/a");

	// tìftang between equal vowels does not get dropped
	assert.strictEqual(dialect.combinedToRN("[la]/'ang"), "[la]/'ang");
	assert.strictEqual(dialect.combinedToRN("[la']/ang"), "[la']/ang");

	// -n/kx- becomes -n/·g-
	assert.strictEqual(dialect.combinedToRN('tì/kan/[kxan]'), 'tì/kan·/[gan]');

	// ä becomes e in unstressed syllables
	assert.strictEqual(dialect.combinedToRN('sä/[lang]'), 'se/[lang]');

	// ä does not become e in stressed syllables
	assert.strictEqual(dialect.combinedToRN("vi/[rä]"), 'vi/[rä]');
});
