$(function () {
	if ($('#search-box').val().length) {
		sngäiTìfwusew();
	}

	$('#search-form').submit(sngäiTìfwusew);

	$('.ui.dropdown').dropdown();

	if (!localStorage.getItem('reykunyu-language')) {
		localStorage.setItem('reykunyu-language', 'en');
	}
	$('.current-lang').text(_('language'));
	$('.mode-english-item').toggle(localStorage.getItem('reykunyu-language') !== 'x-navi');  // for Na’vi it makes no sense to reverse search
	$('#language-dropdown').dropdown('set selected',
		localStorage.getItem('reykunyu-language'));
	$('#language-dropdown').dropdown({
		onChange: function (value) {
			localStorage.setItem('reykunyu-language', value);
			sngäiTìfwusew();
			$('.ui.search').search('clear cache');
			setUpAutocomplete();
			$('.current-lang').text(_('language'));
			$('.mode-english-item').toggle(value !== 'x-navi');  // for Na’vi it makes no sense to reverse search
			return false;
		}
	});

	if (!localStorage.getItem('reykunyu-mode')) {
		localStorage.setItem('reykunyu-mode', 'navi');
	}
	$('#mode-direction').dropdown('set selected',
		localStorage.getItem('reykunyu-mode'));
	$('#mode-direction').dropdown({
		onChange: function (value) {
			localStorage.setItem('reykunyu-mode', value);
			sngäiTìfwusew();
			$('.ui.search').search('clear cache');
			setUpAutocomplete();
			return false;
		}
	});

	if (!localStorage.getItem('reykunyu-direction')) {
		localStorage.setItem('reykunyu-direction', true);
	}
	if (!localStorage.getItem('reykunyu-ipa')) {
		localStorage.setItem('reykunyu-ipa', false);
	}

	setUpAutocomplete();

	$('.ui.checkbox').checkbox();
	$('#infix-details-modal').modal();
	$('#infix-details-modal button').popup();
	$('#settings-modal').modal({
		onApprove: function () {
			localStorage.setItem('reykunyu-direction',
				$('#direction-checkbox').prop('checked') ? '1' : '0');
			localStorage.setItem('reykunyu-ipa',
				$('#ipa-checkbox').prop('checked') ? '1' : '0');
		},
	});

	$('#api-button').on("click", function () {
		$('#api-modal').modal("show");
	});
	$('#settings-button').on("click", function () {
		$('#direction-checkbox').prop('checked',
			localStorage.getItem('reykunyu-direction') === '1');
		$('#ipa-checkbox').prop('checked',
			localStorage.getItem('reykunyu-ipa') === '1');
		$('#settings-modal').modal("show");
	});
	$('#credits-button').on("click", function () {
		$('#credits-modal').modal("show");
	});

	$('.infix-button').on('click', function () {
		$(this).addClass('active').siblings().removeClass('active');
		self.updateInfixDisabledButtons();
		self.updateInfixResults();
	});
});

function setUpAutocomplete() {
	let url = null;
	if (localStorage.getItem('reykunyu-mode') === 'navi' ||
		localStorage.getItem('reykunyu-mode') === 'rhymes') {
		url = 'api/mok?language=' + localStorage.getItem('reykunyu-language') + '&tìpawm={query}';
	} else if (localStorage.getItem('reykunyu-mode') === 'annotated') {
		url = 'api/annotated/suggest?' + '&query={query}';
	} else {
		url = 'api/suggest?language=' + localStorage.getItem('reykunyu-language') + '&query={query}';
	}
	$('.ui.search').search({
		apiSettings: {
			url: url
		},
		maxResults: 0,
		searchDelay: 0,
		selector: {
			'prompt': '#search-box'
		},
		showNoResults: false,
		onSelect: function (result) {
			$('#search-box').val(result['title']);
			sngäiTìfwusew();
			return false;
		}
	});
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

// ngop pätsìt a oeyktìng fnelit lì'uä
// fnel - fnelä tstxo apup (natkenong "n", "v:tr")
function typeBadge(fnel, small) {
	fnel = tstxoFnelä(fnel, small).split('/');
	let $pätsì = $('<span/>').addClass('type ui tag label').text(fnel[0]);
	if (small) {
		$pätsì.addClass('horizontal');
		$pätsì.removeClass('tag');
	}
	if (fnel.length > 1) {
		$pätsì.append($('<div/>').addClass('detail').text(fnel[1]));
	}
	return $pätsì;
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

function conjugationExplanation(conjugation) {
	let $explanation = $('<div/>');
	for (let i = 0; i < conjugation.length; i++) {
		let type = conjugation[i]["type"];
		let c = conjugation[i]["conjugation"];
		if (c["result"].toLowerCase() == c["root"].toLowerCase()) {
			continue;
		}

		switch (type) {
			case "n":
				$explanation.append(nounConjugationExplanation(c));
				break;
			case "v":
				$explanation.append(verbConjugationExplanation(c));
				break;
			case "adj":
				$explanation.append(adjectiveConjugationExplanation(c));
				break;
			case "v_to_n":
				$explanation.append(verbToNounConjugationExplanation(c));
				break;
			case "v_to_adj":
				$explanation.append(verbToAdjectiveConjugationExplanation(c));
				break;
			case "adj_to_adv":
				$explanation.append(adjectiveToAdverbConjugationExplanation(c));
				break;
		}
	}

	return $explanation;
}

function nounConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	for (let i = 0; i <= 2; i++) {
		if (conjugation["affixes"][i]) {
			$('<span/>').addClass('prefix').text(conjugation["affixes"][i]).appendTo($conjugation);
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
		}
	}

	$('<span/>').text(conjugation["root"]).appendTo($conjugation);

	for (let i = 3; i <= 6; i++) {
		if (conjugation["affixes"][i]) {
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
			$('<span/>').addClass('suffix').text(conjugation["affixes"][i]).appendTo($conjugation);
		}
	}

	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation["result"]).appendTo($conjugation);

	return $conjugation;
}

function verbConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	$('<span/>').text(conjugation["root"]).appendTo($conjugation);

	for (let i = 0; i < 3; i++) {
		if (conjugation["infixes"][i]) {
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
			$('<span/>').addClass('infix').html("&#x2039;" + conjugation["infixes"][i] + "&#x203a;").appendTo($conjugation);
		}
	}

	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation["result"]).appendTo($conjugation);

	return $conjugation;
}

function adjectiveConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	if (conjugation["form"] === "postnoun") {
		$('<span/>').addClass('suffix').html("a").appendTo($conjugation);
		$('<span/>').addClass('operator').text('+').appendTo($conjugation);
	}

	$('<span/>').text(conjugation["root"]).appendTo($conjugation);

	if (conjugation["form"] === "prenoun") {
		$('<span/>').addClass('operator').text('+').appendTo($conjugation);
		$('<span/>').addClass('suffix').html("a").appendTo($conjugation);
	}

	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation["result"]).appendTo($conjugation);

	return $conjugation;
}

function verbToNounConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	$('<span/>').text(conjugation["root"]).appendTo($conjugation);

	$('<span/>').addClass('operator').text('+').appendTo($conjugation);
	$('<span/>').addClass('suffix').text(conjugation["affixes"][0]).appendTo($conjugation);

	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	typeBadge('n', true).appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation["result"]).appendTo($conjugation);

	return $conjugation;
}

function verbToAdjectiveConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	$('<span/>').addClass('prefix').text(conjugation["affixes"][0]).appendTo($conjugation);
	$('<span/>').addClass('operator').text('+').appendTo($conjugation);

	$('<span/>').text(conjugation["root"]).appendTo($conjugation);

	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	typeBadge('adj', true).appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation["result"]).appendTo($conjugation);

	return $conjugation;
}

function adjectiveToAdverbConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	$('<span/>').addClass('prefix').text(conjugation["affixes"][0]).appendTo($conjugation);
	$('<span/>').addClass('operator').text('+').appendTo($conjugation);

	$('<span/>').text(conjugation["root"]).appendTo($conjugation);

	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	typeBadge('adv', true).appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation["result"]).appendTo($conjugation);

	return $conjugation;
}

