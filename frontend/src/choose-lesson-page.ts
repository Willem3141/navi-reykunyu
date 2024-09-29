import { Page } from './study';

export class ChooseLessonPage implements Page {
	$element: JQuery;

	constructor(course: Course) {
		this.$element = $('<div/>');
		$('<h3/>').html(course.name).appendTo(this.$element);
		$('<p/>').html(course.description).appendTo(this.$element);

		$.get('/api/srs/lessons', {'courseId': course.id}, (lessons: Lesson[]) => {
			const $lessons = $('<ul/>').addClass('vertical-list').appendTo(this.$element);
			for (let lesson of lessons) {
				const $lesson = $('<li/>').appendTo($lessons);
				$lesson.append($('<div/>').addClass('card-title').html(_('lesson') + ' ' + (lesson['id'] + 1)));
				$lesson.append($('<div/>').addClass('card-description').html(lesson['name']));
			}
		});
	}
}
