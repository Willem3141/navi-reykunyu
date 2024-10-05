import { appendLinkString, toReadableType } from "./lib";

function buildItemList(lesson: Lesson, items: LearnableItem[]): (WordData | string)[] {
	let result = [];
	if (lesson.introduction) {
		result.push(lesson.introduction);
	}
	for (let item of items) {
		result.push(item.vocab);
		if (item.comment) {
			result.push(item.comment);
		}
	}
	if (lesson.conclusion) {
		result.push(lesson.conclusion);
	}
	return result;
}

function showDialog($dialog: JQuery, dismissable?: boolean): void {
	const $dialogLayer = $('#dialog-layer');
	if (dismissable) {
		$dialogLayer.on('click', (e) => {
			if (e.currentTarget == e.target) {
				hideDialog();
			}
		});
	} else {
		$dialogLayer.off('click');
	}
	$dialogLayer.hide();
	$dialogLayer.find('.dialog').hide();
	$dialog.show();
	$dialogLayer.fadeIn(250);
}

function hideDialog(): void {
	const $dialogLayer = $('#dialog-layer');
	$dialogLayer.fadeOut(250, () => {
		$dialogLayer.find('.dialog').hide();
	});
}

function htmlFromNavi(navi: string): string {
	return navi.replace(/\//g, '').replace(/\[/, '<u>').replace(/\]/, '</u>');
}

function htmlFromPronunciation(pronunciation: Pronunciation[]): string {
	let result = '';
	for (let i = 0; i < pronunciation.length; i++) {
		if (i > 0) {
			result += ' or ';
		}
		const syllables = pronunciation[i]['syllables'].split('-');
		for (let j = 0; j < syllables.length; j++) {
			if (syllables.length > 1 && j + 1 == pronunciation[i]['stressed']) {
				result += '<u>' + syllables[j] + '</u>';
			} else {
				result += syllables[j];
			}
		}
	}
	return result.replace(/ù/g, 'u');
}

function getDisplayedNavi(word: WordData) {
	let navi = htmlFromNavi(word['word']['FN']);
	let pronunciation = '';
	if (word['pronunciation']) {
		pronunciation = htmlFromPronunciation(word['pronunciation']);
	}
	if (word['type'] == 'n:si') {
		navi += ' si';
		pronunciation += ' si';
	}
	if (word['pronunciation']) {
		if (navi !== pronunciation) {
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

function buildWordInfo(word: WordData): JQuery {
	let $result = $();

	let navi = getDisplayedNavi(word);
	let english = getDisplayedEnglish(word);

	const $naviCard = $('<div/>').addClass('card');
	const $navi = $('<div/>')
		.attr('id', 'navi')
		.appendTo($naviCard);
	$navi.append($('<span/>').addClass('word').html(navi));
	$navi.append(' ');
	$navi.append($('<span/>').addClass('type').text('(' + toReadableType(word['type']) + ')'));
	$result = $result.add($naviCard);

	const $englishCard = $('<div/>').addClass('card');
	const $english = $('<div/>')
		.attr('id', 'english')
		.appendTo($englishCard);
	$english.append($('<span/>').addClass('meaning').html(english));
	$result = $result.add($englishCard);

	if (word['meaning_note']) {
		const $meaningNoteCard = $('<div/>').addClass('semicard')
		$('<div/>').addClass('semicard-header')
			.text(_('study-section-meaning-note'))
			.appendTo($meaningNoteCard);
		const $meaningNote = $('<div/>').attr('id', 'meaning-note').appendTo($meaningNoteCard);
		appendLinkString(word['meaning_note'], $meaningNote, 'FN', 'en');
		$result = $result.add($meaningNoteCard);
	}

	if (word['etymology']) {
		const $etymologyCard = $('<div/>').addClass('semicard');
		$('<div/>').addClass('semicard-header')
			.text(_('study-section-etymology'))
			.appendTo($etymologyCard);
		const $etymology = $('<div/>').attr('id', 'etymology').appendTo($etymologyCard);
		appendLinkString(word['etymology'], $etymology, 'FN', 'en');
		$result = $result.add($etymologyCard);
	}

	if (word['image']) {
		$('<img/>').attr('src', '/ayrel/' + word['image']).appendTo($englishCard);
	}

	return $result;
}

class LearnPage {
	courseId: number;
	lessonId: number;

	/// All items we're supposed to show to the user. A WordData means the item
	/// is a word to learn; a string is a comment that we should show on a
	/// separate slide.
	items: (WordData | string)[];
	
	/// The index of the item we're currently showing.
	currentItemIndex = 0;  // TODO

	currentSlide: Slide | null = null;

	constructor(courseId: number, lessonId: number, lesson: Lesson, items: LearnableItem[]) {
		this.courseId = courseId;
		this.lessonId = lessonId;
		this.items = buildItemList(lesson, items);
	}

	fetchAndSetUp(): void {
		const item = this.items[this.currentItemIndex];
		if (typeof item === 'string') {
			this.currentSlide = new CommentSlide(item, this.toNextItem.bind(this));
			const $container = $('#main-container');
			$container.empty();
			this.currentSlide.renderIn($container);
		} else {
			this.currentSlide = new WordInfoSlide(item, this.courseId, this.toNextItem.bind(this));
			const $container = $('#main-container');
			$container.empty();
			this.currentSlide.renderIn($container);
		}
	}

	toNextItem(): void {
		this.currentItemIndex++;
		this.updateProgress();
		if (this.currentItemIndex >= this.items.length) {
			showDialog($('#lesson-done-dialog'));
		} else {
			this.fetchAndSetUp();
		}
	}

	updateProgress(): void {
		const $progressBar = $('#progress-bar .filled-part');
		$progressBar
			.css('width', (100.0 * this.currentItemIndex / this.items.length) + '%');
	}
}

abstract class Slide {
	toNextItem: () => void;

	constructor(toNextItem: () => void) {
		this.toNextItem = toNextItem;
	}

	abstract renderIn($container: JQuery): void;
};

class WordInfoSlide extends Slide {
	word: WordData;
	courseId: number;

	$navi?: JQuery;
	$english?: JQuery;
	$meaningNote?: JQuery;
	$etymology?: JQuery;
	$learnedButton?: JQuery;
	$knownButton?: JQuery;
	$exitButton?: JQuery;

	constructor(word: WordData, courseId: number, toNextItem: () => void) {
		super(toNextItem);
		this.word = word;
		this.courseId = courseId;
	}

	renderIn($container: JQuery): void {
		$container.empty();
		const $wordInfo = buildWordInfo(this.word);
		$wordInfo.appendTo($container);
		
		// buttons
		const $buttonsCard = $('<div/>').addClass('semicard')
			.appendTo($container);
		this.$learnedButton = $('<button/>').addClass('button primary-button')
			.text(_('learned-button') + ' →')
			.on('click', () => {
				$.post('/api/srs/mark-correct', { 'vocab': this.word['id'] }, () => {
					this.toNextItem();
				});
			})
			.appendTo($buttonsCard);
		this.$knownButton = $('<button/>').addClass('button secondary-button')
			.text(_('known-button') + ' →')
			.attr('data-text', _('known-button-tooltip'))
			.on('click', () => {
				$.post('/api/srs/mark-known', { 'vocab': this.word['id'] }, () => {
					this.toNextItem();
				});
			})
			.appendTo($buttonsCard);
		this.$exitButton = $('<button/>').addClass('button secondary-button')
			.text(_('exit-button') + ' →')
			.attr('data-text', _('exit-button-tooltip'))
			.on('click', () => {
				window.location.href = '/study/course?c=' + this.courseId;
			})
			.appendTo($buttonsCard);
	}
}

class CommentSlide extends Slide {
	comment: string;
	$continueButton?: JQuery;

	constructor(comment: string, toNextItem: () => void) {
		super(toNextItem);
		this.comment = comment;
	}

	renderIn($container: JQuery): void {
		$('<div/>').addClass('semicard comment')
			.html(this.comment)
			.appendTo($container);

		// buttons
		const $buttonsCard = $('<div/>').addClass('semicard')
			.appendTo($container);
		this.$continueButton = $('<button/>').addClass('button primary-button')
			.text(_('continue-button') + ' →')
			.on('click', () => {
				this.toNextItem();
			})
			.appendTo($buttonsCard);
	}
}

class OverviewPage {
	courseId: number;
	lessonId: number;

	/// All items we're supposed to show to the user. A number means the item
	/// is a word to learn; a string is a comment that we should show on a
	/// separate slide.
	items: (WordData | string)[];

	constructor(courseId: number, lessonId: number, lesson: Lesson, items: LearnableItem[]) {
		this.courseId = courseId;
		this.lessonId = lessonId;
		this.items = buildItemList(lesson, items);
	}

	render(): void {
		const $container = $('#main-container');
		$container.empty();

		$('<h2/>').html(_('lesson-overview')).appendTo($container);

		let $list: JQuery | null = null;
		
		for (let item of this.items) {
			if (typeof item === 'string') {
				$list = null;
				$('<div/>').html(item).appendTo($container);
			} else {
				if (!$list) {
					$list = $('<ul/>').addClass('lesson-words')
						.appendTo($container);
				}
				const $item = $('<li/>').addClass('lesson-word')
					.on('click', () => {
						const $wordInfoDialog = $('#word-info-dialog');
						const $wordInfoBody = $wordInfoDialog.find('.dialog-body');
						$wordInfoBody.empty();
						const $wordInfo = buildWordInfo(<WordData>item);
						$wordInfoBody.append($wordInfo);
						$('#word-info-close-button').on('click', () => {
							hideDialog();
						});
						showDialog($wordInfoDialog, true);
					})
					.appendTo($list);
				$('<span/>').addClass('navi')
					.html(getDisplayedNavi(item))
					.append($('<span/>').addClass('type')
						.html(' (' + toReadableType(item['type']) + ')'))
					.appendTo($item);
				$item.append(' ');
				$('<span/>').addClass('translation')
					.html(getDisplayedEnglish(item))
					.appendTo($item);
			}
		}
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
			$.getJSON('/api/srs/learnable', { 'courseId': courseId, 'lessonId': lessonId }).done((learnableItems) => {
				if (learnableItems.length > 0) {
					new LearnPage(courseId, lessonId, lessonData, learnableItems).fetchAndSetUp();
				} else {
					new OverviewPage(courseId, lessonId, lessonData, items).render();
				}
			});
		});
	});
});