function externalLenitionExplanation(lenition) {
	let $lenition = $('<div/>').addClass('lenition-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($lenition);

	$('<span/>').text(lenition["by"]).appendTo($lenition);
	$('<span/>').addClass('operator').text('+').appendTo($lenition);
	$('<span/>').text(lenition["from"]).appendTo($lenition);

	$('<span/>').addClass('operator').text('=').appendTo($lenition);

	$('<span/>').addClass('word').text(lenition["by"] + " " + lenition["to"]).appendTo($lenition);

	return $lenition;
}

function imageSection(name, image) {
	let $section = $('<div/>').addClass('definition-image');
	$('<img/>').attr('src', '/ayrel/' + image)
		.appendTo($section);
	$('<div/>').addClass('credit')
		.text(name + ' ' + _('image-drawn-by') + ' Eana Unil')
		.appendTo($section);
	return $section;
}

function getTranslation(tìralpeng) {
	let lang = localStorage.getItem('reykunyu-language');
	if (tìralpeng.hasOwnProperty(lang)) {
		return tìralpeng[lang];
	} else {
		return tìralpeng['en'];
	}
}

function translationSection(sìralpeng) {
	let $section = $('<div/>').addClass('result-item definition');
	if (sìralpeng.length === 1) {
		$section.html(getTranslation(sìralpeng[0]));
	} else {
		let $list = $('<ol/>').addClass('meaning-list').appendTo($section);
		for (let i = 0; i < sìralpeng.length; i++) {
			$('<li/>').html(getTranslation(sìralpeng[i])).appendTo($list);
		}
	}
	return $section;
}

// ngop tìoeyktìngit lì'upamä lì'uä
// lìupam[0] - aylì'kong lì'uä, fa pamrel a'aw (natkenong "lì-u-pam")
// lìupam[1] - holpxay lì'kongä a takuk lì'upam tsatseng ('awvea lì'kong: 1, muvea lì'kong: 2, saylahe)
// fnel - fnel lì'uä (kin taluna txo fnel livu "n:si", tsakrr zene sivung lì'ut alu " si")
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

function pronunciationSectionIpa(pronunciation, fnel) {
	let $result = $('<span/>').addClass('stress');
	if (!pronunciation || pronunciation.length === 0) {
		$result.append(_("stress-unknown"));
		return $result;
	}

	$result.addClass('ipa');
	$result.text("(");
	for (let i = 0; i < pronunciation.length; i++) {
		if (i > 0) {
			$result.append(' ' + _('or') + ' ');
		}
		const syllables = pronunciation[i]['syllables'].split("-");
		let ipa = '';
		for (let j = 0; j < syllables.length; j++) {
			if (j > 0) {
				ipa += '.';
			}
			if (syllables.length > 1 && j + 1 === pronunciation[i]['stressed']) {
				ipa += 'ˈ';
			}
			ipa += syllableToIpa(syllables[j]);
		}

		if (['p', 't', 'k'].includes(ipa[ipa.length - 1])) {
			ipa += '\u031A';  // unreleased mark
		}

		if (fnel === "n:si" || fnel === "nv:si") {
			ipa += " si";
		}
		$result.append(ipa);
		if (pronunciation[i].hasOwnProperty('audio')) {
			$result.append(pronunciationAudioButtons(pronunciation[i]['audio']));
		}
	}
	$result.append(")");

	return $result;
}

function syllableToIpa(text) {
	let ipa = '';
	text = text.toLowerCase();

	const ipaMapping = {
		'px': 'p’',
		'tx': 't’',
		'kx': 'k’',
		'\'': 'ʔ',
		'ts': 't͡s',
		'ng': 'ŋ',
		'r': 'ɾ',
		'y': 'j',
		'ì': 'ɪ',
		'e': 'ɛ',
		'ä': 'æ',
		'a': 'ɑ',
		'rr': 'r̩ː',
		'll': 'l̩ː',
	};

	for (let i = 0; i < text.length; i++) {
		if (i < text.length - 1) {
			const nextTwo = text[i] + text[i + 1];
			if (ipaMapping.hasOwnProperty(nextTwo)) {
				ipa += ipaMapping[nextTwo];
				i++;
				continue;
			}
		}
		const next = text[i];
		if (ipaMapping.hasOwnProperty(next)) {
			ipa += ipaMapping[next];
			continue;
		}
		ipa += next;
	}

	return ipa;
}

function pronunciationAudioButtons(audioData) {
	let $buttons = $('<div/>')
		.addClass('pronunciation-audio-buttons buttons');
	for (let audio of audioData) {
		let $button = $('<a/>')
			.addClass('ui icon compact mini basic button pronunciation-audio-button')
			.attr('data-tooltip', 'Speaker: ' + audio['speaker']);
		$('<i/>').addClass('play icon').appendTo($button);
		let clip = null;
		$button.on('click', function () {
			function reset() {
				clip = null;
				$button.empty();
				$('<i/>').addClass('play icon').appendTo($button);
			}
			if (clip === null) {
				clip = new Audio('/fam/' + audio['file']);
				clip.addEventListener('ended', reset);
				clip.play();
				$button.empty();
				$('<i/>').addClass('stop icon').appendTo($button);
			} else {
				clip.pause();
				reset();
			}
		});
		$buttons.append($button);
	}
	return $buttons;
}

function editButton(word, type) {
	let $button = $('<a/>').addClass('ui icon basic button edit-button');
	const url = "/edit?word=" + word + "&type=" + type;
	$button.attr('href', url);
	$('<i/>').addClass('pencil icon').appendTo($button);
	return $button;
}

function statusNoteSection(wordStatus, statusNote) {
	let $noteSection = $('<div/>').addClass('result-item status-note');
	if (wordStatus === "unconfirmed") {
		$noteSection.append("<b>" + _('status-unconfirmed-header') + "</b> ");
		$noteSection.addClass("unconfirmed");
	} else if (wordStatus === "loan") {
		$noteSection.append("<b>" + _('status-loan-header') + "</b> ");
		$noteSection.addClass("loan");
	}
	if (statusNote) {
		$noteSection.append(statusNote);
	} else {
		if (wordStatus === "unconfirmed") {
			$noteSection.append(_('status-unconfirmed-explanation'));
		} else if (wordStatus === "loan") {
			$noteSection.append(_('status-loan-explanation'));
		}
	}
	return $noteSection;
}

function noteSection(note) {
	let $noteSection = $('<div/>').addClass('result-item note');
	appendLinkString(note, $noteSection);
	return $noteSection;
}

function affixesSection(affixes) {
	let $affixesSection = $('<div/>').addClass('result-item affixes');
	$affixesSection.append($('<div/>').addClass('header').text('Affixes'));
	let $affixes = $('<div/>').addClass('body');

	let $table = $('<table/>').appendTo($affixes);
	for (let a of affixes) {
		const affix = a['affix'];
		let $tr = $('<tr/>').appendTo($table);
		let $affixLink = $('<a/>')
			.addClass('word-link')
			.html(lemmaForm(affix["na'vi"], affix['type']))
			//.addClass(a['type'])
			.attr('href', '/?q=' + affix["na'vi"]);
		addLemmaClass($affixLink, affix['type']);
		$('<td/>').append($affixLink).appendTo($tr);
		$meaningCell = $('<td/>').appendTo($tr);
		$meaningCell.append(typeBadge(affix['type'], true));
		$meaningCell.append($('<span/>').text(getTranslation(affix["translations"][0])));
	}

	$affixesSection.append($affixes);
	return $affixesSection;
}

function sourceSection(sources) {
	let $sourceSection = $('<div/>').addClass('result-item see-also');
	$sourceSection.append($('<div/>').addClass('header').text(_('source')));
	for (let source of sources) {
		let $source = $('<div/>').addClass('body');
		if (source.length == 1) {
			let $sourceText = $('<div/>');
			$sourceText.text(source[0]);
			$source.append($sourceText);
		} else {
			let $sourceLink = $('<a/>');
			$sourceLink.attr('href', source[1]);
			$sourceLink.text(source[0]);
			$source.append($sourceLink);
		}
		if (source.length >= 3 && source[2]) {
			$source.append(' (' + source[2] + ')');
		}
		if (source.length >= 4 && source[3]) {
			$source.append(' [' + source[3] + ']');
		}
		$sourceSection.append($source);
	}
	return $sourceSection;
}

function createWordLink(link) {
	if (typeof link === "string") {
		return $('<b/>').text(link);
	} else {
		let $link = $('<span/>');
		let $word = $('<a/>')
			.addClass('word-link')
			.attr('href', "/?q=" + link["na'vi"])
			.html(lemmaForm(link["na'vi"], link["type"]));
		addLemmaClass($word, link["type"]);
		$link.append($word);
		$link.append(' (' + getShortTranslation(link) + ')');
		return $link;
	}
}

function appendLinkString(linkString, $div) {
	for (let piece of linkString) {
		if (typeof piece === 'string') {
			$div.append(piece);
		} else {
			$div.append(createWordLink(piece));
		}
	}
}

function etymologySection(etymology) {
	let $etymologySection = $('<div/>').addClass('result-item etymology');
	$etymologySection.append($('<div/>').addClass('header').text(_('etymology')));
	let $etymology = $('<div/>').addClass('body');
	appendLinkString(etymology, $etymology);
	$etymologySection.append($etymology);
	return $etymologySection;
}

function derivedSection(derived) {
	let $derivedSection = $('<div/>').addClass('result-item derived');
	$derivedSection.append($('<div/>').addClass('header').text(_('derived')));
	let $derived = $('<div/>').addClass('body');

	let first = true;
	for (let word of derived) {
		if (!first) {
			$derived.append(', ');
		}
		$derived.append(createWordLink(word));
		first = false;
	}

	$derivedSection.append($derived);
	return $derivedSection;
}

// ngop sästarsìmit aysätareyä
// aysätare - sästarsìm aylì'uä a tare fìlì'ut
function seeAlsoSection(seeAlso) {
	let $aysätare = $('<div/>').addClass('result-item see-also');
	$aysätare.append($('<div/>').addClass('header').text(_('see-also')));
	let $aysätareTxin = $('<div/>').addClass('body');

	for (let i = 0; i < seeAlso.length; i++) {
		if (i > 0) {
			$aysätareTxin.append(', ');
		}
		let link = seeAlso[i];
		$aysätareTxin.append(createWordLink(link));
	}

	$aysätare.append($aysätareTxin);
	return $aysätare;
}

// ngop hapxìt a wìntxu fya'ot a leykatem tstxolì'uti
function nounConjugationSection(conjugation, note) {
	let $section = $('<details/>').addClass('result-item conjugation');
	let $header = $('<summary/>').addClass('header').text(_('conjugated-forms')).appendTo($section);
	let $headerHide = $('<span/>').addClass('header-hide').appendTo($header);

	let $body = $('<div/>').addClass('body').appendTo($section);

	let $table = $('<table/>').addClass('conjugation-table').appendTo($body);

	let $headerRow = $('<tr/>').appendTo($table);
	let headers = ["", _("singular"), _("dual"), _("trial"), _("plural") + " <span class='muted'>(&gt; 3)</span>"];
	for (let i = 0; i < 5; i++) {
		$('<td/>').addClass('column-title').html(headers[i]).appendTo($headerRow);
	}

	let cases = [_("subjective"), _("agentive"), _("patientive"), _("dative"), _("genitive"), _("topical")];

	for (let i = 0; i < 6; i++) {
		let $row = $('<tr/>').appendTo($table);
		$('<td/>').addClass('row-title').html(cases[i]).appendTo($row);
		for (let j = 0; j < 4; j++) {
			if (conjugation[j].length === 0) {
				$('<td/>').html("&ndash;").appendTo($row);
				continue;
			}

			let c = conjugation[j][i];
			if (!c) {
				$('<td/>').html("&ndash;").appendTo($row);
				continue;
			}

			let formatted = nounConjugationString(c);
			$('<td/>').html(formatted).appendTo($row);
		}
	}

	let hideString = ""
	for (let j = 1; j < 4; j++) {
		if (conjugation[j].length === 0) {
			continue;
		}
		let c = conjugation[j][0];
		if (!c) {
			continue;
		}
		let formatted = nounConjugationString(c);
		if (j > 1) {
			hideString += ", ";
		}
		hideString += formatted;
	}

	if (hideString !== "") {
		hideString += "&nbsp;&nbsp;/&nbsp;&nbsp;";
	}

	for (let i = 1; i < 6; i++) {
		let c;
		if (conjugation[0].length === 0) {
			c = conjugation[1][i];
		} else {
			c = conjugation[0][i];
		}
		if (!c) {
			continue;
		}
		let formatted = nounConjugationString(c);
		if (i > 1) {
			hideString += ", ";
		}
		hideString += formatted;
	}
	$headerHide.append(hideString);

	if (note) {
		$body.append($('<div/>').addClass("conjugation-note").html(note));
	}

	return $section;
}

function nounConjugationString(c) {
	let formatted = "";
	c = c.split(";");
	for (let k = 0; k < c.length; k++) {
		if (k > 0) {
			formatted += " <span class='muted'>" + _('or') + "</span> ";
		}

		let m = c[k].match(/(.*-\)?)(.*)(-.*)/);

		if (m) {
			if (m[1] !== "-") {
				formatted += "<span class='prefix'>" + m[1] + "</span>";
			}
			formatted += m[2].replace(/\{(.*)\}/, "<span class='lenition'>$1</span>");
			if (m[3] !== "-") {
				formatted += "<span class='suffix'>" + m[3] + "</span>";
			}
		} else {
			formatted += c[k];
		}
	}
	return formatted;
}

