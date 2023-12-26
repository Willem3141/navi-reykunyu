$('.ui.checkbox').checkbox();
$('.ui.dropdown').dropdown();

$(function() {
	const getParams = new URLSearchParams(window.location.search);
	const word = getParams.get('word');
	const type = getParams.get('type');

	$('#save-button').on('click', function () {
		try {
			const wordData = generateWordData();
			const url = $('body').data('url');
			$.post(url, {
				'word': word,
				'type': type,
				'data': JSON.stringify(wordData)
			}, function () {
				document.location.href = '/?q=' + wordData["na'vi"];
			});
		} catch (e) {
			alert(e);
		}
	});
});

function generateWordData() {
	return JSON.parse($('#json-field').val());
}
