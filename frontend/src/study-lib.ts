import { addLemmaClass, appendLinkString, lemmaForm, toReadableType } from "./lib";

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

function getDisplayedNavi(word: WordData) {
	let navi = lemmaForm(word, 'FN');
	let pronunciation = '';
	if (word['pronunciation']) {
		pronunciation = htmlFromPronunciation(word['pronunciation']);
	}
	if (word['type'] == 'n:si') {
		pronunciation += ' si';
	}
	if (word['pronunciation']) {
		if (pronunciation.length && navi !== pronunciation) {
			navi = navi + ' <span class="type">(pronounced ' + pronunciation + ')</span>';
		}
	}
	return navi;
}

function getDisplayedEnglish(word: WordData) {
	let english = '';
	if (word['translations'].length > 1) {
		for (let i = 0; i < word['translations'].length; i++) {
			if (i > 0) {
				english += '<br>';
			}
			english += '<b>' + (i + 1) + '.</b> ' + word['translations'][i]['en'];
		}
	} else {
		english = word['translations'][0]['en'];
	}
	return english;
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
	let english = getDisplayedEnglish(word);

	const $navi = $('<div/>')
		.attr('id', 'navi')
		.appendTo($front);
	addLemmaClass($navi, word['type']);
	$navi.append($('<span/>').addClass('word').html(navi));
	$navi.append(' ');
	$navi.append($('<span/>').addClass('type').text('(' + toReadableType(word['type']) + ')'));
	$navi.clone().appendTo($back);

	const $english = $('<div/>')
		.attr('id', 'english')
		.appendTo($back);
	$english.append($('<span/>').addClass('meaning').html(english));

	if (word['meaning_note']) {
		const $meaningNote = $('<div/>').attr('id', 'meaning-note').appendTo($back);
		appendLinkString(word['meaning_note'], $meaningNote, 'FN', 'en');
	}

	if (word['etymology']) {
		const $etymology = $('<div/>').attr('id', 'etymology').html('<b>Etymology:</b> ').appendTo($back);
		appendLinkString(word['etymology'], $etymology, 'FN', 'en');
	}

	if (word['image']) {
		$('<img/>').attr('src', '/ayrel/' + word['image']).appendTo($back);
	}

	return $shape;
}

export function buildQuestionCard(word: WordData, onFlip?: () => void): JQuery {
	let $card = $('<div/>').addClass('ui segment review-card');

	let navi = getDisplayedNavi(word);
	let english = getDisplayedEnglish(word);

	const $question = $('<div/>')
		.attr('id', 'question')
		.appendTo($card);
	$question.append($('<span/>').addClass('type').text('(' + toReadableType(word['type']) + ')'));
	$question.append(' ');
	$question.append($('<span/>').addClass('meaning').html(english));

	return $card;
}

export function buildWordPill(word: WordData): JQuery {
	const $pill = $('<li/>').addClass('lesson-word')
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
		.html(getDisplayedEnglish(word))
		.appendTo($pill);
	return $pill;
}