function createNounConjugation(word, type, uncountable) {

	let conjugation = [];
	let caseFunctions = [subjective, agentive, patientive, dative, genitive, topical]
	let plurals = [singular(word), dual(word), trial(word), plural(word)]

	for (let j = 0; j < 4; j++) {
		let row = [];
		if (!uncountable || j === 0) {
			for (let i = 0; i < 6; i++) {
				row.push(caseFunctions[i](plurals[j]));
			}
		}
		conjugation.push(row);
	}

	return conjugation;
}

// ngop hapxìt a wìntxu fya'ot a leykatem syonlì'uti
function adjectiveConjugationSection(word, type, note) {
	let $section = $('<div/>').addClass('result-item conjugation');
	let $header = $('<div/>').addClass('header').text(_('attributive-forms')).appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);

	let html = "&lt;" + _('type-n') + "&gt; " + prefixed(word);
	html += "&nbsp;&nbsp;<span class='muted'>" + _('or') + "</span>&nbsp;&nbsp;";
	html += suffixed(word) + " &lt;" + _('type-n') + "&gt;";
	$body.html(html);

	if (note) {
		$body.append($('<div/>').addClass("conjugation-note").html(note));
	}

	return $section;
}

// ngop hapxìt a wìntxu hemlì'uvit
function infixesSection(word, infixes, note) {
	let $section = $('<div/>').addClass('result-item conjugation');
	let $header = $('<div/>').addClass('header').text(_('infix-positions')).appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);
	let infixesHtml = infixes.replace(".", "<span class='root-infix'>&#x2039;1&#x203a;</span>");
	infixesHtml = infixesHtml.replace(".", "<span class='root-infix'>&#x2039;2&#x203a;</span>");
	$body.html(infixesHtml + '&nbsp;&nbsp;');
	let $infixDetailsButton = $('<button/>')
		.addClass('ui circular basic icon button')
		.html('<i class="icon th list"></i>');
	const self = this;
	$infixDetailsButton.on("click", function () {
		$('#infix-details-modal').modal("show");
		$('#infix-details-word').text(word);
		$('#infix-details-input').text(word);
		$('#infix-details-infixes').text(infixes);
		self.updateInfixDisabledButtons();
		self.updateInfixResults();
	});
	$body.append($infixDetailsButton);
	if (note) {
		$body.append($('<div/>').addClass("conjugation-note").html(note));
	}
	return $section;
}

