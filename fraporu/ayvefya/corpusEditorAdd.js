$(function () {
	const getParams = new URLSearchParams(window.location.search);
	const sentence = getParams.get('sentence');
	const $mappingNaviRow = $('#mapping-navi-row');
	const $mappingTranslatedRow = $('#mapping-translated-row');
	const $mappingField = $('#mapping-field');

	$('#save-button').on('click', function () {
		try {
			const sentenceData = {
				"na'vi": [],
				"translations": { 'en': { 'translation': [], 'mapping': [] } },
				"source": []
			};
			console.log(sentenceData);
			/*const url = $('body').data('url');
			$.post(url, {
				'word': word,
				'type': type,
				'data': JSON.stringify(wordData)
			}, function () {
				document.location.href = '/corpus-editor'
			});*/
		} catch (e) {
			alert(e);
		}
	});
});

function generateSentenceData() {
	let sentence = {};
	let navi = [];
	$('#grammatical-analysis-table tbody tr').each(function (i, element) {
		const naviWord = $(element).find('.navi-field').val();
		const rootWords = $(element).find('.root-field').val().split('/');
		for (let i = 0; i < rootWords.length; i++) {
			rootWords[i] = rootWords[i].trim();
		}
		navi.push([naviWord, rootWords]);
	});
	sentence["na'vi"] = navi;

	return sentence;
}
