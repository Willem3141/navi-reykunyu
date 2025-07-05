import WordResultBlock from './word-result-block';

type FieldType = 'string' | 'number';

abstract class EditField<T> {
	private label: string = '';
	private infoText?: string;
	protected attributeName: string;
	private minCount: number = 1;
	private maxCount: number = 1;

	private $rows: JQuery[] = [];
	private $addButton!: JQuery;

	constructor(attributeName: string) {
		this.attributeName = attributeName;
	}

	setLabel(label: string) {
		this.label = label;
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

	render() {
		this.$addButton = $('<div/>').addClass('field');
	}

	private setNumberOfRows(count: number) {
		while (count > this.$rows.length) {
			let $row = $('<div/>').addClass('field');

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
			$('#visual-page').append($row);

			this.$rows.push($row);
		}
		while (count < this.$rows.length) {
			this.$rows[this.$rows.length - 1].remove();
			this.$rows.length--;
		}
	}

	updateToJSON(word: any): void {
		let value: any;
		if (this.maxCount === 1) {
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

class EditPage {
	fields: EditField<any>[] = [];

	constructor() {
		let idField = new NumberEditField('id');
		idField.setLabel('ID');
		idField.setInfoText('Numerical ID for Reykunyu\'s internal use. Not editable.');
		this.fields.push(idField);

		let rootField = new StringEditField('na\'vi');
		rootField.setLabel('Root word');
		rootField.setInfoText('Use FN spelling, but with ù where applicable. ' +
			'For multi-syllable words: mark syllable boundaries with / and the ' +
			'stressed syllable with [...]. For example: kal/[txì].');
		this.fields.push(rootField);

		let typeField = new TypeEditField('type');
		typeField.setLabel('Type');
		typeField.setInfoText('The word class of this word.');
		this.fields.push(typeField);

		let infixField = new StringEditField('infixes');
		infixField.setLabel('Infix positions');
		infixField.setInfoText('Mark the infix positions with two dots.');
		this.fields.push(infixField);

		let definitionField = new TranslatedStringEditField('translations');
		definitionField.setLabel('Definition');
		definitionField.setInfoText('The English translation. Enter translations to ' +
			'other languages using the globe icon button on the right.');
		definitionField.setMaxCount(Infinity);
		this.fields.push(definitionField);

		let meaningNoteField = new TranslatedStringEditField('meaning_note');
		meaningNoteField.setLabel('Meaning note');
		meaningNoteField.setInfoText('Free-form additional information on the meaning of the word, ' +
			'such as a clarification on the scope of the word. Can use references to other words ' +
			'of the form [kaltxì:intj] and external links of the form ' +
			'[Pandorapedia](https://www.avatar.com/pandorapedia/).');
		meaningNoteField.setMinCount(0);
		meaningNoteField.setStoreOnlyEnglishAsString(true);
		meaningNoteField.setMultiLine(true);
		this.fields.push(meaningNoteField);

		let etymologyField = new StringEditField('etymology');
		etymologyField.setLabel('Etymology');
		etymologyField.setInfoText('Standard form: From ... + ... . ' +
			'Can use references to other words of the form [kaltxì:intj]. ' +
			'This word will automatically end up in the “derived words” section of each referenced word.');
		etymologyField.setMinCount(0);
		this.fields.push(etymologyField);

		/*let sourceField = new SourceEditField('source');
		sourceField.setLabel('Source');
		sourceField.setInfoText('A source is represented by four elements: ' +
			'the name (e.g., ‘Na\'viteri’, ‘LN Forum’, ‘Activist Survival Guide’), ' +
			'the URL (e.g., the link to the specific Na\'viteri blog post), ' +
			'the date (when the source was published, in yyyy-mm-dd format), ' +
			'and optionally a short remark explaining what aspect of the word was ' +
			'clarified by this source (this is useful when a word has more than one source). ' +
			'The elements are separated by pipes, for example: ' +
			'Na\'viteri | https://... | 2022-07-10 | clarified stress.')
		sourceField.setMinCount(0);
		sourceField.setMaxCount(Infinity);
		this.fields.push(sourceField);*/

		for (let field of this.fields) {
			field.render();
		}

		this.jsonToFields();
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