function updateInfixDisabledButtons() {

	const disableAndReplaceBy = function ($toDisable, $toReplaceBy) {
		$toDisable.addClass('disabled')
		if ($toDisable.hasClass('active')) {
			$toDisable.removeClass('active');
			$toReplaceBy.addClass('active');
		}
	};

	const enable = function ($toEnable) {
		$toEnable.removeClass('disabled');
	};

	// reflexive infix cannot be combined with passive participles
	// (http://forum.learnnavi.org/language-updates/reflexive-causative-in-combination-with-the-infixes-ltusgt-and-ltawngt)
	if ($('#äp-button').hasClass('active') || $('#äpeyk-button').hasClass('active')) {
		disableAndReplaceBy($('#awn-button'), $('#no-mode-button'));
	} else {
		enable($('#awn-button'))
	}

	// participles cannot have aspect, tense, intent, mood
	if ($('#us-button').hasClass('active') || $('#awn-button').hasClass('active')) {
		disableAndReplaceBy($('#ol-button'), $('#no-aspect-button'));
		disableAndReplaceBy($('#er-button'), $('#no-aspect-button'));

		disableAndReplaceBy($('#am-button'), $('#no-tense-button'));
		disableAndReplaceBy($('#ìm-button'), $('#no-tense-button'));
		disableAndReplaceBy($('#ìy-button'), $('#no-tense-button'));
		disableAndReplaceBy($('#ay-button'), $('#no-tense-button'));

		disableAndReplaceBy($('#s-button'), $('#no-intent-button'));

		disableAndReplaceBy($('#ei-button'), $('#no-mood-button'));
		disableAndReplaceBy($('#äng-button'), $('#no-mood-button'));
		disableAndReplaceBy($('#uy-button'), $('#no-mood-button'));
		disableAndReplaceBy($('#ats-button'), $('#no-mood-button'));

		return;
	}

	enable($('#ol-button'));
	enable($('#er-button'));
	enable($('#am-button'));
	enable($('#ìm-button'));
	enable($('#ìy-button'));
	enable($('#ay-button'));

	// with the subjunctive, no "near" tense gradations are possible...
	if ($('#iv-button').hasClass('active')) {
		disableAndReplaceBy($('#ìm-button'), $('#no-tense-button'));
		disableAndReplaceBy($('#ìy-button'), $('#no-tense-button'));

		// ... and we cannot combine aspect and tense anymore
		if (!$('#no-aspect-button').hasClass('active')) {
			disableAndReplaceBy($('#am-button'), $('#no-tense-button'));
			disableAndReplaceBy($('#ay-button'), $('#no-tense-button'));
		}
	}

	// intent cannot be present if aspect is marked, and we have a future tense
	if ($('#no-mode-button').hasClass('active') && $('#no-aspect-button').hasClass('active') &&
		($('#ìy-button').hasClass('active') || $('#ay-button').hasClass('active'))) {
		enable($('#s-button'));
	} else {
		disableAndReplaceBy($('#s-button'), $('#no-intent-button'));
	}

	enable($('#ei-button'));
	enable($('#äng-button'));
	enable($('#uy-button'));
	enable($('#ats-button'));
}

function updateInfixResults() {
	// finds and returns the pre-first infix
	function prefirstInfix() {
		if ($('#eyk-button').hasClass('active')) {
			return 'eyk';
		} else if ($('#äp-button').hasClass('active')) {
			return 'äp';
		} else if ($('#äpeyk-button').hasClass('active')) {
			return 'äpeyk';
		} else {
			return '';
		}
	}

	// finds and returns the first infix
	// yes, I know, this function is large and ugly ;)
	function firstInfix() {
		if ($('#us-button').hasClass('active')) {
			return 'us';
		} else if ($('#awn-button').hasClass('active')) {
			return 'awn';
		} else if ($('#iv-button').hasClass('active')) {

			// subjunctive infixes
			if ($('#ay-button').hasClass('active')) {
				return 'ìyev';

			} else if ($('#no-tense-button').hasClass('active')) {
				if ($('#no-aspect-button').hasClass('active')) {
					return 'iv';
				} else if ($('#ol-button').hasClass('active')) {
					return 'ilv';
				} else {
					return 'irv';
				}

			} else if ($('#am-button').hasClass('active')) {
				return 'ìmv';
			}

		} else {
			// non-subjunctive infixes
			if ($('#ay-button').hasClass('active')) {
				if ($('#no-aspect-button').hasClass('active')) {
					if ($('#no-intent-button').hasClass('active')) {
						return 'ay';
					} else {
						return 'asy';
					}
				} else if ($('#ol-button').hasClass('active')) {
					return 'aly';
				} else {
					return 'ary';
				}

			} else if ($('#ìy-button').hasClass('active')) {
				if ($('#no-aspect-button').hasClass('active')) {
					if ($('#no-intent-button').hasClass('active')) {
						return 'ìy';
					} else {
						return 'ìsy';
					}
				} else if ($('#ol-button').hasClass('active')) {
					return 'ìly';
				} else {
					return 'ìry';
				}

			} else if ($('#no-tense-button').hasClass('active')) {
				if ($('#no-aspect-button').hasClass('active')) {
					return '';
				} else if ($('#ol-button').hasClass('active')) {
					return 'ol';
				} else {
					return 'er';
				}

			} else if ($('#ìm-button').hasClass('active')) {
				if ($('#no-aspect-button').hasClass('active')) {
					return 'ìm';
				} else if ($('#ol-button').hasClass('active')) {
					return 'ìlm';
				} else {
					return 'ìrm';
				}

			} else if ($('#am-button').hasClass('active')) {
				if ($('#no-aspect-button').hasClass('active')) {
					return 'am';
				} else if ($('#ol-button').hasClass('active')) {
					return 'alm';
				} else {
					return 'arm';
				}
			}
		}
	}

	// finds and returns the second infix
	function secondInfix() {
		if ($('#ei-button').hasClass('active')) {
			return 'ei';
		} else if ($('#äng-button').hasClass('active')) {
			return 'äng';
		} else if ($('#uy-button').hasClass('active')) {
			return 'uy';
		} else if ($('#ats-button').hasClass('active')) {
			return 'ats';
		} else {
			return '';
		}
	}

	const infixes = $('#infix-details-infixes').text();
	const prefirst = prefirstInfix();
	const first = firstInfix();
	const second = secondInfix();

	const self = this;
	$.getJSON('/api/conjugate/verb', { 'verb': infixes, 'prefirst': prefirst, 'first': first, 'second': second })
		.done(function (result) {
			$('#infix-details-result').html(self.verbConjugationString(result));
		});
}

