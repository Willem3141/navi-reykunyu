/**
 * Functions to convert pronunciation strings into IPA.
 */

module.exports = {
	generateIpa: generateIpa
}

function generateIpa(pronunciation, type, dialect) {
	const syllables = pronunciation['syllables'].split("-");
	let ipa = '';
	for (let j = 0; j < syllables.length; j++) {
		if (j > 0) {
			ipa += '.';
		}
		if (syllables.length > 1 && j + 1 === pronunciation['stressed']) {
			ipa += 'ˈ';
		}
		ipa += syllableToIpa(syllables[j], dialect);
	}

	if (['p', 't', 'k'].includes(ipa[ipa.length - 1])) {
		ipa += '\u031A';  // unreleased mark
	}

	if (type === "n:si" || type === "nv:si") {
		ipa += " si";
	}

	return ipa;
}

function syllableToIpa(text, dialect) {
	let ipa = '';
	text = text.toLowerCase();

	const ipaMapping = {
		'px': 'p’',
		'tx': 't’',
		'kx': 'k’',
		'\'': 'ʔ',
		'ts': 't͡s',
		'ng': 'ŋ',
		'r': 'ɾ',
		'y': 'j',
		'ì': 'ɪ',
		'e': 'ɛ',
		'ä': 'æ',
		'a': 'ɑ',
		'rr': 'r̩ː',
		'll': 'l̩ː',
	};

	if (dialect === 'RN') {
		ipaMapping['tsy'] = 't͡ʃ';
		ipaMapping['sy'] = 'ʃ';
	}

	ipaLoop:
	for (let i = 0; i < text.length; i++) {
		for (let length = Math.min(3, text.length - i); length >= 1; length--) {
			if (i <= text.length - length) {
				const next = text.substring(i, i + length);
				if (ipaMapping.hasOwnProperty(next)) {
					ipa += ipaMapping[next];
					i += length - 1;
					continue ipaLoop;
				}
			}
		}
		ipa += text[i];
	}

	return ipa;
}
