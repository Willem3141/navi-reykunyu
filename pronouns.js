module.exports = {
	getConjugatedForms: getConjugatedForms,
	formsFromString: formsFromString
}

function getConjugatedForms(dictionary) {
	let forms = {};

	let plurals = ["", "me", "pxe", "ay"];
	let cases = ["", "l", "t", "r", "ä", "ri"];

	for (let w in dictionary) {
		if (dictionary.hasOwnProperty(w)) {
			let word = dictionary[w];
			if (word["conjugation"]) {
				for (let i = 0; i < 4; i++) {
					for (let j = 0; j < 6; j++) {
						let form = word["conjugation"]["forms"][i][j];
						let allForms = formsFromString(form);
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
	}

	return forms;
}

function formsFromString(formString) {
	if (!formString) {
		return [];
	}
	let forms = [];

	let split = formString.split(";");
	for (let i = 0; i < split.length; i++) {
		forms = forms.concat(formsRecursive(split[i]));
	}
	return forms;
}

function formsRecursive(formString) {
	let forms = [];
	let regex = /([^(]*)\(([^)]*)\)(.*)/;
	let result = regex.exec(formString);
	if (result === null) {
		forms.push(formString.split("-").join(""));
	} else {
		forms = forms.concat(formsRecursive(result[1] + result[2] + result[3]));
		forms = forms.concat(formsRecursive(result[1] + result[3]));
	}
	return forms;
}

