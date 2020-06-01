$(function() {
	$('#search-form').submit(sngäiTìfwusew);

	$('.ui.search').search({
		apiSettings: {
			url: 'api/mok?tìpawm={query}'
		},
		maxResults: 0,
		searchDelay: 0,
		selector: {
			'prompt': '#search-box'
		},
		showNoResults: false,
		onSelect: function(result) {
			$('#search-box').val(result['title']);
			sngäiTìfwusew();
			return false;
		}
	});
});

$('.ui.checkbox').checkbox();
$('.ui.dropdown').dropdown();
$('#settings-button').on("click", function() {
	$('#settings-modal').modal("show");
});
$('#credits-button').on("click", function() {
	$('#credits-modal').modal("show");
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
		"adp:len": "adposition/leniting",
		"intj": "interjection",
		"part": "particle",
		"conj": "conjunction",
		"ctr": "F-word",
		"v:?": "verb/unknown type",
		"v:in": "verb/intransitive",
		"v:tr": "verb/transitive",
		"v:m": "verb/modal",
		"v:si": "verb/si",
		"v:cp": "verb/copula",
		"phr": "phrase",
		"inter": "interrogative",
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
	} else if (wordStatus === "unofficial") {
		$pätsì.text("unofficial word");
		$pätsì.addClass("unofficial");
	} else if (wordStatus === "loan") {
		$pätsì.text("loanword");
		$pätsì.addClass("loan");
	}
	return $pätsì;
}

function nounConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');
	
	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

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

function verbConjugationExplanation(conjugation) {
	let $conjugation = $('<div/>').addClass('conjugation-explanation');

	$('<span/>').addClass('operator').html('&rarr;').appendTo($conjugation);

	$('<span/>').text(conjugation[1]).appendTo($conjugation);

	for (let i = 0; i < 3; i++) {
		if (conjugation[2][i]) {
			$('<span/>').addClass('operator').text('+').appendTo($conjugation);
			$('<span/>').addClass('infix').html("&#x2039;" + conjugation[2][i] + "&#x203a;").appendTo($conjugation);
		}
	}
	
	$('<span/>').addClass('operator').text('=').appendTo($conjugation);
	$('<span/>').addClass('word').text(conjugation[0]).appendTo($conjugation);

	return $conjugation;
}

function externalLenitionExplanation(lenition) {
	let $lenition = $('<div/>').addClass('lenition-explanation');
	
	$('<span/>').addClass('operator').html('&rarr;').appendTo($lenition);

	$('<span/>').text(lenition["by"]).appendTo($lenition);
	$('<span/>').addClass('operator').text('+').appendTo($lenition);
	$('<span/>').text(lenition["from"]).appendTo($lenition);
	
	$('<span/>').addClass('operator').text('=').appendTo($lenition);

	$('<span/>').addClass('word').text(lenition["by"] + " " + lenition["to"]).appendTo($lenition);
	
	return $lenition;
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
	if (lìupam.length === 0) {
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

	if (typeof etymology === "string") {
		$etymology.append(etymology);
	} else {
		$etymology.append('From ');
		for (let i = 0; i < etymology.length; i++) {
			if (i > 0) {
				$etymology.append(' + ');
			}
			let link = etymology[i];
			$etymology.append(createWordLink(link));
		}
		$etymology.append('.');
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
function nounConjugationSection(conjugation, note) {
	console.log(conjugation);
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
	for (let i = 0; i < 6; i++) {
		let $row = $('<tr/>').appendTo($table);
		$('<td/>').addClass('row-title').html(cases[i]).appendTo($row);
		for (let j = 0; j < 4; j++) {
			if (conjugation[j].length === 0) {
				$('<td/>').html("&ndash;").appendTo($row);
				continue;
			}

			let c = conjugation[j][i];
			if (!c) {
				$('<td/>').html("&ndash;").appendTo($row);
				continue;
			}

			let formatted = "";
			c = c.split(";");
			for (let k = 0; k < c.length; k++) {
				if (k > 0) {
					formatted += " <span class='muted'>or</span> ";
				}

				let m = c[k].match(/(.*-\)?)(.*)(-.*)/);

				if (m) {
					if (m[1] !== "-") {
						formatted += "<span class='prefix'>" + m[1] + "</span>";
					}
					formatted += m[2].replace(/\{(.*)\}/, "<span class='lenition'>$1</span>");
					if (m[3] !== "-") {
						formatted += "<span class='suffix'>" + m[3] + "</span>";
					}
				} else {
					formatted += c[k];
				}
			}

			$('<td/>').html(formatted).appendTo($row);
		}
	}

	if (note) {
		$body.append($('<div/>').addClass("conjugation-note").html(note));
	}

	return $section;
}

function createNounConjugation(word, type, uncountable) {

	let conjugation = [];
	let caseFunctions = [subjective, agentive, patientive, dative, genitive, topical]
	let plurals = [singular(word), dual(word), trial(word), plural(word)]

	for (let j = 0; j < 4; j++) {
		let row = [];
		if (!uncountable || j === 0) {
			for (let i = 0; i < 6; i++) {
				row.push(caseFunctions[i](plurals[j]));
			}
		}
		conjugation.push(row);
	}

	return conjugation;
}

// ngop hapxìt a wìntxu fya'ot a leykatem syonlì'uti
function adjectiveConjugationSection(word, type, note) {
	let $section = $('<div/>').addClass('result-item conjugation');
	let $header = $('<div/>').addClass('header').text('Attributive forms').appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);

	let html = "&lt;noun&gt; " + prefixed(word);
	html += "&nbsp;&nbsp;<span class='muted'>or</span>&nbsp;&nbsp;";
	html += suffixed(word) + " &lt;noun&gt;";
	$body.html(html);

	if (note) {
		$body.append($('<div/>').addClass("conjugation-note").html(note));
	}

	return $section;
}

// ngop hapxìt a wìntxu hemlì'uvit
function infixesSection(infixes, note) {
	let $section = $('<div/>').addClass('result-item conjugation');
	let $header = $('<div/>').addClass('header').text('Infix positions').appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);
	infixes = infixes.replace(".", "<span class='root-infix'>&#x2039;1&#x203a;</span>");
	infixes = infixes.replace(".", "<span class='root-infix'>&#x2039;2&#x203a;</span>");
	$body.html(infixes);
	if (note) {
		$body.append($('<div/>').addClass("conjugation-note").html(note));
	}
	return $section;
}

