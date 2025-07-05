/// <reference lib="dom" />

import { getShortTranslation, createWordLinkList } from './lib';

import WordResultBlock from './word-result-block';

class Reykunyu {

	/// Maintains whether Reykunyu is currently trying to focus the input field
	/// programmatically. This is important for event handling: a manual focus
	/// event should trigger the autocomplete suggestions pane, but a
	/// programmatic one shouldn't.
	searchBoxFocusAutomaticallyTriggered = false;

	constructor() {
		// initialize UI elements
		$('.ui.dropdown').dropdown();

		// language dropdown
		$('#language-dropdown').dropdown({
			onChange: (value) => {
				setNewLanguage(value);
				this.setUpAutocomplete();
				this.sngäiTìfwusew(false);
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
				this.setUpAutocomplete();
				this.sngäiTìfwusew(false);
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
		// casting to <any> because for some reason the TS typings don't define
		// searchOnFocus
		$('.ui.search').search(<any>{
			apiSettings: {
				url: url
			},
			maxResults: 0,
			searchDelay: 0,
			searchOnFocus: false,
			selector: {
				'prompt': '#search-box'
			},
			showNoResults: false,
			onSelect: (result: any) => {
				$('#search-box').val(result['title'].replace(/\<[^\>]*\>/g, ''));
				this.sngäiTìfwusew();
				return false;
			}
		});
		$('#search-box').off('focus');
		$('#search-box').on('focus', () => {
			if (!this.searchBoxFocusAutomaticallyTriggered) {
				$('.ui.search').search('query');
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
				let resultBlock = new WordResultBlock(
					results["sì'eyng"][i], (i + 1) + '.', this.getDialect(), this.getLanguage(), this.getIPASetting());
				$block.append(resultBlock.$element);
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
		this.searchBoxFocusAutomaticallyTriggered = true;
		$('#search-box').trigger('select');
		this.searchBoxFocusAutomaticallyTriggered = false;
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
						let resultBlock = new WordResultBlock(
							result, (i + 1) + '.', this.getDialect(), this.getLanguage(), this.getIPASetting());
						$toNaviResult.append(resultBlock.$element);
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
				let $cell = $('<td/>').append(createWordLinkList(rhymes[stress], this.getDialect(), this.getLanguage()));
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
