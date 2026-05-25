import WordResultBlock from './word-result-block';

abstract class EditField<T> {
	private label: string;
	private infoText?: string;
	protected attributeName: string;
	private minCount: number = 1;
	private maxCount: number = 1;
	protected onChanged?: () => void;
	protected onRowCountChanged?: () => void;

	private $rows: JQuery[] = [];
	private $addButton: JQuery;

	constructor(attributeName: string, label: string) {
		this.attributeName = attributeName;
		this.label = label;

		this.$addButton = $('<div/>')
			.addClass('ui basic compact button add-button')
			.html('<i class="ui plus icon"></i> ' + this.label);
		this.$addButton.on('click', () => {
			this.setNumberOfRows(this.$rows.length + 1);
		});
	}

	setInfoText(infoText: string) {
		this.infoText = infoText;
	}
	setMinCount(minCount: number) {
		this.minCount = minCount;
		if (this.$rows.length < minCount) {
			this.setNumberOfRows(minCount);
		}
	}
	setMaxCount(maxCount: number) {
		this.maxCount = maxCount;
		if (this.$rows.length > maxCount) {
			this.setNumberOfRows(maxCount);
		}
		this.updateButtonVisibility();
	}
	setOnChanged(onChanged: () => void) {
		this.onChanged = onChanged;
	}
	setOnRowCountChanged(onRowCountChanged: () => void) {
		this.onRowCountChanged = onRowCountChanged;
	}

	getAttributeName(): string {
		return this.attributeName;
	}
	getAddButton(): JQuery {
		return this.$addButton;
	}

	private setNumberOfRows(count: number) {
		if (count == this.$rows.length) {
			return;
		}

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
		this.callOnRowCountChanged();
	}

