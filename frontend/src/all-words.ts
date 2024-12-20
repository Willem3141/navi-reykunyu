import { lemmaForm, addLemmaClass, getTranslation, getShortTranslation, createWordLink, appendLinkString } from './lib';

class AllWordsPage {
	constructor() {
		$('#type-filter-dropdown').dropdown('set selected', '.*');
		$('#type-filter-dropdown').dropdown({
			onChange: this.runFilter
		});
		$('#filter-box').on('input', this.runFilter);

		$('#language-dropdown').dropdown({
			onChange: (value) => {
				setNewLanguage(value);
				this.loadWordList();
				return false;
			}
		});

		this.loadWordList();

		$(window).on('resize scroll', this.updateToC);
	}

	createErrorBlock(text: string, subText: string): JQuery {
		let $error = $('<div/>').addClass('error');
		$('<p/>').addClass('error-text').html(text).appendTo($error);
		$('<img/>').addClass('error-icon').attr("src", "/images/ke'u.svg").appendTo($error);
		$('<p/>').addClass('error-subText').html(subText).appendTo($error);
		return $error;
	}

	pronunciationSection(lìupam: Pronunciation[], fnel: string): JQuery {
		let $tìlam = $('<span/>').addClass('stress');

		for (let i = 0; i < lìupam.length; i++) {
			if (i > 0) {
				$tìlam.append(' ' + _('or') + ' ');
			}
			const aylìkong = lìupam[i]['syllables'].split("-");
			for (let j = 0; j < aylìkong.length; j++) {
				if (j > 0) {
					$tìlam.append("-");
				}
				let $lìkong = $('<span/>').text(aylìkong[j]);
				if (aylìkong.length > 1 && j + 1 === lìupam[i]['stressed']) {
					$lìkong.addClass("stressed");
				} else {
					$lìkong.addClass("unstressed");
				}
				$tìlam.append($lìkong);
			}
			if (fnel === "n:si" || fnel === "nv:si") {
				$tìlam.append(" si");
			}
		}

		return $tìlam;
	}

	statusBadge(wordStatus: string): JQuery {
		let $pätsì = $('<span/>').addClass('status-badge');
		if (wordStatus === "unconfirmed") {
			$pätsì.text(_("status-unconfirmed"));
			$pätsì.addClass("unconfirmed");
		} else if (wordStatus === "unofficial") {
			$pätsì.text(_("status-unofficial"));
			$pätsì.addClass("unofficial");
		} else if (wordStatus === "loan") {
			$pätsì.text(_("status-loan"));
			$pätsì.addClass("loan");
		}
		return $pätsì;
	}

	sourceAbbreviation(source: string): string {
		if (source[1].includes('naviteri.org')) {
			return 'nt';
		} else if (source[1].includes('forum.learnnavi.org')) {
			return 'ln';
		} else if (source[1].includes('wiki.learnnavi.org')) {
			return 'wiki';
		} else if (source[0].includes('Activist Survival Guide')) {
			return 'asg';
		} else {
			return 'o';
		}
	}

