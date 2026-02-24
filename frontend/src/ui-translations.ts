type Strings = { [language: string]: { [key: string]: string } };
const strings: Strings = {/* filled out by the server */};

$(function () {
	// initialize the language dropdown
	const $dropdown = $('#language-dropdown');
	if ($dropdown.length) {
		$dropdown.dropdown();
		if (localStorage.getItem('reykunyu-language')) {
			$dropdown.dropdown('set selected',
				localStorage.getItem('reykunyu-language'));
		} else {
			localStorage.setItem('reykunyu-language', 'en');
			$dropdown.dropdown('set selected', 'en');
		}
		$dropdown.dropdown({
			onChange: setNewLanguage
		});
	}

	// If the page was loaded offline from the service worker, or it was loaded
	// from the browser cache after a tab unload, it may not have the correct
	// language. So we immediately trigger a language update, just in case. If
	// the language was already correct, this won't do anything.
	setNewLanguage(localStorage.getItem('reykunyu-language')!);
});

function setNewLanguage(value: string): void {
	localStorage.setItem('reykunyu-language', value);
	document.cookie = 'lang=' + value;  // note that this removes all other cookies (but we don't set any)
	$('.translation').each(function() {
		$(this).html(_($(this).attr('data-key')!));
	});
	$('[data-content-key]').each(function() {
		$(this).attr('data-content', _($(this).attr('data-content-key')!));
	});
}

function getLanguage(): string {
	const languageFromLocalStorage = localStorage.getItem('reykunyu-language');
	if (languageFromLocalStorage) {
		return languageFromLocalStorage;
	} else {
		return 'en';
	}
}

function _(key: string): string {
	const lang = getLanguage();
	if (strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(key)) {
		return strings[lang][key];
	} else if (strings['en'].hasOwnProperty(key)) {
		return strings['en'][key];
	} else {
		return '[' + key + ']';
	}
}
