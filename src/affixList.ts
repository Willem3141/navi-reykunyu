/**
 * Code that generates an affix list for a conjugated form.
 */

import Dictionary from './dictionary';

export function addAffixList(d: Dictionary, word: WordData, dialect: Dialect): void {
	let conjugated = word['conjugated'];
	if (!conjugated) {
		return;
	}

	for (let conjugationStep of conjugated) {
		let list: AffixData[] = [];
		if (conjugationStep['type'] === 'n') {
			let affixes = conjugationStep['conjugation']['affixes'];
			addAffix(d, list, 'suffix', affixes[3], ['aff:suf'], dialect);
			addAffix(d, list, 'prefix', affixes[2], ['aff:pre'], dialect);
			if (affixes[1] === '(ay)') {
				addAffix(d, list, 'prefix', 'ay', ['aff:pre:len'], dialect);
			} else {
				addAffix(d, list, 'prefix', affixes[1], ['aff:pre:len'], dialect);
			}
			addAffix(d, list, 'prefix', affixes[0], ['aff:pre', 'aff:pre:len'], dialect);
			addAffix(d, list, 'suffix', affixes[4], ['aff:suf'], dialect);
			addAffix(d, list, 'suffix', affixes[5], ['aff:suf', 'adp', 'adp:len'], dialect);
			addAffix(d, list, 'suffix', affixes[6], ['part'], dialect);

		} else if (conjugationStep['type'] === 'v_to_n') {
			let affixes = conjugationStep['conjugation']['affixes'];
			addAffix(d, list, 'suffix', affixes[0], ['aff:suf'], dialect);

		} else if (conjugationStep['type'] === 'v_to_adj') {
			let affixes = conjugationStep['conjugation']['affixes'];
			addAffix(d, list, 'prefix', affixes[0], ['aff:pre'], dialect);

		} else if (conjugationStep['type'] === 'v_to_part') {
			let affixes = conjugationStep['conjugation']['affixes'];
			addAffix(d, list, 'infix', affixes[0], ['aff:in'], dialect);

		} else if (conjugationStep['type'] === 'v') {
			let infixes = conjugationStep['conjugation']['infixes'];
			addPrefirstVerbInfix(d, list, infixes[0], dialect);
			addFirstVerbInfix(d, list, infixes[1], dialect);
			addAffix(d, list, 'infix', infixes[2], ['aff:in'], dialect);

		} else if (conjugationStep['type'] === 'adj') {
			let form = conjugationStep['conjugation']['form'];
			if (form === 'postnoun') {
				addAffix(d, list, 'prefix', 'a', ['aff:pre'], dialect);
			} else if (form === 'prenoun') {
				addAffix(d, list, 'suffix', 'a', ['aff:suf'], dialect);
			}

		} else if (conjugationStep['type'] === 'adj_to_adv') {
			let affixes = conjugationStep['conjugation']['affixes'];
			addAffix(d, list, 'prefix', affixes[0], ['aff:pre'], dialect);

		} else if (conjugationStep['type'] === 'gerund') {
			addAffix(d, list, 'prefix', 'tì', ['aff:pre'], dialect);
			addAffix(d, list, 'infix', 'us', ['aff:in'], dialect);
		}

		conjugationStep['affixes'] = list;
	}
}

function addAffix(d: Dictionary, list: AffixData[], affixType: 'prefix' | 'infix' | 'suffix', affixString: string, types: string[], dialect: Dialect): void {
	if (!affixString.length) {
		return;
	}
	let affix = d.getOfTypes(affixString, types, dialect);
	if (affix.length > 0) {
		list.push({
			'type': affixType,
			'affix': affix[0]
		});
	}
}

function addCombinedAffix(d: Dictionary, list: AffixData[], affixType: 'prefix' | 'infix' | 'suffix',
		combined: string, affixStrings: string[], types: string[], dialect: Dialect): void {
	let combinedList: SimpleAffixData[] = [];
	for (const affixString of affixStrings) {
		addAffix(d, combinedList, affixType, affixString, types, dialect);
	}
	list.push({
		'type': affixType,
		'affix': combined,
		'combinedFrom': combinedList
	});
}

function addPrefirstVerbInfix(d: Dictionary, list: AffixData[], affixString: string, dialect: Dialect): void {
	if (affixString === "äpeyk") {
		addCombinedAffix(d, list, 'infix', affixString, ['äp', 'eyk'], ['aff:in'], dialect);
	} else {
		addAffix(d, list, 'infix', affixString, ['aff:in'], dialect);
	}
}

function addFirstVerbInfix(d: Dictionary, list: AffixData[], affixString: string, dialect: Dialect): void {
	if (affixString === "ìsy") {
		addCombinedAffix(d, list, 'infix', affixString, ['ìy', 's'], ['aff:in'], dialect);
	} else if (affixString === "asy") {
		addCombinedAffix(d, list, 'infix', affixString, ['ay', 's'], ['aff:in'], dialect);
	} else if (affixString === "alm") {
		addCombinedAffix(d, list, 'infix', affixString, ['am', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "ìlm") {
		addCombinedAffix(d, list, 'infix', affixString, ['ìm', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "ìly") {
		addCombinedAffix(d, list, 'infix', affixString, ['ìy', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "aly") {
		addCombinedAffix(d, list, 'infix', affixString, ['ay', 'ol'], ['aff:in'], dialect);
	} else if (affixString === "arm") {
		addCombinedAffix(d, list, 'infix', affixString, ['am', 'er'], ['aff:in'], dialect);
	} else if (affixString === "ìrm") {
		addCombinedAffix(d, list, 'infix', affixString, ['ìm', 'er'], ['aff:in'], dialect);
	} else if (affixString === "ìry") {
		addCombinedAffix(d, list, 'infix', affixString, ['ìy', 'er'], ['aff:in'], dialect);
	} else if (affixString === "ary") {
		addCombinedAffix(d, list, 'infix', affixString, ['ay', 'er'], ['aff:in'], dialect);
	} else if (affixString === "imv") {
		addCombinedAffix(d, list, 'infix', affixString, ['am', 'iv'], ['aff:in'], dialect);
	} else if (affixString === "ìyev") {
		addCombinedAffix(d, list, 'infix', affixString, ['ay', 'iv'], ['aff:in'], dialect);
	} else if (affixString === "ilv") {
		addCombinedAffix(d, list, 'infix', affixString, ['ol', 'iv'], ['aff:in'], dialect);
	} else if (affixString === "irv") {
		addCombinedAffix(d, list, 'infix', affixString, ['er', 'iv'], ['aff:in'], dialect);
	} else {
		addAffix(d, list, 'infix', affixString, ['aff:in'], dialect);
	}
}
