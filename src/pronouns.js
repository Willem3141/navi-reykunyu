module.exports = {
	getConjugatedForms: getConjugatedForms,
}

var conjugationString = require('./conjugationString');

function getConjugatedForms(dictionary) {
	let forms = {};

	let plurals = ["", "me", "pxe", "ay"];
	let cases = ["", "l", "t", "r", "ä", "ri"];

	for (let word of dictionary.getAll()) {
		if (word["conjugation"]) {
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 6; j++) {
					let form = word["conjugation"]["forms"][i][j];
					let allForms = conjugationString.formsFromString(form);
					for (let f in allForms) {
						if (allForms.hasOwnProperty(f)) {
							forms[allForms[f]] = {
								"word": word,
								"plural": plurals[i],
								"case": cases[j]
							};
						}
					}
				}
			}
		}
	}

	return forms;
}

