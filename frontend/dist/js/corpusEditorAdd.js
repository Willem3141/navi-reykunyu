$(function () {
	const getParams = new URLSearchParams(window.location.search);
	const sentence = getParams.get('sentence');
	const $mappingNaviRow = $('#mapping-navi-row');
	const $mappingTranslatedRow = $('#mapping-translated-row');
	const $mappingField = $('#mapping-field');

	$('#save-button').on('click', function () {
		try {
			const key = $('#id-field').val();
			const url = $('body').data('url');
			$.post(url, {
				'key': key,
				'sentence': $('#sentence-field').val(),
			}, function () {
				document.location.href = '/corpus-editor/edit?sentence=' + key;
			});
		} catch (e) {
			alert(e);
		}
	});
});
