class ReviewPage {
	lessonId: number;
	items: string[] = [];
	currentItemIndex = 0;
	currentItem: any = null;
	correctAnswer = '';
	correctStress: number | null = null;
	correctCount = 0;

	static readonly CORRECT_WAITING_TIME = 0;
	static readonly INCORRECT_WAITING_TIME = 4000;

	constructor() {
		const url = new URL(window.location.href);
		if (!url.searchParams.has('lesson')) {
			throw Error('lesson parameter not set');
		}
		this.lessonId = parseInt(url.searchParams.get('lesson')!, 10);
		if (isNaN(this.lessonId)) {
			throw Error('lesson parameter is not an integer');
		}
		$.getJSON('/api/srs/reviewable', { 'lessonId': this.lessonId }).done((data) => {
			this.items = data;
			this.fetchAndSetUp();
		});
		$('#navi-card').on('keypress', (e) => {
			if (e.key === 'Enter') {
				this.checkAnswer();
			}
		});
		$('#check-button').on('click', () => {
			this.checkAnswer();
		});
		$('#exit-button').on('click', () => {
			this.showResults();
		});
	}

	fetchAndSetUp(): void {
		const itemString = this.items[this.currentItemIndex];
		const word = itemString.substring(0, itemString.indexOf(':'));
		const type = itemString.substring(itemString.indexOf(':') + 1);
		$.getJSON('/api/word', { 'word': word, 'type': type }).done((wordData) => {
			this.currentItem = wordData;
			this.setUpQuestion();
		});
	}

	setUpQuestion(): void {
		const word = this.currentItem;
		let navi = word["na'vi"];
		if (word['type'] == 'n:si') {
			navi += ' si';
		}
		this.correctAnswer = navi;
		if (word.hasOwnProperty('pronunciation') && word['pronunciation'].length === 1
				&& word['pronunciation'][0]['syllables'].indexOf('-') !== -1) {
			this.correctStress = word['pronunciation'][0]['stressed'];
		} else {
			this.correctStress = null;
		}

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

		const $english = $('#english');
		$english.empty();
		$english.append($('<span/>').addClass('type').text('(' + this.toReadableType(word['type']) + ')'));
		$english.append(' ');
		$english.append($('<span/>').addClass('meaning').html(english));

		const $navi = $('#navi-card');
		$navi.val('');

		$('#navi-card').removeClass('incorrect correct')
			.prop('disabled', false)
			.trigger('focus');
		$('#check-button').prop('disabled', false);
		$('#correction-card').hide();
		$('#stress-card').hide();
	}

	toReadableType(type: string): string {
		const mapping: { [name: string]: string } = {
			"n": "n.",
			"n:unc": "n.",
			"n:si": "vin.",
			"n:pr": "prop. n.",
			"pn": "pn.",
			"adj": "adj.",
			"num": "num.",
			"adv": "adv.",
			"adp": "adp.",
			"adp:len": "adp+",
			"intj": "intj.",
			"part": "part.",
			"conj": "conj.",
			"ctr": "sbd.",
			"v:?": "v.",
			"v:in": "vin.",
			"v:tr": "vtr.",
			"v:m": "vm.",
			"v:si": "v.",
			"v:cp": "vcp.",
			"phr": "phr.",
			"inter": "inter.",
			"aff:pre": "pref.",
			"aff:pre:len": "pref.",
			"aff:in": "inf.",
			"aff:suf": "suf.",
			"nv:si": "vin."
		}
		return mapping[type];
	}
	 
	correctAnswerDisplay(word: any): string {
		let navi = word["na'vi"];
		let pronunciation = '';
		if (word.hasOwnProperty('pronunciation')) {
			for (let i = 0; i < word['pronunciation'].length; i++) {
				if (i > 0) {
					pronunciation += ' or ';
				}
				const syllables = word['pronunciation'][i]['syllables'].split('-');
				for (let j = 0; j < syllables.length; j++) {
					if (syllables.length > 1 && j + 1 == word['pronunciation'][i]['stressed']) {
						pronunciation += '<u>' + syllables[j] + '</u>';
					} else {
						pronunciation += syllables[j];
					}
				}
			}
		}
		if (word['type'] == 'n:si') {
			navi += ' si';
			pronunciation += ' si';
		}
		if (word.hasOwnProperty('pronunciation')) {
			if (word['pronunciation'].length === 1 &&
				word['pronunciation'][0]['syllables'].split('-').join('') === word["na'vi"]) {
				navi = pronunciation;
			} else {
				navi = navi + ' <span class="type">(pronounced ' + pronunciation + ')</span>';
			}
		}

		return navi;
	}