function verbConjugationString(c) {
	let html = '';
	for (let k = 0; k < c.length; k++) {
		if (k > 0) {
			html += "&nbsp;&nbsp;<span class='muted'>" + _('or') + "</span>&nbsp;&nbsp;";
		}
		html += c[k];
	}

	return html;
}

function createSentence(sentence, lemma) {
	let $sentence = $('<div/>').addClass("sentence");
	let $original = $('<div/>').addClass("original").appendTo($sentence);
	let $translation = $('<div/>').addClass("translation").appendTo($sentence);

	let englishHighlights = [];

	for (let i = 0; i < sentence["na'vi"].length; i++) {
		if (i > 0) {
			$original.append(" ");
		}
		if (sentence["na'vi"][i][1].includes(lemma)) {
			//englishHighlights = sentence["mapping"][i].split(",");
			$original.append($("<span/>").addClass("highlight").text(sentence["na'vi"][i][0]));
		} else {
			$original.append(sentence["na'vi"][i][0]);
		}
	}

	$translation.append(sentence["translations"]["en"].join(' '));

	/*for (let i = 0; i < sentence["translations"].length; i++) {
		if (i > 0) {
			$translation.append(" ");
		}
		//if (englishHighlights.includes("" + (i + 1))) {
			//$translation.append($("<span/>").addClass("highlight").text(sentence["english"][i]));
		//} else {
			$translation.append(sentence["english"][i]);
		//}
	}*/

	if (sentence["source"]) {
		$translation
			.append('&nbsp;&nbsp;&ndash; ');
		let $source = $('<a/>').addClass("source")
			.attr('href', sentence['source']['url'])
			.text(sentence['source']['name'])
			.appendTo($translation);
	}

	return $sentence;
}

function sentencesSection(sentences, lemma) {
	let $section = $('<details/>').addClass('result-item examples');
	let $header = $('<summary/>').addClass('header')
		.text(_('sentence-search') + ' (' + sentences.length + ' '
			+ (sentences.length > 1 ? _('usages-found-plural') : _('usages-found-singular'))
			+ ')')
		.appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);

	for (let i = 0; i < sentences.length; i++) {
		$body.append(createSentence(sentences[i], lemma));
	}

	return $section;
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

// creates a block showing a result
// i -- id of the result, 0-based (to be shown as the number in front of the
//      result)
// r -- the result itself
// query -- the query that the user searched for
function createResultBlock(i, r) {
	let $result = $('<div/>').addClass('result');

	let $resultWord = $('<div/>').addClass('result-word');
	$resultWord.append($('<span/>').addClass('id').text((i + 1) + '.'));

	$lemma = $('<span/>').addClass('lemma').appendTo($resultWord);
	addLemmaClass($lemma, r['type']);
	$lemma.html(lemmaForm(r["na'vi"], r['type']));
	$resultWord.append(typeBadge(r["type"], true).addClass('lemma-type'));

	if (r["status"]) {
		$resultWord.append(statusBadge(r["status"]));
	}

	if (localStorage.getItem('reykunyu-ipa') === '1') {
		$resultWord.append(pronunciationSectionIpa(r["pronunciation"], r["type"]));
	} else {
		$resultWord.append(pronunciationSection(r["pronunciation"], r["type"]));
	}

	const showEditButton = $('body').hasClass('editable');
	if (showEditButton) {
		$resultWord.append(editButton(r["na'vi"], r["type"]));
	}

	if (r.hasOwnProperty("conjugated")) {
		$explanation = conjugationExplanation(r["conjugated"]);
		$resultWord.append($explanation);
	}

	if (r["externalLenition"] && r["externalLenition"]["from"].toLowerCase() !== r["externalLenition"]["to"].toLowerCase()) {
		$resultWord.append(externalLenitionExplanation(r["externalLenition"]));
	}

	$resultWord.appendTo($result);

	if (r["image"]) {
		$result.append(imageSection(r["na'vi"], r["image"]));
	}

	$result.append(translationSection(r["translations"]));

	if (r["meaning_note"]) {
		$result.append(noteSection(r["meaning_note"]));
	}

	if (r["affixes"] && r["affixes"].length) {
		$result.append(affixesSection(r["affixes"]));
	}

	if (r["status"]) {
		$result.append(statusNoteSection(r["status"], r["status_note"]));
	}

	if (r["etymology"]) {
		$result.append(etymologySection(r["etymology"]));
	}
	if (r["derived"]) {
		$result.append(derivedSection(r["derived"]));
	}

	if (r["conjugation"]) {
		$result.append(nounConjugationSection(r["conjugation"]["forms"], r["conjugation_note"]));
	} else if (r["type"] === "n") {
		$result.append(nounConjugationSection(createNounConjugation(r["na'vi"], r["type"], false), r["conjugation_note"]));
	} else if (r["type"] === "n:pr") {
		$result.append(nounConjugationSection(createNounConjugation(r["na'vi"], r["type"], true), r["conjugation_note"]));
	} else if (r["type"] === "adj") {
		$result.append(adjectiveConjugationSection(r["na'vi"], r["type"], r["conjugation_note"]));
	}

	if (r["infixes"]) {
		$result.append(infixesSection(r["na'vi"], r["infixes"], r["conjugation_note"]));
	}

	if (r["sentences"] && r["sentences"].length) {
		$result.append(sentencesSection(r["sentences"], r["na'vi"] + ":" + r["type"]));
	}

	if (r["source"]) {
		$result.append(sourceSection(r["source"]));
	}

	if (r["seeAlso"]) {
		$result.append(seeAlsoSection(r["seeAlso"]));
	}

	return $result;
}

