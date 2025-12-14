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
		let errorCount = 0;
		let warningCount = 0;
		let todoCount = 0;
		let $errorTableBody = $('#error-table tbody');
		let $warningTableBody = $('#warning-table tbody');
		let $todoTableBody = $('#todo-table tbody');
		$errorTableBody.empty();
		$warningTableBody.empty();
		$todoTableBody.empty();
		$('#spinner').show();

		$.getJSON('/api/data-errors')
			.done((errors) => {
				$('#spinner').hide();
				$('#fail').hide();
				$('#issue-results').show();
				for (let error of errors) {
					let $editButton = $("<td><a class=\"ui icon basic button edit-button\" href=\"/edit?word=" + error.word_id + "\"><i class=\"pencil icon\"></i></a></td>");
					let $word = $("<td/>").html("<b>" + error.word + "<b/>");
					let $message = $("<td/>").text(error.message);
					let $row = $("<tr/>");
					$row.append($editButton);
					$row.append($word);
					$row.append($message);
					switch (error.type) {
						case 'error':
							errorCount++;
							$errorTableBody.append($row);
							break;
						case 'warning':
							warningCount++;
							$warningTableBody.append($row);
							break;
						case 'todo':
							todoCount++;
							$todoTableBody.append($row);
							break;
					}
				}

				if (errorCount === 0)
					$('#no-errors').show();
				else
					$('#error-table').show();

				if (warningCount === 0)
					$('#no-warnings').show();
				else
					$('#warning-table').show();

				if (todoCount === 0)
					$('#no-todos').show();
				else
					$('#todo-table').show();
			})
			.fail(() => {
				$('#spinner').hide();
				$('#issue-results').hide();
				$('#fail').show();
				$('#fail').append(this.createErrorBlock(_('word-list-error'), _('searching-error-description')));
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
