/// <reference lib="dom" />

import { lemmaForm, addLemmaClass, getTranslation, getShortTranslation, createWordLink, appendLinkString } from './lib';

class Reykunyu {

	constructor() {
		// initialize UI elements
		$('.ui.dropdown').dropdown();

		// language dropdown
		$('#language-dropdown').dropdown({
			onChange: (value) => {
				setNewLanguage(value);
				this.sngäiTìfwusew(false);
				this.setUpAutocomplete();
				return false;
			}
		});

		// mode dropdown
		if (localStorage.getItem('reykunyu-mode')) {
			$('#mode-direction').dropdown('set selected',
				localStorage.getItem('reykunyu-mode'));
		} else {
			localStorage.setItem('reykunyu-mode', 'reykunyu');
			$('#mode-direction').dropdown('set selected', 'reykunyu');
		}
		$('#mode-direction').dropdown({
			onChange: (value) => {
				localStorage.setItem('reykunyu-mode', value);
				this.sngäiTìfwusew(false);
				this.setUpAutocomplete();
				return false;
			}
		});

		// IPA setting
		if (!localStorage.getItem('reykunyu-ipa')) {
			localStorage.setItem('reykunyu-ipa', 'false');
		}

		$('.ui.checkbox').checkbox();
		$('#infix-details-modal').modal();
		$('#infix-details-modal button').popup();

		$('#login-modal').modal();
		$('#login-button').on("click", () => {
			$('.login-error-message').remove();
			$('#login-modal')
				.modal("show");
		});
		if ($('.login-error-message').length > 0) {
			$('#login-modal')
				.modal('setting', 'duration', 0)
				.modal('show')
				.modal('setting', 'duration', 400);
		}

		$('#settings-modal').modal({
			onApprove: () => {
				this.setUpAutocomplete();
				this.sngäiTìfwusew(true);
				localStorage.setItem('reykunyu-ipa',
					$('#ipa-checkbox').prop('checked') ? '1' : '0');
				localStorage.setItem('reykunyu-dialect', this.getDialect());
			},
		});
		$('#settings-modal button').popup();

		$('#ipa-checkbox').prop('checked',
			localStorage.getItem('reykunyu-ipa') === '1');
		const dialect = localStorage.getItem('reykunyu-dialect');
		$('#dialect-fn-radiobutton').prop('checked', dialect !== 'combined' && dialect !== 'RN');
		$('#dialect-both-radiobutton').prop('checked', dialect === 'combined');
		$('#dialect-rn-radiobutton').prop('checked', dialect === 'RN');
		$('#dialect-rn-warning').toggle(dialect === 'RN');
		$('#settings-button').on("click", () => {
			$('#settings-modal').modal("show");
		});

		// TODO temporary: show the RN warning iff RN is selected
		$('#settings-modal .ui.radio.checkbox').on('click', () => {
			$('#dialect-rn-warning').toggle($('#dialect-rn-radiobutton').prop('checked'));
		});

		// offline mode settings

		// If there already is a service worker, show the remove instead of the
		// download button.
		if ('serviceWorker' in navigator) {
			if (navigator.serviceWorker.controller) {
				$('#offline-mode-download-button').addClass('disabled');
				$('#offline-mode-progress').text('').hide();
				$('#offline-mode-remove-button').show();
			}
		}

		// When the download button is clicked, install the service worker.
		$('#offline-mode-download-button').on('click', async () => {
			$('#offline-mode-download-button').addClass('disabled');
			$('#offline-mode-progress')
				.text(_('settings-offline-mode-downloading'))
				.show();

			if (!('serviceWorker' in navigator)) {
				$('#offline-mode-progress')
					.text(_('settings-offline-mode-error-browser-support-missing'));
				return;
			}

			try {
				await navigator.serviceWorker.register('/js/sw.js', {
					'scope': '/',
					'type': 'module'
				});

				// When the service worker is ready, show the remove instead of
				// the download button.
				navigator.serviceWorker.ready.then(() => {
					$('#offline-mode-download-button').addClass('disabled');
					$('#offline-mode-progress').text('').hide();
					$('#offline-mode-remove-button').show();
				});

			} catch (e) {
				$('#offline-mode-progress')
					.text(_('settings-offline-mode-error-while-installing'));
				console.error(e);
				return;
			}
		});

		// When the remove button is clicked, just uninstall all service
		// workers.
		$('#offline-mode-remove-button').on('click', async () => {
			const registrations = await navigator.serviceWorker.getRegistrations();
			for (const registration of registrations) {
				registration.unregister();
			}
			$('#offline-mode-download-button').removeClass('disabled');
			$('#offline-mode-remove-button').hide();
		});

		const self: Reykunyu = this;
		$('.infix-button').on('click', (e) => {
			$(e.target).addClass('active').siblings().removeClass('active');
			self.updateInfixDisabledButtons();
			self.updateInfixResults();
		});

		$('html').on('click', 'a.word-link', (e) => {
			const href = $(e.currentTarget).attr('href');
			if (!href) {
				return;
			}
			if (href.startsWith('/?q=')) {
				const q = href.substring(4);
				$('#search-box').val(q);
				if (this.getMode() === 'rhymes') {
					$('#mode-direction').dropdown('set selected', 'reykunyu');
				}
				this.sngäiTìfwusew(false);
				e.preventDefault();
			}
		});

		window.addEventListener("popstate", (event) => {
			$('#search-box').val(event.state['query']);
			this.sngäiTìfwusew(true);
		});

		// if there's already something in the search field, then just start a
		// search immediately
		if ((<string>$('#search-box').val()).length) {
			this.sngäiTìfwusew(true);
		}

		$('#search-form').on('submit', () => { this.sngäiTìfwusew(false); return false; });

		this.setUpAutocomplete();
	}

