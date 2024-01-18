/**
 * Generates translations for affixed forms. For example, when searching for
 * fìtute, the code in this file is responsible for constructing the
 * translation "this person".
 */

module.exports = {
	addTranslations: addTranslations
}

let translators = {
	'v': {
		'äp': (t) => t + ' oneself',
		'eyk': (t) => 'cause (someone) to ' + t,
		'äpeyk': (t) => 'cause oneself to ' + t,

		'iv': (t) => t + ' (subj.)',

		'am': (t) => toPast(t),
		'ìm': (t) => 'just ' + toPast(t),
		'ìy': (t) => 'will soon ' + t,
		'ìsy': (t) => 'be determined to soon ' + t,
		'ay': (t) => 'will ' + t,
		'asy': (t) => 'be determined to ' + t,
		'ol': (t) => 'have ' + toPastParticiple(t),
		'er': (t) => 'be ' + toPresentParticiple(t),
		'alm': (t) => 'have ' + toPastParticiple(t),
		'ìlm': (t) => 'have just ' + toPastParticiple(t),
		'ìly': (t) => 'will soon have ' + toPastParticiple(t),
		'aly': (t) => 'will have ' + toPastParticiple(t),
		'arm': (t) => 'have been ' + toPresentParticiple(t),
		'ìrm': (t) => 'have just been ' + toPresentParticiple(t),
		'ìry': (t) => 'will soon have been ' + toPresentParticiple(t),
		'ary': (t) => 'will have been ' + toPresentParticiple(t),

		'imv': (t) => toPast(t) + ' (subj.)',
		'ìyev': (t) => 'will ' + t + ' (subj.)',
		'ilv': (t) => 'have ' + toPastParticiple(t) + ' (subj.)',
		'irv': (t) => 'be ' + toPresentParticiple(t) + ' (subj.)',

		'ei': (t) => t + ' :)',
		'äng': (t) => t + ' :(',
		'uy': (t) => t + ' (formal)',
		'ats': (t) => t + ' (infer.)',
	},
	'n': {
		'pe': (t) => 'which ' + t,
		'fì': (t, d) => (d['hasPluralPrefix'] ? 'these ' : 'this ') + t,
		'tsa': (t, d) => (d['hasPluralPrefix'] ? 'those ' : 'that ') + t,
		'fra': (t, d) => (d['hasPluralPrefix'] ? 'all ' : 'every ') + t,
		
		'me': (t) => 'two ' + pluralize(t),
		'pxe': (t) => 'three ' + pluralize(t),
		'ay': (t) => pluralize(t),

		'fne': (t) => 'type of ' + toAccusative(t),

		'tsyìp': (t) => 'little ' + t,
		'fkeyk': (t) => 'state of ' + toAccusative(t),

		'o': (t) => 'some ' + t,

		'l': (t) => t,
		't': (t) => toAccusative(t),
		'r': (t) => 'to ' + toAccusative(t),
		'ä': (t) => toPossessive(t),
		'ri': (t) => 'as for ' + toAccusative(t),

		'sì': (t) => 'and ' + t,
		'to': (t) => 'than ' + t,
	},
	'v_to_n': {
		'yu': (t) => t + 'er'
	},
	'v_to_part': {
		'us': (t) => toPresentParticiple(t),
		'awn': (t) => toPastParticiple(t),
	},
	'adj_to_adv': {
		'nì': (t) => t + 'ly'
	},
	'gerund': {
		'us': (t) => toPresentParticiple(t),
	}
};

let pasts = {
	'be': 'was',
	'have': 'had',
	'go': 'went',
	'make': 'made',
	'do': 'did',
};
function toPast(verb) {
	if (pasts.hasOwnProperty(verb)) {
		return pasts[verb];
	}
	if (verb.endsWith('e')) {
		return verb + 'd';
	}
	return duplicateFinalConsonant(verb) + 'ed';
}

let presentParticiples = {
	'be': 'being',
};
function toPresentParticiple(verb) {
	if (presentParticiples.hasOwnProperty(verb)) {
		return presentParticiples[verb];
	}
	if (verb.endsWith('e')) {
		return verb.substring(0, verb.length - 1) + 'ing';
	}
	return duplicateFinalConsonant(verb) + 'ing';
}

let pastParticiples = {
	'be': 'been',
	'have': 'had',
	'go': 'gone',
	'make': 'made',
	'do': 'done',
};
function toPastParticiple(verb) {
	if (pastParticiples.hasOwnProperty(verb)) {
		return pastParticiples[verb];
	}
	if (verb.endsWith('e')) {
		return verb + 'd';
	}
	return verb + 'ed';
}

function duplicateFinalConsonant(word) {
	if (word.length < 2) {
		return word;
	}
	let secondLast = word[word.length - 2];
	let last = word[word.length - 1];
	if ('aeiou'.includes(secondLast) && !('aeiou'.includes(last))) {
		return word + last;
	}
	return word;
}

let plurals = {
	'I': 'we',
	'you': 'you',
	'he/she': 'they',
	'he': 'they',
	'she': 'they',
	'child': 'children',
	'fish': 'fish',
};
function pluralize(noun) {
	if (plurals.hasOwnProperty(noun)) {
		return plurals[noun];
	}
	if (noun.endsWith('y')) {
		return noun.substring(0, noun.length - 1) + 'ies';
	}
	return noun + 's';
}

let accusatives = {
	'I': 'me',
	'he/she': 'him/her',
	'he': 'him',
	'she': 'her',
	'we': 'us',
	'they': 'them',
};
function toAccusative(noun) {
	if (accusatives.hasOwnProperty(noun)) {
		return accusatives[noun];
	}
	return noun;
}

let possessives = {
	'I': 'my',
	'you': 'your',
	'he/she': 'his/her',
	'he': 'his',
	'she': 'her',
	'we': 'our',
	'they': 'their',
};
function toPossessive(noun) {
	if (possessives.hasOwnProperty(noun)) {
		return possessives[noun];
	}
	return 'of ' + noun;
}

let dictionary;

function addTranslations(word, d) {
	let translation = getShortTranslation(word);
	let conjugated = word['conjugated'];

	for (let conjugation of conjugated) {
		let hasPluralPrefix = false;
		for (let affix of conjugation['affixes']) {
			if (['me', 'pxe', 'ay'].includes(affix['affix']["na'vi"])) {
				hasPluralPrefix = true;
			}
		}
		for (let affix of conjugation['affixes']) {
			affix = affix['affix'];
			a = affix;
			if (affix.hasOwnProperty("na'vi")) {
				a = affix["na'vi"];
			}
			if (translators.hasOwnProperty(conjugation['type'])) {
				if (translators[conjugation['type']].hasOwnProperty(a)) {
					let data = {
						'hasPluralPrefix': hasPluralPrefix
					};
					translation = translators[conjugation['type']][a](translation, data);
				} else if (conjugation['type'] === 'n') {
					translation = getShortTranslation(affix)
						+ ' ' + toAccusative(translation);
				}
			}
		}
		conjugation['translation'] = translation;
	}
}

function getShortTranslation(word) {
	if (word["short_translation"]) {
		return word["short_translation"];
	}

	let translation = word["translations"][0]['en'];
	translation = translation.split(',')[0];
	translation = translation.split(';')[0];
	translation = translation.split(' | ')[0];
	translation = translation.split(' (')[0];

	if (word["type"][0] === "v"
		&& translation.indexOf("to ") === 0) {
		translation = translation.substr(3);
	}

	return translation;
}
