import * as wordLinks from 'reykunyu/wordLinks';

export function lemmaForm(word: WordData, dialect: 'FN' | 'combined' | 'RN'): string {
	let type = word['type'];
	let lemma = word['word'][dialect];
	lemma = lemma.replace(/\//g, '');
	lemma = lemma.replace(/\[([^\]]*)\]/g, '<span class="stressed">$1</span>');
	if (type === "n:si" || type === "nv:si") {
		return lemma + ' si';
	} else if (type === 'aff:pre') {
		return lemma + "-";
	} else if (type === 'aff:pre:len') {
		return lemma + "+";
	} else if (type === 'aff:in') {
		return '&#x2039;' + lemma + '&#x203a;';
	} else if (type === 'aff:suf') {
		return '-' + lemma;
	}
	return lemma;
}

export function addLemmaClass($element: JQuery, type: string) {
	if (type === 'aff:pre' || type === 'aff:pre:len') {
		$element.addClass('prefix');
	} else if (type === 'aff:in') {
		$element.addClass('infix');
	} else if (type === 'aff:suf') {
		$element.addClass('suffix');
	}
}

// TODO remove as soon as the server sends this
export function getShortTranslation(result: WordData, language: string): string {
	if (language == "en" && result["short_translation_conjugated"]) {
		return result["short_translation_conjugated"];
	}
	if (language == "en" && result["short_translation"]) {
		return result["short_translation"];
	}

	let translation = getTranslation(result["translations"][0], language);
	translation = translation.split(',')[0];
	translation = translation.split(';')[0];
	translation = translation.split(' | ')[0];
	translation = translation.split(' (')[0];

	if (language == "en" && result["type"][0] === "v"
		&& translation.indexOf("to ") === 0) {
		translation = translation.substring(3);
	}

	return translation;
}

export function getTranslation<T>(tìralpeng: Translated<T>, language: string): T {
	if (tìralpeng.hasOwnProperty(language)) {
		return tìralpeng[language];
	} else {
		return tìralpeng['en'];
	}
}

export function createWordLink(target: WordData | null, dialect: Dialect, language: string, referenceRatherThanLink?: boolean): JQuery {
	// Look up the word/type in the references.
	if (target === null) {
		return $('<b/>').text('[?]');
	}

	if (referenceRatherThanLink) {
		const $piece = $('<span/>').addClass('reference').html(lemmaForm(target, dialect));
		addLemmaClass($piece, target['type']);
		return $piece;

	} else {
		let $link = $('<a/>')
			.addClass('word-link')
			.attr('href', "/?q=" + target["word_raw"][dialect]);
		let $word = $('<span/>')
			.addClass('navi')
			.html(lemmaForm(target, dialect));
		addLemmaClass($word, target["type"]);
		$link.append($word);

		let translation = getShortTranslation(target, language);
		let $translation = $('<span/>')
			.addClass('translation')
			.text(translation);
		$link.append(' ');
		$link.append($translation);
		return $link;
	}
}

export function createWordLinkList(derived: WordData[], dialect: Dialect, language: string) {
	let $list = $('<div/>');
	let first = true;
	for (let word of derived) {
		if (!first) {
			$list.append(' ');
		}
		$list.append(createWordLink(word, dialect, language));
		first = false;
	}
	return $list;
}

function processMarkdownLinks(text: string): JQuery {
	let $result = $();
	let pieces = text.split(/\[([^\]]+)\]\(([^)]+)\)/);
	for (let i = 0; i < pieces.length; i++) {
		if (i % 3 === 0) {
			$result = $result.add($('<span/>').text(pieces[i]));
		} else if (i % 3 === 1) {
			$result = $result.add($('<a/>').text(pieces[i]).attr('href', pieces[i + 1]));
		}
	}
	return $result;
}

export function appendLinkString(linkString: LinkString, word: WordData, $div: JQuery, dialect: Dialect, language: string, referenceRatherThanLink?: boolean) {
	wordLinks.visitLinkString(linkString,
		(text: string) => {
			$div.append(processMarkdownLinks(text));
		},
		(referencedWord: string, type: string) => {
			let key = referencedWord + ':' + type;
			let target: WordData | null = null;
			if (word['references'] !== undefined && word['references'][key] !== undefined) {
				target = word['references'][key];
			}
			$div.append(createWordLink(target, dialect, language, referenceRatherThanLink));
		}
	);
}

export function toReadableType(type: string): string {
	return _('type-traditional-' + type);
}