function createSentence(sentence, lemma) {
	let $sentence = $('<div/>').addClass("sentence");
	let $original = $('<div/>').addClass("original").appendTo($sentence);
	let $translation = $('<div/>').addClass("translation").appendTo($sentence);

	let englishHighlights = [];

	for (let i = 0; i < sentence["navi"].length; i++) {
		if (i > 0) {
			$original.append(" ");
		}
		if (sentence["naviWords"][i] === lemma) {
			englishHighlights = sentence["mapping"][i].split(",");
			$original.append($("<span/>").addClass("highlight").text(sentence["navi"][i]));
		} else {
			$original.append(sentence["navi"][i]);
		}
	}

	for (let i = 0; i < sentence["english"].length; i++) {
		if (i > 0) {
			$translation.append(" ");
		}
		if (englishHighlights.includes("" + (i + 1))) {
			$translation.append($("<span/>").addClass("highlight").text(sentence["english"][i]));
		} else {
			$translation.append(sentence["english"][i]);
		}
	}

	return $sentence;
}

function sentencesSection(sentences, lemma) {
	let $section = $('<div/>').addClass('result-item examples');
	let $header = $('<div/>').addClass('header').text('Usage examples').appendTo($section);
	let $body = $('<div/>').addClass('body').appendTo($section);

	for (let i = 0; i < sentences.length; i++) {
		$body.append(createSentence(sentences[i], lemma));
	}

	return $section;
}

