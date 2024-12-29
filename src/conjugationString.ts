/**
 * Provides a method for parsing a conjugation string.
 *
 * Distinct forms are separated by a semicolon. Within a form, dashes separate
 * parts. Slashes separate options for a part, while parentheses indicate
 * optional letters within a part.
 *
 * The exact meaning of the parts depends on the word type.
 *
 * Examples:
 * "ay-oenge-y(ä);-awnge-y(ä)"
 * (parses to ayoengeyä, ayoengey, awngeyä, and awngey)
 * "k-ìyev/iyev-am--e"
 * (parses to kìyevame and kiyevame)
 */

export{ formsFromString, stringAdmits };

function formsFromString(formString: string): string[] {
	if (!formString) {
		return [];
	}
	let forms: string[] = [];

	let split = formString.split(";");
	for (let i = 0; i < split.length; i++) {
		forms = forms.concat(formsRecursive(split[i]));
	}
	return forms;
}

function formsRecursive(formString: string): string[] {

	// parse parentheses
	let parenRegex = /([^(]*)\(([^)]*)\)(.*)/;
	let result = parenRegex.exec(formString);
	if (result) {
		return formsRecursive(result[1] + result[2] + result[3]).concat(formsRecursive(result[1] + result[3]));
	}

	// parse slashes
	let parts = formString.split("-");
	for (let i = 0; i < parts.length; i++) {
		let options = parts[i].split("/");
		if (options.length > 1) {
			let forms: string[] = [];
			for (let j = 0; j < options.length; j++) {
				let optionChosenStringParts = [...parts];
				optionChosenStringParts[i] = options[j];
				let optionChosenString = optionChosenStringParts.join("-");
				forms = forms.concat(formsRecursive(optionChosenString));
			}
			return forms;
		}
	}

	return [formString.split("-").join("")];
}

function stringAdmits(formString: string, target: string): boolean {
	const forms = formsFromString(formString);
	return forms.includes(target);
}
