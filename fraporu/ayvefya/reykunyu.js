$(function() {
	$('#search-form').submit(sngäiTìfwusew);
});

// tìng fnelä tstxoti angim
// fnel - fnelä tstxo apup (natkenong "n", "vtr")
function tstxoFnelä(fnel) {
	let ngimaAyfnel = {
		"n": "noun",
		"pn": "pronoun",
		"adj": "adjective",
		"adv": "adverb",
		"adp": "adposition",
		"intj": "interjection",
		"part": "particle",
		"vin": "verb (intransitive)",
		"vtr": "verb (transitive)",
		"vm": "verb (modal)",
		"vsi": "verb (si)",
		"vc": "verb (copula)",
	}
	return ngimaAyfnel[fnel];
}

// ngop pätsìt a oeyktìng fnelit lì'uä
// fnel - fnelä tstxo apup (natkenong "n", "vtr")
function ngopFneläPätsìt(fnel) {
	return $('<span/>').addClass('type ui tag label').text(tstxoFnelä(fnel));
}

// ngop tìoeyktìngit lì'upamä lì'uä
// aylìkong - aylì'kong lì'uä, fa pamrel a'aw (natkenong "lì-u-pam")
// lìupam - holpxay lì'kongä a takuk lì'upam tsatseng ('awvea lì'kong: 1, muvea lì'kong: 2, saylahe)
function ngopLìupamit(aylìkong, lìupam) {
	let $tìlam = $('<span/>').addClass('stress');
	
	aylìkong = aylìkong.split("-");
	$tìlam.append("(");
	for (let i = 0; i < aylìkong.length; i++) {
		if (i > 0) {
			$tìlam.append("-");
		}
		let $lìkong = $('<span/>').text(aylìkong[i]);
		if (i + 1 === lìupam) {
			$lìkong.addClass("stressed");
		} else {
			$lìkong.addClass("unstressed");
		}
		$tìlam.append($lìkong);
	}
	$tìlam.append(")");
	
	return $tìlam;
}

// ngop sästarsìmit aysätareyä
// aysätare - sästarsìm aylì'uä a tare fìlì'ut
function ngopAysätaret(aysätare) {
	let $aysätare = $('<div/>').addClass('result-item see-also');
	$aysätare.append($('<div/>').addClass('header').text('See also'));
	let $aysätareTxin = $('<div/>').addClass('body');

	for (let i = 0; i < aysätare.length; i++) {
		if (i > 0) {
			$aysätareTxin.append(', ');
		}
		let sätare = aysätare[i];
		$aysätareTxin.append($('<a/>').addClass('word-link').text(sätare["na'vi"]));
		$aysätareTxin.append(' (' + sätare.tìralpeng + ')');
	}

	$aysätare.append($aysätareTxin);
	return $aysätare;
}

// fìvefyat sar fkol mawfwa saryu pamrel soli tìpawmur
function sngäiTìfwusew() {
	let tìpawm = $('#search-box').val();
	$.getJSON('fwew', {'tìpawm': tìpawm})
		.done(function(tìeyng) {
			console.log(tìeyng);

			$results = $('#results');
			$results.empty();

			for (let i = 0; i < tìeyng["sì'eyng"].length; i++) {
				let r = tìeyng["sì'eyng"][i];
				let $result = $('<div/>').addClass('result');

				let $resultWord = $('<div/>').addClass('result-word');
				$resultWord.append($('<span/>').addClass('id').text((i + 1) + '.'));
				$resultWord.append($('<span/>').addClass('lemma').text(r["na'vi"]));
				$resultWord.append(ngopFneläPätsìt(r["fnel"]));
				$resultWord.append(ngopLìupamit(r["aylì'kong"], r["lì'upam"]));
				$resultWord.appendTo($result);

				let $resultDefinition = $('<div/>').addClass('result-item definition').text(r['tìralpeng']);
				$resultDefinition.appendTo($result);

				$result.append(ngopAysätaret(r["aysätare"]));

				$result.appendTo($results);
			}
		})
		.fail(function() {
			$('#results').html('Uh-oh');
		});
	return false;
}

