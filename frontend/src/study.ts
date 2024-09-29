import { ChooseCoursePage } from './choose-course-page';
import { ChooseLessonPage } from './choose-lesson-page';
import { LearnPage } from './learn-page';

class Zeykerokyu {
	activePage!: Page;

	constructor() {
		this.switchToPage(new ChooseCoursePage((course: Course) => {
			this.switchToPage(new ChooseLessonPage());
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
