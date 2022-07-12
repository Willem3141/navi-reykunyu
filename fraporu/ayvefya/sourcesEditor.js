$(function() {
	$('.source-field').on('blur', function () {
		try {
			let wordData = JSON.parse($(this).attr('data-json'));
			if (!wordData.hasOwnProperty('source') && $(this).val() === "") {
				return;
			}
			let sources = $(this).val().split(';');
			wordData['source'] = []
			for (const s of sources) {
				let source = [];
				for (const sItem of s.split(',')) {
					source.push(sItem.trim());
				}
				wordData['source'].push(source);
			}
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

