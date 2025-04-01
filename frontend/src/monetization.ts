export function initializeMonetization() {
	$('body').on('click', '#monetization-optout-button', () => {
		$('#monetization-modal').modal('show');
		$('#monetization-continue-button').on('click', () => {
			window.location.replace('/?q=fleltrr');
		});
	});
}

const ads: string[] = [
	'<p>Getting bored of Na\'vi? Try learning Toki Pona instead &ndash; fewer words, less hassle!</p>',
	'<p style="font-family: Exo;">Unobtanium now available for only $250,000 per ounce!</p><img src="/images/txantsan/rda.png">'
];

export function generateAd() {
	const adIndex = Math.floor(Math.random() * ads.length);
	const adString = ads[adIndex];
	const $ad = $('<div/>').addClass('txantsan').html(adString);
	$ad.on('click', () => {
		window.location.replace('/?q=fleltrr');
	});
	const $adLabel = $('<div/>').text(_('ad-label'));
	const $adLabelContainer = $('<div/>').addClass('txantsan-label').append($adLabel);
	const $adContainer = $('<div/>').addClass('txantsan-container').append($adLabelContainer).append($ad);
	return $adContainer;
}
