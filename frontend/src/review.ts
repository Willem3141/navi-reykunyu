import { buildQuestionCard, buildWordPill, getDisplayedNavi } from "./study-lib";

/// List of confusables for each word. If the user answers with an alternative
/// in this list, the answer isn't marked incorrect, but instead they get the
/// chance to try again.
type Confusable = string | [string, 'synonym' | 'wrong-type' | 'wrong-direction' | 'wrong-form'];
const confusables: Record<string, Confusable[]> = {
	'nìlam:adv': ['tatlam'],
	'tatlam:adv': ['nìlam'],
	'za\'ärìp:v:tr': ['zärìp'],
	'zärìp:v:tr': ['za\'ärìp'],
	'kä\'ärìp:v:tr': ['kärìp'],
	'kärìp:v:tr': ['kä\'ärìp'],
	'zìsìtsaltrr:n': ['zìtsaltrr'],
	'zìtsaltrr:n': ['zìsìtsaltrr'],
	'eywa\'eveng:n:pr': ['eyweveng'],
	'eyweveng:n:pr': ['eywa\'eveng'],
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
	'neympin:n': [['neyn', 'wrong-type']],
	'neyn:adj': [['neympin', 'wrong-type']],
	'\'aw:num': [['fko', 'wrong-type'], ['pum', 'wrong-type']],
	'yawntu:n': ['yawnetu'],
	'yawnetu:n': ['yawntu'],
	'tseng:n': ['tsenge'],
	'tsenge:n': ['tseng'],
	'fìtseng:adv': ['fìtsenge'],
	'fìtsenge:adv': ['fìtseng'],
	'fìtseng:n': ['fìtsenge'],
	'fìtsenge:n': ['fìtseng'],
	'tsatseng:adv': ['tsatsenge'],
	'tsatsenge:adv': ['tsatseng'],
	'tsatseng:n': ['tsatsenge'],
	'tsatsenge:n': ['tsatseng'],
	'tem:v:in': [['toltem', 'wrong-type']],
	'toltem:v:tr': [['tem', 'wrong-type']],
	'\'em:v:tr': [['\'emyu', 'wrong-type']],
	'fwa:ctr': ['a', ['fula', 'wrong-form'], ['futa', 'wrong-form'], ['fura', 'wrong-form'], ['furia', 'wrong-form']],
	'a:part': ['fwa', 'fula', 'futa', 'fura', 'furia'],
	'tsa\'u:pn': ['tsaw'],
	'tìng nari:phr': ['nìn'],
	'nìn:v:tr': ['tìng nari'],
	'apxa:adj': ['tsawl'],
	'ngampam:n': [['ngampam si', 'wrong-type']],
	'ngampam:n:si': [['ngampam', 'wrong-type']],
	'fnelan:n': [['lefnelan', 'wrong-type']],
	'lefnelan:adj': [['fnelan', 'wrong-type']],
	'fnele:n': [['lefnele', 'wrong-type']],
	'lefnele:adj': [['fnele', 'wrong-type']],
	'kuma:conj': ['akum'],
	'akum:conj': ['kuma'],
	'mawkrra:conj': ['akrrmaw'],
	'akrrmaw:conj': ['mawkrra'],
	'takrra:conj': ['akrrta'],
	'akrrta:conj': ['takrra'],
	'taluna:conj': ['alunta', 'talun'],
	'alunta:conj': ['taluna', 'talun'],
	'talun:conj': ['alunta', 'taluna'],
	'ftxey:conj': ['fu'],
	'fu:conj': ['ftxey'],
	'srefwa:conj': [['srekrr', 'wrong-type']],
	'srekrr:adv': [['srefwa', 'wrong-type']],
	'mawfwa:conj': [['mawkrr', 'wrong-type']],
	'mawkrr:adv': [['mawfwa', 'wrong-type']],
	'taweyk:conj': ['taweyka'],
	'taweyka:conj': ['taweyk'],
	'vaykrr:conj': [['vay', 'wrong-type']],
	'kehe:part': ['kea'],
	'palulukan:n': ['palukan'],
	'palukan:n': ['palulukan'],
	'tìfkeytok:n': [['fkeyk', 'wrong-type']],
	'fkeyk:aff:suf': [['tìfkeytok', 'wrong-type']],
	'ye\'krr:adv': [['leye\'krr', 'wrong-type']],
	'leye\'krr:adj': [['ye\'krr', 'wrong-type']],
	'spe\'e:v:tr': [['tìspe\'e', 'wrong-type']],
	'tìspe\'e:n': [['spe\'e', 'wrong-type']],
	'hay:adj': [['nìhay', 'wrong-type']],
	'nìhay:adv': [['hay', 'wrong-type']],
	'fra\'u:pn': ['fraw'],
	'fraw:pn': ['fra\'u'],
	'penunyol:inter': ['nunyolpe'],
	'nunyolpe:inter': ['penunyol'],
	'pefyinep\'ang:inter': ['fyinep\'angpe'],
	'fyinep\'angpe:inter': ['pefyinep\'ang'],
	'pehem:inter': ['kempe'],
	'kempe:inter': ['pehem'],
	'\'ekxinumpe:inter': ['pekxinum'],
	'pekxinum:inter': ['\'ekxinumpe'],
	'la\'ape:inter': ['pela\'a'],
	'pela\'a:inter': ['la\'ape'],
	'somwewpe:inter': ['pesomwew'],
	'pesomwew:inter': ['somwewpe'],
	'lì\'upe:inter': ['pelì\'u'],
	'pelì\'u:inter': ['lì\'upe'],
	'lìmsimpe:inter': ['pelìmsim'],
	'pelìmsim:inter': ['lìmsimpe'],
	'pemstan:inter': ['mestampe'],
	'mestampe:inter': ['pemstan'],
	'pemste:inter': ['mestepe'],
	'mestepe:inter': ['pemste'],
	'pemsu:inter': ['mesupe'],
	'mesupe:inter': ['pemsu'],
	'pepstan:inter': ['pxestampe'],
	'pxestampe:inter': ['pepstan'],
	'pepste:inter': ['pxestepe'],
	'pxestepe:inter': ['pepste'],
	'pepsu:inter': ['pxesupe'],
	'pxesupe:inter': ['pepsu'],
	'paystan:inter': ['aystampe'],
	'aystampe:inter': ['paystan'],
	'payste:inter': ['aystepe'],
	'aystepe:inter': ['payste'],
	'paysu:inter': ['aysupe'],
	'aysupe:inter': ['paysu'],
	'komum:intj': ['kemum'],
	'kemum:intj': ['komum'],
	'letut:adj': ['lukftang'],
	'lukftang:adj': ['letut'],
	'penghrr:vin': ['pllhrr'],
	'pllhrr:vin': ['penghrr'],
	'säpenghrr:n': ['säpllhrr'],
	'säpllhrr:n': ['säpenghrr'],
	'palulukantsyìp:n': ['palukantsyìp'],
	'palukantsyìp:n': ['palulukantsyìp'],
	'tìkangkem:n': ['kangkem'],
	'kangkem:n': ['tìkangkem'],
	'\'opinvultsyìp:n': ['pinvul'],
	'pinvul:n': ['\'opinvultsyìp'],
	'tsmuk:n': ['tsmuktu'],
	'tsmuktu:n': ['tsmuk'],
	'pamrelvul:n': ['relvul'],
	'relvul:n': ['pamrelvul'],
	'säkeynven:n': ['skeynven'],
	'skeynven:n': ['säkeynven'],
	'pesrrpxì:inter': ['trrpxìpe', 'pehrrlik', 'krrlikpe'],
	'trrpxìpe:inter': ['pesrrpxì', 'pehrrlik', 'krrlikpe'],
	'pehrrlik:inter': ['pesrrpxì', 'trrpxìpe', 'krrlikpe'],
	'krrlikpe:inter': ['pesrrpxì', 'trrpxìpe', 'pehrrlik'],
	'lafyon:adj': ['hafyonga\'', 'txantslusam'],
	'hafyonga\':adj': ['lafyon', 'txantslusam'],
	'txantslusam:adj': ['lafyon', 'hafyonga\''],
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
				'precision': 3,
				'autoSuccess': false,
				'text': {
					'ratio': '{value}/{total}'
				},
			}
		);
	}

	fetchAndSetUp(): void {
		const item = this.items[this.currentItemIndex];
		this.currentSlide = new QuestionSlide(item, this.toNextItem.bind(this), this.showDoneModal.bind(this));
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
		} else {
			// reinsert into queue
			function randomBetween(min: number, max: number): number {
				return Math.floor(min + Math.random() * (max - min));
			}
			const index = randomBetween(this.currentItemIndex + 1, this.items.length + 1);
			this.items.splice(index, 0, this.items[this.currentItemIndex]);
		}

		this.currentItemIndex++;
		this.updateProgress();
		if (this.currentItemIndex >= this.items.length) {
			$('#progress-bar').progress('set success');
			this.showDoneModal();
		} else {
			this.fetchAndSetUp();
		}
	}

	showDoneModal(): void {
		// if the user reviewed no words at all, don't show the modal and
		// instead just redirect immediately
		if (this.currentItemIndex === 0) {
			window.location.href = this.doneRedirectUrl;
			return;
		}

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
			' ' + _('correct-count') + ' (' + Math.round(fraction * 100) + '%)');
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
		$('#progress-bar').progress(
			'set total', this.items.length
		);
	}
}

