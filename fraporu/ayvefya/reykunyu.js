$(function() {
	$('#search-form').submit(sngäiTìfwusew);
});

// tìng fnelä tstxoti angim
// fnel - fnelä tstxo apup (natkenong "n", "vtr")
function tstxoFnelä(fnel) {
	let ngimaAyfnel = {
		"n": "noun",
		"n:unc": "noun/uncountable",
		"n:si": "verb/si",
		"n:pr": "noun/proper name",
		"pn": "pronoun",
		"adj": "adjective",
		"num": "numeral",
		"adv": "adverb",
		"adp": "adposition",
		"intj": "interjection",
		"part": "particle",
		"conj": "conjunction",
		"ctr": "F-word",
		"v:?": "verb/unknown type",
		"v:in": "verb/intransitive",
		"v:tr": "verb/transitive",
		"v:m": "verb/modal",
		"v:si": "verb/si",
		"v:c": "verb/copula",
		"phr": "phrase",
	}
	if (ngimaAyfnel[fnel]) {
		return ngimaAyfnel[fnel];
	}
	return "no idea.../ngaytxoa";
}

// ngop pätsìt a oeyktìng fnelit lì'uä
// fnel - fnelä tstxo apup (natkenong "n", "v:tr")
function ngopFneläPätsìt(fnel) {
	fnel = tstxoFnelä(fnel).split('/');
	let $pätsì = $('<span/>').addClass('type ui tag label').text(fnel[0]);
	if (fnel.length > 1) {
		$pätsì.append($('<div/>').addClass('detail').text(fnel[1]));
	}
	return $pätsì;
}

// ngop tìoeyktìngit lì'upamä lì'uä
// aylìkong - aylì'kong lì'uä, fa pamrel a'aw (natkenong "lì-u-pam")
// lìupam - holpxay lì'kongä a takuk lì'upam tsatseng ('awvea lì'kong: 1, muvea lì'kong: 2, saylahe)
// fnel - fnel lì'uä (kin taluna txo fnel livu "n:si", tsakrr zene sivung lì'ut alu " si")
function pronunciationSection(aylìkong, lìupam, fnel) {
	let $section = $('<div/>').addClass('result-item pronunciation');
	let $header = $('<div/>').addClass('header').text('Pronunciation').appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);

	let $tìlam = $('<span/>').addClass('stress').appendTo($body);
	
	aylìkong = aylìkong.split("-");
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
	if (fnel === "n:si") {
		$tìlam.append(" si");
	}
	
	return $section;
}

// ngop sästarsìmit aysätareyä
// aysätare - sästarsìm aylì'uä a tare fìlì'ut
function seeAlsoSection(seeAlso) {
	let $aysätare = $('<div/>').addClass('result-item see-also');
	$aysätare.append($('<div/>').addClass('header').text('See also'));
	let $aysätareTxin = $('<div/>').addClass('body');

	for (let i = 0; i < seeAlso.length; i++) {
		if (i > 0) {
			$aysätareTxin.append(', ');
		}
		let link = seeAlso[i];
		$aysätareTxin.append($('<a/>').addClass('word-link').text(link["na'vi"]));
		$aysätareTxin.append(' (' + link.tìralpeng + ')');
	}

	$aysätare.append($aysätareTxin);
	return $aysätare;
}

// ngop hapxìt a wìntxu fya'ot a leykatem tstxolì'uti
function nounConjugationSection(word, type, uncountable) {
	let $section = $('<div/>').addClass('result-item conjugation');
	let $header = $('<div/>').addClass('header').text('Conjugated forms').appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);

	let $table = $('<table/>').addClass('conjugation-table').appendTo($body);

	let $headerRow = $('<tr/>').appendTo($table);
	let headers = ["", "singular", "dual", "trial", "plural <span class='muted'>(&gt; 3)</span>"];
	for (let i = 0; i < 5; i++) {
		$('<td/>').addClass('column-title').html(headers[i]).appendTo($headerRow);
	}

	let cases = ["subjective", "agentive", "patientive", "dative", "genitive", "topical"]
	let caseFunctions = [subjective, agentive, patientive, dative, genitive, topical]
	let plurals = [word, dual(word), trial(word), plural(word)]
	for (let i = 0; i < 6; i++) {
		let $row = $('<tr/>').appendTo($table);
		$('<td/>').addClass('row-title').html(cases[i]).appendTo($row);
		for (let j = 0; j < 4; j++) {
			if (uncountable && j > 0) {
				$('<td/>').html("&ndash;").appendTo($row);
			} else {
				$('<td/>').html(caseFunctions[i](plurals[j])).appendTo($row);
			}
		}
	}

	return $section;
}

// ngop hapxìt a wìntxu fya'ot a leykatem syonlì'uti
function adjectiveConjugationSection(word, type) {
	let $section = $('<div/>').addClass('result-item conjugation');
	let $header = $('<div/>').addClass('header').text('Forms').appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);

	let html = "&lt;noun&gt; " + prefixed(word);
	html += "&nbsp;&nbsp;<span class='muted'>or</span>&nbsp;&nbsp;";
	html += suffixed(word) + " &lt;noun&gt;";
	$body.html(html);

	return $section;
}

// ngop hapxìt a wìntxu hemlì'uvit
function infixesSection(infixes) {
	let $section = $('<div/>').addClass('result-item conjugation');
	let $header = $('<div/>').addClass('header').text('Infix positions').appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);
	infixes = infixes.replace(".", "<span class='infix'>&#x2039;1&#x203a;</span>");
	infixes = infixes.replace(".", "<span class='infix'>&#x2039;2&#x203a;</span>");
	$body.html(infixes);
	return $section;
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

				$lemma = $('<span/>').addClass('lemma').appendTo($resultWord);
				$lemma.text(r["na'vi"]);
				if (r["type"] === "n:si") {
					$lemma.append(" si");
				}
				$resultWord.append(ngopFneläPätsìt(r["type"]));
				$resultWord.appendTo($result);

				let $resultDefinition = $('<div/>').addClass('result-item definition').text(r['translations']['en']);
				$resultDefinition.appendTo($result);

				$result.append(pronunciationSection(r["pronunciation"], r["stressed"], r["type"]));

				if (r["type"] === "n") {
					$result.append(nounConjugationSection(r["na'vi"], r["type"], false));
				} else if (r["type"] === "n:unc" || r["type"] === "n:pr") {
					$result.append(nounConjugationSection(r["na'vi"], r["type"], true));
				} else if (r["type"] === "adj") {
					$result.append(adjectiveConjugationSection(r["na'vi"], r["type"]));
				}

				if (r["infixes"]) {
					$result.append(infixesSection(r["infixes"]));
				}

				if (r["seeAlso"]) {
					$result.append(seeAlsoSection(r["seeAlso"]));
				}

				$result.appendTo($results);
			}
		})
		.fail(function() {
			$('#results').html('Uh-oh');
		});
	return false;
}