// creates a block showing a result
// i -- id of the result, 0-based (to be shown as the number in front of the
//      result)
// r -- the result itself
// query -- the query that the user searched for
function createResultBlock(i, r, query) {
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

	if ((r["type"] === "n" || r["type"] === "n:pr" || r.hasOwnProperty("conjugation")) && r["conjugated"][0].toLowerCase() !== r["conjugated"][1].toLowerCase()) {
		$resultWord.append(nounConjugationExplanation(r["conjugated"]));
	}
	if (r["type"].substring(0, 2) === "v:" && r["conjugated"][0].toLowerCase() !== r["conjugated"][1].toLowerCase()) {
		$resultWord.append(verbConjugationExplanation(r["conjugated"]));
	}

	if (r["externalLenition"] && r["externalLenition"]["from"].toLowerCase() !== r["externalLenition"]["to"].toLowerCase()) {
		$resultWord.append(externalLenitionExplanation(r["externalLenition"]));
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

	if (r["conjugation"]) {
		$result.append(nounConjugationSection(r["conjugation"]["forms"], r["conjugation_note"]));
	} else if (r["type"] === "n") {
		$result.append(nounConjugationSection(createNounConjugation(r["na'vi"], r["type"], false), r["conjugation_note"]));
	} else if (r["type"] === "adj") {
		$result.append(adjectiveConjugationSection(r["na'vi"], r["type"], r["conjugation_note"]));
	}

	if (r["infixes"]) {
		$result.append(infixesSection(r["infixes"], r["conjugation_note"]));
	}

	if (r["sentences"].length > 0) {
		$result.append(sentencesSection(r["sentences"], r["na'vi"] + ":" + r["type"]));
	}

	if (r["source"]) {
		$result.append(sourceSection(r["source"]));
	}

	if (r["seeAlso"]) {
		$result.append(seeAlsoSection(r["seeAlso"]));
	}

	return $result;
}

function createErrorBlock(text, subText) {
	let $error = $('<div/>').addClass('error');
	$('<p/>').addClass('error-text').html(text).appendTo($error);
	$('<img/>').addClass('error-icon').attr("src", "/ayrel/ke'u.svg").appendTo($error);
	$('<p/>').addClass('error-subText').html(subText).appendTo($error);
	return $error;
}

function createResults(results) {
	console.log(results);
	if (results["sì'eyng"].length) {
		for (let i = 0; i < results["sì'eyng"].length; i++) {
			$results.append(createResultBlock(i, results["sì'eyng"][i], results["tìpawm"]));
		}
	} else {
		$results.append(createErrorBlock("No results found", "Please make sure you are searching for a Na'vi word. At the moment, Reykunyu is Na'vi-to-English only."));
	}
}

function getShortTranslation(result) {
	if (result["short_translation"]) {
		return result["short_translation"];
	}

	let translation = result["translations"][0]["en"];
	translation = translation.split(',')[0];
	translation = translation.split(';')[0];
	translation = translation.split(' (')[0];

	if (result["type"][0] === "v"
		&& translation.indexOf("to ") === 0) {
		translation = translation.substr(3);
	}

	return translation;
}

function createSentenceBarItem(result) {
	let $item = $('<a/>').addClass('item');
	let $itemContainer = $('<div/>').appendTo($item);
	$('<div/>').addClass('navi')
		.text(result["tìpawm"])
		.appendTo($itemContainer);

	let definitionCount = result["sì'eyng"].length;
	if (definitionCount === 0) {
		$('<div/>').addClass('more')
			.text("(not found)")
			.appendTo($itemContainer);
		return $item;
	}

	for (let i = 0; i < Math.min(2, definitionCount); i++) {
		let $definitionLabel = $('<div/>').addClass('definition')
			.appendTo($itemContainer);
		$('<div/>').addClass("ui horizontal label")
			.text(result["sì'eyng"][i]["type"])
			.appendTo($definitionLabel);
		$definitionLabel.append(getShortTranslation(result["sì'eyng"][i]));
	}

	if (definitionCount > 2) {
		$('<div/>').addClass('more')
			.text("(" + (definitionCount - 2) + " more)")
			.appendTo($itemContainer);
	}

	return $item;
}

// fìvefyat sar fkol mawfwa saryu pamrel soli tìpawmur
function sngäiTìfwusew() {
	$('.ui.search').search('hide results');
	$results = $('#results');
	$results.empty();
	$sentenceBar = $('#sentence-bar');
	$sentenceBar.empty();
	let tìpawm = $('#search-box').val();
	$.getJSON('/api/fwew', {'tìpawm': tìpawm})
		.done(function(tìeyng) {
			console.log(tìeyng);

			$results.empty();

			$results.append(createResults(tìeyng[0]));

			// more than one word was found
			if (tìeyng.length > 1) {
				$sentenceBar.show();
			} else {
				$sentenceBar.hide();
			}

			for (let i = 0; i < tìeyng.length; i++) {
				let $item = createSentenceBarItem(tìeyng[i]);
				if (i === 0) {
					$item.addClass("active");
				}
				$sentenceBar.append($item);
				let result = tìeyng[i];
				$item.on("click", function() {
					$("#sentence-bar .item").removeClass("active");
					$item.addClass("active");
					$results.empty();
					$results.append(createResults(result));
				});
			}
		})
		.fail(function() {
			$sentenceBar.empty();
			$results.empty();
			$results.append(createErrorBlock("Something went wrong while searching", "Please try again later. If the problem persists, please <a href='//wimiso.nl/contact'>contact</a> me."));
		});
	return false;
}

