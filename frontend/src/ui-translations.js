let strings = {};

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

	// if the page was loaded offline from the service worker, it may not have
	// the correct language, so we need to immediately trigger a language update
	if ($('body').hasClass('offline')) {
		setNewLanguage(localStorage.getItem('reykunyu-language'));
	}
});

function setNewLanguage(value) {
	localStorage.setItem('reykunyu-language', value);
	document.cookie = 'lang=' + value;  // note that this removes all other cookies (but we don't set any)
	$('.translation').each(function() {
		$(this).html(_($(this).attr('data-key')));
	});
	$('[data-content-key]').each(function() {
		$(this).attr('data-content', _($(this).attr('data-content-key')));
	});
}

function _(key) {
	const lang = localStorage.getItem('reykunyu-language');
	if (strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(key)) {
		return strings[lang][key];
	} else if (strings['en'].hasOwnProperty(key)) {
		return strings['en'][key];
	} else {
		return '[' + key + ']';
	}
}
