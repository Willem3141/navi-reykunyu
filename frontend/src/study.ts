import { LearnPage } from './learn-page';

class Zeykerokyu {
	activePage!: Page;

	constructor() {
		this.switchToPage(new LearnPage((course: Course) => {
			this.switchToPage(new ChooseLessonPage(course));
		}));
	}

	switchToPage(page: Page): void {
		this.activePage = page;
		$('#main-container').empty().append(page.$element);
	}
}

export interface Page {
	$element: JQuery;
}

$(() => {
	new Zeykerokyu();
});
