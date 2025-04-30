// Some simple routines that allow editing the data in data/words.json, and
// storing the history of these edits in data/history.json.

import fs from 'fs';
//import db from './db'; here as an example but maybe should do manually

function readJson(): WordData[] {
	return JSON.parse(fs.readFileSync('./data/words.json', 'utf8'));
}

function writeJson(json: WordData[]): void {
	return fs.writeFileSync("./data/words.json", JSON.stringify(json));
}

export function getWordData(id: number): WordData {
	const json = readJson();
	const idx = json.findIndex((w) => w.id == id);
	if (idx == -1) {
		throw Error('Tried to get word data for a non-existing ID');
	}
	const data = json[idx];
	return data;
}

export function updateWordData(id: number, newData: WordData, user: Express.User): void {
	const json = readJson();
	const idx = json.findIndex((w) => w.id == id);
	if (idx == -1) {
		throw Error('Tried to get word data for a non-existing ID');
	}
	const data = json[idx];
	if (!data) {
		throw Error('Tried to update word data for a non-existing ID');
	}
	if (newData['id'] !== id) {
		throw Error('Tried to update word data containing the incorrect ID');
	}
	json[idx] = newData;
	writeJson(json);

	// add history entry
	let history = JSON.parse(fs.readFileSync('./data/history.json', 'utf8'));
	history.push({
		'user': user['username'],
		'date': new Date(),
		'id': id,
		'old': data,
		'data': newData
	});
	fs.writeFileSync("./data/history.json", JSON.stringify(history));
}
export function deleteWordData(id: number, user: Express.User): void {
	const json = readJson();
	const idx = json.findIndex((w) => w.id == id);
	if (idx == -1) {
		throw Error('Tried to get delete data for a non-existing ID');
	}
	const data = json[idx];
        json.splice(idx,1);
	writeJson(json);
        console.log("deleted data",data);

	// add history entry
	let history = JSON.parse(fs.readFileSync('./data/history.json', 'utf8'));
	history.push({
		'user': user['username'],
		'date': new Date(),
		'id': id,
		'deleted': 1,
		'data': data
	});
	fs.writeFileSync("./data/history.json", JSON.stringify(history));
	//db.run('delete from favorite_words where vocab = ?',id);
	//db.run('delete from vocab_status where vocab = ?',id);
}

export function insertWordData(newData: WordData, user: Express.User): void {
	const json = readJson();
	const id = json[json.length-1]['id']+1;
        
	if (newData['id'] !== -1) {
		throw Error('Tried to insert word data already containing an ID');
	}
	newData['id'] = id;
	json.push(newData);
	writeJson(json);

	// add history entry
	let history = JSON.parse(fs.readFileSync('./data/history.json', 'utf8'));
	history.push({
		'user': user['username'],
		'date': new Date(),
		'id': id,
		'data': newData
	});
	fs.writeFileSync("./data/history.json", JSON.stringify(history));
}

export function getAll(): WordData[] {
	return readJson();
}

export function getUntranslated(language: string): WordData[] {
	const json = readJson();
	let results: WordData[] = [];

	wordLoop:
	for (let w in json) {
		let word = json[w];
		for (let translation of word['translations']) {
			if (!translation.hasOwnProperty(language) ||
				translation[language].length === 0) {
				results.push(word);
				continue wordLoop;
			}
		}
	}

	return results;
}
