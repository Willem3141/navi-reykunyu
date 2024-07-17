$(function () {
	// initialize UI elements
	$('#tab-help-page-bar .item').on('click', function() {
		$('#tab-help-page-bar .item').removeClass('active');
		$(this).addClass('active');
		$('.page').hide();

		// drop "-tab" from the id and append "-page" to get the content to show
		let id = $(this).attr('id');
		$('#' + id.substring(0, id.length - 4) + '-page').show();
	});
});

