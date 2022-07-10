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
	let $tìlam = $('<span/>').addClass('stress');
	if (!lìupam || lìupam.length === 0) {
		$tìlam.append(_("stress-unknown"));
		return $tìlam;
	}

	$tìlam.append("(");
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
		if (lìupam[i].hasOwnProperty('audio')) {
			$tìlam.append(pronunciationAudioButtons(lìupam[i]['audio']));
		}
	}

	$tìlam.append(")");

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

function createWordBlock(word) {
	let $block = $("<div/>");
	const $word = $('<span/>').addClass('word').html(lemmaForm(word["na'vi"], word["type"]));
	addLemmaClass($word, word["type"]);
	$block.append($word);
	$block.append(' ');
	//$block.append(pronunciationSection(word["pronunciation"]));
	$block.append(' ');
	$block.append($('<div/>').addClass("ui horizontal label").text(tstxoFnelä(word["type"])));
	$block.append(' ');
	$block.append($('<span/>').addClass('translation').html(getTranslation(word["translations"][0])));
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

function loadWordList() {
	let $results = $('#word-list');
	$.getJSON('/api/frau')
		.done(function(dictionary) {
			$results.empty();

			let keys = []
			for (let key in dictionary) {
				keys.push(key);
			}
			keys.sort(Intl.Collator().compare);
			for (let i in keys) {
				let word = dictionary[keys[i]];
				$results.append(createWordBlock(word));
			}
		})
		.fail(function() {
			$results.empty();
			$results.append(createErrorBlock("Something went wrong while loading the word list", "Please try again later. If the problem persists, please <a href='//wimiso.nl/contact'>contact</a> me."));
		});
	return false;
}