	createWordBlock(word: WordData): JQuery {
		let $block = $("<div/>")
			.addClass('entry')
			.attr('data-lemma', word['word_raw'][this.getDialect()])
			.attr('data-type', word['type']);

		const $word = $('<span/>').addClass('word').html(lemmaForm(word, this.getDialect()));
		addLemmaClass($word, word["type"]);
		$block.append($word);
		$block.append(' (');
		$block.append($('<span/>').addClass("word-type").text(this.tstxoFnelä(word['type'], true)));
		if (word['pronunciation'] && word['pronunciation'].length > 0) {
			$block.append(', ');
			$block.append(this.pronunciationSection(word['pronunciation'], word['type']));
		}
		if (word['infixes']) {
			const infixes = word['infixes'];
			let infixesHtml = infixes.replace(".", "<span class='root-infix'>·</span>");
			infixesHtml = infixesHtml.replace(".", "<span class='root-infix'>·</span>");
			$block.append(', ');
			$block.append(infixesHtml);
		}
		$block.append(') ');
		if (word['status']) {
			$block.append(this.statusBadge(word['status']));
			$block.append(' ');
		}
		for (const i in word["translations"]) {
			if (word["translations"].length > 1) {
				$block.append($('<span/>').addClass('number').html(' ' + (parseInt(i, 10) + 1) + '. '));
			}
			$block.append($('<span/>').addClass('definition').html(getTranslation(word["translations"][i], this.getLanguage())));
		}
		if (word['meaning_note'] && word['meaning_note'].length > 0) {
			$block.append('. ');
			const $meaningNote = $('<span/>').addClass('meaning-note');
			appendLinkString(word['meaning_note'], $meaningNote, this.getDialect(), this.getLanguage(), true);
			$block.append($meaningNote);
		}
		if (word['etymology'] && word['etymology'].length > 0) {
			if (word['meaning_note'] && word['meaning_note'].length > 0) {
				// assume the meaning note already ends in '.'
				$block.append(' ');
			} else {
				$block.append('. ');
			}
			const $etymology = $('<span/>').addClass('etymology');
			appendLinkString(word['etymology'], $etymology, this.getDialect(), this.getLanguage(), true);
			$block.append($etymology);
		}
		if (word['source']) {
			for (const s of word['source']) {
				if (s.length < 3 || s[1].length == 0) {
					continue;
				}
				$block.append(' ');
				$block.append($('<a/>')
					.addClass('source-link')
					.html(this.sourceAbbreviation(s))
					.attr('title', s[0] + (s[2].length > 0 ? ' (' + s[2] + ')' : ''))
					.attr('href', s[1]));
			}
		}
		if (word['seeAlso'] && word['seeAlso'].length > 0) {
			const $seeAlso = $('<span/>').addClass('see-also');
			$seeAlso.append(' (&rarr; ');
			for (let i = 0; i < word['seeAlso'].length; i++) {
				if (i > 0) {
					$seeAlso.append(', ');
				}
				appendLinkString([word['seeAlso'][i]], $seeAlso, this.getDialect(), this.getLanguage(), true);
			}
			$seeAlso.append(')');
			$block.append($seeAlso);
		}
		return $block;
	}

	// tìng fnelä tstxoti angim
	// fnel - fnelä tstxo apup (natkenong "n", "vtr")
	// traditional - if true, use traditional type abbreviations
	tstxoFnelä(fnel: string, traditional: boolean): string {
		const translation = _((traditional ? 'type-traditional-' : 'type-') + fnel);
		if (translation) {
			return translation;
		}
		return "no idea.../ngaytxoa";
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

	sections = {
		'FN': "'aäefhiìklmnoprstuvwyz".split(''),
		'combined': "'aäefhiìklmnoprstuùvwyz".split(''),
		'RN': "'aäbdefghiìklmnoprstuùvwyz".split('')
	};

	loadWordList() {
		let $results = $('#word-list-result');
		$results.empty();
		$('#spinner').show();

		$.getJSON('/api/list/all')
			.done((dictionary) => {
				$('#spinner').hide();
				const $tocBar = $('#toc-bar');
				$tocBar.empty();
				for (const section of this.sections[this.getDialect()]) {
					$('<a/>')
						.addClass('ui compact button')
						.text(section)
						.attr('href', '#' + section)
						.attr('id', 'button-' + section)
						.appendTo($tocBar);
				}

				dictionary.sort((a: WordData, b: WordData) => {
					return this.compareNaviWords(a['word_raw'][this.getDialect()], b['word_raw'][this.getDialect()], 0);
				});
				let section = '';
				let $block: JQuery | null = null;
				for (let word of dictionary) {
					const initial = word['word_raw'][this.getDialect()][0].toLowerCase();
					if (initial !== section) {
						let $header = $('<h2/>')
							.append(initial)
							.attr('id', initial);
						if (initial === "'") {
							$header.append($('<span/>').addClass('muted').text(' (tìftang)'));
						}
						$results.append($header);
						$block = $('<div/>')
							.addClass('letter-block')
							.attr('id', 'block-' + initial);
						$results.append($block);
						section = initial;
					}
					$block!.append(this.createWordBlock(word));
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

	getDialect(): Dialect {
		let dialect = localStorage.getItem('reykunyu-dialect');
		if (dialect !== 'combined' && dialect !== 'RN') {
			dialect = 'FN';
		}
		return <Dialect>dialect;
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
			$block.find('.entry').each((i, e) => {
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
		for (const section of this.sections[this.getDialect()]) {
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
	new AllWordsPage();
});