function createErrorBlock(text, subText) {
	let $error = $('<div/>').addClass('error');
	$('<p/>').addClass('error-text').html(text).appendTo($error);
	$('<img/>').addClass('error-icon').attr("src", "/ayrel/ke'u.svg").appendTo($error);
	$('<p/>').addClass('error-subText').html(subText).appendTo($error);
	return $error;
}

function createResults(results) {
	if (results["sì'eyng"].length) {
		for (let i = 0; i < results["sì'eyng"].length; i++) {
			$results.append(createResultBlock(i, results["sì'eyng"][i]));
		}
	} else if (results["aysämok"].length) {
		const suggestions = results["aysämok"].map(a => "<b>" + a + "</b>");
		$results.append(createErrorBlock(_("no-results"), _("did-you-mean") + " " + suggestions.join(', ').replace(/, ([^,]*)$/, " " + _("or") + " $1") + "?"));
	} else {
		$results.append(createErrorBlock(_("no-results"), _("no-results-description-navi")));
	}
}

function getShortTranslation(result) {
	if (result["short_translation"]) {
		return result["short_translation"];
	}

	let translation = getTranslation(result["translations"][0]);
	translation = translation.split(',')[0];
	translation = translation.split(';')[0];
	translation = translation.split(' | ')[0];
	translation = translation.split(' (')[0];

	if (translation.startsWith('(') && translation.endsWith(')')) {
		translation = translation.substring(1, translation.length - 1);
	}

	if (result["type"][0] === "v"
		&& translation.indexOf("to ") === 0) {
		translation = translation.substr(3);
	}

	return translation;
}

function createSentenceBarItem(result) {
	let $item = $('<a/>').addClass('item');
	let $itemContainer = $('<div/>').appendTo($item);
	$('<div/>').addClass('navi')
		.text(result["tìpawm"])
		.appendTo($itemContainer);

	let definitionCount = result["sì'eyng"].length;
	if (definitionCount === 0) {
		$('<div/>').addClass('more')
			.text(_("not-found)"))
			.appendTo($itemContainer);
		return $item;
	}

	for (let i = 0; i < Math.min(2, definitionCount); i++) {
		let $definitionLabel = $('<div/>').addClass('definition')
			.appendTo($itemContainer);
		typeBadge(result["sì'eyng"][i]["type"], true).appendTo($definitionLabel);
		$definitionLabel.append(getShortTranslation(result["sì'eyng"][i]));
	}

	if (definitionCount > 2) {
		$('<div/>').addClass('more')
			.text("(" + (definitionCount - 2) + " " + _("omitted-more") + ")")
			.appendTo($itemContainer);
	}

	return $item;
}

// fìvefyat sar fkol mawfwa saryu pamrel soli tìpawmur
function sngäiTìfwusew() {
	$('.ui.search').search('hide results');
	$results = $('#results');
	$results.empty();
	$sentenceBar = $('#sentence-bar');
	$sentenceBar.hide();
	$sentenceBar.empty();
	const mode = localStorage.getItem('reykunyu-mode');
	if (mode === 'navi') {
		doSearchNavi();
	} else if (mode === 'english') {
		doSearchEnglish();
	} else if (mode === 'analyzer') {
		doSearchAnalyzer();
	} else if (mode === 'annotated') {
		doSearchAnnotated();
	} else if (mode === 'rhymes') {
		doSearchRhymes();
	}
	return false;
}

function doSearchNavi() {
	let tìpawm = $('#search-box').val();
	$.getJSON('/api/fwew', { 'tìpawm': tìpawm })
		.done(function (tìeyng) {
			$results.empty();

			$results.append(createResults(tìeyng[0]));

			// more than one word was found
			if (tìeyng.length > 1) {
				$sentenceBar.show();
			} else {
				$sentenceBar.hide();
			}

			for (let i = 0; i < tìeyng.length; i++) {
				let $item = createSentenceBarItem(tìeyng[i]);
				if (i === 0) {
					$item.addClass("active");
				}
				$sentenceBar.append($item);
				let result = tìeyng[i];
				$item.on("click", function () {
					$("#sentence-bar .item").removeClass("active");
					$item.addClass("active");
					$results.empty();
					$results.append(createResults(result));
				});
			}
		})
		.fail(function () {
			$sentenceBar.empty();
			$results.empty();
			$results.append(createErrorBlock(_('searching-error'), _('searching-error-description')));
		});
}

function doSearchEnglish() {
	let query = $('#search-box').val();
	$.getJSON('/api/search', { 'query': query, 'language': localStorage.getItem('reykunyu-language') })
		.done(function (tìeyng) {
			$results.empty();

			if (tìeyng.length) {
				for (let i = 0; i < tìeyng.length; i++) {
					const result = tìeyng[i];
					$results.append(createResultBlock(i, result));
				}
			} else {
				$results.append(createErrorBlock(_("no-results"), _("no-results-description-english")));
			}
		})
		.fail(function () {
			$sentenceBar.empty();
			$results.empty();
			$results.append(createErrorBlock(_('searching-error'), _('searching-error-description')));
		});
}

function createAnnotatedBlock(definition) {
	let block = $('<div/>')
		.addClass('result')
		.addClass('result-annotated')
		.html(definition);
	return block;
}

function createAnnotatedFooter() {
	let block = $('<div/>')
		.addClass('credits-footer')
		.text('source: An Annotated Na\'vi Dictionary by Stefan G. Müller (Plumps), 2022-01-04');
	return block;
}

function doSearchAnnotated() {
	let query = $('#search-box').val();
	$.getJSON('/api/annotated/search', { 'query': query })
		.done(function (result) {
			$results.empty();

			if (result.length) {
				for (let i = 0; i < result.length; i++) {
					const definition = result[i];
					$results.append(createAnnotatedBlock(definition));
				}
				$results.append(createAnnotatedFooter());
			} else {
				$results.append(createErrorBlock(_("no-results"), _("no-results-description")));
			}
		})
		.fail(function () {
			$sentenceBar.empty();
			$results.empty();
			$results.append(createErrorBlock(_('searching-error'), _('searching-error-description')));
		});
}

