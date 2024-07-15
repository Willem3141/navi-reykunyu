$('.ui.checkbox').checkbox();
$('.ui.dropdown').dropdown();

var id = -1;

$(function() {
	const getParams = new URLSearchParams(window.location.search);
	id = parseInt(getParams.get('word'), 10);

	$('#save-button').on('click', function () {
		try {
			$('#save-button').addClass('loading');
			const wordData = generateWordData();
			const url = $('body').data('url');
			$.post(url, {
				'id': id,
				'data': JSON.stringify(wordData)
			}, function (data) {
				document.location.href = data['url'];
			});
		} catch (e) {
			$('#save-button').removeClass('loading');
			alert(e);
		}
	});
});

function generateWordData() {
	return JSON.parse($('#json-field').val());
}
