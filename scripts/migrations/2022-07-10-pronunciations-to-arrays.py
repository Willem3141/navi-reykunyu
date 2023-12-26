import json
import sys

with open('words.json') as dict_file:
    words = json.load(dict_file)

for key in words.keys():
    word = words[key]
    if 'pronunciation' in word:
        pronunciation = word['pronunciation']
        word['pronunciation'] = [{
            'syllables': pronunciation[0],
            'stressed': pronunciation[1]
        }]
        if len(pronunciation) >= 3:
            word['pronunciation'][0]['audio'] = pronunciation[2]

with open('words-updated.json', 'w') as dict_file:
    json.dump(words, dict_file)
