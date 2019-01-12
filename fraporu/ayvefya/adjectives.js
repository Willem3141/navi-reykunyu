/**
 * Functions for prefixing and suffixing adjectives with -a-
 */

function prefixed(adjective) {
	if (adjective.charAt(0) === "a") { // TODO should this also be done with aw- and ay-?
		return adjective
	} if (adjective.substring(0, 2) === "le") {
		return "<span class='prefix'>(a)</span>-" + adjective
	} else {
		return "<span class='prefix'>a</span>-" + adjective
	}
}

function suffixed(adjective) {
	if (adjective.charAt(adjective.length - 1) === "a") {
		return adjective
	} else {
		return adjective + "-<span class='suffix'>a</span>"
	}
}