	getMode(): string {
		return $('#mode-direction').dropdown('get value');
	}

	getLanguage(): string {
		return $('#language-dropdown').dropdown('get value');
	}

	getDialect(): Dialect {
		if ($('#dialect-fn-radiobutton').is(':checked')) {
			return 'FN';
		} else if ($('#dialect-rn-radiobutton').is(':checked')) {
			return 'RN';
		} else {
			return 'combined';
		}
	}

	getIPASetting() {
		return $('#ipa-checkbox').is(':checked');
	}

	setUpAutocomplete() {
		let url: string | null = null;
		$('.ui.search').search('clear cache');
		if (this.getMode() === 'reykunyu') {
			url = 'api/mok?language=' + this.getLanguage() + '&tìpawm={query}&dialect=' + this.getDialect();
		} else if (this.getMode() === 'rhymes') {
			url = 'api/mok?language=' + this.getLanguage() + '&tìpawm={query}&dialect=' + this.getDialect();
		} else if (this.getMode() === 'annotated') {
			url = 'api/annotated/suggest?' + '&query={query}';
		} else {
			url = 'api/suggest?language=' + this.getLanguage() + '&query={query}';
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
			onSelect: (result) => {
				$('#search-box').val(result['title'].replace(/\<[^\>]*\>/g, ''));
				this.sngäiTìfwusew();
				return false;
			}
		});
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
	conjugatedBox(conjugation: ConjugationStep[]): JQuery | null {
		let $conjugatedBox = $('<div/>')
			.addClass('result-item conjugated-box');
		let boxIsEmpty = true;

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
			if (this.getLanguage() == "en" && conjugation[i].hasOwnProperty('translation')) {
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
			.html(lemmaForm(word, this.getDialect()) + ' ' + _('image-drawn-by') + ' Eana Unil')
			.appendTo($section);
		return $section;
	}

	translationSection(sìralpeng: Translated<string>[]): JQuery {
		let $section = $('<div/>').addClass('result-item definition');
		if (sìralpeng.length === 1) {
			$section.text(getTranslation(sìralpeng[0], this.getLanguage()));
		} else {
			let $list = $('<ol/>').addClass('meaning-list').appendTo($section);
			for (let i = 0; i < sìralpeng.length; i++) {
				$('<li/>').text(getTranslation(sìralpeng[i], this.getLanguage())).appendTo($list);
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
			const dialect = this.getDialect();
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

	pronunciationAudioButtons(audioData: AudioData[]): JQuery {
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

	noteSection(note: LinkString) {
		let $noteSection = $('<div/>').addClass('result-item note');
		appendLinkString(note, $noteSection, this.getDialect(), this.getLanguage());
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
					}, this.getDialect()));
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
						.html(lemmaForm(c['affix'], this.getDialect()))
						.attr('href', '/?q=' + c['affix']["word_raw"][this.getDialect()]);
					addLemmaClass($affixLink, c['affix']['type']);
					$componentsCell.append($affixLink);
					$meaningCell.append($('<span/>').text(getTranslation(c['affix']["translations"][0], this.getLanguage())));
				}
			} else {
				let $affixLink = $('<a/>')
					.addClass('word-link')
					.html(lemmaForm(<WordData>affix, this.getDialect()))
					//.addClass(a['type'])
					.attr('href', '/?q=' + (<WordData>affix)["word_raw"][this.getDialect()]);
				addLemmaClass($affixLink, (<WordData>affix)['type']);
				$('<td/>').append($affixLink)
					.append(this.typeBadge((<WordData>affix)['type'], true))
					.attr('colspan', 2)
					.appendTo($tr);
				let $meaningCell = $('<td/>').appendTo($tr);
				$meaningCell.append($('<span/>').text(getTranslation((<WordData>affix)["translations"][0], this.getLanguage())));
			}
		}

