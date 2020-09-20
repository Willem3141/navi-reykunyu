/**
 * Provides a method for parsing a conjugation string.
 *
 * An example of a conjugation string is "ay-oenge-y(ä);-awnge-y(ä)".
 * Distinct forms are separated by a semicolon. Within a form, dashes separate
 * parts. Parentheses indicate optional letters.
 * So for the example above, the possible forms are ayoengeyä, ayoengey,
 * awngeyä, and awngey.
 * The exact meaning of the parts depends on the word type.
 */

module.exports = {
	formsFromString: formsFromString
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

