$(function() {
	$('#language-dropdown').dropdown({
		onChange: function (value) {
			setNewLanguage(value);
			// reload page on language changes, so that the untranslated word
			// list for the newly selected language gets loaded
			window.location.reload();
			return false;
		}
	});
});
