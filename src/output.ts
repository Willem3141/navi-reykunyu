/**
 * Some simple functions to output debug information to the console.
 */

export { error, warning, hint };

/** Outputs an error to the console. */
function error(message: string): void {
	console.log('\x1b[31;1mError:\x1b[37m ' + message + '\x1b[0m');
}

/** Outputs a warning to the console. */
function warning(message: string): void {
	console.log('\x1b[33;1mWarning:\x1b[37m ' + message + '\x1b[0m');
}

/** List of hint IDs we've already shown. */
let printedHints: string[] = [];

/**
 * Outputs a hint to the console.
 * @param id If provided, checks if a hint with the same ID has already been
 * output. If so, output is suppressed, to avoid showing the same hint more
 * than once.
 */
function hint(message: string, id?: string) {
	if (!id || !printedHints.includes(id)) {
		console.log(message + '\n');
		if (id) {
			printedHints.push(id);
		}
	}
}
