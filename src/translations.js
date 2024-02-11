module.exports = {
	'_': _,
	setLanguage: setLanguage,
	getStringsJSON: getStringsJSON,
};

const fs = require('fs');
let stringsJSON;
try {
	stringsJSON = fs.readFileSync("./src/translations.json");
} catch (e) {
	output.error('translations.json not found, exiting');
	process.exit(1);
}
let strings = JSON.parse(stringsJSON);

let lang = 'en';

function setLanguage(l) {
	lang = l;
}

function getTranslation(key) {
	if (strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(key)) {
		return strings[lang][key];
	} else if (strings['en'].hasOwnProperty(key)) {
		return strings['en'][key];
	} else {
		return '[' + key + ']';
	}
}

function _(key) {
	return '<span class="translation" data-key="' + key + '">' + getTranslation(key) + '</span>';
}

function getStringsJSON() {
	return stringsJSON;
}
