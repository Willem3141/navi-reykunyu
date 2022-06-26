class StressGame {
	correctCount = 0;
	totalCount = 0;

	constructor() {
		this.fetchAndSetUp();

		$('html').on('keydown', function (e: JQuery.KeyDownEvent) {
			const number = parseFloat(e.key);
			if (isNaN(number)) {
				return;
			}
			const $syllables = $('#syllables').children('.syllable');
			if (number - 1 < 0 || number - 1 > $syllables.length) {
				return;
			}
			$($syllables[number - 1]).trigger('click');
		});
	}

	fetchAndSetUp(): void {
		const self = this;
		$.getJSON('/api/random', { 'holpxay': 1 }).done(function (data) {
			if (!data[0].hasOwnProperty('pronunciation') ||
				!(data[0]['pronunciation'][0].includes('-')) ||
				data[0]['type'] === 'n:si') {
				self.fetchAndSetUp();
				return;
			}
			self.setUpQuestion(data[0]);
		});
	}

	setUpQuestion(word: any): void {
		const $definition = $('#definition');
		$definition.empty();
		$definition.append($('<span/>').addClass('lemma').text(word["na'vi"]));
		$definition.append(' ');
		$definition.append($('<span/>').addClass('type').text('(' + this.toReadableType(word['type']) + ')'));
		$definition.append(' ');
		$definition.append($('<span/>').addClass('meaning').text(word['translations'][0]['en']));

		const $syllables = $('#syllables');
		$syllables.empty();
		const syllables = word.pronunciation[0].split('-');
		for (let i = 0; i < syllables.length; i++) {
			if (i > 0) {
				$syllables.append(this.createSeparator());
			}
			const syllable = syllables[i];
			$syllables.append(this.createSyllableBlock(syllable, i + 1, word.pronunciation[1]));
		}
	}

	createSyllableBlock(syllable: string, i: number, correct: number): JQuery<HTMLElement> {
		const $syllable = $('<div/>').addClass('syllable');
		if (i === correct) {
			$syllable.addClass('correct');
		} else {
			$syllable.addClass('incorrect');
		}
		$('<div/>')
			.addClass('navi')
			.text(syllable)
			.appendTo($syllable);
		$('<div/>')
			.addClass('index')
			.text('' + i)
			.appendTo($syllable);

		const self = this;

		$syllable.on('click', function () {
			const $syllables = $('#syllables');
			$syllables.children('.syllable').children('.index').html('&nbsp;');
			const $correctSyllable = $($syllables.children('.syllable')[correct - 1]);
			$correctSyllable.children('.index').text('✓');
			$syllable.addClass('chosen');
			let timeout = 300;
			if (i === correct) {
				self.correctCount++;
			} else {
				$syllable.children('.index').text('✗');
				$correctSyllable.addClass('correction');
				timeout = 2000;
			}
			self.totalCount++;
			self.updateScore();

			setTimeout(function () {
				self.fetchAndSetUp();
			}, timeout);
		});
		return $syllable;
	}

	createSeparator(): JQuery<HTMLElement> {
		return $('<div/>').addClass('separator').text('-');
	}

	toReadableType(type: string): string {
		const mapping: { [name: string]: string } = {
			"n": "n.",
			"n:unc": "n.",
			"n:si": "v.",
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

	updateScore(): void {
		const scoreString = this.correctCount + '/' + this.totalCount;
		const $scoreField = $('#score-field');
		$scoreField
			.addClass('just-changed')
			.text(scoreString);
		setTimeout(function () {
			$scoreField.removeClass('just-changed');
			$scoreField.addClass('in-transition')
		});
		setTimeout(function () {
			$scoreField.removeClass('in-transition');
		}, 250);
	}
}

new StressGame();
