/**
 * Functions to convert pronunciation strings into IPA.
 */

module.exports = {
	generateIpa: generateIpa
}

const convert = require("./convert");
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
		let nextStartsWithEjective = false;
		let nextStartsWithVowel = false;
		if (j + 1 < syllables.length) {
			const nextSyllable = syllables[j + 1];
			nextStartsWithEjective = nextSyllable.length > 1 && nextSyllable[1] === 'x';
			nextStartsWithVowel = phonology.isVowel(nextSyllable[0]);
		}
		ipa += syllableToIpa(syllables[j], dialect, lastOfPrevious, nextStartsWithEjective, stressed);
		lastOfPrevious = syllables[j][syllables[j].length - 1];
		if (['p', 't', 'k'].includes(lastOfPrevious) && !nextStartsWithVowel) {
			ipa += '\u031A';  // unreleased mark
		}
	}

	if (type === "n:si" || type === "nv:si") {
		ipa += " si";
	}

	return '[' + ipa + ']';
}

function syllableToIpa(text, dialect, lastOfPrevious, nextStartsWithEjective, stressed) {
	let ipa = '';
	text = convert.compress(text.toLowerCase());

	const ipaMapping = {
		'cy': (d) => d.dialect === 'RN' ? 't͡ʃ' : 't͡sj',
		'c': 't͡s',
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
		'c': 't͡s',
		'g': 'ŋ',
		'r': 'ɾ',
		'y': 'j',
		'ì': 'ɪ',
		'e': 'ɛ',
		'ä': 'æ',
		'ä': (d) => (d.dialect === 'RN' && !d.stressed) ? '(æ~ɛ)' : 'æ',
		'u': (d) => d.dialect === 'FN' ? (d.last ? 'u' : '(u~ʊ)') : 'u',
		'ù': (d) => d.dialect === 'FN' ? (d.last ? 'u' : '(u~ʊ)') : 'ʊ',
		'R': 'r̩ː',
		'L': 'l̩ː',
		'P': (d) => (d.dialect === 'RN' && (d.first || (d.last && d.nextStartsWithEjective))) ? 'b' : 'p’',
		'T': (d) => (d.dialect === 'RN' && (d.first || (d.last && d.nextStartsWithEjective))) ? 'd' : 't’',
		'K': (d) => (d.dialect === 'RN' && (d.first || (d.last && d.nextStartsWithEjective))) ? 'ɡ' : 'k’',
		'1': 'aw',
		'2': 'aj',
		'3': 'ɛw',
		'4': 'ɛj',
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
							'stressed': stressed,
							'nextStartsWithEjective': nextStartsWithEjective
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
