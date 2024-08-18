const test = require('node:test');
const assert = require('node:assert');

const nouns = require('../src/nouns');

test('adding case suffixes to a noun ending in a consonant', (t) => {
	assert.strictEqual(nouns.conjugate('fwampop', ['', '', '', '', '', '', ''], true, 'FN'), '-fwampop-');
	assert.strictEqual(nouns.conjugate('fwampop', ['', '', '', '', '', 'l', ''], true, 'FN'), '-fwampop-ìl');
	assert.strictEqual(nouns.conjugate('fwampop', ['', '', '', '', '', 't', ''], true, 'FN'), '-fwampop-it/ti');
	assert.strictEqual(nouns.conjugate('fwampop', ['', '', '', '', '', 'r', ''], true, 'FN'), '-fwampop-ur');
	assert.strictEqual(nouns.conjugate('fwampop', ['', '', '', '', '', 'ä', ''], true, 'FN'), '-fwampop-ä');
	assert.strictEqual(nouns.conjugate('fwampop', ['', '', '', '', '', 'ri', ''], true, 'FN'), '-fwampop-ìri');
});

test('adding case suffixes to a noun ending in a vowel', (t) => {
	assert.strictEqual(nouns.conjugate('kelku', ['', '', '', '', '', '', ''], true, 'FN'), '-kelku-');
	assert.strictEqual(nouns.conjugate('kelku', ['', '', '', '', '', 'l', ''], true, 'FN'), '-kelku-l');
	assert.strictEqual(nouns.conjugate('kelku', ['', '', '', '', '', 't', ''], true, 'FN'), '-kelku-t(i)');
	assert.strictEqual(nouns.conjugate('kelku', ['', '', '', '', '', 'r', ''], true, 'FN'), '-kelku-r(u)');
	assert.strictEqual(nouns.conjugate('kelku', ['', '', '', '', '', 'ä', ''], true, 'FN'), '-kelku-ä');
	assert.strictEqual(nouns.conjugate('kelku', ['', '', '', '', '', 'ri', ''], true, 'FN'), '-kelku-ri');
});

test('adding case suffixes to a loaned noun ending in ì', (t) => {
	assert.strictEqual(nouns.conjugate('Kelnì', ['', '', '', '', '', '', ''], true, 'FN', true), '-Kelnì-');
	assert.strictEqual(nouns.conjugate('Kelnì', ['', '', '', '', '', 'l', ''], true, 'FN', true), '-Keln-ìl');
	assert.strictEqual(nouns.conjugate('Kelnì', ['', '', '', '', '', 't', ''], true, 'FN', true), '-Keln-it');
	assert.strictEqual(nouns.conjugate('Kelnì', ['', '', '', '', '', 'r', ''], true, 'FN', true), '-Keln-ur');
	assert.strictEqual(nouns.conjugate('Kelnì', ['', '', '', '', '', 'ä', ''], true, 'FN', true), '-Keln-ä');
	assert.strictEqual(nouns.conjugate('Kelnì', ['', '', '', '', '', 'ri', ''], true, 'FN', true), '-Keln-ìri');
});

test('adding plural prefixes to a noun', (t) => {
	assert.strictEqual(nouns.conjugate('fwampop', ['', '', '', '', '', '', ''], true, 'FN'), '-fwampop-');
	assert.strictEqual(nouns.conjugate('fwampop', ['', 'me', '', '', '', '', ''], true, 'FN'), 'me-fwampop-');
	assert.strictEqual(nouns.conjugate('fwampop', ['', 'pxe', '', '', '', '', ''], true, 'FN'), 'pxe-fwampop-');
	assert.strictEqual(nouns.conjugate('fwampop', ['', 'ay', '', '', '', '', ''], true, 'FN'), 'ay-fwampop-');
});

test('adding plural prefixes to a noun that requires lenition', (t) => {
	assert.strictEqual(nouns.conjugate('kelku', ['', '', '', '', '', '', ''], true, 'FN'), '-kelku-');
	assert.strictEqual(nouns.conjugate('kelku', ['', 'me', '', '', '', '', ''], true, 'FN'), 'me-{h}elku-');
	assert.strictEqual(nouns.conjugate('kelku', ['', 'pxe', '', '', '', '', ''], true, 'FN'), 'pxe-{h}elku-');
	assert.strictEqual(nouns.conjugate('kelku', ['', 'ay', '', '', '', '', ''], true, 'FN'), '(ay)-{h}elku-');
});

test('adding plural prefixes to a capitalized noun', (t) => {
	assert.strictEqual(nouns.conjugate('Fwampop', ['', '', '', '', '', '', ''], true, 'FN'), '-Fwampop-');
	assert.strictEqual(nouns.conjugate('Fwampop', ['', 'me', '', '', '', '', ''], true, 'FN'), 'me-Fwampop-');
	assert.strictEqual(nouns.conjugate('Fwampop', ['', 'pxe', '', '', '', '', ''], true, 'FN'), 'pxe-Fwampop-');
	assert.strictEqual(nouns.conjugate('Fwampop', ['', 'ay', '', '', '', '', ''], true, 'FN'), 'ay-Fwampop-');
});

test('adding plural prefixes to a capitalized noun that requires lenition', (t) => {
	assert.strictEqual(nouns.conjugate('Kelku', ['', '', '', '', '', '', ''], true, 'FN'), '-Kelku-');
	assert.strictEqual(nouns.conjugate('Kelku', ['', 'me', '', '', '', '', ''], true, 'FN'), 'me-{H}elku-');
	assert.strictEqual(nouns.conjugate('Kelku', ['', 'pxe', '', '', '', '', ''], true, 'FN'), 'pxe-{H}elku-');
	assert.strictEqual(nouns.conjugate('Kelku', ['', 'ay', '', '', '', '', ''], true, 'FN'), '(ay)-{H}elku-');
});