function rhymesWithSyllableCountSection(syllableCount, rhymes) {
	let $syllableSection = $('<div/>').addClass('result-item etymology');
	if (syllableCount == 0) {
		$syllableSection.append($('<div/>').addClass('header').text(_('stress-unknown')));
	} else if (syllableCount == 1) {
		$syllableSection.append($('<div/>').addClass('header').text(syllableCount + ' ' + _('syllable')));
	} else {
		$syllableSection.append($('<div/>').addClass('header').text(syllableCount + ' ' + _('syllables')));
	}
	let $body = $('<div/>').addClass('body');
	let $table = $('<table/>');
	for (const stress in rhymes) {
		if (rhymes[stress]) {
			let $row = $('<tr/>');
			if (stress > 0) {
				$row.append($('<td/>').addClass('stressed-cell').html(_('stressed-on') + ' <b>' + stress + '</b>: '));
			}
			let $cell = $('<td/>');
			let needsComma = false;
			for (const word of rhymes[stress]) {
				if (needsComma) {
					$cell.append(', ');
				}
				$cell.append(createWordLink(word));
				needsComma = true;
			}
			$row.append($cell);
			$table.append($row);
		}
	}
	$body.append($table);
	$syllableSection.append($body);
	return $syllableSection;
}

function doSearchRhymes() {
	let tìpawm = $('#search-box').val();
	$.getJSON('/api/rhymes', { 'tìpawm': tìpawm })
		.done(function (response) {
			$results.empty();

			//let $resultWord = $('<div/>').addClass('result-word');

			console.log(response);

			if (response.length === 0) {
				$results.append(createErrorBlock(_("no-results"), _("no-results-description")));
			} else {
				let $result = $('<div/>').addClass('result');
				$results.append($result);
				for (const syllableCount in response) {
					if (syllableCount > 0 && response[syllableCount]) {
						$result.append(rhymesWithSyllableCountSection(syllableCount, response[syllableCount]));
					}
				}
				if (response[0]) {
					$result.append(rhymesWithSyllableCountSection(0, response[0]));
				}
			}
		})
		.fail(function () {
			$sentenceBar.empty();
			$results.empty();
			$results.append(createErrorBlock(_('searching-error'), _('searching-error-description')));
		});
}

function generateSentenceTree(tree, role) {
	let $element = $('<li/>');

	if (role) {
		$element.append($('<span/>')
			.addClass('sentence-tree-role')
			.text(role + ':'));
		$element.append(' ');
	}
	$element.append($('<span/>')
		.addClass('sentence-tree-navi')
		.text(tree['word']));
	if (tree.hasOwnProperty('translation')) {
		$element.append(' ');
		$element.append($('<span/>')
			.addClass('sentence-tree-translation')
			.text('→ "' + tree['translation'] + '"'));
	}

	if (tree.hasOwnProperty('children')) {
		let $subList = $('<ul/>');
		for (let i = 0; i < tree['children'].length; i++) {
			$subList.append(generateSentenceTree(
				tree['children'][i], tree['roles'][i]));
		}
		$element.append($subList);
	}

	return $element;
}

function doSearchAnalyzer() {
	let tìpawm = $('#search-box').val();
	$.getJSON('/api/parse', { 'tìpawm': tìpawm })
		.done(function (response) {
			$sentenceBar.empty();
			$results.empty();
			let $betaNoticeBlock = $('<div/>')
				.addClass('beta-notice-block')
				.html('<b>Note:</b> Reykunyu\'s sentence analyzer is a work in progress. Right now, it is able to analyze very simple sentences only, and may give inaccurate results.')
				.appendTo($results);
			if (response.hasOwnProperty('lexingErrors') && response['lexingErrors'].length) {
				let $lexingErrorsBlock = $('<div/>')
					.addClass('error-block');
				$('<div/>')
					.addClass('header')
					.text('Parse errors found:')
					.appendTo($lexingErrorsBlock);
				let $lexingErrorsBody = $('<div/>')
					.addClass('body')
					.appendTo($lexingErrorsBlock);
				for (let e of response['lexingErrors']) {
					$lexingErrorsBody.append($('<div/>').text(e));
				}
				$results.append($lexingErrorsBlock);
			}
			if (response.hasOwnProperty('results') && response['results'].length) {
				for (let i = 0; i < response['results'].length; i++) {
					const result = response['results'][i];
					if (result['penalty'] > response['results'][0]['penalty']) {
						continue;
					}
					if (i > 0) {
						let $parseWarningsBlock = $('<div/>')
							.addClass('ui horizontal divider')
							.appendTo($results)
							.text('or');
					}
					if (result.hasOwnProperty('errors') && result['errors'].length) {
						let $parseWarningsBlock = $('<div/>')
							.addClass('warning-block');
						$('<div/>')
							.addClass('header')
							.text('Warnings found:')
							.appendTo($parseWarningsBlock);
						let $parseWarningsBody = $('<div/>')
							.addClass('body')
							.appendTo($parseWarningsBlock);
						for (const error of result['errors']) {
							$parseWarningsBody.append($('<div/>').text(error));
						}
						$results.append($parseWarningsBlock);
					}
					let $resultBlock = $('<div/>')
						.addClass('result-block')
						.appendTo($results);
					$('<div/>')
						.addClass('header')
						.text('Sentence structure:')
						.appendTo($resultBlock);
					$resultBlock.append($('<ul/>').append(generateSentenceTree(result['parseTree'])));
					$('<div/>')
						.addClass('header')
						.text('Approximate translation:')
						.appendTo($resultBlock);
					$('<div/>')
						.addClass('body')
						.text('→ "' + result['translation'] + '"')
						.appendTo($resultBlock);
				}
			}
		})
		.fail(function () {
			$sentenceBar.empty();
			$results.empty();
			$results.append(createErrorBlock(_('parsing-error'), _('searching-error-description')));
		});
}

