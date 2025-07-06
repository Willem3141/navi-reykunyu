import WordResultBlock from './word-result-block';

type FieldType = 'string' | 'number';

abstract class EditField<T> {
	private label: string;
	private infoText?: string;
	protected attributeName: string;
	private minCount: number = 1;
	private maxCount: number = 1;
	protected onChanged?: () => void;

	private $rows: JQuery[] = [];
	private $addButton: JQuery;

	constructor(attributeName: string, label: string, onChanged: () => void) {
		this.attributeName = attributeName;
		this.label = label;
		this.onChanged = onChanged;

		this.$addButton = $('<div/>')
			.addClass('ui basic compact button add-button')
			.html('<i class="ui plus icon"></i> ' + this.label);
		this.$addButton.on('click', () => {
			this.setNumberOfRows(this.$rows.length + 1);
			if (this.onChanged) {
				this.onChanged();
			}
		});
	}

	setInfoText(infoText: string) {
		this.infoText = infoText;
	}
	setMinCount(minCount: number) {
		this.minCount = minCount;
	}
	setMaxCount(maxCount: number) {
		this.maxCount = maxCount;
	}

	getAttributeName(): string {
		return this.attributeName;
	}
	getAddButton(): JQuery {
		return this.$addButton;
	}

	private setNumberOfRows(count: number) {
		while (count > this.$rows.length) {
			let $row = $('<div/>')
				.addClass('field row')
				.data('field', this.attributeName);

			let $label = $('<label/>')
				.attr('for', this.attributeName + '-field')
				.text(this.label)
				.appendTo($row);
			if (this.infoText) {
				$('<div/>')
					.addClass('info-spawner')
					.attr('data-position', 'right center')
					.attr('data-tooltip', this.infoText)
					.html('<i class="info icon"></i>')
					.appendTo($label);
			}
			let $input = this.renderInput();
			$input.appendTo($row);

			let $buttons = $('<div/>')
				.addClass('row-buttons');
			$buttons.appendTo($row);

			$('#visual-page').append($row);

			this.$rows.push($row);
		}
		while (count < this.$rows.length) {
			this.$rows[this.$rows.length - 1].remove();
			this.$rows.length--;
		}

		this.updateButtonVisibility();
	}

	updateButtonVisibility() {
		for (let $row of this.$rows) {
			let $buttons = $row.find('.row-buttons')
			$buttons.empty();
		}

		if (this.$rows.length - 1 >= this.minCount) {
			for (let $row of this.$rows) {
				let $buttons = $row.find('.row-buttons')
				$buttons.empty();
				let $deleteButton = $('<div/>')
					.addClass('delete-button')
					.html('<i class="remove icon"></i>')
					.appendTo($buttons);
				$deleteButton.on('click', () => {
					$row.remove();
					this.$rows.splice(this.$rows.indexOf($row), 1);
					this.updateButtonVisibility();
					if (this.onChanged) {
						this.onChanged();
					}
				});
			}
		}

		if (this.$rows.length + 1 <= this.maxCount) {
			this.$addButton.show();
		} else {
			this.$addButton.hide();
		}
	}

	updateToJSON(word: any): void {
		let value: any = undefined;
		if (this.maxCount === 1) {
			if (this.$rows.length > 0) {
				value = this.inputToValue(this.$rows[0]);
			}
		} else {
			value = [];
			for (let $row of this.$rows) {
				value.push(this.inputToValue($row));
			}
		}
		word[this.attributeName] = value;
	}

	updateFromJSON(word: any): void {
		let value = word[this.attributeName];
		if (value === undefined) {
			this.setNumberOfRows(0);
		} else if (this.maxCount === 1) {
			if (Array.isArray(value)) {
				throw new Error('JSON contained array where a bare element was expected');
			}
			this.setNumberOfRows(1);
			this.inputFromValue(this.$rows[0], value);
		} else {
			if (!Array.isArray(value)) {
				throw new Error('JSON contained bare element where an array was expected');
			}
			this.setNumberOfRows(value.length);
			for (let i = 0; i < value.length; i++) {
				this.inputFromValue(this.$rows[i], value[i]);
			}
		}
	}

