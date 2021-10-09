$(function() {
	$('.etymology-field').on('blur', function () {
		try {
			let wordData = JSON.parse($(this).attr('data-json'));
			if (!wordData.hasOwnProperty('etymology') && $(this).val() === "") {
				return;
			}
			if (wordData['etymology'] === $(this).val()) {
				return;
			}
			wordData['etymology'] = $(this).val();
			let $self = $(this);
			const url = $('body').data('url');
			$.post(url, {
				'word': wordData['na\'vi'],
				'type': wordData['type'],
				'data': JSON.stringify(wordData)
			}, function () {
				console.log($self);
				$self.addClass('edit-succeeded');
				setTimeout(function () {
					$self.removeClass('edit-succeeded');
				}, 1000);
			});
		} catch (e) {
			alert(e);
		}
	});
});

