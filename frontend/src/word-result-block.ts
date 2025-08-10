/// <reference lib="dom" />

import { lemmaForm, addLemmaClass, getTranslation, getShortTranslation, createWordLink, createWordLinkList, appendLinkString } from './lib';

export default class WordResultBlock {

	$element: JQuery;
	dialect: Dialect;
	language: string;

	constructor(r: WordData, index: string, dialect: Dialect, language: string, useIPA: boolean) {
		this.$element = $('<div/>').addClass('result');
		this.dialect = dialect;
		this.language = language;

		const inOfflineMode: boolean = $('body').hasClass('offline');

		const $resultWord = $('<div/>').addClass('result-word');
		$resultWord.append($('<span/>').addClass('id').text(index));

		const $lemma = $('<span/>').addClass('lemma').appendTo($resultWord);
		addLemmaClass($lemma, r['type']);
		$lemma.html(lemmaForm(r, this.dialect));
		$resultWord.append(this.typeBadge(r["type"], true));

		if (r["status"]) {
			$resultWord.append(this.statusBadge(r["status"]));
		}

		if (useIPA) {
			const $pronunciation = this.pronunciationSectionIpa(r["pronunciation"], r["type"], !inOfflineMode);
			if ($pronunciation) {
				$resultWord.append($pronunciation);
			}
		} else {
			const $pronunciation = this.pronunciationSection(r["pronunciation"], r["type"], !inOfflineMode);
			if ($pronunciation) {
				$resultWord.append($pronunciation);
			}
		}

		const loggedIn = $('body').hasClass('logged-in');
		if (loggedIn) {
			$resultWord.append(this.wordToolbar(r));
		}

		if (r['id'] == 2772) {
			$resultWord.on('click', () => {
				if ($('.development-banner').length === 0) {
					$('<div/>').addClass('development-banner colorful').prependTo($('body'));
				}
			});
		}

		$resultWord.appendTo(this.$element);

		if ((r["conjugated"] && r["conjugated"].length > 0) || r['externalLenition']) {
			const $conjugatedBox = this.conjugatedBox(r["conjugated"], r['externalLenition']);
			if ($conjugatedBox) {
				this.$element.append($conjugatedBox);
			}
		}

		if (r["image"] && !inOfflineMode) {
			this.$element.append(this.imageSection(r, r["image"]));
		}

		this.$element.append(this.translationSection(r["translations"]));

		if (r["meaning_note"]) {
			this.$element.append(this.meaningNoteSection(r));
		}

		if (r["status"]) {
			this.$element.append(this.statusNoteSection(r["status"], r["status_note"]));
		}

		if (r["etymology"]) {
			this.$element.append(this.etymologySection(r));
		}

		if (r["derived"]) {
			this.$element.append(this.derivedSection(r));
		}

		if (r["conjugation"]) {
			if (r["type"] === "n" || r["type"] === "pn" || r["type"] === "n:pr" || r["type"] === "ctr") {
				this.$element.append(this.nounConjugationSection(r, <NounConjugation>r["conjugation"][this.dialect], r["conjugation_note"]));
			} else if (r["type"] === "adj") {
				this.$element.append(this.adjectiveConjugationSection(r, <AdjectiveConjugation>r["conjugation"][this.dialect], r["conjugation_note"]));
			}
		}

		if (r["infixes"]) {
			this.$element.append(this.infixesSection(r, r["word_raw"][this.dialect], r["infixes"], r["conjugation_note"]));
		}

		if (r["sentences"] && r["sentences"].length) {
			this.$element.append(this.sentencesSection(r["sentences"], r["word_raw"]["FN"] + ":" + r["type"]));
		}

		if (r["source"] && r["source"].length > 0 && r["source"][0].length > 0 && r["source"][0][0].length > 0) {
			this.$element.append(this.sourceSection(r["source"]));
		}

		if (r["seeAlso"]) {
			this.$element.append(this.seeAlsoSection(r["seeAlso"]));
		}

		if (r['todo'] && $('body').hasClass('logged-in-admin')) {
			this.$element.append(this.todoSection(r['todo']));
		}
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

	// ngop pätsìt a oeyktìng fnelit lì'uä
	// fnel - fnelä tstxo apup (natkenong "n", "v:tr")
	typeBadge(fnel: string, small: boolean): JQuery {
		const abbreviatedType = this.tstxoFnelä(fnel, true);
		const fullType = this.tstxoFnelä(fnel, false);
		let $pätsì = $('<span/>')
			.addClass('type ui tag label type-badge')
			.attr('data-tooltip', fullType)
			.text(abbreviatedType);
		$pätsì.addClass('horizontal');
		$pätsì.removeClass('tag');
		return $pätsì;
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

	// creates a box showing the conjugated form of a word
	conjugatedBox(conjugation: ConjugationStep[] | undefined, externalLenition: ExternalLenition | undefined): JQuery | null {
		let $conjugatedBox = $('<div/>')
			.addClass('result-item conjugated-box');
		let boxIsEmpty = true;

		if (conjugation) {
			for (let i = 0; i < conjugation.length; i++) {
				let $item = $('<div/>')
					.addClass('conjugated-box-item');

				let type = conjugation[i]["type"];
				let c = conjugation[i]["conjugation"];
				if (c["result"].length == 1
					&& c["result"][0].toLowerCase() == c["root"].toLowerCase()
					&& !c.hasOwnProperty("correction")) {
					continue;
				}
				boxIsEmpty = false;

				let $explanation;
				switch (type) {
					case "n":
						$explanation = this.nounConjugationExplanation(<NounConjugationStep>c);
						break;
					case "v":
						$explanation = this.verbConjugationExplanation(<VerbConjugationStep>c);
						break;
					case "adj":
						$explanation = this.adjectiveConjugationExplanation(<AdjectiveConjugationStep>c);
						break;
					case "v_to_n":
						$explanation = this.verbToNounConjugationExplanation(<NounConjugationStep>c);
						break;
					case "v_to_adj":
						$explanation = this.verbToAdjectiveConjugationExplanation(<NounConjugationStep>c);
						break;
					case "v_to_part":
						$explanation = this.verbToParticipleConjugationExplanation(<NounConjugationStep>c);
						break;
					case "adj_to_adv":
						$explanation = this.adjectiveToAdverbConjugationExplanation(<NounConjugationStep>c);
						break;
					case "gerund":
						$explanation = this.gerundConjugationExplanation(<OtherConjugationStep>c);
						break;
				}
				if (this.language == "en" && conjugation[i].hasOwnProperty('translation')) {
					$explanation.append($('<span/>')
						.addClass('operator')
						.html('&rarr;'));
					$explanation.append($('<span/>')
						.addClass('translation')
						.html('&ldquo;' + conjugation[i]['translation'] + '&rdquo;'));
				}
				$item.append($explanation);

				if (conjugation[i]["affixes"] && conjugation[i]["affixes"]!.length) {
					$item.append(this.affixesSection(conjugation[i]["affixes"]!));
				}

				$conjugatedBox.append($item);
			}
		}

		if (externalLenition) {
			let $item = $('<div/>')
				.addClass('conjugated-box-item');
			boxIsEmpty = false;

			let $conjugation = $('<div/>').addClass('conjugation-explanation');

			$('<span/>').addClass('word').text(externalLenition['by']).appendTo($conjugation);
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
			$('<span/>').addClass('word').text(externalLenition['from']).appendTo($conjugation);
			$('<span/>').addClass('operator').text('=').appendTo($conjugation);
			$('<span/>').addClass('word').text(externalLenition['by'] + ' ' + externalLenition['to']).appendTo($conjugation);

			$item.append($conjugation);
			$conjugatedBox.append($item);
		}

		if (boxIsEmpty) {
			return null;
		}
		return $conjugatedBox;
	}

	nounConjugationExplanation(conjugation: NounConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

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
		if (conjugation["correction"]) {
			$('<span/>').addClass('correction').text(conjugation["correction"]).appendTo($conjugation);
		}
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);

		return $conjugation;
	}

	verbConjugationExplanation(conjugation: VerbConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

		$('<span/>').text(conjugation["root"]).appendTo($conjugation);

		for (let i = 0; i < 3; i++) {
			if (conjugation["infixes"][i]) {
				$('<span/>').addClass('operator').text('+').appendTo($conjugation);
				$('<span/>').addClass('infix').html("&#x2039;" + conjugation["infixes"][i] + "&#x203a;").appendTo($conjugation);
			}
		}

		$('<span/>').addClass('operator').text('=').appendTo($conjugation);
		if (conjugation["correction"]) {
			$('<span/>').addClass('correction').text(conjugation["correction"]).appendTo($conjugation);
		}
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);

		return $conjugation;
	}

