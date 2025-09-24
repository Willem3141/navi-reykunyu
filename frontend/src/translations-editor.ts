import { lemmaForm, addLemmaClass } from './lib';

import * as dialect from 'reykunyu/dialect';

class TranslationsEditorPage {
	constructor() {
		$('#type-filter-dropdown').dropdown('set selected', '.*');
		$('#type-filter-dropdown').dropdown({
			onChange: this.runFilter.bind(this)
		});
		$('#filter-box').on('input', this.runFilter.bind(this));

		$('#language-dropdown').dropdown({
			onChange: (value) => {
				setNewLanguage(value);
				this.loadWordList();
				return false;
			}
		});

		this.loadWordList();

		$(window).on('resize scroll', this.updateToC.bind(this));
	}

	createErrorBlock(text: string, subText: string): JQuery {
		let $error = $('<div/>').addClass('error');
		$('<p/>').addClass('error-text').html(text).appendTo($error);
		$('<img/>').addClass('error-icon').attr("src", "/images/ke'u.svg").appendTo($error);
		$('<p/>').addClass('error-subText').html(subText).appendTo($error);
		return $error;
	}

	createWordTranslationRow(word: WordData, i: number): JQuery {
		let $row = $("<tr/>")
			.addClass('dashed-top-line')
			.attr('data-lemma', word['word_raw']['FN'])
			.attr('data-type', word['type']);

		const $cell = $('<td/>').css('width', '20%').appendTo($row);
		if (i === 0) {
			$row.removeClass('dashed-top-line');
			const $word = $('<span/>').addClass('word').html(lemmaForm(word, 'FN')).appendTo($cell);
			addLemmaClass($word, word["type"]);
			$cell.append(' (');
			$('<span/>').addClass("word-type").text(word['type']).appendTo($cell);
			$cell.append(')');
		}

		$('<td/>')
			.css('width', '40%')
			.text(word["translations"][i]['en'])
			.appendTo($row);
		if (this.getLanguage() !== 'en') {
			const $editor = $('<td/>')
				.css('width', '40%')
				.text(word["translations"][i][this.getLanguage()])
				.attr('contenteditable', 'plaintext-only')
				.appendTo($row);
			$editor.on('blur', () => {
				const url = $('body').data('url');
				$.post(url, {
					'id': word['id'],
					'field': 'translations',
					'index': i,
					'language': this.getLanguage(),
					'translation': $editor.text()
				}, () => {
				});
			});
		}

		return $row;
	}

	createWordFieldRow(word: WordData, field: string): JQuery {
		let $row = $("<tr/>")
			.addClass('dashed-top-line')
			.attr('data-lemma', word['word_raw']['FN'])
			.attr('data-type', word['type']);

		$('<td/>')
			.appendTo($row);
		$('<td/>')
			.text((word as any)[field]['en'])
			.appendTo($row);
		if (this.getLanguage() !== 'en') {
			const $editor = $('<td/>')
				.text((word as any)[field][this.getLanguage()])
				.attr('contenteditable', 'plaintext-only')
				.appendTo($row);
			$editor.on('blur', () => {
				const url = $('body').data('url');
				$.post(url, {
					'id': word['id'],
					'field': field,
					'language': this.getLanguage(),
					'translation': $editor.text()
				}, () => {
				});
			});
		}

		return $row;
	}

	createWordRows(word: WordData): JQuery {
		let $rows = $();
		for (let i = 0; i < word['translations'].length; i++) {
			$rows = $rows.add(this.createWordTranslationRow(word, i));
		}
		if (word['short_translation']) {
			$rows = $rows.add(this.createWordFieldRow(word, 'short_translation'));
		}
		if (word['meaning_note']) {
			$rows = $rows.add(this.createWordFieldRow(word, 'meaning_note'));
		}
		if (word['conjugation_note']) {
			$rows = $rows.add(this.createWordFieldRow(word, 'conjugation_note'));
		}

		return $rows;
	}

