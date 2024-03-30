$(function () {
	// initialize UI elements
	$('#tab-help-page-bar .item').on('click', function() {
		$('#tab-help-page-bar .item').removeClass('active');
		$(this).addClass('active');
		let id = $(this).attr('id');
		$('.page').hide();
		$('#' + id.substring(0, id.length - 4) + '-page').show();
	});
});

