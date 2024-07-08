// Some simple routines that allow editing the data in data/words.json.

module.exports = {
	'getWordData': getWordData,
	'updateWordData': updateWordData,
}

const fs = require('fs');
const output = require('./output');

function readJson() {
	return JSON.parse(fs.readFileSync("./data/words.json"));
}

function writeJson(json) {
	return fs.writeFileSync("./data/words.json", JSON.stringify(json));
}

function getWordData(id) {
	const json = readJson();
	const data = json[id];
	if (!data) {
		throw Error('Tried to get word data for a non-existing ID');
	}
	return data;
}

function updateWordData(id, newData, user) {
	const json = readJson();
	const data = json[id];
	if (!data) {
		throw Error('Tried to update word data for a non-existing ID');
	}
	json[id] = newData;
	writeJson(json);

	// add history entry
	let history = JSON.parse(fs.readFileSync("./data/history.json"));
	history.push({
		'user': user,
		'date': new Date(),
		'id': id,
		'old': data,
		'data': newData
	});
	fs.writeFileSync("./data/history.json", JSON.stringify(history));
}
