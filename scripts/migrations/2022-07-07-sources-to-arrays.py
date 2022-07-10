import json
import sys

with open('words.json') as dict_file:
    words = json.load(dict_file)

for key in words.keys():
    word = words[key]
    if 'source' in word:
        if type(word['source']) == str:
            word['source'] = [[word['source']]]
        elif type(word['source']) == list:
            word['source'] = [word['source']]
        else:
            print('weird source value for ' + key, file=sys.stderr)

with open('words-updated.json', 'w') as dict_file:
    json.dump(words, dict_file)
