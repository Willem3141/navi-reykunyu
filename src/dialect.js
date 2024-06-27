/// Functions that convert a Na'vi word with syllable separators and stressed
/// syllable marks (like "txùm/[tsä']/wll") to the conventional spelling in FN,
/// RN, or combined (FN + "ù" where relevant).

module.exports = {
	'makeRaw': makeRaw,
	'combinedToFN': combinedToFN,
	'combinedToRN': combinedToRN
}

/// Removes the syllable separators and stressed syllable marks.
function makeRaw(word) {
	return word.replace(/[-\[\]]/g, '').replaceAll('/', '');
}

/// Changes combined notation to FN (this just drops the ù).
function combinedToFN(combined) {
	return combined.replaceAll('ù', 'u');
}

/// Changes combined notation to RN.
function combinedToRN(combined) {
	let rn = combined;

	// syllable-initial ejectives become voiced stops
	rn = rn.replace(/(?<=^|[^fs])px(?=[aäeiìouù])/g, 'b');
	rn = rn.replace(/(?<=^|[^fs])tx(?=[aäeiìouù])/g, 'd');
	rn = rn.replace(/(?<=^|[^fs])kx(?=[aäeiìouù])/g, 'g');

	// syllable-final ejectives become voiced stops if followed by a voiced stop
	rn = rn.replace(/px(?=\/\[?[bdg])/g, 'b');
	rn = rn.replace(/tx(?=\/\[?[bdg])/g, 'd');
	rn = rn.replace(/kx(?=\/\[?[bdg])/g, 'g');

	// tìftang dropping between non-equal vowels
	rn = rn.replace(/(([aäeiìouù]|[ae][wy])\]?\/\[?)'([aäeiìouù])/g,
		function (m, before, beforeVowel, afterVowel) {
			return beforeVowel === afterVowel ? before + "'" + afterVowel : before + afterVowel;
		});
	rn = rn.replace(/([aäeiìouù]|[ae][wy])'(\]?\/\[?([aäeiìouù]))/g,
		function (m, beforeVowel, after, afterVowel) {
			return beforeVowel === afterVowel ? beforeVowel + "'" + after : beforeVowel + after;
		});

	// ä becomes e in unstressed syllables
	rn = rn.replace(/ä(?=.*\[)/g, 'e');
	rn = rn.replace(/(?<=\].*)ä/g, 'e');

	// insert interpunct to avoid n/g being read as ng
	rn = rn.replace(/(?<=n\]?)\/(?=\[?g)/g, '·/');

	return rn;
}
