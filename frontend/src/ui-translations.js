let strings = {};

// initialize the language dropdown
$(function () {
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
		$('.current-lang').text(_('language'));
		$dropdown.dropdown({
			onChange: setNewLanguage
		});
	}
});

function setNewLanguage(value) {
	localStorage.setItem('reykunyu-language', value);
	document.cookie = 'lang=' + value;  // note that this removes all other cookies (but we don't set any)
	$('.translation').each(function() {
		$(this).html(_($(this).attr('data-key')));
	});
	$('.current-lang').text(_('language'));
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
