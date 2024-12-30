import { buildQuestionCard, buildWordPill, getDisplayedNavi } from "./study-lib";

/// List of alternatives for each word. If the user answers with an alternative
/// in this list, the answer isn't marked incorrect, but instead they get the
/// chance to try again.
type Alternative = string | [string, 'synonym' | 'wrong-type' | 'wrong-direction'];
const alternatives: Record<string, Alternative[]> = {
	'nìlam:adv': ['tatlam'],
	'tatlam:adv': ['nìlam'],
	'za\'ärìp:vtr': ['zärìp'],
	'zärìp:vtr': ['za\'ärìp'],
	'kä\'ärìp:vtr': ['kärìp'],
	'kärìp:vtr': ['kä\'ärìp'],
	'zìsìtsaltrr:n': ['zìtsaltrr'],
	'zìtsaltrr:n': ['zìsìtsaltrr'],
	'eywa\'eveng:n': ['eyweveng'],
	'eyweveng:n': ['eywa\'eveng'],
	'fìtxan:adv': ['nìftxan'],
	'nìftxan:adv': ['fìtxan'],
	'pesu:inter': ['tupe'],
	'tupe:inter': ['pesu'],
	'pefya:inter': ['fyape'],
	'fyape:inter': ['pefya'],
	'pehrr:inter': ['krrpe'],
	'krrpe:inter': ['pehrr'],
	'pelun:inter': ['lumpe'],
	'lumpe:inter': ['pelun'],
	'peseng:inter': ['tsengpe'],
	'tsengpe:inter': ['peseng'],
	'peu:inter': ['\'upe'],
	'\'upe:inter': ['peu'],
	'pefnel:inter': ['fnepe'],
	'fnepe:inter': ['pefnel'],
	'polpxay:inter': ['holpxaype'],
	'holpxaype:inter': ['polpxay'],
	'pìmtxan:inter': ['hìmtxampe'],
	'hìmtxampe:inter': ['pìmtxan'],
	'pxel:adp': ['na'],
	'na:adp': ['pxel'],
	'mip:adj': [['want', 'wrong-direction']],
	'tul:v:in': [['find', 'wrong-direction']],
	'srane:part': ['sran'],
	'eampin:n': [['ean', 'wrong-type']],
	'ean:adj': [['eampin', 'wrong-type']],
	'rimpin:n': [['rim', 'wrong-type']],
	'rim:adj': [['rimpin', 'wrong-type']],
	'tumpin:n': [['tun', 'wrong-type']],
	'tun:adj': [['tumpin', 'wrong-type']],
	'\'ompin:n': [['\'om', 'wrong-type']],
	'\'om:adj': [['\'ompin', 'wrong-type']],
	'teyrpin:n': [['teyr', 'wrong-type']],
	'teyr:adj': [['teyrpin', 'wrong-type']],
	'layompin:n': [['layon', 'wrong-type']],
	'layon:adj': [['layompin', 'wrong-type']],
	'\'aw:num': [['fko', 'wrong-type'], ['pum', 'wrong-type']],
	'yawntu:n': ['yawnetu'],
	'yawnetu:n': ['yawntu'],
	'tseng:n': ['tsenge'],
	'tsenge:n': ['tseng'],
	'fìtseng:adv': ['fìtsenge'],
	'fìtsenge:adv': ['fìtseng'],
	'tsatseng:adv': ['tsatsenge'],
	'tsatsenge:adv': ['tsatseng'],
	'tem:v:in': [['toltem', 'wrong-type']],
	'toltem:v:tr': [['tem', 'wrong-type']],
	'\'em:v:tr': [['\'emyu', 'wrong-type']]
};

class ReviewPage {
	/// The URL we're redirecting to when this review session is done.
	doneRedirectUrl: string;

	/// All items we're supposed to show to the user.
	items: WordData[];
	
	/// The index of the item we're currently showing.
	currentItemIndex = 0;
	correctCount = 0;

	currentSlide!: Slide;

	constructor(doneRedirectUrl: string, items: WordData[]) {
		this.doneRedirectUrl = doneRedirectUrl;
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
		this.currentSlide = new QuestionSlide(item, this.doneRedirectUrl, this.toNextItem.bind(this));
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
		$modal.find('.ui.primary.button').attr('href', this.doneRedirectUrl);
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
	doneRedirectUrl: string;

	$card?: JQuery;
	$meaningInput!: JQuery;
	$checkButton!: JQuery;
	$exitButton!: JQuery;

	static readonly CORRECT_WAITING_TIME = 0;
	static readonly INCORRECT_WAITING_TIME = 4000;

	constructor(word: WordData, doneRedirectUrl: string, toNextItem: (correct: boolean) => void) {
		super(toNextItem);
		this.word = word;
		this.doneRedirectUrl = doneRedirectUrl;
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
				window.location.href = this.doneRedirectUrl;
			})
			.appendTo($buttonsCard);
	}

	getCorrectAnswer(): string {
		return this.word['word_raw']['FN'].toLowerCase() + (this.word['type'] === 'n:si' ? ' si' : '');
	}

	isAlternative(answer: string): 'synonym' | 'wrong-type' | 'wrong-direction' | null {
		const key = this.word['word']['FN'] + ':' + this.word['type'];
		if (alternatives[key]) {
			for (let alternative of alternatives[key]) {
				if (typeof alternative === 'string') {
					if (alternative === answer) {
						return 'synonym'
					}
				} else {
					if (alternative[0] === answer) {
						return alternative[1];
					}
				}
			}
		}
		return null;
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
			let alternativeType = this.isAlternative(givenAnswer);
			if (alternativeType) {
				this.$meaningInput.popup({
					'content': _(alternativeType + '-note'),
					'position': 'bottom center',
					'on': 'manual'
				});
				this.$meaningInput.popup('show');
				this.$meaningInput.on('input', () => {
					this.$meaningInput.popup('hide');
				});
				this.$meaningInput.trigger('select');
			} else {
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
			}
		} else {
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
}

export interface Page {
	$element: JQuery;
}

$(() => {
	let params: any = {};
	let doneRedirectUrl = '/study';
	const url = new URL(window.location.href);
	if (url.searchParams.has('c')) {
		const courseId = parseInt(url.searchParams.get('c')!, 10);
		if (isNaN(courseId)) {
			throw Error('course parameter is not an integer');
		}
		params['courseId'] = courseId;
		doneRedirectUrl = '/study/course?c=' + courseId;
		if (url.searchParams.has('l')) {
			const lessonId = parseInt(url.searchParams.get('l')!, 10);
			if (isNaN(lessonId)) {
				throw Error('lesson parameter is not an integer');
			}
			params['lessonId'] = lessonId;
			doneRedirectUrl = '/study/lesson?c=' + courseId + '&l=' + lessonId;
		}
	}
	$.getJSON('/api/srs/reviewable', params).done((reviewableItems) => {
		if (reviewableItems.length > 0) {
			new ReviewPage(doneRedirectUrl,
				reviewableItems.map((item: LearnableItem) => item['vocab'])).fetchAndSetUp();
		} else {
			window.location.href = doneRedirectUrl;
		}
	});
});