	private updateButtonVisibility() {
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
					this.callOnRowCountChanged();
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
		let value: any;
		if (this.$rows.length === 0) {
			value = undefined;
		} else if (this.maxCount === 1) {
			value = this.inputToValue(this.$rows[0]);
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

	protected callOnChanged() {
		if (this.onChanged) {
			this.onChanged();
		}
	}
	protected callOnRowCountChanged() {
		if (this.onRowCountChanged) {
			this.onRowCountChanged();
		}
	}

	abstract renderInput(): JQuery;
	abstract inputToValue($row: JQuery): T;
	abstract inputFromValue($row: JQuery, value: T): void;
}

class ChoiceEditField extends EditField<string> {
	choices: Record<string, string>;

	constructor(attributeName: string, label: string, choices: Record<string, string>) {
		super(attributeName, label);
		this.choices = choices;
	}

	renderInput(): JQuery {
		let $select = $('<select/>')
			.attr('id', this.attributeName + '-field')
			.addClass('ui selection dropdown')
			.on('input', this.callOnChanged.bind(this));

		for (let type of Object.keys(this.choices)) {
			let $option = $('<option/>')
				.attr('value', type)
				.text(this.choices[type]);
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
			.attr('id', this.attributeName + '-field')
			.on('input', this.callOnChanged.bind(this));
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
		let $input = $(this.multiLine ? '<textarea/>' : '<input/>')
			.attr('id', this.attributeName + '-field')
			.on('input', this.callOnChanged.bind(this));
		let $inputField = $('<div/>')
			.addClass('ui action input')
			.append($input);
		if (this.multiLine) {
			$inputField.find('textarea').attr('rows', 4);
		}
		let $button = $('<div/>')
			.addClass('ui basic icon button')
			.html('<i class="globe icon"></i>')
			.appendTo($inputField);
		$button.on('click', () => {
			$('#translations-modal input').val('');
			$('#translation-en-field').val($input.val()!);
			let languages = $input.data();
			for (let lang of Object.keys(languages)) {
				$('#translation-' + lang + '-field').val(languages[lang]);
			}
			$('#translations-modal').modal('show');
			$('#translations-modal-ok-button').off('click');
			$('#translations-modal-ok-button').on('click', () => {
				$input.val($('#translation-en-field').val()!);
				$('#translations-modal input').each(function() {
					let id = $(this).attr('id')!;
					let lang = id.split('-')[1];
					let value = $(this).val() as string;
					if (value.length) {
						$input.data()[lang] = value;
					} else {
						$input.removeData(lang);
					}
				});
				this.callOnChanged();
			});
		});
		return $inputField;
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
		let $inputField = $('<div/>')
			.addClass('ui action input')
			.append($('<input/>')
				.attr('id', this.attributeName + '-field')
				.on('input', this.callOnChanged.bind(this))
			);
		let $button = $('<div/>')
			.addClass('ui basic icon button')
			.html('<i class="pencil alternate icon"></i>')
			.appendTo($inputField);
		$button.on('click', () => {
			const $input = $inputField.find('input');
			$('#source-title-field').val($input.val()!);
			$('#source-url-field').val($input.data('url') ?? '');
			$('#source-date-field').val($input.data('date') ?? '');
			$('#source-note-field').val($input.data('note') ?? '');
			$('#source-modal').modal('show');
			$('#source-modal-ok-button').off('click');
			$('#source-modal-ok-button').on('click', () => {
				$input.val($('#source-title-field').val()!);
				$input.data('url', $('#source-url-field').val()!);
				$input.data('date', $('#source-date-field').val()!);
				$input.data('note', $('#source-note-field').val()!);
				this.callOnChanged();
			});
		});
		return $inputField;
	}
	inputToValue($row: JQuery): Source {
		const $input = $row.find('input');
		let source: Source = [
			$input.val() as string
		];
		if ($input.data('note')) {
			source.length = 4;
			source[1] = '';
			source[2] = '';
			source[3] = $input.data('note');
		}
		if ($input.data('date')) {
			if (source.length < 3) {
				source.length = 3;
			}
			source[1] = '';
			source[2] = $input.data('date');
		}
		if ($input.data('url')) {
			if (source.length < 2) {
				source.length = 2;
			}
			source[1] = $input.data('url');
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
	warnOnUnload = false;

	constructor() {
		window.addEventListener('beforeunload', (event) => {
			if (this.warnOnUnload) {
				event.preventDefault();
			}
		});

		let rootField = new StringEditField('na\'vi', 'Root word');
		rootField.setInfoText('Use FN spelling, but with ù where applicable. ' +
			'For multi-syllable words: mark syllable boundaries with / and the ' +
			'stressed syllable with [...]. For example: kal/[txì].');

		let typeField = new ChoiceEditField('type', 'Type', {
			'n': 'noun',
			'n:pr': 'proper noun',
			'n:si': 'si-verb complement',
			'pn': 'pronoun',
			'adj': 'adjective',
			'num': 'numeral',
			'adv': 'adverb',
			'adp': 'adposition',
			'adp:len': 'adposition (leniting)',
			'intj': 'interjection',
			'part': 'particle',
			'conj': 'conjunction',
			'ctr': 'contraction (‘f-word’)',
			'v:?': 'verb (unknown type)',
			'v:in': 'verb (intransitive)',
			'v:tr': 'verb (transitive)',
			'v:m': 'verb (modal)',
			'v:si': 'verb (si itself)',
			'v:cp': 'verb (copula)',
			'phr': 'phrase',
			'inter': 'interrogative',
			'aff:pre': 'prefix',
			'aff:pre:len': 'prefix (leniting)',
			'aff:in': 'infix',
			'aff:suf': 'suffix'
		});
		typeField.setInfoText('The word class of this word.');

		let infixField = new StringEditField('infixes', 'Infix positions');
		infixField.setInfoText('Mark the infix positions with two dots.');

		let definitionField = new TranslatedStringEditField('translations', 'Definition');
		definitionField.setInfoText('The English translation. Enter translations to ' +
			'other languages using the globe icon button on the right.');
		definitionField.setMaxCount(Infinity);

		let shortTranslationField = new TranslatedStringEditField('short_translation', 'Short translation');
		shortTranslationField.setInfoText('By default Reykunyu takes the part of the first definition ' +
			'until the first comma, minus any parenthesized parts, as a “short translation”. ' +
			'For the few words for which this isn\'t desirable, ' +
			'you can manually enter a short translation to override this.');
		shortTranslationField.setMinCount(0);
		shortTranslationField.setStoreOnlyEnglishAsString(true);

		let meaningNoteField = new TranslatedStringEditField('meaning_note', 'Meaning note');
		meaningNoteField.setInfoText('Free-form additional information on the meaning of the word, ' +
			'such as a clarification on the scope of the word. Can use references to other words ' +
			'of the form [kaltxì:intj] and external links of the form ' +
			'[Pandorapedia](https://www.avatar.com/pandorapedia/).');
		meaningNoteField.setMinCount(0);
		meaningNoteField.setStoreOnlyEnglishAsString(true);
		meaningNoteField.setMultiLine(true);

		let conjugationNoteField = new TranslatedStringEditField('conjugation_note', 'Conjugation note');
		conjugationNoteField.setInfoText('In case this word has conjugation exceptions ' +
			'(e.g., missing or alternate forms), they can be noted here.');
		conjugationNoteField.setMinCount(0);
		conjugationNoteField.setStoreOnlyEnglishAsString(true);
		conjugationNoteField.setMultiLine(true);

		let etymologyField = new StringEditField('etymology', 'Etymology');
		etymologyField.setInfoText('Standard form: From ... + ... . ' +
			'Can use references to other words of the form [kaltxì:intj]. ' +
			'This word will automatically end up in the “derived words” section of each referenced word.');
		etymologyField.setMinCount(0);

		let imageField = new StringEditField('image', 'Image');
		imageField.setInfoText('File name of an image to show. Note: you cannot upload ' +
			'new images using this editor. The image already has to be on the server for this to work.');
		imageField.setMinCount(0);

		let sourceField = new SourceEditField('source', 'Source');
		sourceField.setInfoText('A source for this word. There can be more than one. ' +
			'Sources should contain URL and date, if available, and can contain a short note. ' +
			'Enter these using the pencil icon button on the right.');
		sourceField.setMinCount(0);
		sourceField.setMaxCount(Infinity);

		let seeAlsoField = new StringEditField('seeAlso', 'See also');
		seeAlsoField.setInfoText('The See also section contains words that are otherwise related to this word. ' +
			'Words that are already linked from the other sections don\'t need to be repeated ' +
			'in the See also section. Use the syntax kaltxì:intj.');
		seeAlsoField.setMinCount(0);
		seeAlsoField.setMaxCount(Infinity);

		let statusField = new ChoiceEditField('status', 'Status', {
			'loan': 'Loanword', 'unconfirmed': 'Unconfirmed', 'unofficial': 'Unofficial'
		});
		statusField.setInfoText('An optional status flag for this word. ' +
			'Use this if the word is a loanword from an Earth language or if it has not been confirmed by Pawl.');
		statusField.setMinCount(0);

		let statusNoteField = new StringEditField('status_note', 'Status note');
		statusNoteField.setInfoText('Optional note about the status of this word.');
		statusNoteField.setMinCount(0);

		let disambiguationHintField = new TranslatedStringEditField('disambiguation_hint', 'Disambiguation');
		disambiguationHintField.setInfoText('In the study tool, words for which the English translation has multiple ' +
			'meanings are problematic, as the study tool doesn\'t show meaning notes (as they may give away the answer). ' +
			'For this use case, a disambiguation hint can be added. ' +
			'Usually the disambiguation hint should be a short section of the meaning note, and it should ' +
			'never include the Na\'vi word itself.');
		disambiguationHintField.setMinCount(0);

		let todoField = new StringEditField('todo', 'To do');
		todoField.setInfoText('Comments about how this word definition should be improved. ' +
			'These aren\'t shown to “normal” users (only to administrators).');
		todoField.setMinCount(0);

		this.fields = [rootField, typeField, infixField, definitionField,
			shortTranslationField, meaningNoteField, conjugationNoteField, etymologyField,
			imageField, sourceField, seeAlsoField, statusField, statusNoteField,
			disambiguationHintField, todoField];
		this.jsonToFields();
		this.updateFieldLimits(infixField, statusNoteField);
		for (let field of this.fields) {
			field.setOnChanged(() => {
				this.warnOnUnload = true;
				this.fieldsToJSON();
				this.renderPreview();
			});
			field.setOnRowCountChanged(() => {
				console.log('wee woo row count changed');
				this.warnOnUnload = true;
				this.fieldsToJSON();
				this.updateFieldLimits(infixField, statusNoteField);
				this.fieldsToJSON();
				this.resortRows();
				this.renderPreview();
			});
		}
		typeField.setOnChanged(() => {
			this.warnOnUnload = true;
			this.fieldsToJSON();
			this.updateFieldLimits(infixField, statusNoteField);
			this.fieldsToJSON();
			this.renderPreview();
		});
		statusField.setOnChanged(() => {
			this.warnOnUnload = true;
			this.fieldsToJSON();
			this.updateFieldLimits(infixField, statusNoteField);
			this.fieldsToJSON();
			this.renderPreview();
		});

		let $addButtonContainer = $('<div/>')
			.addClass('add-button-container')
			.appendTo('#visual-page');
		for (let field of this.fields) {
			field.getAddButton().appendTo($addButtonContainer);
		}
		this.resortRows();
		this.renderPreview();

		$('#json-field').on('input', () => {
			this.jsonToFields();
			this.renderPreview();
		});

		$('#save-button').on('click', () => {
			try {
				$('#save-button').addClass('loading');
				const wordData = $('#json-field').val() as string;
				const id = JSON.parse(wordData)['id'];
				const url = $('body').data('url');
				$.post(url, {
					'id': id,
					'data': wordData
				}, (data) => {
					this.warnOnUnload = false;
					document.location.href = data['url'];
				});
			} catch (e) {
				$('#save-button').removeClass('loading');
				alert(e);
			}
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

		$('#translations-modal-cancel-button').on('click', () => {
			$('#translations-modal').modal('hide');
		});
		$('#source-modal-cancel-button').on('click', () => {
			$('#source-modal').modal('hide');
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

	updateFieldLimits(infixField: StringEditField, statusNoteField: StringEditField): void {
		let jsonString = $('#json-field').val() as string;
		let json: WordData = JSON.parse(jsonString);
		if (json['type'].startsWith('v:')) {
			infixField.setMinCount(1);
			infixField.setMaxCount(1);
		} else {
			infixField.setMinCount(0);
			infixField.setMaxCount(0);
		}
		if (json['status'] && json['status'].length > 0) {
			statusNoteField.setMaxCount(1);
		} else {
			statusNoteField.setMaxCount(0);
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
