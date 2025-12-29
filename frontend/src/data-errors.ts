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
		$('#spinner').show();

		$.getJSON('/api/data-errors')
			.done((errors) => {
				$('#spinner').hide();
				$('#fail').hide();
				$('#issue-results').show();
				this.buildIssueTable("error", $('#error-table tbody'), $('#no-errors'), errors);
				this.buildIssueTable("warning", $('#warning-table tbody'), $('#no-warnings'), errors);
				this.buildIssueTable("todo", $('#todo-table tbody'), $('#no-todos'), errors);
			})
			.fail(() => {
				$('#spinner').hide();
				$('#issue-results').hide();
				$('#fail').show();
				$('#fail').append(this.createErrorBlock(_('word-list-error'), _('searching-error-description')));
			});
		return false;
	}

	buildIssueTable(issueType: string, $tableBody: JQuery, $placeholder: JQuery, issues: Array<DataIssue>) {
		$tableBody.empty();
		let issueCount = 0;
		for (let issue of issues) {
			let $editButton = $("<td><a class=\"ui icon basic button edit-button\" href=\"/edit?word=" + issue.word_id + "\"><i class=\"pencil icon\"></i></a></td>");
			let $word = $("<td/>").html("<b>" + issue.word + "<b/>");
			let $message = $("<td/>").text(issue.message);
			let $row = $("<tr/>");
			$row.append($editButton);
			$row.append($word);
			$row.append($message);
			if (issue.type === issueType) {
				issueCount++;
				$tableBody.append($row);
			}
		}
		if (issueCount > 0) {
			$tableBody.show();
		}
		else {
			$placeholder.show();
		}
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
