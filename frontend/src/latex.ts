import { lemmaFormLaTeX, getTranslation, getShortTranslation, createWordLink, makeLinkStringLaTeX } from './lib';

class AllWordsPage {
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

	sourceAbbreviation(source: Source): string | null {
		if (!source[1]) {
			return null;
		}
		let date = '~';
		if (source[2]) {
			let dateElements = source[2].split('-');
			date += dateElements[0] + '-' + dateElements[1];
		}
		if (source[1].includes('naviteri.org')) {
			return 'NT' + date;
		} else if (source[1].includes('forum.learnnavi.org')) {
			return 'LN' + date;
		} else if (source[1].includes('wiki.learnnavi.org')) {
			return 'Wiki' + date;
		} else if (source[0].includes('Activist Survival Guide')) {
			return 'ASG';
		}
		return null;
	}

	addDot(latex: string): string {
		latex = latex.trimEnd(); // remove trailing newlines or whatever other garbage may be there
		if (!'.?!'.includes(latex[latex.length - 1])) {
			latex += '.';
		}
		return latex;
	}

	makePronunciation(pronunciation: Pronunciation[], type: string): string {
		let result = '';
		for (let i = 0; i < pronunciation.length; i++) {
			if (i > 0) {
				result += ' ' + _('or') + ' ';
			}
			const ipa = pronunciation[i]['ipa'];
			if (ipa['FN'] !== ipa['RN']) {
				result += 'FN ';
				result += '{\\gentium ' + ipa['FN'] + '}';
				result += ' / ';
				result += 'RN ';
				result += '{\\gentium ' + ipa['RN'] + '}';

			} else {
				result += '{\\gentium ' + ipa['FN'] + '}';
			}
		}
		return result.replaceAll('~', '\\textasciitilde{}');
	}

	convertToHeadwordForm(pronunciation: Pronunciation): string {
		let result = '';
		let syllables = pronunciation['syllables'].split('-');
		for (let i = 0; i < syllables.length; i++) {
			if (syllables.length > 1 && i + 1 === pronunciation['stressed']) {
				result += '[' + syllables[i] + ']';
			} else {
				result += syllables[i];
			}
		}
		return result;
	}

