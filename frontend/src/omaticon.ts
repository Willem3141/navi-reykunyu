export function initializeOmaticonButton(): void {
	const $omaticonButton = $('#omaticon-button');
	const $omaticonModal = $('#omaticon-modal');
	$omaticonButton.on('click', () => {
		$omaticonModal.modal('show');
	});

	const teams = ['fang', 'spirit', 'pulse', 'thorn'];
	for (let team of teams) {
		$('#' + team + '-button').on('click', () => {
			$omaticonModal.modal('hide');
			setTheme(team);
			if (team === 'thorn') {
				$omaticonButton.popup({
					content: _('best-team'),
					position: 'bottom center'
				});
			} else {
				$omaticonButton.popup('remove popup');
			}
		});
	}
}

function setTheme(theme: string): void {
	const $body = $('body');
	$body.attr('class')!.split(/\s+/).forEach((c: string) => {
		if (c.startsWith('theme-')) {
			$body.removeClass(c);
		}
	});
	$body.addClass('theme-' + theme);
}
