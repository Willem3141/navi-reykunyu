/**
 * Converts Na'vi words between the conventional spelling and a compressed
 * spelling, that uses one character per Na'vi letter. This is helpful because
 * then things like ‘find the last letter of a word’ becomes much easier.
 * 
 * All one-character letters are just mapped to themselves. The conversion
 * table for the remaining letters:
 * 
 * ts -> c
 * ng -> G
 * tx -> T
 * px -> P
 * kx -> K
 * ll -> L
 * rr -> R
 * aw -> 1
 * ay -> 2
 * ew -> 3
 * ey -> 4
 * 
 * This compression is lossless for all valid Na'vi words (but does not
 * conserve capitalization).
 */

module.exports = {
	compress: compress,
	decompress: decompress,
	decompressAll: decompressAll
}

function compress(word) {
	let result = word.replace(/ts/g, 'c')
	                 .replace(/ng/g, 'G')
	                 .replace(/tx/g, 'T')
	                 .replace(/px/g, 'P')
	                 .replace(/kx/g, 'K')
	                 .replace(/ll/g, 'L')
	                 .replace(/rr/g, 'R')
	                 .replace(/aw/g, '1')
	                 .replace(/ay/g, '2')
	                 .replace(/ew/g, '3')
	                 .replace(/ey/g, '4')
	                 .replace(/·/g, '');
	return result;
}

function decompress(word) {
	let result = word.replace(/1/g, 'aw')
	                 .replace(/2/g, 'ay')
	                 .replace(/3/g, 'ew')
	                 .replace(/4/g, 'ey')
	                 .replace(/L/g, 'll')
	                 .replace(/R/g, 'rr')
	                 .replace(/T/g, 'tx')
	                 .replace(/P/g, 'px')
	                 .replace(/K/g, 'kx')
	                 .replace(/c/g, 'ts')
	                 .replace(/ng/g, 'n·g')
	                 .replace(/G/g, 'ng');
	return result;
}

function decompressAll(input) {
	if (Array.isArray(input)) {
		let result = []
		for (let i = 0; i < input.length; i++) {
			result.push(decompressAll(input[i]));
		}
		return result;
	} else {
		return decompress(input);
	}
}
