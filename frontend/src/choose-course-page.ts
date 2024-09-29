import { Page } from './study';

export class ChooseCoursePage implements Page {
	$element: JQuery;

	constructor(onCourseChosen: (course: Course) => void) {
		this.$element = $('<div/>');
		$('<h3/>').html(_('pick-a-course')).appendTo(this.$element);
		$('<p/>').html(_('pick-a-course-note')).appendTo(this.$element);

		$.get('/api/srs/courses', (courses: Course[]) => {
			const $courses = $('<ul/>').addClass('courses-list').appendTo(this.$element);
			for (let course of courses) {
				const $course = $('<li/>').appendTo($courses);
				$course.append($('<div/>').addClass('course-name').html(course['name']));
				$course.append($('<div/>').addClass('course-description').html(course['description']));
				$course.on('click', () => {
					onCourseChosen(course);
				});
			}
		});
	}
}
