declare type FromNaviResult = FromNaviResultPiece[];

declare type FromNaviResultPiece = {
	tìpawm: string,
	'sì\'eyng': WordData[],
	aysämok: string[]
};

declare type ToNaviResult = WordData[];

declare type WordData = {
	id: number,
	word: {
		FN: string,
		combined: string,
		RN: string,
	},
	word_raw: {
		FN: string,
		combined: string,
		RN: string,
	},
	"na'vi": string,  // deprecated
	type: string,
	pronunciation?: Pronunciation[],
	translations: Translated<string>[],
	short_translation?: string,
	short_translation_conjugated?: string,
	meaning_note?: LinkString,
	infixes?: string,
	conjugation?: {
		FN: NounConjugation | AdjectiveConjugation,
		combined: NounConjugation | AdjectiveConjugation,
		RN: NounConjugation | AdjectiveConjugation
	},
	conjugation_note?: LinkString,
	conjugated?: ConjugationStep[],
	externalLenition?: {
		from: string,
		to: string,
		by: string
	},
	image?: string,
	source?: Source,
	status?: 'loan' | 'unconfirmed' | 'unofficial',
	status_note?: string,
	etymology?: LinkString,
	derived?: WordData[],
	seeAlso?: WordData[],
	favorite?: boolean,
	sentences?: Sentence[],
	references?: Record<string, WordData>
};

declare type Dialect = 'FN' | 'combined' | 'RN';

declare type Pronunciation = {
	syllables: string,
	stressed: number,
	audio: AudioData[],
	ipa: {
		FN: string,
		RN: string
	}
};

declare type AudioData = {
	file: string,
	speaker: string
}

declare type Translated<T> = {
	[language: string]: T
};

declare type NounConjugation = string[][];

declare type AdjectiveConjugation = {
	prefixed: string,
	suffixed: string
};

declare type ConjugationStep = ({
	type: 'n' | 'v_to_n' | 'v_to_adj' | 'v_to_part' | 'adj_to_adv',
	conjugation: NounConjugationStep,
} | {
	type: 'v',
	conjugation: VerbConjugationStep,
} | {
	type: 'adj',
	conjugation: AdjectiveConjugationStep,
} | {
	type: 'gerund',
	conjugation: OtherConjugationStep,
}) & {
	affixes?: AffixData[],
	translation?: string
};

declare type NounConjugationStep = {
	root: string,
	result: string[],
	affixes: string[],
	correction?: string
};

declare type VerbConjugationStep = {
	root: string,
	result: string[],
	infixes: [string, string, string],
	correction?: string
};

declare type AdjectiveConjugationStep = {
	root: string,
	result: string[],
	form: 'predicative' | 'prenoun' | 'postnoun',
	correction?: string
};

declare type OtherConjugationStep = {
	root: string,
	result: string[],
	correction?: string
};

declare type AffixData = SimpleAffixData | CombinedAffixData;

declare type SimpleAffixData = {
	type: 'prefix' | 'infix' | 'suffix',
	affix: WordData
};

declare type CombinedAffixData = {
	type: 'prefix' | 'infix' | 'suffix',
	affix: string,
	combinedFrom: SimpleAffixData[]
}

declare type Source = [string, string, string, string];

declare type LinkString = string;

declare type Sentence = {
	'na\'vi': [string, string[]][],
	translations: Translated<{
		translation: string[],
		mapping: number[][]
	}>,
	source: string[]
};

declare type RhymesResult = {'results': WordData[][][]};

// SRS types
declare type Course = {
	id: number,
	name: string,
	description: string
}

declare type Lesson = {
	id: number,
	name: string,
	introduction?: string,
	conclusion?: string
}

declare type LearnableItem = {
	vocab: WordData,
	comment?: string
}

// autocomplete suggestions (format prescribed by Semantic UI)
declare type Suggestion = { 'title': string, 'description'?: string };
declare type Suggestions = { 'results': Suggestion[] };
