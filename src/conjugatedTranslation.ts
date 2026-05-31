import nlp from 'compromise';

/**
 * Generates translations for affixed forms. For example, when searching for
 * fìtute, the code in this file is responsible for constructing the
 * translation "this person".
 */

let translators: Record<string, Record<string, (translation: string, data: any) => string>> = {
	'v': {
		'äp': (t) => t + ' oneself',
		'eyk': (t) => 'cause (someone) to ' + t,
		'äpeyk': (t) => 'cause oneself to ' + t,

		'iv': (t) => t,

		'am': (t) => toPast(t),
		'ìm': (t) => 'just ' + toPast(t),
		'ìy': (t) => 'will soon ' + t,
		'ìsy': (t) => 'is determined to soon ' + t,
		'ay': (t) => 'will ' + t,
		'asy': (t) => 'is determined to ' + t,
		'ol': (t) => 'have ' + toPastParticiple(t),
		'er': (t) => 'is ' + toPresentParticiple(t),
		'alm': (t) => 'have ' + toPastParticiple(t),
		'ìlm': (t) => 'have just ' + toPastParticiple(t),
		'ìly': (t) => 'will soon have ' + toPastParticiple(t),
		'aly': (t) => 'will have ' + toPastParticiple(t),
		'arm': (t) => 'have been ' + toPresentParticiple(t),
		'ìrm': (t) => 'have just been ' + toPresentParticiple(t),
		'ìry': (t) => 'will soon have been ' + toPresentParticiple(t),
		'ary': (t) => 'will have been ' + toPresentParticiple(t),

		'imv': (t) => toPast(t),
		'ìyev': (t) => 'will ' + t,
		'ilv': (t) => 'have ' + toPastParticiple(t),
		'irv': (t) => 'is ' + toPresentParticiple(t),

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
		'munsna': (t) => 'pair of ' + pluralize(t),

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
		'yu': (t) => t + 'er',
		'tswo': (t) => 'ability to ' + t
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

// Verb conjugation

// For all of the verb forms, we let compromise do the (surprisingly) complex
// work of doing the conjugations. However, the library sort of expects a full
// sentence to work with. Therefore we create a simple sentence of the form "I
// <verb>" and hand that to compromise. This coerces nlp-compromise to see our
// input as a verb. Then afterwards we simply remove the "I ". (An alternative
// would have been to use .tag('Verb'), but that doesn't work for multi-word
// definitions.)

function createVerbSentence(verb: string): string {
	if (verb === 'be' || verb.startsWith('be ')) {
		verb = 'am' + verb.substring(2);
	}
	return 'I ' + verb;
}

function toPast(verb: string): string {
	let sentence = createVerbSentence(verb);
	let pastSentence = nlp(sentence).verbs().toPastTense().all().text();
	if (!pastSentence.startsWith('I ')) {
		// Huh? Something weird seems to have happened. Fallback to a simple
		// solution.
		return verb + 'ed';
	}
	return pastSentence.substring(2);
}

function toPresentParticiple(verb: string): string {
	let sentence = createVerbSentence(verb);
	let pastSentence = nlp(sentence).verbs().toGerund().all().text();
	if (!pastSentence.startsWith('I am ')) {
		return verb + 'ing';
	}
	return pastSentence.substring(5);
}

function toPastParticiple(verb: string): string {
	let sentence = createVerbSentence(verb);
	let pastSentence = nlp(sentence).verbs().toPastParticiple().all().text();
	if (!pastSentence.startsWith('I have ')) {
		return toPast(verb);
	}
	return pastSentence.substring(7);
}

// Noun declension

let plurals: {[verb: string]: string} = {
	'I': 'we',
	'you': 'you',
	'he/she': 'they',
	'he': 'they',
	'she': 'they'
};
function pluralize(noun: string): string {
	if (plurals.hasOwnProperty(noun)) {
		return plurals[noun];
	}
	return nlp(noun).nouns().toPlural().all().text();
}

let accusatives: {[verb: string]: string} = {
	'I': 'me',
	'he/she': 'him/her',
	'he': 'him',
	'she': 'her',
	'we': 'us',
	'they': 'them',
};
function toAccusative(noun: string): string {
	if (accusatives.hasOwnProperty(noun)) {
		return accusatives[noun];
	}
	return noun;
}

let possessives: {[verb: string]: string} = {
	'I': 'my',
	'you': 'your',
	'he/she': 'his/her',
	'he': 'his',
	'she': 'her',
	'we': 'our',
	'they': 'their',
};
function toPossessive(noun: string): string {
	if (possessives.hasOwnProperty(noun)) {
		return possessives[noun];
	}
	return 'of ' + noun;
}

export function addTranslations(word: WordData): void {
	if (!word['short_translation']) {
		return;
	}
	let translation = word['short_translation']['en'];
	let conjugated = word['conjugated'];
	if (!conjugated) {
		return;
	}
	if (word["type"][0] === "v" && translation.indexOf("to ") === 0) {
		translation = translation.substring(3);
	}

	for (let conjugation of conjugated) {
		if (conjugation['affixes']) {
			let hasPluralPrefix = false;
			for (let affix of conjugation['affixes'] as any) {
				if (typeof affix['affix'] !== 'string') {
					if (['me', 'pxe', 'ay'].includes(affix['affix']["na'vi"])) {
						hasPluralPrefix = true;
					}
				}
			}
			for (let affix of conjugation['affixes']) {
				let a: string;
				if (typeof affix['affix'] === 'string') {
					a = affix['affix'];
				} else {
					a = affix['affix']["na'vi"];
				}
				if (translators.hasOwnProperty(conjugation['type'])) {
					if (translators[conjugation['type']].hasOwnProperty(a)) {
						let data = {
							'hasPluralPrefix': hasPluralPrefix
						};
						translation = translators[conjugation['type']][a](translation, data);
					} else if (conjugation['type'] === 'n') {
						translation = (affix['affix'] as WordData)['short_translation']!['en']
							+ ' ' + toAccusative(translation);
					}
				}
			}
			conjugation['translation'] = translation;
		}
	}
}
