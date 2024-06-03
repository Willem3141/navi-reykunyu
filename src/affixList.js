/**
 * Code that generates an affix list for a conjugated form.
 */

module.exports = {
	addAffixList: addAffixList
}

let dictionary;

function addAffixList(word, d, dialect) {
	dictionary = d;
	let conjugated = word['conjugated'];

	for (let conjugation of conjugated) {
		list = [];
		let affixes = conjugation['conjugation']['affixes'];
		if (conjugation['type'] === 'n') {
			addAffix(list, 'suffix', affixes[3], ['aff:suf'], dialect);
			addAffix(list, 'prefix', affixes[2], ['aff:pre'], dialect);
			if (affixes[1] === '(ay)') {
				addAffix(list, 'prefix', 'ay', ['aff:pre:len'], dialect);
			} else {
				addAffix(list, 'prefix', affixes[1], ['aff:pre:len'], dialect);
			}
			addAffix(list, 'prefix', affixes[0], ['aff:pre', 'aff:pre:len'], dialect);
			addAffix(list, 'suffix', affixes[4], ['aff:suf'], dialect);
			addAffix(list, 'suffix', affixes[5], ['aff:suf', 'adp', 'adp:len'], dialect);
			addAffix(list, 'suffix', affixes[6], ['part'], dialect);

		} else if (conjugation['type'] === 'v_to_n') {
			addAffix(list, 'suffix', affixes[0], ['aff:suf'], dialect);

		} else if (conjugation['type'] === 'v_to_adj') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre'], dialect);

		} else if (conjugation['type'] === 'v_to_part') {
			addAffix(list, 'infix', affixes[0], ['aff:in'], dialect);

		} else if (conjugation['type'] === 'v') {
			let infixes = conjugation['conjugation']['infixes'];
			addPrefirstVerbInfix(list, infixes[0], dialect);
			addFirstVerbInfix(list, infixes[1], dialect);
			addAffix(list, 'infix', infixes[2], ['aff:in'], dialect);

		} else if (conjugation['type'] === 'adj') {
			let form = conjugation['conjugation']['form'];
			if (form === 'postnoun') {
				addAffix(list, 'prefix', 'a', ['aff:pre'], dialect);
			} else if (form === 'prenoun') {
				addAffix(list, 'suffix', 'a', ['aff:suf'], dialect);
			}

		} else if (conjugation['type'] === 'adj_to_adv') {
			addAffix(list, 'prefix', affixes[0], ['aff:pre'], dialect);
		} else if (conjugation['type'] === 'gerund') {
			addAffix(list, 'prefix', 'tì', ['aff:pre'], dialect);
			addAffix(list, 'infix', 'us', ['aff:in'], dialect);
		}

		conjugation['affixes'] = list;
	}
}

function addAffix(list, affixType, affixString, types, dialect) {
	if (!affixString.length) {
		return;
	}
	let affix = dictionary.getOfTypes(affixString, types, dialect);
	if (affix.length > 0) {
		list.push({
			'type': affixType,
			'affix': affix[0]
		});
	}
}

function addCombinedAffix(list, affixType, combined, affixStrings, types, dialect) {
	let combinedList = [];
	for (const affixString of affixStrings) {
		addAffix(combinedList, affixType, affixString, types, dialect);
	}
	list.push({
		'type': affixType,
		'affix': combined,
		'combinedFrom': combinedList
	});
}

function addPrefirstVerbInfix(list, affixString, dialect) {
	if (affixString === "äpeyk") {
		addCombinedAffix(list, 'infix', affixString, ['äp', 'eyk'], ['aff:in'], dialect);
	} else {
		addAffix(list, 'infix', affixString, ['aff:in'], dialect);
	}
}

function addFirstVerbInfix(list, affixString, dialect) {
	if (affixString === "ìsy") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 's'], ['aff:in'], dialect);
	} else if (affixString === "asy") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 's'], ['aff:in'], dialect);
	} else if (affixString === "alm") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "ìlm") {
		addCombinedAffix(list, 'infix', affixString, ['ìm', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "ìly") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "aly") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "arm") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'er'], ['aff:in'], dialect);
	} else if (affixString === "ìrm") {
		addCombinedAffix(list, 'infix', affixString, ['ìm', 'er'], ['aff:in'], dialect);
	} else if (affixString === "ìry") {
		addCombinedAffix(list, 'infix', affixString, ['ìy', 'er'], ['aff:in'], dialect);
	} else if (affixString === "ary") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'er'], ['aff:in'], dialect);
	} else if (affixString === "imv") {
		addCombinedAffix(list, 'infix', affixString, ['am', 'iv'], ['aff:in'], dialect);
	} else if (affixString === "ìyev") {
		addCombinedAffix(list, 'infix', affixString, ['ay', 'iv'], ['aff:in'], dialect);
	} else if (affixString === "ilv") {
		addCombinedAffix(list, 'infix', affixString, ['ol', 'iv'], ['aff:in'], dialect);
	} else if (affixString === "irv") {
		addCombinedAffix(list, 'infix', affixString, ['er', 'iv'], ['aff:in'], dialect);
	} else {
		addAffix(list, 'infix', affixString, ['aff:in'], dialect);
	}
}
