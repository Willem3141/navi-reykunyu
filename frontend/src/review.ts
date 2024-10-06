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

function buildWordInfo(word: WordData, onFlip?: () => void): JQuery {
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

class ReviewPage {
	courseId: number;
	lessonId: number;

	/// All items we're supposed to show to the user.
	items: WordData[];
	
	/// The index of the item we're currently showing.
	currentItemIndex = 0;

	currentSlide: Slide | null = null;

	constructor(courseId: number, lessonId: number, lesson: Lesson, items: WordData[]) {
		this.courseId = courseId;
		this.lessonId = lessonId;
		this.items = items;

		$('#progress-bar').show()
			.progress({
				'value': 0,
				'total': this.items.length,
				'label': 'ratio',
				'text': {
					'ratio': '{value}/{total}'
				},
			}
		);
	}

	fetchAndSetUp(): void {
		const item = this.items[this.currentItemIndex];
		this.currentSlide = new QuestionSlide(item, this.courseId, this.lessonId, this.toNextItem.bind(this));
		const $container = $('#main-container');
		$container.empty();
		this.currentSlide.renderIn($container);
	}

	toNextItem(): void {
		this.currentItemIndex++;
		this.updateProgress();
		if (this.currentItemIndex >= this.items.length) {
			$('#lesson-done-modal').modal({
				'closable': false
			})
			$('#lesson-done-modal').modal('show');
		} else {
			this.fetchAndSetUp();
		}
	}

	updateProgress(): void {
		$('#progress-bar').progress(
			'set progress', this.currentItemIndex
		);
	}
}

abstract class Slide {
	toNextItem: () => void;

	constructor(toNextItem: () => void) {
		this.toNextItem = toNextItem;
	}

	abstract renderIn($container: JQuery): void;
};

class QuestionSlide extends Slide {
	word: WordData;
	courseId: number;
	lessonId: number;

	$shape?: JQuery;
	$navi?: JQuery;
	$english?: JQuery;
	$meaningNote?: JQuery;
	$etymology?: JQuery;
	$flipButton?: JQuery;
	$answerButton?: JQuery;
	$exitButton?: JQuery;

	constructor(word: WordData, courseId: number, lessonId: number, toNextItem: () => void) {
		super(toNextItem);
		this.word = word;
		this.courseId = courseId;
		this.lessonId = lessonId;
	}

	renderIn($container: JQuery): void {
		$container.empty();

		this.$shape = buildWordInfo(this.word);
		this.$shape.appendTo($container);
		
		// buttons
		const $buttonsCard = $('<div/>').addClass('buttons under-card')
			.appendTo($container);
		this.$answerButton = $('<button/>').addClass('ui primary button')
			.hide()
			.text(_('answer-button'))
			.prepend($('<i/>').addClass('checkmark icon'))
			.on('click', () => {
				// TODO figure out if correct etc.
				$.post('/api/srs/mark-correct', { 'vocab': this.word['id'] }, () => {
					this.toNextItem();
				});
			})
			.appendTo($buttonsCard);
		this.$exitButton = $('<button/>').addClass('ui button')
			.text(_('exit-button'))
			.attr('data-content', _('exit-button-tooltip'))
			.popup({
				position: 'top center'
			})
			.on('click', () => {
				window.location.href = '/study/lesson?c=' + this.courseId + '&l=' + this.lessonId;
			})
			.appendTo($buttonsCard);
	}
}

export interface Page {
	$element: JQuery;
}

$(() => {
	const url = new URL(window.location.href);
	if (!url.searchParams.has('c')) {
		throw Error('course parameter not set');
	}
	const courseId = parseInt(url.searchParams.get('c')!, 10);
	if (isNaN(courseId)) {
		throw Error('course parameter is not an integer');
	}
	if (!url.searchParams.has('l')) {
		throw Error('lesson parameter not set');
	}
	const lessonId = parseInt(url.searchParams.get('l')!, 10);
	if (isNaN(lessonId)) {
		throw Error('lesson parameter is not an integer');
	}
	$.getJSON('/api/srs/lesson', { 'courseId': courseId, 'lessonId': lessonId }).done((lessonData) => {
		$.getJSON('/api/srs/items', { 'courseId': courseId, 'lessonId': lessonId }).done((items) => {
			$.getJSON('/api/srs/reviewable', { 'courseId': courseId, 'lessonId': lessonId }).done((reviewableItems) => {
				if (reviewableItems.length > 0) {
					new ReviewPage(courseId, lessonId, lessonData,
						reviewableItems.map((item: LearnableItem) => item['vocab'])).fetchAndSetUp();
				} else {
					window.location.href = '/study/lesson?c=' + courseId + '&l=' + lessonId;
				}
			});
		});
	});
});
