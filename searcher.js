
var fs = require('fs');

var convert = require('./convert');
var nouns = require('./nouns');
var verbs = require('./verbs');

module.exports = {
	getResponsesFor: getResponsesFor
};

var dictionary = {};
fs.readdirSync("../navi-reykunyu/aylì'u").forEach(file => {
	let wordData;
	try {
		wordData = (JSON.parse(fs.readFileSync("../navi-reykunyu/aylì'u/" + file, 'utf8')));
	} catch (e) {
		console.log("error when reading " + file + "; ignoring");
		return;
	}
	wordData["sentences"] = [];
	dictionary[wordData["na'vi"].toLowerCase() + ":" + wordData["type"]] = wordData;
});

function simplifiedTranslation(translation) {
	let result = "";
	
	for (let i = 0; i < translation.length; i++) {
		if (i > 0) {
			result += "; ";
		}
		result += translation[i]["en"].split(",")[0];
	}
	
	return result;
}

for (word in dictionary) {
	if (dictionary.hasOwnProperty(word)) {
		
		let etymologyList = dictionary[word]["etymology"];
		if (etymologyList) {
			for (let i = 0; i < etymologyList.length; i++) {
				let word = dictionary[etymologyList[i]];
				if (word) {
					etymologyList[i] = {
						"na'vi": word["na'vi"],
						"translations": simplifiedTranslation(word["translations"])
					}
				}
			}
		}
		
		let seeAlsoList = dictionary[word]["seeAlso"];
		if (seeAlsoList) {
			for (let i = 0; i < seeAlsoList.length; i++) {
				let word = dictionary[seeAlsoList[i]];
				if (word) {
					seeAlsoList[i] = {
						"na'vi": word["na'vi"],
						"translations": simplifiedTranslation(word["translations"])
					}
				}
			}
		}
	}
}

function getResponsesFor(query) {
	let results = [];
	
	// first split query on spaces to get individual words
	const spacesRegex = /\s+/g;
	let queryWords = query.split(spacesRegex);
	
	for (let i = 0; i < queryWords.length; i++) {
		let wordResults = [];
		let queryWord = queryWords[i];
		queryWord = queryWord.replace(/[ .,!?]+/g, "");
		queryWord = queryWord.toLowerCase();

		// handle conjugated nouns
		let nounResults = nouns.parse(queryWord);
		nounResults.forEach(function(result) {
			if (dictionary.hasOwnProperty(result[1] + ":n")) {
				let word = JSON.parse(JSON.stringify(dictionary[result[1] + ":n"]));
				word["conjugated"] = result;
				wordResults.push(word);
			}
		});

		// handle conjugated verbs
		// TODO
		//let verbResults = verbs.parse(queryWord);
		
		// then other word types
		for (word in dictionary) {
			if (dictionary.hasOwnProperty(word)) {
				if (dictionary[word]["na'vi"] === queryWord && dictionary[word]["type"] !== "n") {
					wordResults.push(dictionary[word]);
				}
			}
		}

		results.push({
			"tìpawm": queryWord,
			"sì'eyng": wordResults
		});
	}
	
	return results;
}