	checkAnswer(): void {
		let givenAnswer = ('' + $('#navi-card').val()!).trim().toLowerCase();
		const lastCharacter = parseInt(givenAnswer.charAt(givenAnswer.length - 1), 10);
		let givenStress: number | null = null;
		if (!isNaN(lastCharacter)) {
			givenAnswer = givenAnswer.substring(0, givenAnswer.length - 1).trim();
			givenStress = lastCharacter;
		}
		$('#navi-card').val(givenAnswer);

		if (givenAnswer !== this.correctAnswer.toLowerCase()) {
			$('#navi-card').addClass('incorrect')
				.prop('disabled', true);
			$('#check-button').prop('disabled', true);
			$('#correction-card').slideDown();
			$('#correction').html(this.correctAnswerDisplay(this.currentItem));
			$.post('/api/srs/mark-incorrect', { 'vocab': this.items[this.currentItemIndex] });
			this.addToLearnedList(false);
			setTimeout(() => {
				this.nextOrResults();
			}, ReviewPage.INCORRECT_WAITING_TIME);
			return;
		}

		$('#navi-card').addClass('correct')
			.prop('disabled', true);
		$('#check-button').prop('disabled', true);

		if (this.correctStress !== null) {
			// ask for stress
			$('#stress-card').show();

			const $syllables = $('#syllables');
			$syllables.empty();

			const syllables = this.currentItem['pronunciation'][0]['syllables'].split('-');
			for (let i = 0; i < syllables.length; i++) {
				if (i > 0) {
					$syllables.append(this.createSeparator());
				}
				const syllable = syllables[i];
				$syllables.append(this.createSyllableBlock(syllable, i + 1, this.correctStress));
			}

			if (givenStress !== null) {
				// if stress was already provided by the user in the input
				// field, apply it now by immediately clicking the corresponding
				// stress button
				const $syllables = $('#syllables .syllable');
				if (givenStress >= 1 && givenStress <= $syllables.length) {
					$($syllables[givenStress - 1]).trigger('click');
				}
			}

		} else {
			// don't need to ask for stress
			$('#navi-card').addClass('correct')
				.prop('disabled', true);
			$('#check-button').prop('disabled', true);
			$.post('/api/srs/mark-correct', { 'vocab': this.items[this.currentItemIndex] });
			this.addToLearnedList(true);
			this.correctCount++;
			setTimeout(() => {
				this.nextOrResults();
			}, ReviewPage.CORRECT_WAITING_TIME);
		}
	}

	nextOrResults(): void {
		this.currentItemIndex++;
		this.updateScore();
		if (this.currentItemIndex >= this.items.length) {
			this.showResults();
		} else {
			this.fetchAndSetUp();
		}
	}
	
	createSyllableBlock(syllable: string, i: number, correct: number): JQuery<HTMLElement> {
		const $syllable = $('<div/>').addClass('syllable');
		$('<div/>')
			.addClass('navi')
			.text(syllable)
			.appendTo($syllable);
		$('<div/>')
			.addClass('index')
			.text('' + i)
			.appendTo($syllable);

		$syllable.on('click', () => {
			const $syllables = $('#syllables');
			if (i === correct) {
				$syllable.addClass('correct');
				$.post('/api/srs/mark-correct', { 'vocab': this.items[this.currentItemIndex] });
				this.addToLearnedList(true);
				this.correctCount++;
				setTimeout(() => {
					this.nextOrResults();
				}, ReviewPage.CORRECT_WAITING_TIME);
			} else {
				$syllable.addClass('incorrect');
				const $correctSyllable = $($syllables.children('.syllable')[correct - 1]);
				$correctSyllable.addClass('correct');
				$.post('/api/srs/mark-incorrect', { 'vocab': this.items[this.currentItemIndex] });
				this.addToLearnedList(false);
				setTimeout(() => {
					this.nextOrResults();
				}, ReviewPage.INCORRECT_WAITING_TIME);
			}
		});
		return $syllable;
	}

	createSeparator(): JQuery<HTMLElement> {
		return $('<div/>').addClass('separator').text('-');
	}

	updateScore(): void {
		const $progressBar = $('.progress-bar .filled-part');
		$progressBar
			.css('width', (100.0 * this.currentItemIndex / this.items.length) + '%');
	}

	appendLinkString(linkString: any[], $div: JQuery): void {
		for (let piece of linkString) {
			if (typeof piece === 'string') {
				$div.append(piece);
			} else {
				$div.append($('<span/>')
					.addClass('word-reference')
					.html('<b>' + piece["na'vi"] + '</b> <i>' + this.getShortTranslation(piece) + '</i>')
				);
			}
		}
	}

	getShortTranslation(result: any): string {
		if (result["short_translation"]) {
			return result["short_translation"];
		}

		let translation = result["translations"][0]['en'];
		translation = translation.split(',')[0];
		translation = translation.split(';')[0];
		translation = translation.split(' | ')[0];
		translation = translation.split(' (')[0];

		if (result["type"][0] === "v"
			&& translation.indexOf("to ") === 0) {
			translation = translation.substr(3);
		}

		return translation;
	}

	showResults(): void {
		$('#done-dialog-item-count').text(this.currentItemIndex);
		$('#dialog-layer').show();
		$('#to-review-button').attr('href', '/study/review/?lesson=' + this.lessonId);
	}

	addToLearnedList(correct: boolean): void {
		const $word = $('<div/>')
			.addClass('learned-word')
			.addClass(correct ? 'correct' : 'incorrect');
		$('<span/>')
			.addClass('navi')
			.html(this.correctAnswerDisplay(this.currentItem))
			.appendTo($word);
		$('<span/>')
			.addClass('english')
			.html($('#english').html())
			.appendTo($word);
		$('#learned-words').append($word);
		$('.progress-bar .filled-part')
			.toggleClass('incorrect', !correct);
	}
}

new ReviewPage();
