import { appendLinkString, toReadableType } from "./lib";

class LearnPage {
	courseId: number;
	lessonId: number;

	/// All items we're supposed to show to the user. A number means the item
	/// is a word to learn; a string is a comment that we should show on a
	/// separate slide.
	items: (number | string)[];
	
	/// The index of the item we're currently showing.
	currentItemIndex = 0;  // TODO

	currentItemWordData: WordData | null = null;

	constructor(courseId: number, lessonId: number, lesson: Lesson, items: LearnableItem[]) {
		this.courseId = courseId;
		this.lessonId = lessonId;
		this.items = [];
		if (lesson.introduction) {
			this.items.push(lesson.introduction);
		}
		for (let item of items) {
			this.items.push(item.vocab);
			if (item.comment) {
				this.items.push(item.comment);
			}
		}
		if (lesson.conclusion) {
			this.items.push(lesson.conclusion);
		}
	}

	render(): void {
		// TODO
		this.fetchAndSetUp();
	}

	fetchAndSetUp(): void {
		const item = this.items[this.currentItemIndex];
		if (typeof item === 'number') {
			const itemID = this.items[this.currentItemIndex];
			$.getJSON('/api/word', { 'id': itemID }).done((wordData) => {
				this.currentItemWordData = wordData;
				this.setUpQuestion();
			});
		} else {
			this.currentItemWordData = null;
			this.setUpComment();
		}
	}

	setUpQuestion(): void {
		const word = this.currentItemWordData!;
		let navi = word['word']['FN'];
		let pronunciation = '';
		if (word['pronunciation']) {
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
		if (word['pronunciation']) {
			if (word['pronunciation'].length === 1 &&
				word['pronunciation'][0]['syllables'].split('-').join('').replace(/ù/g, 'u') === word['word_raw']['FN']) {
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

		const $container = $('#main-container');
		$container.empty();

		const $naviCard = $('<div/>').addClass('card')
			.appendTo($container);
		const $navi = $('<div/>')
			.attr('id', 'navi')
			.appendTo($naviCard);
		$navi.append($('<span/>').addClass('word').html(navi));
		$navi.append(' ');
		$navi.append($('<span/>').addClass('type').text('(' + toReadableType(word['type']) + ')'));

		const $english = $('#english');
		$english.empty();
		$english.append($('<span/>').addClass('meaning').html(english));

		if (word['meaning_note']) {
			$('#meaning-note-card').show();
			const $meaningNote = $('#meaning-note');
			$meaningNote.empty();
			appendLinkString(word['meaning_note'], $meaningNote, 'FN', 'en');
		} else {
			$('#meaning-note-card').hide();
		}

		if (word['etymology']) {
			$('#etymology-card').show();
			const $etymology = $('#etymology');
			$etymology.empty();
			appendLinkString(word['etymology'], $etymology, 'FN', 'en');
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

	setUpComment(): void {
		// TODO
	}
}

class OverviewPage {
	constructor(courseId: number, lessonId: number, lesson: Lesson, items: LearnableItem[]) {
		// TODO
	}
	render(): void {
		// TODO
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
					new LearnPage(courseId, lessonId, lessonData, learnableItems).render();
				} else {
					new OverviewPage(courseId, lessonId, lessonData, items).render();
				}
			});
		});
	});
});
