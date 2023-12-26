$(function () {
	const getParams = new URLSearchParams(window.location.search);
	const key = getParams.get('sentence');
	const $mappingNaviRow = $('#mapping-navi-row');
	const $mappingTranslatedRow = $('#mapping-translated-row');
	const $mappingField = $('#mapping-field');

	const json = JSON.parse($mappingField.val());
	const naviWordCount = $('.mapping-navi-button').length;
	if (json.length !== naviWordCount) {
		$mappingField.val(JSON.stringify(new Array(naviWordCount).fill([])));
	}

	let naviId = -1;

	$mappingNaviRow.on('click', '.mapping-navi-button', function () {
		naviId = parseInt($(this).attr('data-id'), 10);
		$mappingNaviRow.find('.mapping-navi-button').removeClass('active');
		$(this).addClass('active');
		const $translatedButtons = $mappingTranslatedRow.find('.mapping-translated-button');
		$translatedButtons.removeClass('active');
		const json = JSON.parse($mappingField.val());
		for (const translatedId of json[naviId - 1]) {
			$($translatedButtons[translatedId - 1]).addClass('active');
		}
	});
	$mappingTranslatedRow.on('click', '.mapping-translated-button', function () {
		const translatedId = parseInt($(this).attr('data-id'), 10);
		const json = JSON.parse($mappingField.val());
		if ($(this).hasClass('active')) {
			json[naviId - 1].splice(json[naviId - 1].indexOf(translatedId), 1);
		} else {
			json[naviId - 1].push(translatedId);
			json[naviId - 1].sort();
		}
		$(this).toggleClass('active');
		$mappingField.val(JSON.stringify(json));
	});

	$('#save-button').on('click', function () {
		try {
			const sentenceData = generateSentenceData();
			const url = $('body').data('url');
			$.post(url, {
				'key': key,
				'sentence': JSON.stringify(sentenceData)
			}, function () {
				document.location.href = '/corpus-editor'
			});
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
	sentence['na\'vi'] = navi;

	sentence['translations'] = {
		'en': {
			'translation': $('#translation-field').val().split(' '),
			'mapping': JSON.parse($('#mapping-field').val())
		}
	};

	sentence['source'] = [
		$('#source-name-field').val(),
		$('#source-url-field').val(),
		$('#source-date-field').val()
	];

	return sentence;
}
