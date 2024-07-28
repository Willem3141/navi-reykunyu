$(function() {
	$('#type-filter-dropdown').dropdown('set selected', '.*');
	$('#type-filter-dropdown').dropdown({
		onChange: runFilter
	});
	$('#filter-box').on('input', runFilter);

	$('#language-dropdown').dropdown({
		onChange: function (value) {
			setNewLanguage(value);
			loadWordList();
			return false;
		}
	});

	loadWordList();
});

function createErrorBlock(text, subText) {
	let $error = $('<div/>').addClass('error');
	$('<p/>').addClass('error-text').html(text).appendTo($error);
	$('<img/>').addClass('error-icon').attr("src", "/ayrel/ke'u.svg").appendTo($error);
	$('<p/>').addClass('error-subText').html(subText).appendTo($error);
	return $error;
}

function pronunciationSection(lìupam, fnel) {
	if (!lìupam || lìupam.length === 0) {
		return false;
	}

	let $tìlam = $('<span/>').addClass('stress');

	for (let i = 0; i < lìupam.length; i++) {
		if (i > 0) {
			$tìlam.append(' ' + _('or') + ' ');
		}
		aylìkong = lìupam[i]['syllables'].split("-");
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

function getTranslation(tìralpeng) {
	let lang = localStorage.getItem('reykunyu-language');
	if (tìralpeng.hasOwnProperty(lang)) {
		return tìralpeng[lang];
	} else {
		return tìralpeng['en'];
	}
}

function lemmaForm(word, type) {
	if (type === "n:si" || type === "nv:si") {
		return word + ' si';
	} else if (type === 'aff:pre') {
		return word + "-";
	} else if (type === 'aff:pre:len') {
		return word + "+";
	} else if (type === 'aff:in') {
		return '&#x2039;' + word + '&#x203a;';
	} else if (type === 'aff:suf') {
		return '-' + word;
	}
	return word;
}

function addLemmaClass($element, type) {
	if (type === 'aff:pre' || type === 'aff:pre:len') {
		$element.addClass('prefix');
	} else if (type === 'aff:in') {
		$element.addClass('infix');
	} else if (type === 'aff:suf') {
		$element.addClass('suffix');
	}
}

function statusBadge(wordStatus) {
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

function sourceAbbreviation(source) {
	if (source[1].includes('naviteri.org')) {
		return 'nt';
	} else if (source[1].includes('forum.learnnavi.org')) {
		return 'ln';
	} else if (source[1].includes('wiki.learnnavi.org')) {
		return 'wiki';
	} else {
		return 'o';
	}
}

function createWordBlock(word) {
	let $block = $("<div/>")
		.addClass('entry')
		.attr('data-lemma', word['na\'vi'])
		.attr('data-type', word['type']);

	const $word = $('<span/>').addClass('word').html(lemmaForm(word["na'vi"], word["type"]));
	addLemmaClass($word, word["type"]);
	$block.append($word);
	$block.append(' (');
	$block.append($('<span/>').addClass("word-type").text(tstxoFnelä(word["type"], true)));
	const $pronunciation = pronunciationSection(word["pronunciation"]);
	if ($pronunciation) {
		$block.append(', ');
		$block.append(pronunciationSection(word["pronunciation"]));
	}
	if (word.hasOwnProperty('infixes')) {
		const infixes = word['infixes'];
		let infixesHtml = infixes.replace(".", "<span class='root-infix'>·</span>");
		infixesHtml = infixesHtml.replace(".", "<span class='root-infix'>·</span>");
		$block.append(', ');
		$block.append(infixesHtml);
	}
	$block.append(') ');
	if (word.hasOwnProperty('status')) {
		$block.append(statusBadge(word['status']));
		$block.append(' ');
	}
	for (const i in word["translations"]) {
		if (word["translations"].length > 1) {
			$block.append($('<span/>').addClass('number').html(' ' + (parseInt(i, 10) + 1) + '. '));
		}
		$block.append($('<span/>').addClass('definition').html(getTranslation(word["translations"][i])));
	}
	if (word.hasOwnProperty('source')) {
		for (const s of word['source']) {
			if (s.length < 3 || s[1].length == 0) {
				continue;
			}
			$block.append(' ');
			$block.append($('<a/>')
				.addClass('source-link')
				.html(sourceAbbreviation(s))
				.attr('title', s[0] + (s[2].length > 0 ? ' (' + s[2] + ')' : ''))
				.attr('href', s[1]));
		}
	}
	return $block;
}

// tìng fnelä tstxoti angim
// fnel - fnelä tstxo apup (natkenong "n", "vtr")
// traditional - if true, use traditional type abbreviations
function tstxoFnelä(fnel, traditional) {
	const translation = _((traditional ? 'type-traditional-' : 'type-') + fnel);
	if (translation) {
		return translation;
	}
	return "no idea.../ngaytxoa";
}

const naviSortAlphabet = " 'aäeéfghiìklmnoprstuvwxyz";

// Compares Na'vi words a and b according to Na'vi ‘sorting rules’ (ä after a, ì
// after i, digraphs sorted as if they were two letters using English spelling,
// tìftang is sorted before everything else). A non-zero i specifies that the
// first i characters of both strings are to be ignored. Returns a negative
// value if a < b, a positive value if a > b, or 0 if a == b.
function compareNaviWords(a, b, i) {
	if (a.length <= i || b.length <= i) {
		return a.length - b.length;
	}
	const first = a[i].toLowerCase();
	const second = b[i].toLowerCase();
	if (first == second) {
		return compareNaviWords(a, b, i + 1);
	}
	return naviSortAlphabet.indexOf(first) - naviSortAlphabet.indexOf(second);
}

const sections = "'aäefhiìklmnoprstuvwyz".split('');

function loadWordList() {
	let $results = $('#word-list-result');
	$results.empty();
	$('#spinner').show();

	$.getJSON('/api/list/all')
		.done(function(dictionary) {
			$('#spinner').hide();
			const $tocBar = $('#toc-bar');
			$tocBar.empty();
			for (const section of sections) {
				$('<a/>')
					.addClass('ui compact button')
					.text(section)
					.attr('href', '#' + section)
					.attr('id', 'button-' + section)
					.appendTo($tocBar);
			}

			dictionary.sort(function (a, b) {
				return compareNaviWords(a['word_raw']['FN'], b['word_raw']['FN'], 0);
			});
			let section = '';
			let block = null;
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
					$block = $('<div/>')
						.addClass('letter-block')
						.attr('id', 'block-' + initial);
					$results.append($block);
					section = initial;
				}
				$block.append(createWordBlock(word));
			}

			runFilter();
		})
		.fail(function() {
			$results.empty();
			$results.append(createErrorBlock("Something went wrong while loading the word list", "Please try again later. If the problem persists, please <a href='//wimiso.nl/contact'>contact</a> me."));
		});
	return false;
}


// filtering

function runFilter() {
	let filter;
	try {
		filter = new RegExp($('#filter-box').val());
	} catch (e) {
		// TODO provide proper error
		filter = /.*/;
	}
	const typeFilter = new RegExp('^' + $('#type-filter-dropdown').dropdown('get value') + '$');
	$('.letter-block').each((i, block) => {
		const $block = $(block);
		let anyMatchesInBlock = false;
		$block.find('.entry').each((i, e) => {
			const $e = $(e);
			const type = $e.attr('data-type');
			if (typeFilter.test(type)) {
				const lemma = $e.attr('data-lemma');
				const matches = filter.test(lemma);
				$e.toggle(matches);
				anyMatchesInBlock = anyMatchesInBlock || matches;
			} else {
				$e.toggle(false);
			}
		});
		const $header = $block.prev();
		$header.toggle(anyMatchesInBlock);
		$('#button-' + $.escapeSelector($header.attr('id'))).toggle(anyMatchesInBlock);
	});

	updateToC();
}


// table of contents handling

function updateToC() {
	for (const section of sections) {
		let $block = $('#block-' + $.escapeSelector(section));
		let $button = $('#button-' + $.escapeSelector(section));

		if ($(window).scrollTop() + $('.word-list-toc').outerHeight() < $block.offset().top + $block.outerHeight()
				&& $(window).scrollTop() + $(window).height() > $block.offset().top) {
			$button.addClass('active')
		} else {
			$button.removeClass('active')
		}
	}
}

$(window).on('resize scroll', updateToC);
