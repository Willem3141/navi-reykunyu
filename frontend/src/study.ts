import { buildWordCard, buildWordPill } from "./study-lib";

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

class LearnPage {
	courseId: number;
	lessonId: number;

	/// All items we're supposed to show to the user. A WordData means the item
	/// is a word to learn; a string is a comment that we should show on a
	/// separate slide.
	items: (WordData | string)[];
	
	/// The index of the item we're currently showing.
	currentItemIndex = 0;

	currentSlide: Slide | null = null;

	relearn: boolean;

	constructor(courseId: number, lessonId: number, lesson: Lesson, items: LearnableItem[], relearn?: boolean) {
		this.courseId = courseId;
		this.lessonId = lessonId;
		this.items = buildItemList(lesson, items);
		this.relearn = relearn ? true : false;

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
		if (typeof item === 'string') {
			this.currentSlide = new CommentSlide(item, this.toNextItem.bind(this));
			const $container = $('#main-container');
			$container.empty();
			this.currentSlide.renderIn($container);
		} else {
			this.currentSlide = new WordInfoSlide(item, this.courseId, this.lessonId, this.toNextItem.bind(this), this.relearn);
			const $container = $('#main-container');
			$container.empty();
			this.currentSlide.renderIn($container);
		}
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

class WordInfoSlide extends Slide {
	word: WordData;
	courseId: number;
	lessonId: number;
	relearn: boolean;

	$shape?: JQuery;
	$flipButton?: JQuery;
	$continueButton?: JQuery;
	$learnedButton?: JQuery;
	$knownButton?: JQuery;
	$exitButton?: JQuery;

	constructor(word: WordData, courseId: number, lessonId: number, toNextItem: () => void, relearn: boolean) {
		super(toNextItem);
		this.word = word;
		this.courseId = courseId;
		this.lessonId = lessonId;
		this.relearn = relearn;
	}

	renderIn($container: JQuery): void {
		$container.empty();

		const hideFlipButton = () => {
			this.$flipButton!.hide();
			this.$learnedButton?.show();
			this.$continueButton?.show();
		};
		this.$shape = buildWordCard(this.word, hideFlipButton.bind(this));
		this.$shape.appendTo($container);
		
		// buttons
		const $buttonsCard = $('<div/>').addClass('buttons under-card')
			.appendTo($container);
		this.$flipButton = $('<button/>').addClass('ui primary button')
			.text(_('flip-button'))
			.prepend($('<i/>').addClass('share icon'))
			.on('click', () => {
				if (this.$shape!.is('.animating')) {
					return;
				}
				this.$shape!.find('.side')
					.css('width', this.$shape!.width() + 'px');
				this.$shape!.shape('flip over');
				hideFlipButton();
			})
			.appendTo($buttonsCard);
		if (this.relearn) {
			this.$continueButton = $('<button/>').addClass('ui primary button')
				.hide()
				.text(_('continue-button'))
				.append($('<i/>').addClass('arrow right icon'))
				.on('click', () => {
					$.post('/api/srs/mark-correct', { 'vocab': this.word['id'] }, () => {
						this.toNextItem();
					});
				})
				.appendTo($buttonsCard);
		} else {
			this.$learnedButton = $('<button/>').addClass('ui primary button')
				.hide()
				.text(_('learned-button'))
				.prepend($('<i/>').addClass('checkmark icon'))
				.on('click', () => {
					$.post('/api/srs/mark-correct', { 'vocab': this.word['id'] }, () => {
						this.toNextItem();
					});
				})
				.appendTo($buttonsCard);
			this.$knownButton = $('<button/>').addClass('ui button')
				.text(_('known-button'))
				.attr('data-content', _('known-button-tooltip'))
				.popup({
					position: 'top center'
				})
				.on('click', () => {
					$.post('/api/srs/mark-known', { 'vocab': this.word['id'] }, () => {
						this.toNextItem();
					});
				})
				.appendTo($buttonsCard);
		}
		this.$exitButton = $('<button/>').addClass('ui button')
			.text(_('exit-button'))
			.attr('data-content', _('exit-button-tooltip'))
			.popup({
				position: 'top center'
			})
			.on('click', () => {
				window.location.href = this.relearn ?
					'/study/lesson?c=' + this.courseId + '&l=' + this.lessonId :
					'/study/course?c=' + this.courseId;
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
		$('<div/>').addClass('ui segment comment')
			.html(this.comment)
			.appendTo($container);

		// buttons
		const $buttonsCard = $('<div/>').addClass('buttons under-card')
			.appendTo($container);
		this.$continueButton = $('<button/>').addClass('ui primary button')
			.text(_('continue-button'))
			.append($('<i/>').addClass('icon arrow right'))
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
		$('#progress-bar').hide();

		const $container = $('#main-container');
		$container.empty();

		const $buttonsCard = $('<div/>').addClass('buttons')
			.appendTo($container);
		$('<a/>').addClass('ui primary button')
			.text(_('review-button'))
			.attr('href', '/study/review?c=' + this.courseId + '&l=' + this.lessonId)
			.appendTo($buttonsCard);
		$('<a/>').addClass('ui button')
			.text(_('relearn-button'))
			.attr('href', '/study/lesson?c=' + this.courseId + '&l=' + this.lessonId + '&relearn')
			.appendTo($buttonsCard);

		$('<h2/>').html(_('lesson-overview')).appendTo($container);

		let $list: JQuery | null = null;
		
		for (let item of this.items) {
			if (typeof item === 'string') {
				$list = null;
				$('<div/>').addClass('ui segment comment')
					.html(item)
					.appendTo($container);
			} else {
				if (!$list) {
					$list = $('<ul/>').addClass('lesson-words')
						.appendTo($container);
				}
				buildWordPill(item).appendTo($list);
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
	const relearn = url.searchParams.has('relearn');
	$.getJSON('/api/srs/lesson', { 'courseId': courseId, 'lessonId': lessonId }).done((lessonData) => {
		$.getJSON('/api/srs/items', { 'courseId': courseId, 'lessonId': lessonId }).done((items) => {
			$.getJSON('/api/srs/learnable', { 'courseId': courseId, 'lessonId': lessonId }).done((learnableItems) => {
				if (learnableItems.length > 0) {
					new LearnPage(courseId, lessonId, lessonData, learnableItems).fetchAndSetUp();
				} else if (relearn) {
					new LearnPage(courseId, lessonId, lessonData, items, true).fetchAndSetUp();
				} else {
					new OverviewPage(courseId, lessonId, lessonData, items).render();
				}
			});
		});
	});
});
