$(function() {
	loadWordList();
});

function createErrorBlock(text, subText) {
	let $error = $('<div/>').addClass('error');
	$('<p/>').addClass('error-text').html(text).appendTo($error);
	$('<img/>').addClass('error-icon').attr("src", "/ayrel/ke'u.svg").appendTo($error);
	$('<p/>').addClass('error-subText').html(subText).appendTo($error);
	return $error;
}

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

function createWordBlock(word) {
	let $block = $("<div/>");
	$block.append($('<span/>').addClass('word').text(word["na'vi"]));
	$block.append(' ');
	$block.append(pronunciationSection(word["pronunciation"]));
	$block.append(' ');
	$block.append($('<div/>').addClass("ui horizontal label").text(word["type"]));
	$block.append(' ');
	$block.append($('<span/>').addClass('translation').text(word["translations"][0]["en"]));
	return $block;
}

function loadWordList() {
	let $results = $('#word-list');
	$.getJSON('/api/frau')
		.done(function(dictionary) {
			$results.empty();

			let keys = []
			for (let key in dictionary) {
				keys.push(key);
			}
			keys.sort(Intl.Collator().compare);
			for (let i in keys) {
				let word = dictionary[keys[i]];
				$results.append(createWordBlock(word));
			}
		})
		.fail(function() {
			$results.empty();
			$results.append(createErrorBlock("Something went wrong while loading the word list", "Please try again later. If the problem persists, please <a href='//wimiso.nl/contact'>contact</a> me."));
		});
	return false;
}