	adjectiveConjugationExplanation(conjugation: AdjectiveConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

		if (conjugation["form"] === "postnoun") {
			$('<span/>').addClass('prefix').html("a").appendTo($conjugation);
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
		}

		$('<span/>').text(conjugation["root"]).appendTo($conjugation);

		if (conjugation["form"] === "prenoun") {
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
			$('<span/>').addClass('suffix').html("a").appendTo($conjugation);
		}

		$('<span/>').addClass('operator').text('=').appendTo($conjugation);
		if (conjugation["correction"]) {
			$('<span/>').addClass('correction').text(conjugation["correction"]).appendTo($conjugation);
		}
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);

		return $conjugation;
	}

	verbToNounConjugationExplanation(conjugation: NounConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

		$('<span/>').text(conjugation["root"]).appendTo($conjugation);

		$('<span/>').addClass('operator').text('+').appendTo($conjugation);
		$('<span/>').addClass('suffix').text(conjugation["affixes"][0]).appendTo($conjugation);

		$('<span/>').addClass('operator').text('=').appendTo($conjugation);
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);
		this.typeBadge('n', true).appendTo($conjugation);

		return $conjugation;
	}

	verbToAdjectiveConjugationExplanation(conjugation: NounConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

		$('<span/>').addClass('prefix').text(conjugation["affixes"][0]).appendTo($conjugation);
		$('<span/>').addClass('operator').text('+').appendTo($conjugation);

		$('<span/>').text(conjugation["root"]).appendTo($conjugation);

		$('<span/>').addClass('operator').text('=').appendTo($conjugation);
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);
		this.typeBadge('adj', true).appendTo($conjugation);

		return $conjugation;
	}

	verbToParticipleConjugationExplanation(conjugation: NounConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

		$('<span/>').text(conjugation["root"]).appendTo($conjugation);

		$('<span/>').addClass('operator').text('+').appendTo($conjugation);
		$('<span/>').addClass('infix').html("&#x2039;" + conjugation["affixes"][0] + "&#x203a;").appendTo($conjugation);

		$('<span/>').addClass('operator').text('=').appendTo($conjugation);
		if (conjugation["correction"]) {
			$('<span/>').addClass('correction').text(conjugation["correction"]).appendTo($conjugation);
		}
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);
		this.typeBadge('adj', true).appendTo($conjugation);

		return $conjugation;
	}

	adjectiveToAdverbConjugationExplanation(conjugation: NounConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

		$('<span/>').addClass('prefix').text(conjugation["affixes"][0]).appendTo($conjugation);
		$('<span/>').addClass('operator').text('+').appendTo($conjugation);

		$('<span/>').text(conjugation["root"]).appendTo($conjugation);

		$('<span/>').addClass('operator').text('=').appendTo($conjugation);
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);
		this.typeBadge('adv', true).appendTo($conjugation);

		return $conjugation;
	}

	gerundConjugationExplanation(conjugation: OtherConjugationStep): JQuery {
		let $conjugation = $('<div/>').addClass('conjugation-explanation');

		$('<span/>').addClass('prefix').text('tì').appendTo($conjugation);
		$('<span/>').addClass('operator').text('+').appendTo($conjugation);

		$('<span/>').text(conjugation["root"]).appendTo($conjugation);

		$('<span/>').addClass('operator').text('+').appendTo($conjugation);
		$('<span/>').addClass('infix').html("&#x2039;us&#x203a;").appendTo($conjugation);

		$('<span/>').addClass('operator').text('=').appendTo($conjugation);
		$('<span/>').addClass('word').text(conjugation["result"].join(' / ')).appendTo($conjugation);
		this.typeBadge('n', true).appendTo($conjugation);

		return $conjugation;
	}

	imageSection(word: WordData, image: string): JQuery {
		let $section = $('<div/>').addClass('definition-image');
		$('<img/>').attr('src', '/ayrel/' + image)
			.appendTo($section);
		$('<div/>').addClass('credit')
			.html(lemmaForm(word, this.dialect) + ' ' + _('image-drawn-by') + ' Eana Unil')
			.appendTo($section);
		return $section;
	}

	translationSection(sìralpeng: Translated<string>[]): JQuery {
		let $section = $('<div/>').addClass('result-item definition');
		if (sìralpeng.length === 1) {
			$section.text(getTranslation(sìralpeng[0], this.language));
		} else {
			let $list = $('<ol/>').addClass('meaning-list').appendTo($section);
			for (let i = 0; i < sìralpeng.length; i++) {
				$('<li/>').text(getTranslation(sìralpeng[i], this.language)).appendTo($list);
			}
		}
		return $section;
	}

	// ngop tìoeyktìngit lì'upamä lì'uä
	// lìupam[0] - aylì'kong lì'uä, fa pamrel a'aw (natkenong "lì-u-pam")
	// lìupam[1] - holpxay lì'kongä a takuk lì'upam tsatseng ('awvea lì'kong: 1, muvea lì'kong: 2, saylahe)
	// fnel - fnel lì'uä (kin taluna txo fnel livu "n:si", tsakrr zene sivung lì'ut alu " si")
	pronunciationSection(lìupam: Pronunciation[] | undefined, fnel: string, includeAudio: boolean): JQuery | null {
		if (!lìupam || lìupam.length === 0) {
			return null;
		}

		let $tìlam = $('<span/>').addClass('stress');
		$tìlam.append("(");
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
			if (lìupam[i].hasOwnProperty('audio') && includeAudio) {
				$tìlam.append(this.pronunciationAudioButtons(lìupam[i]['audio']));
			}
		}

		$tìlam.append(")");

		return $tìlam;
	}

	pronunciationSectionIpa(pronunciation: Pronunciation[] | undefined, fnel: string, includeAudio: boolean): JQuery | null {
		if (!pronunciation || pronunciation.length === 0) {
			return null;
		}

		let $result = $('<span/>').addClass('stress');
		for (let i = 0; i < pronunciation.length; i++) {
			if (i > 0) {
				$result.append(' ' + _('or') + ' ');
			}
			const ipa = pronunciation[i]['ipa'];
			const dialect = this.dialect;
			if (dialect === 'combined' && ipa['FN'] !== ipa['RN']) {
				$result.append($('<span/>').text('FN').attr('data-tooltip', 'Forest Na’vi'));
				$result.append(' ');
				$result.append($('<span/>').text(ipa['FN']).addClass('ipa'));
				if (pronunciation[i].hasOwnProperty('audio') && includeAudio) {
					$result.append(this.pronunciationAudioButtons(pronunciation[i]['audio']));
				}
				$result.append(' / ');
				$result.append($('<span/>').text('RN').attr('data-tooltip', 'Reef Na’vi'));
				$result.append(' ');
				$result.append($('<span/>').text(ipa['RN']).addClass('ipa'));

			} else if (dialect === 'combined') {
				$result.append($('<span/>').text(ipa['FN']).addClass('ipa'));
				if (pronunciation[i].hasOwnProperty('audio') && includeAudio) {
					$result.append(this.pronunciationAudioButtons(pronunciation[i]['audio']));
				}

			} else {
				$result.append($('<span/>').text(ipa[dialect]).addClass('ipa'));
				if (ipa[dialect] === ipa['FN'] && pronunciation[i].hasOwnProperty('audio') && includeAudio) {
					$result.append(this.pronunciationAudioButtons(pronunciation[i]['audio']));
				}
			}
		}

		return $result;
	}

	pronunciationAudioButtons(audioData: PronunciationAudio[]): JQuery {
		let $buttons = $('<div/>')
			.addClass('ui icon compact mini basic buttons pronunciation-audio-buttons');
		for (let audio of audioData) {
			let $button = $('<a/>')
				.addClass('ui button pronunciation-audio-button')
				.attr('data-tooltip', _('speaker') + ' ' + audio['speaker']);
			$('<i/>').addClass('play icon').appendTo($button);
			let clip: HTMLAudioElement | null = null;
			$button.on('click', () => {
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

	wordToolbar(word: WordData): JQuery {
		const $toolbar = $('<div/>').addClass('ui icon compact mini basic buttons word-toolbar');

		// favorite button
		const $favoriteButton = $('<div/>')
			.addClass('ui button favorite-button')
			.attr('data-tooltip', _('mark-as-favorite'))
			.appendTo($toolbar)
			.on('click', () => {
				if ($favoriteButton.hasClass('active')) {
					$.post('/api/user/unmark-favorite', { 'vocab': word.id }, () => {
						$favoriteButton.removeClass('active');
					});
				} else {
					$.post('/api/user/mark-favorite', { 'vocab': word.id }, () => {
						$favoriteButton.addClass('active');
					});
				}
			});
		if (word.favorite) {
			$favoriteButton.addClass('active');
		}
		$('<i/>').addClass('star icon').appendTo($favoriteButton);

		// edit button
		if ($('body').hasClass('logged-in-admin')) {
			const $editButton = $('<a/>')
				.addClass('ui button')
				.attr('data-tooltip', _('edit'))
				.appendTo($toolbar);
			const url = "/edit?word=" + word.id;
			$editButton.attr('href', url);
			$('<i/>').addClass('pencil icon').appendTo($editButton);
		}

		return $toolbar;
	}

	statusNoteSection(wordStatus: string, statusNote?: string): JQuery {
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

	meaningNoteSection(word: WordData) {
		let $noteSection = $('<div/>').addClass('result-item note');
		appendLinkString(getTranslation(word['meaning_note']!, this.language), word, $noteSection, this.dialect, this.language);
		return $noteSection;
	}

	affixesSection(affixes: AffixData[]) {
		let $affixes = $('<div/>').addClass('affixes');

		let $table = $('<table/>').appendTo($affixes);
		$('<tr/>')
			.append($('<th/>').attr('colspan', 2).text('Affix'))
			.append($('<th/>').text('Meaning'))
			.appendTo($table);
		for (let a of affixes) {
			const affix = a['affix'];
			let $tr = $('<tr/>').appendTo($table);
			if (a.hasOwnProperty('combinedFrom')) {
				let $affixSpan = $('<span/>')
					.html(lemmaForm(<WordData>{
						'word': { 'FN': <string>affix, 'combined': <string>affix, 'RN': <string>affix }, 'type': 'aff:in'
					}, this.dialect));
				addLemmaClass($affixSpan, 'aff:in');
				$('<td/>')
					.append($affixSpan)
					.append(this.typeBadge('aff:in', true))
					.appendTo($tr);
				let $componentsCell = $('<td/>').appendTo($tr);
				let $meaningCell = $('<td/>').appendTo($tr);
				let first = true;
				for (const c of (<CombinedAffixData>a)['combinedFrom']) {
					if (first) {
						$componentsCell.append('= ');
						first = false;
					} else {
						$componentsCell.append(' + ');
						$meaningCell.append(' + ');
					}
					let $affixLink = $('<a/>')
						.addClass('word-link')
						.html(lemmaForm(c['affix'], this.dialect))
						.attr('href', '/?q=' + c['affix']["word_raw"][this.dialect]);
					addLemmaClass($affixLink, c['affix']['type']);
					$componentsCell.append($affixLink);
					$meaningCell.append($('<span/>').text(getTranslation(c['affix']["translations"][0], this.language)));
				}
			} else {
				let $affixLink = $('<a/>')
					.addClass('word-link')
					.html(lemmaForm(<WordData>affix, this.dialect))
					//.addClass(a['type'])
					.attr('href', '/?q=' + (<WordData>affix)["word_raw"][this.dialect]);
				addLemmaClass($affixLink, (<WordData>affix)['type']);
				$('<td/>').append($affixLink)
					.append(this.typeBadge((<WordData>affix)['type'], true))
					.attr('colspan', 2)
					.appendTo($tr);
				let $meaningCell = $('<td/>').appendTo($tr);
				$meaningCell.append($('<span/>').text(getTranslation((<WordData>affix)["translations"][0], this.language)));
			}
		}

		return $affixes;
	}

	sourceSection(sources: Source[]) {
		let $sourceSection = $('<div/>').addClass('result-item see-also');
		$sourceSection.append($('<div/>').addClass('header').text(_('source')));
		for (let source of sources) {
			let $source = $('<div/>').addClass('body');
			if (source.length < 2 || !source[1] || source[1].length === 0) {
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

	etymologySection(word: WordData) {
		let $etymologySection = $('<div/>').addClass('result-item etymology');
		$etymologySection.append($('<div/>').addClass('header').text(_('etymology')));
		let $etymology = $('<div/>').addClass('body');
		appendLinkString(word['etymology']!, word, $etymology, this.dialect, this.language);
		$etymologySection.append($etymology);
		return $etymologySection;
	}

	derivedSection(word: WordData) {
		let $derivedSection = $('<div/>').addClass('result-item derived');
		$derivedSection.append($('<div/>').addClass('header').text(_('derived')));
		$derivedSection.append(createWordLinkList(word['derived']!, this.dialect, this.language).addClass('body'));
		return $derivedSection;
	}

	seeAlsoSection(seeAlso: WordData[]) {
		let $seeAlsoSection = $('<div/>').addClass('result-item see-also');
		$seeAlsoSection.append($('<div/>').addClass('header').text(_('see-also')));
		$seeAlsoSection.append(createWordLinkList(seeAlso, this.dialect, this.language).addClass('body'));
		return $seeAlsoSection;
	}

	todoSection(todo: string) {
		let $todoSection = $('<div/>').addClass('result-item warning-block todo');
		$('<b/>').text('To do: ').appendTo($todoSection);
		$('<span/>').text(todo).appendTo($todoSection);
		$('<p/>').addClass("block-postscript").text(_('only-for-admins')).appendTo($todoSection);
		return $todoSection;
	}

	// ngop hapxìt a wìntxu fya'ot a leykatem tstxolì'uti
	nounConjugationSection(word: WordData, conjugation: NounConjugation, note?: Translated<LinkString>) {
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

				let formatted = this.nounConjugationString(c);
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
			let formatted = this.nounConjugationString(c);
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
			let formatted = this.nounConjugationString(c);
			if (i > 1) {
				hideString += ", ";
			}
			hideString += formatted;
		}
		$headerHide.append(hideString);

		if (note) {
			const $note = $('<div/>').addClass("conjugation-note");
			appendLinkString(getTranslation(note, this.language), word, $note, this.dialect, this.language);
			$body.append($note);
		}

		return $section;
	}

	nounConjugationString(conjugationString: string): string {
		let formatted = "";
		const c = conjugationString.split(";");
		for (let k = 0; k < c.length; k++) {
			if (k > 0) {
				formatted += " <span class='muted'>" + _('or') + "</span> ";
			}

			let m = c[k].match(/(.*-\)?)(.*)(-.*)/);

			if (m) {
				if (m[1] !== "-") {
					formatted += "<span class='prefix'>" + m[1] + "</span>";
				}
				formatted += m[2].replace(/\{([^}]*)\}/g, "<span class='lenition'>$1</span>");
				if (m[3] !== "-") {
					formatted += "<span class='suffix'>" + m[3] + "</span>";
				}
			} else {
				formatted += c[k];
			}
		}
		return formatted;
	}

	// ngop hapxìt a wìntxu fya'ot a leykatem syonlì'uti
	adjectiveConjugationSection(word: WordData, conjugation: AdjectiveConjugation, note?: Translated<LinkString>): JQuery {
		let $section = $('<div/>').addClass('result-item conjugation');
		let $header = $('<div/>').addClass('header').text(_('attributive-forms')).appendTo($section);
		let $body = $('<div/>').addClass('body').appendTo($section);

		let html = '';
		if (conjugation['prefixed']) {
			html = "&lt;" + _('type-n') + "&gt; " + this.nounConjugationString(conjugation["prefixed"]);
		}
		if (conjugation['prefixed'] && conjugation['suffixed']) {
			html += "&nbsp;&nbsp;<span class='muted'>" + _('or') + "</span>&nbsp;&nbsp;";
		}
		if (conjugation['suffixed']) {
			html += this.nounConjugationString(conjugation["suffixed"]) + " &lt;" + _('type-n') + "&gt;";
		}
		$body.html(html);

		if (note) {
			const $note = $('<div/>').addClass("conjugation-note");
			appendLinkString(getTranslation(note, this.language), word, $note, this.dialect, this.language);
			$body.append($note);
		}

		return $section;
	}

	// ngop hapxìt a wìntxu hemlì'uvit
	infixesSection(word: WordData, navi: string, infixes: string, note?: Translated<LinkString>): JQuery {
		let $section = $('<div/>').addClass('result-item conjugation');
		$('<div/>').addClass('header').text(_('infix-positions')).appendTo($section);
		let $body = $('<div/>').addClass('body').appendTo($section);
		let infixesHtml = infixes.replace(".", "<span class='root-infix'>·</span>");
		infixesHtml = infixesHtml.replace(".", "<span class='root-infix'>·</span>");
		$body.html(infixesHtml + '&nbsp;&nbsp;');
		let $infixDetailsButton = $('<a/>')
			.addClass('ui icon compact mini basic button')
			.attr('data-tooltip', _('infix-viewer'))
			.html('<i class="icon th list"></i>');
		const self = this;
		$infixDetailsButton.on("click", () => {
			$('#infix-details-modal').modal("show");
			$('#infix-details-word').text(navi);
			$('#infix-details-input').text(navi);
			$('#infix-details-infixes').text(infixes);
			$('.infix-button').off('click');
			$('.infix-button').on('click', (e) => {
				$(e.target).closest('.infix-button').addClass('active').siblings().removeClass('active');
				self.updateInfixDisabledButtons();
				self.updateInfixResults();
			});
			self.updateInfixDisabledButtons();
			self.updateInfixResults();
		});
		$body.append($infixDetailsButton);
		if (note) {
			const $note = $('<div/>').addClass("conjugation-note");
			appendLinkString(getTranslation(note, this.language), word, $note, this.dialect, this.language);
			$body.append($note);
		}
		return $section;
	}

	updateInfixDisabledButtons() {

		const disableAndReplaceBy = ($toDisable: JQuery, $toReplaceBy: JQuery) => {
			$toDisable.addClass('disabled')
			if ($toDisable.hasClass('active')) {
				$toDisable.removeClass('active');
				$toReplaceBy.addClass('active');
			}
		};

		const enable = ($toEnable: JQuery) => {
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

	updateInfixResults(): void {
		// finds and returns the pre-first infix
		function prefirstInfix(): string {
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
		function firstInfix(): string {
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
					return 'imv';
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

			return '';
		}

		// finds and returns the second infix
		function secondInfix(): string {
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
			.done((result: string) => {
				$('#infix-details-result').html(self.verbConjugationString(result));
			});
	}

	verbConjugationString(c: string): string {
		let html = '';
		for (let k = 0; k < c.length; k++) {
			if (k > 0) {
				html += "&nbsp;&nbsp;<span class='muted'>" + _('or') + "</span>&nbsp;&nbsp;";
			}
			html += c[k];
		}

		return html;
	}

	createSentence(sentence: Sentence, lemma: string): JQuery {
		let $sentence = $('<div/>').addClass("sentence");
		let $original = $('<div/>').addClass("original").appendTo($sentence);
		let $translation = $('<div/>').addClass("translation").appendTo($sentence);

		let translationHighlights: number[] = [];
		const translation = getTranslation(sentence['translations'], this.language);

		for (let i = 0; i < sentence["na'vi"].length; i++) {
			if (i > 0) {
				$original.append(" ");
			}
			if (sentence["na'vi"][i][1].includes(lemma)) {
				if (translation && translation.hasOwnProperty('mapping')) {
					translationHighlights = translationHighlights.concat(translation['mapping'][i]);
				}
				$original.append($("<span/>").addClass("highlight").text(sentence["na'vi"][i][0]));
			} else {
				$original.append(sentence["na'vi"][i][0]);
			}
		}

		for (let i = 0; i < translation['translation'].length; i++) {
			if (i > 0) {
				$translation.append(' ');
			}
			if (translationHighlights.includes(i + 1)) {
				$translation.append($("<span/>").addClass('highlight').text(translation['translation'][i]));
			} else {
				$translation.append(translation['translation'][i]);
			}
		}

		if (sentence["source"]) {
			$translation
				.append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&ndash; ');
			let $source = $('<a/>').addClass("source")
				.attr('href', sentence['source'][1])
				.text(sentence['source'][0])
				.appendTo($translation);
			if (sentence['source'].length >= 3 && sentence['source'][2]) {
				$translation.append(' (' + sentence['source'][2] + ')');
			}
		}

		return $sentence;
	}

	sentencesSection(sentences: Sentence[], lemma: string): JQuery {
		let $section = $('<details/>').addClass('result-item examples');
		let $header = $('<summary/>').addClass('header')
			.text(_('sentence-search') + ' (' + sentences.length + ' '
				+ (sentences.length > 1 ? _('usages-found-plural') : _('usages-found-singular'))
				+ ')')
			.appendTo($section);
		let $body = $('<div/>').addClass('body').appendTo($section);

		for (let i = 0; i < sentences.length; i++) {
			$body.append(this.createSentence(sentences[i], lemma));
		}

		return $section;
	}
}
