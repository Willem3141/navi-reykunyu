$('.ui.checkbox').checkbox();
$('.ui.dropdown').dropdown();

$(function() {
	const getParams = new URLSearchParams(window.location.search);
	const word = getParams.get('word');
	const type = getParams.get('type');

	showHideInfixes();
	$('#type-field').on('change', showHideInfixes);

	$('#definition-field').on('click', '.add-meaning-button', function () {
		const $tr = $(this).closest('tr');
		$tr.clone().insertAfter($tr);
		if ($('#definition-field tbody tr').length >= 2) {
			$('.delete-meaning-button').removeClass('disabled');
		}
		renumberMeanings();
	});
	$('#definition-field').on('click', '.delete-meaning-button', function () {
		const $tr = $(this).closest('tr');
		$tr.remove();
		if ($('#definition-field tbody tr').length < 2) {
			$('.delete-meaning-button').addClass('disabled');
		}
		renumberMeanings();
	});
	$('#definition-field').on('click', '.translation-button', function () {
		const $tr = $(this).closest('tr');
		const $field = $tr.find('input');
		const english = $field.val();
		$('#translation-en-field').text(english);

		const languages = $field.data();
		for (let lang of Object.keys(languages)) {
			$('#translation-' + lang + '-field').val(languages[lang]);
		}

		$('#translations-modal').data('editing', $field);
		$('#translations-modal').modal('show');
	});

	$('#source-field').on('click', '.add-source-button', function () {
		const $tr = $(this).closest('tr');
		$tr.clone().insertAfter($tr);
	});
	$('#source-field').on('click', '.delete-source-button', function () {
		const $tr = $(this).closest('tr');
		$tr.remove();
	});

	$('#save-button').on('click', function () {
		//try {
			const wordData = generateWordData();
			const url = $('body').data('url');
			$.post(url, {
				'word': word,
				'type': type,
				'data': JSON.stringify(wordData)
			}, function () {
				document.location.href = '/?q=' + wordData["na'vi"];
			});
		//} catch (e) {
		//	alert(e);
		//}
	});

	$('#translations-modal-cancel-button').on('click', function () {
		$('#translations-modal').modal('hide');
	});

	$('#translations-modal-ok-button').on('click', function () {
		const $field = $('#translations-modal').data('editing');
		const languages = $field.data();
		$('#translations-modal input').each(function() {
			let id = $(this).attr('id');
			let lang = id.split('-')[1];
			let value = $(this).val();
			if (value.length) {
				$field.data()[lang] = value;
			}
		});
		$('#translations-modal').modal('hide');
	});
});

function showHideInfixes() {
	const type = $('#type-field').val();
	if (type.startsWith('v:')) {
		$('#v-option').show();
	} else {
		$('#v-option').hide();
	}
}

function generateWordData() {
	word = {};
	word["na'vi"] = preprocess($('#root-field').val());
	word["type"] = $('#type-field').val();
	if (word["type"].startsWith('v:')) {
		if ($('#infixes-field').val()) {
			word["infixes"] = $('#infixes-field').val();
		} else {
			throw new Error('Cannot save a verb without infix data');
		}
	}
	if ($('#meaning-note-field').val()) {
		word["meaning_note"] = $('#meaning-note-field').val();
	}
	if ($('#conjugation-note-field').val()) {
		word["conjugation_note"] = $('#conjugation-note-field').val();
	}
	if ($('#pronunciation-field .syllables-cell').val()) {
		word["pronunciation"] = [
			preprocess($('#pronunciation-field .syllables-cell').val()),
			parseInt($('#pronunciation-field .stress-cell').val(), 10)
		];
	}

	let translations = [];
	const $rows = $('#definition-field').find('tr');
	$rows.each(function() {
		let translation = {};
		translation['en'] = $(this).find('input').val();
		const languages = $(this).find('input').data();
		for (let lang of Object.keys(languages)) {
			translation[lang] = languages[lang];
		}
		translations.push(translation);
	});

	word["translations"] = translations;

	if ($('#status-field').val() !== "none") {
		word["status"] = $('#status-field').val();
	}
	if ($('#status-note-field').val()) {
		word["status_note"] = $('#status-note-field').val();
	}
	if ($('#etymology-field').val()) {
		word["etymology"] = $('#etymology-field').val();
	}
	if ($('#source-name-field').val()) {
		word["source"] = [
			$('#source-name-field').val(),
			$('#source-url-field').val(),
			$('#source-date-field').val()
		];
	}
	let sources = [];
	const $sourceRows = $('#source-field tbody').find('tr');
	$sourceRows.each(function() {
		let source = [];
		source.push($(this).find('.source-name-field').val());
		source.push($(this).find('.source-url-field').val());
		source.push($(this).find('.source-date-field').val());
		if ($(this).find('.source-remarks-field').val().length) {
			source.push($(this).find('.source-remarks-field').val());
		}
		sources.push(source);
	});
	word["source"] = sources;

	// hidden fields
	if ($('#image-field').val()) {
		word["image"] = $('#image-field').val();
	}
	if ($('#conjugation-field').val()) {
		word["conjugation"] = JSON.parse($('#conjugation-field').val());
	}
	if ($('#short-translation-field').val()) {
		word["short_translation"] = $('#short-translation-field').val();
	}
	if ($('#see-also-field').val()) {
		word["seeAlso"] = JSON.parse($('#see-also-field').val());
	}

	return word;
}

function preprocess(query) {
	query = query.replace(/’/g, "'");
	query = query.replace(/‘/g, "'");
	return query;
}

function renumberMeanings() {
	$('#definition-field tbody tr').each(function (i, tr) {
		$(tr).find('.id-cell').text((i + 1) + '.');
	});
}
