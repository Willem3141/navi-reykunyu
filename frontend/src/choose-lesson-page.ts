import { Page } from './study';

export class ChooseLessonPage implements Page {
	$element: JQuery;

	constructor() {
		this.$element = $('<div/>').html('hoi!');
	}
}
