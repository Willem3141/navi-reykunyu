$(function() {
	$('.etymology-field').on('blur', function () {
		try {
			let wordData = JSON.parse($(this).attr('data-json'));
			if (!wordData.hasOwnProperty('etymology') && $(this).val() === "") {
				return;
			}
			if (wordData.hasOwnProperty('etymology') && wordData['etymology'] === $(this).val()) {
				return;
			}
			if ($(this).val() === '') {
				delete wordData['etymology'];
			} else {
				wordData['etymology'] = $(this).val();
			}
			let $self = $(this);
			const url = $('body').data('url');
			$.post(url, {
				'id': wordData['id'],
				'data': JSON.stringify(wordData)
			}, function () {
				$self.addClass('edit-succeeded');
				setTimeout(function () {
					$self.removeClass('edit-succeeded');
				}, 1000);
				$self.attr('data-json', JSON.stringify(wordData));
			});
		} catch (e) {
			alert(e);
		}
	});
});

