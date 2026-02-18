import { addLemmaClass, appendLinkString, lemmaForm, toReadableType, getTranslation, getDisambiguationHint } from "./lib";

function htmlFromPronunciation(pronunciation: Pronunciation[]): string {
	let result = '';
	for (let i = 0; i < pronunciation.length; i++) {
		if (i > 0) {
			result += ' or ';
		}
		const syllables = pronunciation[i]['syllables'].split('-');
		for (let j = 0; j < syllables.length; j++) {
			if (syllables.length > 1 && j + 1 == pronunciation[i]['stressed']) {
				result += '<span class="stressed">' + syllables[j] + '</span>';
			} else {
				result += syllables[j];
			}
		}
	}
	return result.replace(/ù/g, 'u');
}

export function getDisplayedNavi(word: WordData) {
	let navi = lemmaForm(word, 'FN');
	let pronunciation = '';
	if (word['pronunciation']) {
		pronunciation = htmlFromPronunciation(word['pronunciation']);
	}
	if (word['type'] == 'n:si') {
		pronunciation += ' si';
	}
	if (word['pronunciation']) {
		if (pronunciation.length && navi.toLowerCase() !== pronunciation.toLowerCase()) {
			navi = navi + ' <span class="type">(pronounced ' + pronunciation + ')</span>';
		}
	}
	return navi;
}

function getDisplayedTranslation(word: WordData) {
	let translation = '';
	if (word['translations'].length > 1) {
		for (let i = 0; i < word['translations'].length; i++) {
			if (i > 0) {
				translation += '<br>';
			}
			translation += '<b>' + (i + 1) + '.</b> ' + getTranslation(word['translations'][i], getLanguage());
		}
	} else {
		translation = getTranslation(word['translations'][0], getLanguage());
	}

	if (word['disambiguation_hint']) {
		let hint = getDisambiguationHint(word['translations'][0], word['disambiguation_hint'], getLanguage());
		if (hint !== null) {
			translation += ' (' + hint + ')';
		}
	}

	return translation;
}

export function buildWordCard(word: WordData, onFlip?: () => void): JQuery {
	let $shape = $('<div/>').addClass('ui shape learn-card');
	let $sides = $('<div/>').addClass('sides')
		.appendTo($shape);
	let $front = $('<div/>').addClass('ui segment')
		.appendTo($('<div/>').addClass('side active').appendTo($sides));
	let $back = $('<div/>').addClass('ui segment')
		.appendTo($('<div/>').addClass('side').appendTo($sides));
	$shape.shape({
		'width': 'initial',
		'height': 'initial',
		'duration': window.matchMedia('(prefers-reduced-motion)').matches ? 0 : 700
	});
	$shape.on('click', () => {
		if ($shape!.is('.animating')) {
			return;
		}
		$shape!.find('.side')
			.css('width', $shape!.width() + 'px');
		$shape!.shape('flip over');
		if (onFlip) {
			onFlip();
		}
	});

	let navi = getDisplayedNavi(word);
	let translation = getDisplayedTranslation(word);

	const $navi = $('<div/>')
		.attr('id', 'navi')
		.appendTo($front);
	addLemmaClass($navi, word['type']);
	$navi.append($('<span/>').addClass('word').html(navi));
	$navi.append(' ');
	$navi.append($('<span/>').addClass('type').text('(' + toReadableType(word['type']) + ')'));
	$navi.clone().appendTo($back);

	const $translation = $('<div/>')
		.attr('id', 'translation')
		.appendTo($back);
	$translation.append($('<span/>').addClass('meaning').html(translation));

	if (word['meaning_note']) {
		const $meaningNote = $('<div/>').attr('id', 'meaning-note').appendTo($back);
		appendLinkString(getTranslation(word['meaning_note'], getLanguage()), word, $meaningNote, 'FN', getLanguage());
	}

	if (word['etymology']) {
		const $etymology = $('<div/>').attr('id', 'etymology').html('<b>Etymology:</b> ').appendTo($back);
		appendLinkString(word['etymology'], word, $etymology, 'FN', getLanguage());
	}

	if (word['image']) {
		$('<img/>').attr('src', '/ayrel/' + word['image']).appendTo($back);
	}

	return $shape;
}

export function buildQuestionCard(word: WordData, onFlip?: () => void): JQuery {
	let $card = $('<div/>').addClass('ui segment review-card');

	let navi = getDisplayedNavi(word);
	let translation = getDisplayedTranslation(word);

	const $question = $('<div/>')
		.attr('id', 'question')
		.appendTo($card);
	$question.append($('<span/>').addClass('type').text('(' + toReadableType(word['type']) + ')'));
	$question.append(' ');
	$question.append($('<span/>').addClass('meaning').html(translation));

	return $card;
}

export function buildWordPill(word: WordData): JQuery {
	const $pill = $('<li/>').addClass('ui segment word-pill')
		.on('click', () => {
			const $modal = $('#word-info-modal');
			const $content = $modal.find('.content');
			$content.empty();
			const $wordInfo = buildWordCard(<WordData>word);
			$content.append($wordInfo);
			$modal.modal({
				'allowMultiple': true
			});
			$modal.modal('show');
		});
	const $navi = $('<span/>').addClass('navi')
		.html(getDisplayedNavi(word))
		.append($('<span/>').addClass('type')
			.html(' (' + toReadableType(word['type']) + ')'))
		.appendTo($pill);
	addLemmaClass($navi, word['type']);
	$pill.append(' ');
	$('<span/>').addClass('translation')
		.html(getDisplayedTranslation(word))
		.appendTo($pill);
	return $pill;
}