	// Compares Na'vi words a and b according to Na'vi ‘sorting rules’ (ä after a, ì
	// after i, digraphs sorted as if they were two letters using English spelling,
	// tìftang is sorted before everything else). A non-zero i specifies that the
	// first i characters of both strings are to be ignored. Returns a negative
	// value if a < b, a positive value if a > b, or 0 if a == b.
	compareNaviWords(a: string, b: string, i: number): number {
		const naviSortAlphabet = " 'aäbdeéfghiìklmnoprstuùvwxyz";

		if (a.length <= i || b.length <= i) {
			return a.length - b.length;
		}
		const first = a[i].toLowerCase();
		const second = b[i].toLowerCase();
		if (first == second) {
			return this.compareNaviWords(a, b, i + 1);
		}
		return naviSortAlphabet.indexOf(first) - naviSortAlphabet.indexOf(second);
	}

	sections = "'aäefhiìklmnoprstuvwyz".split('');

	loadWordList() {
		let $results = $('#word-list-result');
		$results.empty();
		$('#spinner').show();

		$.getJSON('/words.json')
			.done((dictionary) => {
				$('#spinner').hide();
				const $tocBar = $('#toc-bar');
				$tocBar.empty();
				for (const section of this.sections) {
					$('<a/>')
						.addClass('ui compact button')
						.text(section)
						.attr('href', '#' + section)
						.attr('id', 'button-' + section)
						.appendTo($tocBar);
				}

				for (let word of dictionary) {
					word['word'] = { 'FN': dialect.combinedToFN(word['na\'vi']) };
					word['word_raw'] = { 'FN': dialect.makeRaw(word['word']['FN']) };
				}

				dictionary.sort((a: WordData, b: WordData) => {
					return this.compareNaviWords(a['word_raw']['FN'], b['word_raw']['FN'], 0);
				});
				let section = '';
				let $block: JQuery | null = null;
				for (let word of dictionary) {
					const initial = word['word_raw']['FN'][0].toLowerCase();
					if (initial !== section) {
						let $header = $('<h2/>')
							.append(initial)
							.attr('id', initial);
						if (initial === "'") {
							$header.append($('<span/>').addClass('muted').text(' (tìftang)'));
						}
						$results.append($header);
						$block = $('<table/>')
							.addClass('top-aligned letter-block')
							.attr('id', 'block-' + initial);
						$results.append($block);
						section = initial;
					}
					$block!.append(this.createWordRows(word));
				}

				this.runFilter();
			})
			.fail(() => {
				$results.empty();
				$('#spinner').hide();
				$('#toc-bar').hide();
				$('#no-results').hide();
				$results.append(this.createErrorBlock(_('word-list-error'), _('searching-error-description')));
			});
		return false;
	}

	getLanguage(): string {
		let lang = localStorage.getItem('reykunyu-language');
		if (!lang) {
			lang = 'en';
		}
		return lang;
	}


	// filtering

	runFilter() {
		let filter: RegExp;
		try {
			filter = new RegExp(<string>$('#filter-box').val());
		} catch (e) {
			// TODO provide proper error
			filter = /.*/;
		}
		const typeFilter = new RegExp('^' + $('#type-filter-dropdown').dropdown('get value') + '$');
		let anyMatches = false;

		$('.letter-block').each((i, block) => {
			const $block = $(block);
			let anyMatchesInBlock = false;
			$block.find('tr').each((i, e) => {
				const $e = $(e);
				const type = <string>$e.attr('data-type');
				if (typeFilter.test(type)) {
					const lemma = <string>$e.attr('data-lemma');
					const matches = filter.test(lemma);
					$e.toggle(matches);
					anyMatchesInBlock = anyMatchesInBlock || matches;
				} else {
					$e.toggle(false);
				}
			});
			const $header = $block.prev();
			$header.toggle(anyMatchesInBlock);
			$('#button-' + $.escapeSelector(<string>$header.attr('id'))).toggle(anyMatchesInBlock);
			anyMatches = anyMatches || anyMatchesInBlock;
		});

		this.updateToC();

		$('#toc-bar').toggle(anyMatches);
		$('#no-results').toggle(!anyMatches);
	}


	// table of contents handling

	updateToC() {
		for (const section of this.sections) {
			let $block = $('#block-' + $.escapeSelector(section));
			let $button = $('#button-' + $.escapeSelector(section));

			if ($(window).scrollTop()! + $('.word-list-toc').outerHeight()! < $block.offset()!.top + $block.outerHeight()!
					&& $(window).scrollTop()! + $(window).height()! > $block.offset()!.top) {
				$button.addClass('active')
			} else {
				$button.removeClass('active')
			}
		}
	}
}

$(() => {
	new TranslationsEditorPage();
});
