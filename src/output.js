/**
 * Some simple functions to output debug information to the console.
 */

module.exports = {
	error: error,
	warning: warning,
	hint: hint,
}

function error(message) {
	console.log('\x1b[31;1mError:\x1b[37m ' + message + '\x1b[0m');
}

function warning(message) {
	console.log('\x1b[33;1mWarning:\x1b[37m ' + message + '\x1b[0m');
}

let printedHints = [];

function hint(message, id) {
	if (!id || !printedHints.includes(id)) {
		console.log(message + '\n');
		if (id) {
			printedHints.push(id);
		}
	}
}