	abstract renderInput(): JQuery;
	abstract inputToValue($row: JQuery): T;
	abstract inputFromValue($row: JQuery, value: T): void;
}

class NumberEditField extends EditField<number> {
	renderInput(): JQuery {
		return $('<input/>')
			.attr('id', this.attributeName + '-field')
			.attr('disabled', '');
	}
	inputToValue($row: JQuery): number {
		let value = $row.find('input').val() as string;
		return parseInt(value, 10);
	}
	inputFromValue($row: JQuery, value: number): void {
		$row.find('input').val(value);
	}
}

class TypeEditField extends EditField<string> {
	readonly types = ['n', 'n:pr', 'n:si', 'pn', 'adj', 'num', 'adv', 'adp', 'adp:len',
		'intj', 'part', 'conj', 'ctr', 'v:?', 'v:in', 'v:tr', 'v:m', 'v:si', 'v:cp',
		'phr', 'inter', 'aff:pre', 'aff:pre:len', 'aff:in', 'aff:suf'];

	renderInput(): JQuery {
		let $select = $('<select/>')
			.attr('id', this.attributeName + '-field')
			.addClass('ui selection dropdown');
		
		for (let type of this.types) {
			let $option = $('<option/>')
				.attr('value', type)
				.text(type + ' (' + _('type-' + type) + ')');
			$select.append($option);
		}

		return $select;
	}
	inputToValue($row: JQuery): string {
		return $row.find('select').val() as string;
	}
	inputFromValue($row: JQuery, value: string): void {
		$row.find('select').val(value);
	}
}

class StringEditField extends EditField<string> {
	renderInput(): JQuery {
		return $('<input/>')
			.attr('id', this.attributeName + '-field');
	}
	inputToValue($row: JQuery): string {
		return $row.find('input').val() as string;
	}
	inputFromValue($row: JQuery, value: string): void {
		$row.find('input').val(value);
	}
}

class TranslatedStringEditField extends EditField<string | Translated<string>> {
	storeOnlyEnglishAsString = false;
	multiLine = false;

	setStoreOnlyEnglishAsString(storeOnlyEnglishAsString: boolean) {
		this.storeOnlyEnglishAsString = storeOnlyEnglishAsString;
	}

	setMultiLine(multiLine: boolean) {
		this.multiLine = multiLine;
	}

	renderInput(): JQuery {
		let $input = $('<div/>')
			.addClass('ui action input')
			.append($(this.multiLine ? '<textarea/>' : '<input/>')
				.attr('id', this.attributeName + '-field')
			)
			.append($('<div/>')
				.addClass('ui basic icon button')
				.html('<i class="globe icon"></i>')
			);
		if (this.multiLine) {
			$input.find('textarea').attr('rows', 4);
		}
		return $input;
	}
	inputToValue($row: JQuery): string | Translated<string> {
		const $input = $row.find('input, textarea');
		let translation: Translated<string> = {
			'en': $input.val() as string
		};
		const languages = $input.data();
		for (let lang of Object.keys(languages)) {
			translation[lang] = languages[lang];
		}
		if (this.storeOnlyEnglishAsString && Object.keys(translation).length === 1) {
			return translation['en'];
		} else {
			return translation;
		}
	}
	inputFromValue($row: JQuery, value: string | Translated<string>): void {
		const $input = $row.find('input, textarea');
		$input.removeData();
		if (typeof value === 'string') {
			$input.val(value);
		} else {
			$input.val(value['en']);
			for (let lang of Object.keys(value)) {
				if (lang !== 'en') {
					$input.data(lang, value[lang]);
				}
			}
		}
	}
}

