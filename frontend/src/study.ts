class LearnPage {
	courseId: number;
	lessonId: number;

	/// All items we're supposed to show to the user. A number means the item
	/// is a word to learn; a string is a comment that we should show on a
	/// separate slide.
	items: (number | string)[];
	
	/// The index of the item we're currently showing.
	currentItemIndex = 0;

	constructor(courseId: number, lessonId: number, lesson: Lesson, items: LearnableItem[]) {
		this.courseId = courseId;
		this.lessonId = lessonId;
		this.items = [];
		if (lesson.introduction) {
			this.items.push(lesson.introduction);
		}
		for (let item of items) {
			this.items.push(item.vocab);
			if (item.comment) {
				this.items.push(item.comment);
			}
		}
		if (lesson.conclusion) {
			this.items.push(lesson.conclusion);
		}
		console.log(this.items);
	}

	render(): void {
		// TODO
		this.fetchAndSetUp();
	}

	fetchAndSetUp(): void {
		/*const itemID = this.items[this.currentItemIndex].vocab;
		$.getJSON('/api/word', { 'id': itemID }).done((wordData) => {
			this.currentItem = wordData;
			this.setUpQuestion();
		});*/
	}
}

class OverviewPage {
	constructor(courseId: number, lessonId: number, lesson: Lesson, items: LearnableItem[]) {
		// TODO
	}
	render(): void {
		// TODO
	}
}

export interface Page {
	$element: JQuery;
}

$(() => {
	const url = new URL(window.location.href);
	if (!url.searchParams.has('c')) {
		throw Error('course parameter not set');
	}
	const courseId = parseInt(url.searchParams.get('c')!, 10);
	if (isNaN(courseId)) {
		throw Error('course parameter is not an integer');
	}
	if (!url.searchParams.has('l')) {
		throw Error('lesson parameter not set');
	}
	const lessonId = parseInt(url.searchParams.get('l')!, 10);
	if (isNaN(lessonId)) {
		throw Error('lesson parameter is not an integer');
	}
	$.getJSON('/api/srs/lesson', { 'courseId': courseId, 'lessonId': lessonId }).done((lessonData) => {
		$.getJSON('/api/srs/items', { 'courseId': courseId, 'lessonId': lessonId }).done((items) => {
			$.getJSON('/api/srs/learnable', { 'courseId': courseId, 'lessonId': lessonId }).done((learnableItems) => {
				if (learnableItems.length > 0) {
					new LearnPage(courseId, lessonId, lessonData, learnableItems).render();
				} else {
					new OverviewPage(courseId, lessonId, lessonData, items).render();
				}
			});
		});
	});
});
