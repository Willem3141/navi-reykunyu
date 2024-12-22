import * as conjugationString from './conjugationString';
import * as dictionary from './dictionary';

type ConjugatedPronoun = {
	'word': WordData,
	'plural': string,
	'case': string
};

export function getConjugatedForms() {
	let forms: {[form: string]: ConjugatedPronoun} = {};

	let plurals = ["", "me", "pxe", "ay"];
	let cases = ["", "l", "t", "r", "ä", "ri"];

	for (let word of dictionary.getAll()) {
		if (word['type'] === 'n:pr' && word["conjugation"]) {
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 6; j++) {
					let form = (word['conjugation']['FN'] as NounConjugation)[i][j];
					let allForms = conjugationString.formsFromString(form);
					for (let f in allForms) {
						if (allForms.hasOwnProperty(f)) {
							forms[allForms[f]] = {
								'word': word,
								'plural': plurals[i],
								'case': cases[j]
							};
						}
					}
				}
			}
		}
	}

	return forms;
}

