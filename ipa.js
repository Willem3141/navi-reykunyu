/**
 * Functions to convert pronunciation strings into IPA.
 */

module.exports = {
	generateIpa: generateIpa
}

const phonology = require("./phonology");

function generateIpa(pronunciation, type, dialect) {
	const syllables = pronunciation['syllables'].split("-");
	let ipa = '';
	let lastOfPrevious = '';
	for (let j = 0; j < syllables.length; j++) {
		if (j > 0) {
			ipa += '.';
		}
		const stressed = j + 1 === pronunciation['stressed'];
		if (stressed && syllables.length > 1) {
			ipa += 'ˈ';
		}
		ipa += syllableToIpa(syllables[j], dialect, lastOfPrevious, stressed);
		lastOfPrevious = syllables[j][syllables[j].length - 1];
	}

	if (['p', 't', 'k'].includes(ipa[ipa.length - 1])) {
		ipa += '\u031A';  // unreleased mark
	}

	if (type === "n:si" || type === "nv:si") {
		ipa += " si";
	}

	return '[' + ipa + ']';
}

function syllableToIpa(text, dialect, lastOfPrevious, stressed) {
	let ipa = '';
	text = text.toLowerCase();

	const ipaMapping = {
		'tsy': (d) => d.dialect === 'RN' ? 't͡ʃ' : 't͡sj',
		'ts': 't͡s',
		'sy': (d) => d.dialect === 'RN' ? 'ʃ' : 'sj',
		'\'': (d) => {
			if (d.dialect === 'FN' || !d.first
				|| !d.previous || !phonology.isVowel(d.previous)
				|| !d.next || !phonology.isVowel(d.next)) {
				return 'ʔ';
			}
			// RN: always drop tìftang if between two inequal vowels
			// and optionally drop tìftang if between two equal vowels
			if (d.previous === d.next) {
				return '(ʔ)';
			} else {
				return '';
			}
		},
		'ts': 't͡s',
		'ng': 'ŋ',
		'r': 'ɾ',
		'y': 'j',
		'ì': 'ɪ',
		'e': 'ɛ',
		'ä': 'æ',
		'ä': (d) => (d.dialect === 'RN' && !d.stressed) ? '(æ~ɛ)' : 'æ',
		'u': (d) => d.dialect === 'FN' ? (d.last ? 'u' : '(u~ʊ)') : 'u',
		'ù': (d) => d.dialect === 'FN' ? (d.last ? 'u' : '(u~ʊ)') : 'ʊ',
		'rr': 'r̩ː',
		'll': 'l̩ː',
		'px': (d) => (d.dialect === 'RN' && d.first) ? 'b' : 'p’',
		'tx': (d) => (d.dialect === 'RN' && d.first) ? 'd' : 't’',
		'kx': (d) => (d.dialect === 'RN' && d.first) ? 'ɡ' : 'k’',
	};

	ipaLoop:
	for (let i = 0; i < text.length; i++) {
		for (let length = Math.min(3, text.length - i); length >= 1; length--) {
			if (i <= text.length - length) {
				const next = text.substring(i, i + length);
				if (ipaMapping.hasOwnProperty(next)) {
					var toAdd = ipaMapping[next];
					if (typeof toAdd === 'string') {
						ipa += toAdd;
					} else {
						ipa += toAdd({
							'dialect': dialect,
							'first': i === 0,
							'last': i === text.length - 1,
							'previous': lastOfPrevious,
							'next': i + 1 < text.length ? text[i + 1] : '',
							'stressed': stressed
						});
					}
					i += length - 1;
					continue ipaLoop;
				}
			}
		}
		ipa += text[i];
	}

	return ipa;
}
