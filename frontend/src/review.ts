import { buildQuestionCard, buildWordPill, getDisplayedNavi } from "./study-lib";

class ReviewPage {
	courseId: number;
	lessonId: number;

	/// All items we're supposed to show to the user.
	items: WordData[];
	
	/// The index of the item we're currently showing.
	currentItemIndex = 0;
	correctCount = 0;

	currentSlide!: Slide;

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

	addToLearnedList(correct: boolean): void {
		const $pill = buildWordPill(this.items[this.currentItemIndex]);
		if (!correct) {
			$pill.addClass('incorrect');
		}
		$('#reviewed-words').append($pill);
	}

	/// correct indicates if the previous question was answered correctly
	toNextItem(correct: boolean): void {
		this.addToLearnedList(correct);
		if (correct) {
			this.correctCount++;
		}
		this.currentItemIndex++;
		this.updateProgress();
		if (this.currentItemIndex >= this.items.length) {
			this.showDoneModal();
		} else {
			this.fetchAndSetUp();
		}
	}

	showDoneModal(): void {
		const $modal = $('#lesson-done-modal');
		$modal.find('#review-count').text(this.currentItemIndex);
		let fraction = this.correctCount / this.currentItemIndex;
		let emotion = 'nitram';
		if (fraction < 0.55) {
			emotion = 'tì\'efuluke';
		}
		if (this.currentItemIndex >= 10) {
			if (fraction > 0.9) {
				emotion = 'lrrtok';
			} else if (fraction < 0.3) {
				emotion = 'tsngusawvìk';
			}
		}
		$modal.find('.navi-face').attr('src', '/images/study/' + emotion + '.png');
		$modal.find('.navi-face-description').text(this.correctCount + '/' + this.currentItemIndex +
			' correct (' + Math.round(fraction * 100) + '%)');
		$modal.modal({
			'allowMultiple': true,
			'closable': false
		})
		$modal.modal('show');
	}

	updateProgress(): void {
		$('#progress-bar').progress(
			'set progress', this.currentItemIndex
		);
	}
}

abstract class Slide {
	toNextItem: (correct: boolean) => void;

	constructor(toNextItem: (correct: boolean) => void) {
		this.toNextItem = toNextItem;
	}

	abstract renderIn($container: JQuery): void;
};

class QuestionSlide extends Slide {
	word: WordData;
	courseId: number;
	lessonId: number;

	$card?: JQuery;
	$meaningInput!: JQuery;
	$checkButton!: JQuery;
	$exitButton!: JQuery;

	static readonly CORRECT_WAITING_TIME = 0;
	static readonly INCORRECT_WAITING_TIME = 4000;

	constructor(word: WordData, courseId: number, lessonId: number, toNextItem: (correct: boolean) => void) {
		super(toNextItem);
		this.word = word;
		this.courseId = courseId;
		this.lessonId = lessonId;
	}

	renderIn($container: JQuery): void {
		$container.empty();

		this.$card = buildQuestionCard(this.word);
		this.$card.appendTo($container);

		this.$meaningInput = $('<input/>')
			.attr('placeholder', 'Na\'vi')
			.appendTo(($('<div/>').addClass('ui fluid input meaning-input').appendTo($container)))
			.trigger('focus')
			.on('keypress', (e) => {
				if (e.key === 'Enter') {
					this.checkAnswer();
				}
			});
		
		// buttons
		const $buttonsCard = $('<div/>').addClass('buttons under-card')
			.appendTo($container);
		this.$checkButton = $('<button/>').addClass('ui primary button')
			.text(_('check-button'))
			.prepend($('<i/>').addClass('checkmark icon'))
			.on('click', this.checkAnswer.bind(this))
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

	getCorrectAnswer(): string {
		return this.word['word_raw']['FN'].toLowerCase() + (this.word['type'] === 'n:si' ? ' si' : '');
	}
	
	checkAnswer(): void {
		let givenAnswer = ('' + this.$meaningInput.val()!).trim();
		const lastCharacter = parseInt(givenAnswer.charAt(givenAnswer.length - 1), 10);
		let givenStress: number | null = null;
		if (!isNaN(lastCharacter)) {
			givenAnswer = givenAnswer.substring(0, givenAnswer.length - 1).trim();
			givenStress = lastCharacter;
		}
		givenAnswer = givenAnswer.replace(/’/g, "'");
		givenAnswer = givenAnswer.replace(/‘/g, "'");
		this.$meaningInput.val(givenAnswer);
		givenAnswer = givenAnswer.toLowerCase();
		givenAnswer = givenAnswer.replace(/[\[\]<>+\-]/g, '');

		if (givenAnswer !== this.getCorrectAnswer()) {
			this.$meaningInput.prop('disabled', true);
			this.$meaningInput.parent().addClass('error');
			this.$checkButton.prop('disabled', true);
			$('<div/>').addClass('correction')
				.append($('<div/>').addClass('word').html('→ ' + getDisplayedNavi(this.word)))
				.insertAfter(this.$meaningInput.parent());
			$.post('/api/srs/mark-incorrect', { 'vocab': this.word['id'] }, () => {
				setTimeout(() => {
					this.toNextItem(false);
				}, QuestionSlide.INCORRECT_WAITING_TIME);
			});
			return;
		}

		this.$meaningInput.addClass('correct')
			.prop('disabled', true);
		this.$checkButton.prop('disabled', true);

		// don't need to ask for stress
		$.post('/api/srs/mark-correct', { 'vocab': this.word['id'] }, () => {
			setTimeout(() => {
				this.toNextItem(true);
			}, QuestionSlide.CORRECT_WAITING_TIME);
		});
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
