$(() => {
	let $snowLayer = $('#snow-layer');

	let ayupxare = [
		"Ftxozäri aylrrtok!",
		"Ftxozäri aylrrtok!",
		"Ftxozäri aylrrtok nìmun!",
		"Sar Reykunyut a fì'uri irayo!",
		"Sunu ngaru herwì srak?",
		"♫ Tewti ma utral, ngeyä ayrìk leiu lor! ♪",
		"Ya sleru txawew!",
		"Lu herwìva apxay!",
		"♪ Txon amawey, txon a'eoio. Fratseng lu atan, fnu frapo! ♫",
		"Fpìl oe, herwì zup nì'it nìhawng set...",
		"Nari si! Txanfwerwì za'u!",
		"Herwì oeru leyr serengi...",
		"Rutxe ftang!",
		"Nìngay srak?",
		"Tarep!",
		"Pelun nga var sivung herwìti?",
		"Fìfya ke tsun fko ivinan pamrelit...",
		"Reykunyu sleru hertxayo!",
		"Ngeyä eltu lefngap slu kì'ong li srak?",
		"Kawkrr mì sìrey ke tsole'a oel herwìti a 'eko fìtxan!",
	];

	function maybeAddSnowflake() {
		if (Math.random() < 0.2) {
			addSnowflake();
		}
	}

	function addSnowflake() {
		let size = 10 + Math.tan(Math.random() * 1.5) * 5;
		let $flake = $('<div/>')
			.addClass('flake')
			.css('left', Math.random() * 100 + '%')
			.css('width', size)
			.css('height', size)
			.css('margin-left', -size / 2 + 'px')
			.css('margin-top', -size / 2 + 'px')
			.css('animation',
				'fallingFlake linear ' + (4 + Math.random() * 2) + 's both, ' +
				'windWave alternate infinite ' + (0.8 + Math.random() * 0.4) + 's ease-in-out')
			.appendTo($snowLayer);

		$flake.on('animationend', () => {
			$flake.css('animation-play-state', 'paused');
		});

		setTimeout(() => {
			$flake.remove();
		}, 120 * 1000);
	}

	let i = 0;

	$('#snow-button').on('click', () => {
		addSnowflake();
		setInterval(maybeAddSnowflake, 100);

		$('#snow-button').popup({
			content: ayupxare[0],
			position: 'bottom center'
		});
		$('#snow-button').popup('show');

		$('#snow-button').attr('data-content', ayupxare[i]);
		$('#snow-button').popup('change content', ayupxare[i]);
		$('#snow-button').popup('reposition');
		i++;
		if (i >= ayupxare.length) {
			i = 9;
		}
	});
});