class SourceEditField extends EditField<Source> {
	renderInput(): JQuery {
		let $input = $('<div/>')
			.addClass('ui action input')
			.append($('<input/>')
				.attr('id', this.attributeName + '-field')
			);
		let $button = $('<div/>')
			.addClass('ui basic icon button')
			.html('<i class="pencil alternate icon"></i>')
			.appendTo($input);
		$button.on('click', () => {
			$('#source-title-field').val($input.find('input').val()!);
			$('#source-modal').modal('show');
			$('#source-modal-ok-button').off('click');
			$('#source-modal-ok-button').on('click', () => {
				$input.find('input').val($('#source-title-field').val()!);
				if (this.onChanged) {
					this.onChanged();
				}
			});
		});
		return $input;
	}
	inputToValue($row: JQuery): Source {
		const $input = $row.find('input');
		let source: Source = [
			$input.val() as string
		];
		if ($input.data('url')) {
			source.length = 2;
			source[1] = $input.data('url');
		}
		if ($input.data('date')) {
			source.length = 3;
			source[2] = $input.data('date');
		}
		if ($input.data('note')) {
			source.length = 4;
			source[3] = $input.data('note');
		}
		return source;
	}
	inputFromValue($row: JQuery, value: Source): void {
		const $input = $row.find('input');
		$input.val(value[0]);
		$input.removeData();
		if (value.length >= 2) {
			$input.data('url', value[1]!);
		}
		if (value.length >= 3) {
			$input.data('date', value[2]!);
		}
		if (value.length >= 4) {
			$input.data('note', value[3]!);
		}
	}
}

class EditPage {
	fields: EditField<any>[] = [];

	constructor() {
		let updateFunction = () => {
			this.fieldsToJSON();
			this.resortRows();
			this.renderPreview();
		};

		let idField = new NumberEditField('id', 'ID', updateFunction);
		idField.setInfoText('Numerical ID for Reykunyu\'s internal use. Not editable.');
		this.fields.push(idField);

		let rootField = new StringEditField('na\'vi', 'Root word', updateFunction);
		rootField.setInfoText('Use FN spelling, but with ù where applicable. ' +
			'For multi-syllable words: mark syllable boundaries with / and the ' +
			'stressed syllable with [...]. For example: kal/[txì].');
		this.fields.push(rootField);

		let typeField = new TypeEditField('type', 'Type', updateFunction);
		typeField.setInfoText('The word class of this word.');
		this.fields.push(typeField);

		let infixField = new StringEditField('infixes', 'Infix positions', updateFunction);
		infixField.setInfoText('Mark the infix positions with two dots.');
		infixField.setMinCount(0);
		this.fields.push(infixField);

		let definitionField = new TranslatedStringEditField('translations', 'Definition', updateFunction);
		definitionField.setInfoText('The English translation. Enter translations to ' +
			'other languages using the globe icon button on the right.');
		definitionField.setMaxCount(Infinity);
		this.fields.push(definitionField);

		let meaningNoteField = new TranslatedStringEditField('meaning_note', 'Meaning note', updateFunction);
		meaningNoteField.setInfoText('Free-form additional information on the meaning of the word, ' +
			'such as a clarification on the scope of the word. Can use references to other words ' +
			'of the form [kaltxì:intj] and external links of the form ' +
			'[Pandorapedia](https://www.avatar.com/pandorapedia/).');
		meaningNoteField.setMinCount(0);
		meaningNoteField.setStoreOnlyEnglishAsString(true);
		meaningNoteField.setMultiLine(true);
		this.fields.push(meaningNoteField);

		let etymologyField = new StringEditField('etymology', 'Etymology', updateFunction);
		etymologyField.setInfoText('Standard form: From ... + ... . ' +
			'Can use references to other words of the form [kaltxì:intj]. ' +
			'This word will automatically end up in the “derived words” section of each referenced word.');
		etymologyField.setMinCount(0);
		this.fields.push(etymologyField);

		let sourceField = new SourceEditField('source', 'Source', updateFunction);
		sourceField.setInfoText('A source for this word. There can be more than one. ' +
			'Sources should contain URL and date, if available, and can contain a short note. ' +
			'Enter these using the pencil icon button on the right.');
		sourceField.setMinCount(0);
		sourceField.setMaxCount(Infinity);
		this.fields.push(sourceField);

		this.jsonToFields();

		let $addButtonContainer = $('<div/>')
			.addClass('add-button-container')
			.appendTo('#visual-page');
		for (let field of this.fields) {
			field.getAddButton().appendTo($addButtonContainer);
		}
		this.resortRows();
		this.renderPreview();

		$('#visual-page').on('input', 'input, textarea, select', () => {
			this.fieldsToJSON();
			this.renderPreview();
		});

		$('#json-field').on('input', () => {
			this.jsonToFields();
			this.renderPreview();
		});

		// language dropdown
		$('#language-dropdown').dropdown({
			onChange: (value) => {
				setNewLanguage(value);
				this.renderPreview();
				return false;
			}
		});

		// tabs
		$('#visual-or-json-tabs .item').on('click', function() {
			$('#visual-or-json-tabs .item').removeClass('active');
			$(this).addClass('active');
			$('.page').hide();

			// drop "-tab" from the id and append "-page" to get the content to show
			let id = $(this).attr('id')!;
			$('#' + id.substring(0, id.length - 4) + '-page').show();
		});

		// template buttons
		$('body').on('click', '.template-button', (e) => {
			const $td = $(e.target).closest('td');
			$td.find('input').val($(e.target).attr('data-template')!);
		});
	}