	makeLaTeXFor(word: WordData): string {
		let latex = '';

		let headword = lemmaFormLaTeX(word, 'combined');
		latex += '\\textbf{' + headword + '}\n';

		if (word['pronunciation'] && word['pronunciation'].length > 0) {
			// Do we even need to show the pronunciation? If it's equal to what's already in the headword, it's useless.
			let headwordPronunciation = word['word']['combined'].toLowerCase().replaceAll('/', '').replaceAll('é', 'e');
			let pronunciations = [];
			for (let pronunciation of word['pronunciation']) {
				pronunciations.push(this.convertToHeadwordForm(pronunciation));
			}
			if (pronunciations.length > 1 && pronunciations[0].toLowerCase() === headwordPronunciation) {
				//console.log(headwordPronunciation, pronunciations[0]);
				latex += '(also pron. ';
				for (let i = 1; i < pronunciations.length; i++) {
					if (i > 1) {
						latex += ' or ';
					}
					let p = pronunciations[i].replace(/\[([^\]]*)\]/g, '\\uline{$1}');
					latex += '\\textbf{' + p + '}';
				}
				latex += ')\n';
			} else if (pronunciations[0].toLowerCase() !== headwordPronunciation) {
				latex += '(pron. ';
				for (let i = 0; i < pronunciations.length; i++) {
					if (i > 0) {
						latex += ' or ';
					}
					let p = pronunciations[i].replace(/\[([^\]]*)\]/g, '\\uline{$1}');
					latex += '\\textbf{' + p + '}';
				}
				latex += ')\n';
			}
			//latex += ' ' + this.makePronunciation(word['pronunciation'], word['type']) + '\n';
			//}
		}

		//addLemmaClass($word, word["type"]);

		if (word['status']) {
			latex += '\\statusbox{' + word['status'] + '} ';
		}

		latex += '(\\textit{' + this.tstxoFnelä(word['type'], true) + '}';
		if (word['infixes']) {
			latex += ',\\ ';
			const infixes = word['infixes'];
			latex += 'inf.\\ ';
			latex += infixes.replaceAll('..', '\\kern40000sp\\textbf{·}\\kern40000sp\\textbf{·}\\kern40000sp ')
				.replaceAll('.', '\\kern40000sp\\textbf{·}\\kern40000sp ');
		}
		latex += ')\\ %';

		for (const i in word["translations"]) {
			latex += '\n';
			if (word["translations"].length > 1) {
				latex += '\\textbf{' + (parseInt(i, 10) + 1) + '.}~';
			}
			latex += getTranslation(word["translations"][i], this.getLanguage());
		}
		latex = this.addDot(latex);
		if (word['meaning_note']) {
			latex += '\n';
			latex += makeLinkStringLaTeX(getTranslation(word['meaning_note'], this.getLanguage()), word, this.getDialect(), this.getLanguage(), true);
			latex = this.addDot(latex);
		}
		if (word['etymology'] && word['etymology'].length > 0 && word['type'] !== 'phr' && (word['type'] !== 'n:si' || !word['etymology'].startsWith('From '))) {
			latex += '\n';
			let etymology = makeLinkStringLaTeX(word['etymology'], word, this.getDialect(), this.getLanguage(), true);
			etymology = etymology.replace(/(מַצָּה)/, '{\\hebrew $1}');
			etymology = etymology.replace(/(חָמֵץ)/, '{\\hebrew $1}');
			etymology = etymology.replace(/(中文)/, '{\\cjk $1}');
			latex += etymology;
			latex = this.addDot(latex);
		}
		if (word['seeAlso'] && word['seeAlso'].length > 0) {
			latex += '\n';
			latex += ' (→ ';
			for (let i = 0; i < word['seeAlso'].length; i++) {
				if (i > 0) {
					latex += ', ';
				}
				latex += '\\textbf{' + lemmaFormLaTeX(word['seeAlso'][i], this.getDialect()) + '}';
			}
			latex += ')';
		}
		if (word['source']) {
			let source = '';
			let firstSource = true;
			for (const s of word['source']) {
				let abbreviation = this.sourceAbbreviation(s);
				if (abbreviation != null) {
					if (!firstSource) {
						source += '\\,/\\,';
					} else {
						firstSource = false;
					}
					source += abbreviation;
				}
			}
			if (source !== '') {
				latex += '\n';
				latex += '{\\scriptsize ' + source + '}';
			}
		}
		if (word['image'] && word['word_raw']['FN'] !== 'syaksyuk' && word['word_raw']['FN'] !== 'palukan') {
			latex += '\n\n';
			latex += '\\begin{figure}[h]\\centering\\includegraphics[width=.3\\textwidth]{ayrel/' + word['image'] + '}\\\\\\textbf{' + lemmaFormLaTeX(word, 'combined') + '}\\end{figure}';
		}

		return latex;
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
	compareNaviWords(a: WordData, b: WordData, i: number): number {
		let aWord = a['word_raw']['FN'];
		let bWord = b['word_raw']['FN'];

		if (aWord === bWord) {
			return a['type'].localeCompare(b['type']);
		}

		const naviSortAlphabet = " 'aäbdeéfghiìklmnoprstuùvwxyz";

		if (aWord.length <= i || bWord.length <= i) {
			return aWord.length - bWord.length;
		}
		const first = aWord[i].toLowerCase();
		const second = bWord[i].toLowerCase();
		if (first == second) {
			return this.compareNaviWords(a, b, i + 1);
		}
		return naviSortAlphabet.indexOf(first) - naviSortAlphabet.indexOf(second);
	}

	sections = {
		'FN': "'aäefhiìklmnoprstuvwyz".split(''),
		'combined': "'aäefhiìklmnoprstuvwyz".split(''),
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
					return this.compareNaviWords(a, b, 0);
				});
				let section = '';

				let latex = '';
				for (let word of dictionary) {
					if (word['type'] === 'n' && word['word_raw']['FN'] === 'moe') {
						continue; // oopsie
					}
					const initial = word['word_raw']['FN'][0].toLowerCase();
					if (initial !== section) {
						if (initial === "'") {
							latex += '\\twocolumn[\\section*{\\centering\\LARGE ' + initial + '\\\\\\large\\textcolor{gray}{(tì\\uline{ftang})}}\\vspace{5mm}]';
						} else {
							latex += '\\twocolumn[\\section*{\\centering\\LARGE ' + initial + '}\\vspace{5mm}]';
						}
						latex += '\\chapterstart{' + initial + '}';
						latex += '\n\n';
						section = initial;
					}

					latex += '\\hangindent=1.4em\n\\hangafter=1\n';
					latex += this.makeLaTeXFor(word) + '\n\n';
				}
				$('#latex-box').text(latex);

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