		return $affixes;
	}

	sourceSection(sources: Source) {
		let $sourceSection = $('<div/>').addClass('result-item see-also');
		$sourceSection.append($('<div/>').addClass('header').text(_('source')));
		for (let source of sources) {
			let $source = $('<div/>').addClass('body');
			if (source.length === 1 || source[1].length === 0) {
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

	etymologySection(etymology: LinkString) {
		let $etymologySection = $('<div/>').addClass('result-item etymology');
		$etymologySection.append($('<div/>').addClass('header').text(_('etymology')));
		let $etymology = $('<div/>').addClass('body');
		appendLinkString(etymology, $etymology, this.getDialect(), this.getLanguage());
		$etymologySection.append($etymology);
		return $etymologySection;
	}

	derivedSection(derived: WordData[]) {
		let $derivedSection = $('<div/>').addClass('result-item derived');
		$derivedSection.append($('<div/>').addClass('header').text(_('derived')));
		$derivedSection.append(this.createWordLinkList(derived).addClass('body'));
		return $derivedSection;
	}

	seeAlsoSection(seeAlso: WordData[]) {
		let $seeAlsoSection = $('<div/>').addClass('result-item see-also');
		$seeAlsoSection.append($('<div/>').addClass('header').text(_('see-also')));
		$seeAlsoSection.append(this.createWordLinkList(seeAlso).addClass('body'));
		return $seeAlsoSection;
	}

	createWordLinkList(derived: WordData[]) {
		let $list = $('<div/>');
		let first = true;
		for (let word of derived) {
			if (!first) {
				$list.append(' ');
			}
			$list.append(createWordLink(word, this.getDialect(), this.getLanguage()));
			first = false;
		}
		return $list;
	}

	// ngop hapxìt a wìntxu fya'ot a leykatem tstxolì'uti
	nounConjugationSection(conjugation: NounConjugation, note?: LinkString) {
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
			appendLinkString(note, $note, this.getDialect(), this.getLanguage());
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
	adjectiveConjugationSection(conjugation: AdjectiveConjugation, note?: LinkString): JQuery {
		let $section = $('<div/>').addClass('result-item conjugation');
		let $header = $('<div/>').addClass('header').text(_('attributive-forms')).appendTo($section);
		let $body = $('<div/>').addClass('body').appendTo($section);

		let html = "&lt;" + _('type-n') + "&gt; " + this.nounConjugationString(conjugation["prefixed"]);
		html += "&nbsp;&nbsp;<span class='muted'>" + _('or') + "</span>&nbsp;&nbsp;";
		html += this.nounConjugationString(conjugation["suffixed"]) + " &lt;" + _('type-n') + "&gt;";
		$body.html(html);

		if (note) {
			const $note = $('<div/>').addClass("conjugation-note");
			appendLinkString(note, $note, this.getDialect(), this.getLanguage());
			$body.append($note);
		}

		return $section;
	}

	// ngop hapxìt a wìntxu hemlì'uvit
	infixesSection(word: string, infixes: string, note?: LinkString): JQuery {
		let $section = $('<div/>').addClass('result-item conjugation');
		let $header = $('<div/>').addClass('header').text(_('infix-positions')).appendTo($section);
		let $body = $('<div/>').addClass('body').appendTo($section);
		let infixesHtml = infixes.replace(".", "<span class='root-infix'>·</span>");
		infixesHtml = infixesHtml.replace(".", "<span class='root-infix'>·</span>");
		$body.html(infixesHtml + '&nbsp;&nbsp;');
		let $infixDetailsButton = $('<button/>')
			.addClass('ui circular basic icon button')
			.html('<i class="icon th list"></i>');
		const self = this;
		$infixDetailsButton.on("click", () => {
			$('#infix-details-modal').modal("show");
			$('#infix-details-word').text(word);
			$('#infix-details-input').text(word);
			$('#infix-details-infixes').text(infixes);
			self.updateInfixDisabledButtons();
			self.updateInfixResults();
		});
		$body.append($infixDetailsButton);
		if (note) {
			const $note = $('<div/>').addClass("conjugation-note");
			appendLinkString(note, $note, this.getDialect(), this.getLanguage());
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
		const translation = getTranslation(sentence['translations'], this.getLanguage());

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

	// creates a block showing a result
	// i -- id of the result, 0-based (to be shown as the number in front of the
	//      result)
	// r -- the result itself
	// query -- the query that the user searched for
	createResultBlock(i: number, r: WordData) {
		const $result = $('<div/>').addClass('result');
		const inOfflineMode: boolean = $('body').hasClass('offline');

		const $resultWord = $('<div/>').addClass('result-word');
		$resultWord.append($('<span/>').addClass('id').text((i + 1) + '.'));

		const $lemma = $('<span/>').addClass('lemma').appendTo($resultWord);
		addLemmaClass($lemma, r['type']);
		$lemma.html(lemmaForm(r, this.getDialect()));
		$resultWord.append(this.typeBadge(r["type"], true));

		if (r["status"]) {
			$resultWord.append(this.statusBadge(r["status"]));
		}

		if (this.getIPASetting()) {
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

		$resultWord.appendTo($result);

		if (r["conjugated"] && r["conjugated"].length > 0) {
			const $conjugatedBox = this.conjugatedBox(r["conjugated"]);
			if ($conjugatedBox) {
				$result.append($conjugatedBox);
			}
		}

		if (r["image"] && !inOfflineMode) {
			$result.append(this.imageSection(r, r["image"]));
		}

		$result.append(this.translationSection(r["translations"]));

		if (r["meaning_note"]) {
			$result.append(this.noteSection(r["meaning_note"]));
		}

		if (r["status"]) {
			$result.append(this.statusNoteSection(r["status"], r["status_note"]));
		}

		if (r["etymology"]) {
			$result.append(this.etymologySection(r["etymology"]));
		}

		if (r["derived"]) {
			$result.append(this.derivedSection(r["derived"]));
		}

		if (r["conjugation"]) {
			if (r["type"] === "n" || r["type"] === "pn" || r["type"] === "n:pr" || r["type"] === "ctr") {
				$result.append(this.nounConjugationSection(<NounConjugation>r["conjugation"][this.getDialect()], r["conjugation_note"]));
			} else if (r["type"] === "adj") {
				$result.append(this.adjectiveConjugationSection(<AdjectiveConjugation>r["conjugation"][this.getDialect()], r["conjugation_note"]));
			}
		}

		if (r["infixes"]) {
			$result.append(this.infixesSection(r["word_raw"][this.getDialect()], r["infixes"], r["conjugation_note"]));
		}

		if (r["sentences"] && r["sentences"].length) {
			$result.append(this.sentencesSection(r["sentences"], r["word_raw"]["FN"] + ":" + r["type"]));
		}

		if (r["source"] && r["source"].length > 0 && r["source"][0].length > 0 && r["source"][0][0].length > 0) {
			$result.append(this.sourceSection(r["source"]));
		}

		if (r["seeAlso"]) {
			$result.append(this.seeAlsoSection(r["seeAlso"]));
		}

		return $result;
	}

	createErrorBlock(text: string, subText: string): JQuery {
		let $error = $('<div/>').addClass('error');
		$('<p/>').addClass('error-text').html(text).appendTo($error);
		$('<p/>').addClass('error-subText').html(subText).appendTo($error);
		$('<img/>').addClass('error-icon').attr("src", "/images/ke'u.svg").appendTo($error);
		return $error;
	}

	createResults(results: FromNaviResultPiece, $block: JQuery): void {
		if (results["sì'eyng"].length) {
			for (let i = 0; i < results["sì'eyng"].length; i++) {
				$block.append(this.createResultBlock(i, results["sì'eyng"][i]));
			}
		} else if (results["aysämok"].length) {
			const suggestions = results["aysämok"].map(a => '<a class="word-link" href="/?q=' + a + '">' + a + '</a>');
			$block.append(this.createErrorBlock(_("no-results"),
				_("did-you-mean") + " " +
				suggestions.join(', ').replace(/, ([^,]*)$/, " " + _("or") + " $1") + "?"));
		} else {
			$block.append(this.createErrorBlock(_("no-results"), _("no-results-description-navi")));
		}
	}


	createSentenceBarItem(result: FromNaviResultPiece): JQuery {
		let $item = $('<a/>').addClass('item');
		let $itemContainer = $('<div/>').appendTo($item);
		$('<div/>').addClass('navi')
			.text(result["tìpawm"])
			.appendTo($itemContainer);

		let definitionCount = result["sì'eyng"].length;
		if (definitionCount === 0) {
			$('<div/>').addClass('more')
				.text(_("not-found"))
				.appendTo($itemContainer);
			return $item;
		}

		for (let i = 0; i < Math.min(2, definitionCount); i++) {
			let $definitionLabel = $('<div/>').addClass('definition')
				.appendTo($itemContainer);
			this.typeBadge((<WordData> result["sì'eyng"][i])["type"], true).appendTo($definitionLabel);
			$definitionLabel.append(getShortTranslation(result["sì'eyng"][i], this.getLanguage()));
		}

		if (definitionCount > 2) {
			$('<div/>').addClass('more')
				.text("(" + (definitionCount - 2) + " " + _("omitted-more") + ")")
				.appendTo($itemContainer);
		}

		return $item;
	}

	// currently selected tab, fromNa'vi or toNa'vi
	mode: string = 'fromNa\'vi';

	// fìvefyat sar fkol mawfwa saryu pamrel soli tìpawmur
	// initial - if true, this is taken to be the first automatic search when the
	//           page loads, hence we should not pushState
	sngäiTìfwusew(initial?: boolean): void {
		$('.ui.search').search('hide results');
		const $results = $('#results');
		$results.empty();
		const $modeTabs = $('#tab-mode-bar');
		$modeTabs.hide();
		const query = $('#search-box').val();

		// TODO temporary easter egg to enable RN mode
		if (query === "lu oe tsùlfätu lì'fyaye wione") {
			const $rnButton = $('#dialect-rn-radiobutton');
			$rnButton.parent().checkbox('set enabled');
		}

		if (initial) {
			history.replaceState({ 'query': query, 'mode': this.getMode() }, '', '/?q=' + query);
		} else {
			history.pushState({ 'query': query, 'mode': this.getMode() }, '', '/?q=' + query);
		}
		if (query === "") {
			document.title = "Reykunyu – Online Na'vi dictionary";
			return;
		}
		document.title = query + " – Reykunyu";
		if (this.getMode() === 'reykunyu') {
			this.doSearchNavi();
		} else if (this.getMode() === 'annotated') {
			this.doSearchAnnotated();
		} else if (this.getMode() === 'rhymes') {
			this.doSearchRhymes();
		} else {
			console.error("Unexpected mode value '" + this.getMode() + "'");
		}
		$('#search-box').trigger('select');
	}

	doSearchNavi(): void {
		const tìpawm = <string>$('#search-box').val();
		const $results = $('#results');
		const $modeTabs = $('#tab-mode-bar');
		$.getJSON('/api/fwew-search', { 'query': tìpawm, 'language': this.getLanguage(), 'dialect': this.getDialect() })
			.done((tìeyng) => {
				this.reloadIfOfflineStatusChanged(tìeyng);
				const fromNaviResult: FromNaviResult = tìeyng['fromNa\'vi'];
				const toNaviResult: ToNaviResult = tìeyng['toNa\'vi'];
				$results.empty();

				// create from-Na'vi results
				let $fromNaviResult = $('<div/>');
				let fromNaviResultCount = 0;
				for (let i = 0; i < fromNaviResult.length; i++) {
					fromNaviResultCount += fromNaviResult[i]["sì'eyng"].length;
				}
				if (fromNaviResult.length > 1) {
					let $sentenceBar = $('<div/>')
						.addClass('ui pointing menu')
						.attr('id', 'sentence-bar')
						.appendTo($fromNaviResult);

					for (let i = 0; i < fromNaviResult.length; i++) {
						const result = fromNaviResult[i];
						let $item = this.createSentenceBarItem(result);
						if (i === 0) {
							$item.addClass("active");
						}
						$sentenceBar.append($item);
						$item.on("click", () => {
							$("#sentence-bar .item").removeClass("active");
							$item.addClass("active");
							$fromNaviResult.find('.result').remove();
							$fromNaviResult.find('.error').remove();
							this.createResults(result, $fromNaviResult);
						});
					}
				}
				this.createResults(fromNaviResult[0], $fromNaviResult);

				// create to-Na'vi results
				let $toNaviResult = $('<div/>');
				if (toNaviResult.length) {
					for (let i = 0; i < toNaviResult.length; i++) {
						const result = toNaviResult[i];
						$toNaviResult.append(this.createResultBlock(i, result));
					}
				} else {
					if (tìpawm.split(' ').length > 1) {
						$toNaviResult.append(this.createErrorBlock(_("no-results"), _("no-results-description-english-only-one")));
					} else {
						$toNaviResult.append(this.createErrorBlock(_("no-results"), _("no-results-description-english")));
					}
				}

				$results.append($fromNaviResult);

				// set up tabs
				if (this.getLanguage() !== "x-navi") {
					$results.append($toNaviResult);
					$modeTabs.empty();
					$modeTabs.show();
					let $fromNaviTab = $('<div/>')
						.addClass('item')
						.html("Na'vi&nbsp;&rarr;&nbsp;" + _('language'))
						.appendTo($modeTabs);
					$fromNaviTab.append($('<div/>')
						.text(fromNaviResultCount)
						.addClass('result-count-tag'));
					if (fromNaviResultCount === 0) {
						$fromNaviTab.addClass('gray');
					}
					$fromNaviTab.on('click', () => {
						this.mode = 'fromNa\'vi';
						$fromNaviTab.addClass('active');
						$toNaviTab.removeClass('active');
						$fromNaviResult.show();
						$toNaviResult.hide();
					});
					let $toNaviTab = $('<div/>')
						.addClass('item')
						.html(_('language') + "&nbsp;&rarr;&nbsp;Na'vi")
						.appendTo($modeTabs);
					$toNaviTab.append($('<div/>')
						.text(toNaviResult.length)
						.addClass('result-count-tag'));
					if (toNaviResult.length === 0) {
						$toNaviTab.addClass('gray');
					}
					$toNaviTab.on('click', () => {
						this.mode = 'toNa\'vi';
						$toNaviTab.addClass('active');
						$fromNaviTab.removeClass('active');
						$toNaviResult.show();
						$fromNaviResult.hide();
					});

					if (this.mode === 'fromNa\'vi' &&
							fromNaviResultCount === 0 && toNaviResult.length > 0) {
						this.mode = 'toNa\'vi';
					} else if (this.mode === 'toNa\'vi' &&
							toNaviResult.length === 0 && fromNaviResultCount > 0) {
						this.mode = 'fromNa\'vi';
					}

					if (this.mode === 'fromNa\'vi') {
						$fromNaviTab.addClass('active');
						$toNaviResult.hide();
					} else {
						$toNaviTab.addClass('active');
						$fromNaviResult.hide();
					}
				}
			})
			.fail(() => {
				$results.empty();
				$results.append(this.createErrorBlock(_('searching-error'), _('searching-error-description')));
			});
	}

	createAnnotatedBlock(definition: string): JQuery {
		let block = $('<div/>')
			.addClass('result')
			.addClass('result-annotated')
			.html(definition);
		return block;
	}

	createAnnotatedFooter(): JQuery {
		let block = $('<div/>')
			.addClass('credits-footer')
			.text('source: An Annotated Na\'vi Dictionary by Stefan G. Müller (Plumps), 2025-02-03');
		return block;
	}

	doSearchAnnotated(): void {
		const query = <string>$('#search-box').val();
		const $results = $('#results');
		$.getJSON('/api/annotated/search', { 'query': query })
			.done((result) => {
				this.reloadIfOfflineStatusChanged(result);
				$results.empty();

				if (result['results'].length) {
					for (let i = 0; i < result['results'].length; i++) {
						const definition = result['results'][i];
						$results.append(this.createAnnotatedBlock(definition));
					}
					$results.append(this.createAnnotatedFooter());
				} else if (result.hasOwnProperty('offline') && result['offline']) {
					$results.append(this.createErrorBlock(_('offline-unavailable'), _('offline-unavailable-annotated')));
				} else {
					$results.append(this.createErrorBlock(_('no-results'), _('no-results-description-annotated')));
				}
			})
			.fail(() => {
				$results.empty();
				$results.append(this.createErrorBlock(_('searching-error'), _('searching-error-description')));
			});
	}

	rhymesWithSyllableCountSection(syllableCount: number, rhymes: WordData[][]): JQuery {
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
				if (parseInt(stress, 10) > 0) {
					$row.append($('<td/>').addClass('stressed-cell').html(_('stressed-on') + ' <b>' + stress + '</b>: '));
				}
				let $cell = $('<td/>').append(this.createWordLinkList(rhymes[stress]));
				$row.append($cell);
				$table.append($row);
			}
		}
		$body.append($table);
		$syllableSection.append($body);
		return $syllableSection;
	}

	doSearchRhymes(): void {
		const tìpawm = <string>$('#search-box').val();
		const $results = $('#results');
		$.getJSON('/api/rhymes', { 'tìpawm': tìpawm, 'dialect': this.getDialect() })
			.done((response: RhymesResult) => {
				this.reloadIfOfflineStatusChanged(response);
				$results.empty();

				if (response['results'].length === 0) {
					$results.append(this.createErrorBlock(_("no-results"), ''));
				} else {
					let $result = $('<div/>').addClass('result');
					$results.append($result);
					for (const syllableCount in response['results']) {
						if (parseInt(syllableCount, 10) > 0 && response['results'][syllableCount]) {
							$result.append(this.rhymesWithSyllableCountSection(
								parseInt(syllableCount, 10), response['results'][syllableCount]));
						}
					}
					if (response['results'][0]) {
						$result.append(this.rhymesWithSyllableCountSection(0, response['results'][0]));
					}
				}
			})
			.fail(() => {
				$results.empty();
				$results.append(this.createErrorBlock(_('searching-error'), _('searching-error-description')));
			});
	}

	/// Given a response from the server (which contains `offline`: true if it
	/// came from the service worker), and the current offline status of the
	/// page, check if the two are still in sync. If not, reload the page. This
	/// way, we ensure that the “offline mode” label is shown to the user if the
	/// latest search result came from the service worker, and it is not shown
	/// anymore when the internet connection is restored.
	reloadIfOfflineStatusChanged(response: any): void {
		const responseCameFromServiceWorker: boolean = response.hasOwnProperty('offline') && response['offline'];
		const pageWasLoadedInOfflineMode: boolean = $('body').hasClass('offline');

		if (responseCameFromServiceWorker !== pageWasLoadedInOfflineMode) {
			window.location.reload();
		}
	}
}

$(() => {
	new Reykunyu();
});