	resortRows(): void {
		let $addButtons = $('.add-button');
		$addButtons.detach();

		let $visualPage = $('#visual-page');
		for (let field of this.fields) {
			let $rows = $visualPage.children('.row');
			let fieldHasRows = false;
			$rows.each((i, row) => {
				let $row = $(row);
				if ($row.data('field') == field.getAttributeName()) {
					$row.appendTo($visualPage);
					fieldHasRows = true;
				}
			});
			if (fieldHasRows) {
				$('<div/>')
					.addClass('add-button-container')
					.appendTo('#visual-page');
			}
			field.getAddButton().appendTo($visualPage.children().last());
		}
	}

	jsonToFields(): void {
		let jsonString = $('#json-field').val() as string;
		let json: WordData;
		try {
			json = JSON.parse(jsonString);
		} catch (e) {
			return;  // TODO if this happens, don't allow going back to the visual editor tab or something
		}

		for (let field of this.fields) {
			field.updateFromJSON(json);
		}
	}

	fieldsToJSON(): void {
		let jsonString = $('#json-field').val() as string;
		let json: WordData;
		try {
			json = JSON.parse(jsonString);
		} catch (e) {
			return;
		}

		for (let field of this.fields) {
			field.updateToJSON(json);
		}

		$('#json-field').val(JSON.stringify(json, null, 4));
	}

	renderPreview() {
		let jsonString = $('#json-field').val() as string;
		let json: WordData;
		try {
			json = JSON.parse(jsonString);
		} catch (e) {
			$('#preview-container').empty();
			let $error = $('<div/>')
				.addClass('error-block')
				.text('JSON parsing error: ' + e);
			$('#preview-container').append($error);
			return;
		}

		$.post('/edit/preview', { 'data': jsonString }, (data: WordData) => {
			let preview: WordResultBlock;
			try {
				preview = new WordResultBlock(data, '', 'combined', this.getLanguage(), true);
			} catch (e) {
				$('#preview-container').empty();
				let $error = $('<div/>')
					.addClass('error-block')
					.text('Preview rendering error: ' + e);
				$('#preview-container').append($error);
				return;
			}
			$('#preview-container').empty();
			$('#preview-container').append(preview.$element);
		});
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
	new EditPage();
});
