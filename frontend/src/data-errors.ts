import { appendLinkString } from './lib';

class DataErrorsPage {
	constructor() {
		$('#language-dropdown').dropdown({
			onChange: (value) => {
				setNewLanguage(value);
				this.loadErrorList();
				return false;
			}
		});

		this.loadErrorList();
	}

	loadErrorList() {
		let $results = $('#error-list-result');
		$results.empty();
		$('#spinner').show();

		$.getJSON('/api/data-errors')
			.done((errors) => {
				$('#spinner').hide();
				if (errors.length === 0) {
					$('#no-errors').show();
				} else {
					for (let error of errors) {
						let $item = $('<li/>').text(error);
						$results.append($item);
					}
				}
			})
			.fail(() => {
				$results.empty();
				$('#no-errors').hide();
				$results.append(this.createErrorBlock(_('word-list-error'), _('searching-error-description')));
			});
		return false;
	}

	createErrorBlock(text: string, subText: string): JQuery {
		let $error = $('<div/>').addClass('error');
		$('<p/>').addClass('error-text').html(text).appendTo($error);
		$('<img/>').addClass('error-icon').attr("src", "/images/ke'u.svg").appendTo($error);
		$('<p/>').addClass('error-subText').html(subText).appendTo($error);
		return $error;
	}

	getLanguage(): string {
		let lang = localStorage.getItem('reykunyu-language');
		if (!lang) {
			lang = 'en';
		}
		return lang;
	}
}

$(() => {
	new DataErrorsPage();
});
