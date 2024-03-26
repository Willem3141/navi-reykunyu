import json
import sys

def update_navi_with_pronunciation(word):
	if 'pronunciation' not in word:
		return False
	pronunciation = word['pronunciation']
	if len(pronunciation) != 1:
		return False

	pronunciation = pronunciation[0]
	syllables = pronunciation['syllables'].lower().split('-')
	if pronunciation['stressed'] and len(syllables) > 1:
		syllables[pronunciation['stressed'] - 1] = '[' + syllables[pronunciation['stressed'] - 1] + ']'
	joined_syllables = '/'.join(syllables)

	if joined_syllables.replace('[', '').replace(']', '').replace('/', '').replace('ù', 'u') == word["na'vi"].lower():
		print(joined_syllables)
		word["na'vi"] = joined_syllables
		return True

	return False

with open('data/words-old.json', encoding='utf-8') as dict_file:
	old_words = json.load(dict_file)

words = []

keys = list(old_words.keys())
keys.sort()

for key in old_words.keys():
	word = old_words[key]
	word['id'] = len(words)
	if not update_navi_with_pronunciation(word):
		print(word["na'vi"] + ':' + word['type'])
	words.append(word)

with open('data/words.json', 'w', encoding='utf-8') as dict_file:
	json.dump(words, dict_file)