abstract class Slide {
	toNextItem: (correct: boolean) => void;
	exit: () => void;

	constructor(toNextItem: (correct: boolean) => void, exit: () => void) {
		this.toNextItem = toNextItem;
		this.exit = exit;
	}

	abstract renderIn($container: JQuery): void;
};

class QuestionSlide extends Slide {
	word: WordData;

	$card?: JQuery;
	$meaningInput!: JQuery;
	$stressInput: JQuery | null = null;
	$checkButton!: JQuery;
	$exitButton!: JQuery;

	static readonly CORRECT_WAITING_TIME = 0;
	static readonly INCORRECT_WAITING_TIME = 4000;

	constructor(word: WordData, toNextItem: (correct: boolean) => void, exit: () => void) {
		super(toNextItem, exit);
		this.word = word;
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

		let syllables = this.getSyllables();
		if (syllables !== null) {
			this.$stressInput = $('<div/>')
				.addClass('additional-question')
				.hide()
				.appendTo($container);
			$('<div/>')
				.addClass('additional-question-label')
				.html(_('syllables-input-question'))
				.appendTo(this.$stressInput);
			const $stressButtonsContainer = $('<div/>')
				.addClass('ui icon compact basic buttons stress-buttons-container')
				.appendTo(this.$stressInput);
			for (let syllable = 0; syllable < syllables.length; syllable++) {
				$('<div/>')
					.addClass('ui button stress-button')
					.text(syllables[syllable])
					.attr('data-index', syllable + 1)
					.on('click', () => {
						if (syllable + 1 === this.getCorrectStress()) {
							this.markCorrect();
						} else {
							this.markIncorrect();
						}
					})
					.appendTo($stressButtonsContainer);
			}
		}

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
			.on('click', this.exit)
			.appendTo($buttonsCard);
	}

