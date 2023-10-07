/**
 * Code that generates an affix list for a conjugated form.
 */

module.exports = {
	makeAffixList: makeAffixList
}

let dictionary;

function makeAffixList(conjugated, d) {
	dictionary = d;

	list = [];

	for (let conjugation of conjugated) {
		let affixes = conjugation['conjugation']['affixes'];
		if (conjugation['type'] === 'n') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre', 'aff:pre:len']);
			if (affixes[1] === '(ay)') {
				addAffix(list, 'prefix', 'ay', ['aff:pre:len']);
			} else {
				addAffix(list, 'prefix', affixes[1], ['aff:pre:len']);
			}
			addAffix(list, 'prefix', affixes[2], ['aff:pre']);
			addAffix(list, 'suffix', affixes[3], ['aff:suf']);
			addAffix(list, 'suffix', affixes[4], ['aff:suf']);
			addAffix(list, 'suffix', affixes[5], ['aff:suf', 'adp', 'adp:len']);
			addAffix(list, 'suffix', affixes[6], ['part']);

		} else if (conjugation['type'] === 'v_to_n') {
			addAffix(list, 'suffix', affixes[0], ['aff:suf']);

		} else if (conjugation['type'] === 'v_to_adj') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre']);

		} else if (conjugation['type'] === 'v_to_part') {
			addAffix(list, 'infix', affixes[0], ['aff:in']);

		} else if (conjugation['type'] === 'v') {
			let infixes = conjugation['conjugation']['infixes'];
			addPrefirstVerbInfix(list, infixes[0]);
			addFirstVerbInfix(list, infixes[1]);
			addAffix(list, 'infix', infixes[2], ['aff:in']);

		} else if (conjugation['type'] === 'adj') {
			let form = conjugation['conjugation']['form'];
			if (form === 'postnoun') {
				addAffix(list, 'prefix', 'a', ['aff:pre']);
			} else if (form === 'prenoun') {
				addAffix(list, 'suffix', 'a', ['aff:suf']);
			}

		} else if (conjugation['type'] === 'adj_to_adv') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre']);
		}
	}

	return list;
}

function addAffix(list, affixType, affixString, types) {
	if (!affixString.length) {
		return;
	}
	let affix;
	for (let t of types) {
		if (dictionary.hasOwnProperty(affixString + ':' + t)) {
			affix = dictionary[affixString + ':' + t];
			break;
		}
	}
	if (affix) {
		list.push({
			'type': affixType,
			'affix': affix
		});
	}
}

function addCombinedAffix(list, affixType, combined, affixStrings, types) {
	let combinedList = [];
	for (const affixString of affixStrings) {
		addAffix(combinedList, affixType, affixString, types);
	}
	list.push({
		'type': affixType,
		'affix': combined,
		'combinedFrom': combinedList
	});
}

function addPrefirstVerbInfix(list, affixString) {
	if (affixString === "äpeyk") {
		addCombinedAffix(list, 'infix', affixString, ['äp', 'eyk'], ['aff:in']);
	} else {
		addAffix(list, 'infix', affixString, ['aff:in']);
	}
}

function addFirstVerbInfix(list, affixString) {
	if (affixString === "ìsy") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 's'], ['aff:in']);
	} else if (affixString === "asy") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 's'], ['aff:in']);
	} else if (affixString === "alm") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'ol'], ['aff:in']);
	} else if (affixString === "ìlm") {
		addCombinedAffix(list, 'infix', affixString, ['ìm', 'ol'], ['aff:in']);
	} else if (affixString === "ìly") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 'ol'], ['aff:in']);
	} else if (affixString === "aly") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'ol'], ['aff:in']);
	} else if (affixString === "arm") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'er'], ['aff:in']);
	} else if (affixString === "ìrm") {
		addCombinedAffix(list, 'infix', affixString, ['ìm', 'er'], ['aff:in']);
	} else if (affixString === "ìry") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 'er'], ['aff:in']);
	} else if (affixString === "ary") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'er'], ['aff:in']);
	} else if (affixString === "imv") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'iv'], ['aff:in']);
	} else if (affixString === "ìyev") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'iv'], ['aff:in']);
	} else if (affixString === "ilv") {
		addCombinedAffix(list, 'infix', affixString, ['ol', 'iv'], ['aff:in']);
	} else if (affixString === "irv") {
		addCombinedAffix(list, 'infix', affixString, ['er', 'iv'], ['aff:in']);
	} else {
		addAffix(list, 'infix', affixString, ['aff:in']);
	}
}
