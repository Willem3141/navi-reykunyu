class LearnPage {
	lessonId: number;
	items: string[] = [];
	currentItemIndex = 0;
	currentItem: any = null;

	constructor() {
		const url = new URL(window.location.href);
		if (!url.searchParams.has('lesson')) {
			throw Error('lesson parameter not set');
		}
		this.lessonId = parseInt(url.searchParams.get('lesson')!, 10);
		if (isNaN(this.lessonId)) {
			throw Error('lesson parameter is not an integer');
		}
		$.getJSON('/api/srs/learnable', { 'lessonId': this.lessonId }).done((data) => {
			this.items = data;
			this.fetchAndSetUp();
		});
		$('#next-button').on('click', () => {
			$.post('/api/srs/mark-correct', { 'vocab': this.items[this.currentItemIndex] });
			this.addToLearnedList();
			this.currentItemIndex++;
			this.updateScore();
			if (this.currentItemIndex >= this.items.length) {
				this.showResults();
			} else {
				this.fetchAndSetUp();
			}
		});
		$('#known-button').on('click', () => {
			$.post('/api/srs/mark-known', { 'vocab': this.items[this.currentItemIndex] });
			this.addToLearnedList();
			this.currentItemIndex++;
			this.updateScore();
			if (this.currentItemIndex >= this.items.length) {
				this.showResults();
			} else {
				this.fetchAndSetUp();
			}
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

		const $navi = $('#navi');
		$navi.empty();
		$navi.append($('<span/>').addClass('word').html(navi));
		$navi.append(' ');
		$navi.append($('<span/>').addClass('type').text('(' + this.toReadableType(word['type']) + ')'));

		const $english = $('#english');
		$english.empty();
		$english.append($('<span/>').addClass('meaning').html(english));

		if (word.hasOwnProperty('meaning_note')) {
			$('#meaning-note-card').show();
			const $meaningNote = $('#meaning-note');
			$meaningNote.empty();
			this.appendLinkString(word['meaning_note'], $meaningNote);
		} else {
			$('#meaning-note-card').hide();
		}

		if (word.hasOwnProperty('etymology')) {
			$('#etymology-card').show();
			const $etymology = $('#etymology');
			$etymology.empty();
			this.appendLinkString(word['etymology'], $etymology);
		} else {
			$('#etymology-card').hide();
		}

		const $image = $('#word-image');
		if (word.hasOwnProperty('image')) {
			$image.show();
			$image.attr('src', '/ayrel/' + word['image']);
		} else {
			$image.hide();
		}
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

	addToLearnedList(): void {
		const $word = $('<div/>').addClass('learned-word');
		$('<span/>')
			.addClass('navi')
			.html($('#navi').html())
			.appendTo($word);
		$('<span/>')
			.addClass('english')
			.html($('#english').html())
			.appendTo($word);
		$('#learned-words').append($word);
	}
}

new LearnPage();
