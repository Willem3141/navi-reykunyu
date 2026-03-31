let wordRegex = /((\w|['])+)/g;
let vowelRegex = /[aeiou]|y(?![aeiou])/m;
export default function snailify(english: string): string {
	return english.replace(wordRegex, (word) => {
		if (['a', 'an', 'in', 'or', 'and', 'with', 'to', 'is', 'will', 'be', 'the', 'i', 'you', 'from', 'for'].includes(word.toLowerCase())) {
			return word;
		}
		let firstVowel = vowelRegex.exec(word.toLowerCase());
		if (!firstVowel) {
			return word;
		}
		if (word[0] !== word[0].toLowerCase()) {
			return 'Sn' + word[firstVowel.index].toLowerCase() + word.substring(firstVowel.index + 1);
		} else {
			return 'sn' + word.substring(firstVowel.index);
		}
	});
}
