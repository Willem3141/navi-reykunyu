class ReviewPage {
	lessonId: number;
	items: string[] = [];
	currentItemIndex = 0;
	currentItem: any = null;
	correctAnswer = '';
	correctStress: number | null = null;
	correctCount = 0;

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
			"aff:in": "inf.",
			"aff:suf": "suf.",
			"nv:si": "vin."
		}
		return mapping[type];
	}

	checkAnswer(): void {
		let answer = ('' + $('#navi-card').val()!).trim().toLowerCase();
		const lastCharacter = parseInt(answer.charAt(answer.length - 1), 10);
		let stress: number | null = null;
		if (!isNaN(lastCharacter)) {
			stress = lastCharacter;
		}

		if (isNaN(lastCharacter) && this.correctStress !== null) {
			// ask for stress

		} else {

			if (answer === this.correctAnswer.toLowerCase()) {
				$.post('/api/srs/mark-correct', { 'vocab': this.items[this.currentItemIndex] });
				this.correctCount++;
			} else {
				$.post('/api/srs/mark-incorrect', { 'vocab': this.items[this.currentItemIndex] });
			}

			this.currentItemIndex++;
			if (this.currentItemIndex >= this.items.length) {
				this.showResults();
			} else {
				this.fetchAndSetUp();
			}
		}
	}

	updateScore(): void {
		const scoreString = '<b>' + this.currentItemIndex + '</b> items learned';
		const $scoreField = $('#score-field');
		$scoreField
			.addClass('just-changed')
			.html(scoreString);
		setTimeout(function () {
			$scoreField.removeClass('just-changed');
			$scoreField.addClass('in-transition')
		});
		setTimeout(function () {
			$scoreField.removeClass('in-transition');
		}, 250);
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
}

new ReviewPage();
