import json
import sys

with open('words.json', encoding='utf-8') as dict_file:
    old_words = json.load(dict_file)

words = []

keys = list(old_words.keys())
keys.sort()

for key in old_words.keys():
    word = old_words[key]
    word['id'] = len(words)
    words.append(word)

with open('words-updated.json', 'w', encoding='utf-8') as dict_file:
    json.dump(words, dict_file)
