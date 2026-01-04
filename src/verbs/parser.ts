/**
 * Returns all possible conjugations that could have resulted in the given
 * word.
 */
export function parse(word: string): Omit<VerbConjugationStep, 'result'>[] {
	let candidates = getCandidates(word);
	return candidates;
}

function tryPrefirstInfixes(candidate: Omit<VerbConjugationStep, 'result'>): Omit<VerbConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({...candidate});
	let tryInfix = (infix: string, name: string) => {
		let matches = candidate["root"].matchAll(new RegExp(infix, 'g'));
		for (let match of matches) {
			let index = match.index!;
			let newInfixes = [...candidate["infixes"]];
			newInfixes[0] = name;
			candidates.push({
				"root": candidate["root"].slice(0, index) + candidate["root"].slice(index + infix.length),
				"infixes": newInfixes
			});
		}
	};

	tryInfix("äp", "äp");
	tryInfix("eyk", "eyk");
	tryInfix("äpeyk", "äpeyk");

	return candidates;
}

function tryFirstInfixes(candidate: Omit<VerbConjugationStep, 'result'>): Omit<VerbConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({...candidate});
	let tryInfix = (infix: string, name: string, replacement?: string) => {
		if (!replacement) {
			replacement = '';
		}
		let matches = candidate["root"].matchAll(new RegExp(infix, 'g'));
		for (let match of matches) {
			let index = match.index!;
			let newInfixes = [...candidate["infixes"]];
			newInfixes[1] = name;
			candidates.push({
				"root": candidate["root"].slice(0, index) + replacement + candidate["root"].slice(index + infix.length),
				"infixes": newInfixes
			});
		}
	};

	tryInfix("us", "us");
	tryInfix("awn", "awn");

	tryInfix("am", "am");
	tryInfix("ìm", "ìm");
	tryInfix("ìy", "ìy");
	tryInfix("ìsy", "ìsy");
	tryInfix("ay", "ay");
	tryInfix("asy", "asy");

	tryInfix("ol", "ol");
	tryInfix("ol", "ol", "ll");
	tryInfix("ll", "ol", "ll");
	tryInfix("alm", "alm");
	tryInfix("ìlm", "ìlm");
	tryInfix("ìly", "ìly");
	tryInfix("aly", "aly");

	tryInfix("er", "er");
	tryInfix("er", "er", "rr");
	tryInfix("rr", "er", "rr");
	tryInfix("arm", "arm");
	tryInfix("ìrm", "ìrm");
	tryInfix("ìry", "ìry");
	tryInfix("ary", "ary");

	tryInfix("iv", "iv");
	tryInfix("imv", "imv");
	tryInfix("ìyev", "ìyev");
	tryInfix("iyev", "ìyev");

	tryInfix("ilv", "ilv");
	tryInfix("irv", "irv");

	return candidates;
}

function trySecondInfixes(candidate: Omit<VerbConjugationStep, 'result'>): Omit<VerbConjugationStep, 'result'>[] {
	let candidates = [];

	candidates.push({...candidate});
	let tryInfix = (infix: string, name: string) => {
		let matches = candidate["root"].matchAll(new RegExp(infix, 'g'));
		for (let match of matches) {
			let index = match.index!;
			let newInfixes = [...candidate["infixes"]];
			newInfixes[2] = name;
			candidates.push({
				"root": candidate["root"].slice(0, index) + candidate["root"].slice(index + infix.length),
				"infixes": newInfixes
			});
		}
	};

	tryInfix("ei", "ei");
	tryInfix("eiy", "ei");
	tryInfix("äng", "äng");
	tryInfix("eng", "äng");
	tryInfix("uy", "uy");
	tryInfix("uye", "uy");  // for z.en.(e)ke
	tryInfix("y", "uy");  // for verbs like nui
	tryInfix("ats", "ats");
	tryInfix("atse", "ats");  // for z.en.(e)ke

	return candidates;
}

function getCandidates(word: string): Omit<VerbConjugationStep, 'result'>[] {
	let functions: ((candidate: Omit<VerbConjugationStep, 'result'>) =>
			Omit<VerbConjugationStep, 'result'>[])[] = [
		tryPrefirstInfixes,
		tryFirstInfixes,
		trySecondInfixes,
	];

	let candidates: Omit<VerbConjugationStep, 'result'>[] = [];
	candidates.push({
		"root": word,
		"infixes": ["", "", ""]
	});

	for (let i = 0; i < functions.length; i++) {
		let newCandidates: Omit<VerbConjugationStep, 'result'>[] = [];
		for (let j = 0; j < candidates.length; j++) {
			newCandidates = newCandidates.concat(functions[i](candidates[j]));
		}
		candidates = newCandidates;
	}

	return candidates;
}
