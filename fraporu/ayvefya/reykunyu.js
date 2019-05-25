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

function statusBadge(wordStatus) {
	let $pätsì = $('<span/>').addClass('status-badge');
	if (wordStatus === "unconfirmed") {
		$pätsì.text("unconfirmed word");
		$pätsì.addClass("unconfirmed");
	}
	return $pätsì;
}

function nounConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');
	
	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	console.log(conjugation);
	
	for (let i = 0; i <= 2; i++) {
		if (conjugation[2][i]) {
			$('<span/>').addClass('prefix').text(conjugation[2][i]).appendTo($conjugation);
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
		}
	}
	
	$('<span/>').text(conjugation[1]).appendTo($conjugation);
	
	for (let i = 3; i <= 6; i++) {
		if (conjugation[2][i]) {
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
			$('<span/>').addClass('suffix').text(conjugation[2][i]).appendTo($conjugation);
		}
	}
	
	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation[0]).appendTo($conjugation);
	
	return $conjugation;
}

function translationSection(sìralpeng) {
	let $section = $('<div/>').addClass('result-item definition');
	$section.text(sìralpeng[0]["en"]);
	return $section;
}

// ngop tìoeyktìngit lì'upamä lì'uä
// lìupam[0] - aylì'kong lì'uä, fa pamrel a'aw (natkenong "lì-u-pam")
// lìupam[1] - holpxay lì'kongä a takuk lì'upam tsatseng ('awvea lì'kong: 1, muvea lì'kong: 2, saylahe)
// fnel - fnel lì'uä (kin taluna txo fnel livu "n:si", tsakrr zene sivung lì'ut alu " si")
function pronunciationSection(lìupam, fnel) {
	let $tìlam = $('<span/>').addClass('stress');
	if (!lìupam) {
		$tìlam.append("(stress pattern unknown)");
		return $tìlam;
	}
	
	$tìlam.append("(");
	aylìkong = lìupam[0].split("-");
	for (let i = 0; i < aylìkong.length; i++) {
		if (i > 0) {
			$tìlam.append("-");
		}
		let $lìkong = $('<span/>').text(aylìkong[i]);
		if (aylìkong.length > 1 && i + 1 === lìupam[1]) {
			$lìkong.addClass("stressed");
		} else {
			$lìkong.addClass("unstressed");
		}
		$tìlam.append($lìkong);
	}
	if (fnel === "n:si") {
		$tìlam.append(" si");
	}
	$tìlam.append(")");
	
	return $tìlam;
}

function statusNoteSection(wordStatus, statusNote) {
	let $noteSection = $('<div/>').addClass('result-item status-note');
	if (wordStatus === "unconfirmed") {
		$noteSection.append("<b>Unconfirmed:</b> ");
		$noteSection.addClass("unconfirmed");
	}
	$noteSection.append(statusNote);
	return $noteSection;
}

function noteSection(note) {
	let $noteSection = $('<div/>').addClass('result-item note');
	$noteSection.html(note);
	return $noteSection;
}

function sourceSection(source) {
	let $sourceSection = $('<div/>').addClass('result-item see-also');
	$sourceSection.append($('<div/>').addClass('header').text('Source'));
	let $source = $('<div/>').addClass('body');
	if (typeof source === "string") {
		$source.html(source);
	} else {
		let $sourceLink = $('<a/>');
		$sourceLink.attr('href', source[1]);
		$sourceLink.html(source[0]);
		$source.append($sourceLink);
	}
	$sourceSection.append($source);
	return $sourceSection;
}

function createWordLink(link) {
	if (typeof link === "string") {
		return $('<b/>').text(link);
	} else {
		let $link = $('<span/>');
		$link.append($('<a/>').addClass('word-link').text(link["na'vi"]));
		$link.append(' (' + link["translations"] + ')');
		return $link;
	}
}

function etymologySection(etymology) {
	let $etymologySection = $('<div/>').addClass('result-item etymology');
	$etymologySection.append($('<div/>').addClass('header').text('Etymology'));
	let $etymology = $('<div/>').addClass('body');

	$etymology.append('from ');
	for (let i = 0; i < etymology.length; i++) {
		if (i > 0) {
			$etymology.append(' + ');
		}
		let link = etymology[i];
		$etymology.append(createWordLink(link));
	}

	$etymologySection.append($etymology);
	return $etymologySection;
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
		$aysätareTxin.append(createWordLink(link));
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
	let $header = $('<div/>').addClass('header').text('Attributive forms').appendTo($section);
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

				if (r["status"]) {
					$resultWord.append(statusBadge(r["status"]));
				}

				$resultWord.append(pronunciationSection(r["pronunciation"], r["type"]));
				
				if (r["type"] === "n" && r["na'vi"] !== tìeyng["tìpawm"]) {
					$resultWord.append(nounConjugationExplanation(r["conjugation"]));
				}
				
				$resultWord.appendTo($result);

				$result.append(translationSection(r["translations"]));

				if (r["meaning_note"]) {
					$result.append(noteSection(r["meaning_note"]));
				}

				if (r["status_note"]) {
					$result.append(statusNoteSection(r["status"], r["status_note"]));
				}

				if (r["etymology"]) {
					$result.append(etymologySection(r["etymology"]));
				}

				if (r["type"] === "n") {
					$result.append(nounConjugationSection(r["na'vi"], r["type"], false, r["conjugation_note"]));
				} else if (r["type"] === "n:unc" || r["type"] === "n:pr") {
					$result.append(nounConjugationSection(r["na'vi"], r["type"], true, r["conjugation_note"]));
				} else if (r["type"] === "adj") {
					$result.append(adjectiveConjugationSection(r["na'vi"], r["type"], r["conjugation_note"]));
				}

				if (r["infixes"]) {
					$result.append(infixesSection(r["infixes"], r["conjugation_note"]));
				}

				if (r["source"]) {
					$result.append(sourceSection(r["source"]));
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