	getCorrectAnswer(): string {
		return this.word['word_raw']['FN'].toLowerCase() + (this.word['type'] === 'n:si' ? ' si' : '');
	}

	/// Returns an array of the current word's pronunciation's syllables, or
	/// `null` if the stress shouldn't be asked (i.e., if the word has only one
	/// single syllable, or it has either none or multiple pronunciations
	/// defined).
	getSyllables(): string[] | null {
		if (!this.word['pronunciation'] || this.word['pronunciation'].length !== 1) {
			return null;
		}

		let pronunciation = this.word['pronunciation'][0];
		let syllables = pronunciation.syllables.split('-');
		if (syllables.length === 1) {
			return null;
		}

		return syllables;
	}

	/// Returns the (1-based) index of the stressed syllable, or `null` if the
	/// stress shouldn't be asked (i.e., if the word has only one single syllable,
	/// or it has either none or multiple pronunciations defined).
	getCorrectStress(): number | null {
		if (this.getSyllables() === null) {
			return null;
		}

		let pronunciation = this.word['pronunciation']![0];
		return pronunciation.stressed;
	}

	isConfusable(answer: string): 'synonym' | 'wrong-type' | 'wrong-direction' | 'wrong-form' | null {
		let key = this.word['word_raw']['FN'] + ':' + this.word['type'];
		key = key.toLowerCase();
		if (confusables[key]) {
			for (let confusable of confusables[key]) {
				if (typeof confusable === 'string') {
					if (confusable === answer) {
						return 'synonym';
					}
				} else {
					if (confusable[0] === answer) {
						return confusable[1];
					}
				}
			}
		}
		return null;
	}

	preprocessAnswer(answer: string): string {
		answer = answer.replace(/’/g, "'");
		answer = answer.replace(/‘/g, "'");
		answer = answer.toLowerCase();
		answer = answer.replace(/[\[\]<>+\-]/g, '');
		return answer;
	}

	checkAnswer(): void {
		let givenAnswer = ('' + this.$meaningInput.val()!).trim();
		const lastCharacter = parseInt(givenAnswer.charAt(givenAnswer.length - 1), 10);
		let givenStress: number | null = null;
		if (!isNaN(lastCharacter)) {
			givenAnswer = givenAnswer.substring(0, givenAnswer.length - 1).trim();
			givenStress = lastCharacter;
		}
		givenAnswer = this.preprocessAnswer(givenAnswer);
		this.$meaningInput.val(givenAnswer);

		// If the answer is incorrect, check if the answer is confusable. If so,
		// give another chance.
		if (givenAnswer !== this.getCorrectAnswer()) {
			let confusableType = this.isConfusable(givenAnswer);
			if (confusableType) {
				this.$meaningInput.popup({
					'content': _(confusableType + '-note'),
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
				this.markIncorrect();
			}
			return;
		}

		// Answer was correct.
		this.$meaningInput.addClass('correct')
			.prop('disabled', true);
		this.$checkButton.prop('disabled', true);

		// Do we need to ask for stress?
		if (this.$stressInput !== null && givenStress === null) {
			this.$stressInput.show();
			// TODO
			return;
		}

		this.markCorrect();
	}

	markCorrect(): void {
		$.post('/api/srs/mark-correct', { 'vocab': this.word['id'] }, () => {
			setTimeout(() => {
				this.toNextItem(true);
			}, QuestionSlide.CORRECT_WAITING_TIME);
		});
	}

	markIncorrect(): void {
		$.post('/api/srs/mark-incorrect', { 'vocab': this.word['id'] }, () => {
			setTimeout(() => {
				this.toNextItem(false);
			}, QuestionSlide.INCORRECT_WAITING_TIME);
		});
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
