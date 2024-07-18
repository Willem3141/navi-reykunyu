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
		generated_word = ''
		i = 0
		for letter in joined_syllables:
			if letter in ['[', ']', '/']:
				generated_word += letter
			else:
				if word["na'vi"][i].isupper():
					generated_word += letter.upper()
				else:
					generated_word += letter
				i += 1

		word["na'vi"] = generated_word
		return True

	return False

with open('data/words-old.json', encoding='utf-8') as dict_file:
	old_words = json.load(dict_file)

words = []

keys = list(old_words.keys())
keys.sort()

id_to_key_map = {}
key_to_id_map = {}
to_review = []
for key in old_words.keys():
	word = old_words[key]
	word['id'] = len(words)
	id_to_key_map[word['id']] = key
	key_to_id_map[key] = word['id']
	if not update_navi_with_pronunciation(word):
		to_review.append([word['id'], word["na'vi"] + ':' + word['type']])
	words.append(word)

print('\x1b[1mWords for pronunciation review:\x1b[0m')
for word in to_review:
	print(word[1] + '  →  ' + 'https://reykunyu.lu/edit?word=' + str(word[0]))

with open('data/words.json', 'w', encoding='utf-8') as dict_file:
	json.dump(words, dict_file)

with open('data/id-to-key-map.json', 'w', encoding='utf-8') as map_file:
	json.dump(id_to_key_map, map_file)

with open('data/key-to-id-map.json', 'w', encoding='utf-8') as map_file:
	json.dump(key_to_id_map, map_file)
