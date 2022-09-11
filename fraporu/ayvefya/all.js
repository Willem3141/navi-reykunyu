$(function() {
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
	} else if (type === 'aff:in') {
		return '&#x2039;' + word + '&#x203a;';
	} else if (type === 'aff:suf') {
		return '-' + word;
	}
	return word;
}

function addLemmaClass($element, type) {
	if (type === 'aff:pre') {
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

function createWordBlock(word) {
	let $block = $("<div/>")
		.addClass('entry');
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
		$block.append($('<span/>').addClass('translation').html(getTranslation(word["translations"][i])));
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

const naviAlphabet = " 'aäeéfghiìklmnoprstuvwxyz";

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
	return naviAlphabet.indexOf(first) - naviAlphabet.indexOf(second);
}

function loadWordList() {
	let $results = $('#word-list');
	$.getJSON('/api/frau')
		.done(function(dictionary) {
			$results.empty();

			let keys = []
			for (let key in dictionary) {
				keys.push(key);
			}
			keys.sort(function (a, b) {
				return compareNaviWords(a, b, 0);
			});
			let section = '';
			let block = null;
			for (let i in keys) {
				const initial = keys[i][0];
				if (initial !== section) {
					let $header = $('<h2/>')
						.append(initial)
						.attr('id', initial);
					if (initial === "'") {
						$header.append($('<span/>').addClass('muted').text(' (tìftang)'));
					}
					$results.append($header);
					$block = $('<div/>')
						.addClass('letter-block');
					$results.append($block);
					section = initial;
				}
				let word = dictionary[keys[i]];
				$block.append(createWordBlock(word));
			}
		})
		.fail(function() {
			$results.empty();
			$results.append(createErrorBlock("Something went wrong while loading the word list", "Please try again later. If the problem persists, please <a href='//wimiso.nl/contact'>contact</a> me."));
		});
	return false;
}

