export function initializeMonetization() {
	$('body').on('click', '#monetization-optout-button', () => {
		$('#monetization-modal').modal('show');
		$('#monetization-continue-button').on('click', () => {
			window.location.replace('/?q=fleltrr');
		});
	});
}
