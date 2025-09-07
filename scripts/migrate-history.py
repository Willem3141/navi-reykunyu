# This script converts Reykunyu's old history file (basically a large array of edits) to a new format where the history
# of each word is recorded individually.
#
# The desired new format:
# [
#     [
#         // history of the word with ID 0
#         {"user": "Wllìm", "date": "some ISO date", "type": "edited", data: {...}},
#         ...
#     ],
#     [
#         // history of the word with ID 1
#         {"user": "Wllìm", "date": "some ISO date", "type": "edited", comment: "Updated this and that", data: {...}},
#         ...
#     ],
#     ...
# ]
#
# Types can be "added", "edited", "migration", and (when that is implemented) "removed". The first history item for each
# word should of course be "added". The last history item should correspond to what's in words.json.
#
# This script is fairly complicated because the old history logging format changed over time.
#
# Originally, the words were in a Git repository (https://github.com/Willem3141/navi-tsim) so updates were Git commits.
# At that point no separate history log was kept. So for this period, we have to reconstruct the history by looking at
# these commits.
#
# In January 2021, Reykunyu gained an editor (see commit 4f87470). From that point words have instead been kept in a
# history file data/history.json with the following format:
#
# [
#     {"user": "Wllìm", "date": "some ISO date", "word": "kaltxì:intj", "old": {...}, "data": {...},
#     {"user": "Wllìm", "date": "some ISO date", "word": "utral:n", "data": {...},
#     ...
# ]
#
# Note: words are identified by their key (word:type) which may change over time when the word or type is changed. Newly
# added words can be distinguished because they have no "old" field.
#
# This was changed in July 2024, when words got persistent IDs. Then the history file format changed as well. The old
# file was backed up as data/history-before-id-migration.json, and a new file data/history.json was started with the new
# format:
#
# [
#     {"user": "Wllìm", "date": "some ISO date", "id": 123, "old": {...}, "data": {...},
#     {"user": "Wllìm", "date": "some ISO date", "id": 456, "old": {...}, "data": {...},
#     ...
# ]
#
# This is still the current format. At the time of the switch, the ID <-> key mapping was stored in id-to-key-map.json.
#
# ## Migrations
#
# Over time, also several migrations were run on the word database. These are not stored in the history file as they
# were run locally.
#
# * 2022-07-10: all source values were updated to arrays so that more than one source could be stored (commit 4bc8f83).
# * 2022-07-10: all pronunciation values were updated from a plain array to an object (commit 793b2fb).
# * 2024-07-18: the migration that added IDs to the words, but it also added stress and syllable marks to the na'vi
#   field (PR #133).
#
# These migrations should be added to the new history file as well with type "migration".


history = {}
words = {}
target = None
#target = 'hrh:intj'

def get_key(data):
	key = data['na\'vi'] + ':' + (data['type'] if 'type' in data else '?')
	return key.lower()

def json_equals(first, second):
	if json.dumps(first, sort_keys=True) == json.dumps(second, sort_keys=True):
		return True

	# Weirdness: it happens regularly that the navi-tsim git version has a bare string as the source, while the “old”
	# data registered in a later history entry has an array containing that same string. I'm not sure why this happens,
	# probably a bug. Hack: if this happens, we still consider the entries the same.
	if 'source' in second and type(second['source']) == list and len(second['source']) == 1:
		secondCopy = json.loads(json.dumps(second))
		if secondCopy['source'][0] == '':
			del secondCopy['source']
		else:
			secondCopy['source'] = secondCopy['source'][0]
		return json_equals(first, secondCopy)

	# Weirdness: sometimes Reykunyu inadvertently added externalLenition data to the words in the database.
	if 'externalLenition' in first:
		firstCopy = json.loads(json.dumps(first))
		del firstCopy['externalLenition']
		return json_equals(firstCopy, second)

	return False

def add_migrations(words, history, old_words_file, new_words_file, user, date, comment):
	with open(old_words_file) as old_words:
		old_words = json.load(old_words)
	with open(new_words_file) as new_words:
		new_words = json.load(new_words)

	for key in old_words:
		if key != key.lower():
			# Ignore words with capitals. These are remnants of the capitalization bug.
			continue

		if target != None and key != target: continue

		if 'x-navi' not in old_words[key]['translations'][0] and 'x-navi' in new_words[key]['translations'][0]:
			#print('!! from ')
			#print(json.dumps(old_words[key], indent=4))
			#print('!! to ')
			#print(json.dumps(new_words[key], indent=4))
			# An edit was made.
			old_word_with_xnavi = json.loads(json.dumps(old_words[key]))
			for i, translation in enumerate(old_word_with_xnavi['translations']):
				translation['x-navi'] = new_words[key]['translations'][i]['x-navi']
			if json_equals(old_words[key], old_word_with_xnavi):
				continue
			print('!! edited ' + key)
			words[key] = old_word_with_xnavi
			history[key].append(
				{
					'user': user,
					'date': date,
					'type': 'edited',
					'comment': comment,
					'data': old_word_with_xnavi
				}
			)


# Phase 1: the navi-tsim git history

import sys
import time
import json
import git
from git.objects.tree import Tree

repo = git.Repo('/home/willem/Git/navi-tsim')
EMPTY_TREE = repo.tree('4b825dc642cb6eb9a060e54bf8d69288fbee4904')
commits = list(repo.iter_commits('master', first_parent=True))
commits.reverse()
for commit in commits:
	message = str(commit.message).strip()
	if len(commit.parents) > 1:
		message = str(commit.parents[1].message).strip()
	message = message.replace('\n', '. ', 1)
	message = message.replace('\n', ' ')
	message = message.replace('  ', ' ')
	print('\033[95mCommit: \033[1m' + message + '\033[0m')

	parent = commit.parents[0] if commit.parents else EMPTY_TREE
	diff = parent.diff(commit, create_patch=False)
	for element in diff:
		if not element.b_path.startswith('aylì\'u/'):
			continue
		if element.change_type == 'A':
			print('    added ' + str(element.b_path))
			data = element.b_blob.data_stream
			data = json.load(data)
			key = get_key(data)
			if key not in history:
				history[key] = []
			history[key].append(
				{
					'user': 'Wllìm',
					'date': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(commit.committed_date)),
					'type': 'added',
					'comment': message,
					'data': data
				}
			)
			words[key] = data
		elif element.change_type == 'M' or element.change_type == 'R':
			if element.change_type == 'M':
				print('    modified ' + str(element.b_path))
			elif element.change_type == 'R':
				print('    renamed ' + str(element.a_path) + ' -> ' + str(element.b_path))

			old = element.a_blob.data_stream
			old = json.load(old)
			data = element.b_blob.data_stream
			data = json.load(data)
			key_old = get_key(old)
			key = get_key(data)
			if key_old not in history or key_old not in words:
				print('Missing word ' + key_old)
				sys.exit(1)
			versions = history[key_old]
			del history[key_old]
			del words[key_old]
			versions.append(
				{
					'user': 'Wllìm',
					'date': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(commit.committed_date)),
					'type': 'edited',
					'comment': message,
					'data': data
				}
			)
			history[key] = versions
			words[key] = data

		elif element.change_type == 'D':
			print('    deleted ' + str(element.b_path))
			old = element.a_blob.data_stream
			old = json.load(old)
			key_old = get_key(old)
			if key_old not in history or key_old not in words:
				print('Missing word ' + key_old)
				sys.exit(1)
			del words[key_old]
			history[key_old].append(
				{
					'user': 'Wllìm',
					'date': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(commit.committed_date)),
					'type': 'removed',
					'comment': message,
				}
			)


# Phase 2: the old history file

words = {}
handledXNaviMigration = False

with open('data/history-before-id-migration.json') as history_file:
	old_history = json.load(history_file)

for i, entry in enumerate(old_history):
	date = entry['date']

	# First: handle migrations.
	if date > '2021-10-28T11:00:00.000Z' and not handledXNaviMigration:
		print('\033[95mMigration: \033[1mx-navi import\033[0m')
		handledXNaviMigration = True
		add_migrations(words, history, 'data-20230930/words-20211027.json', 'data-20230930/words-20211028.json', 'Wllìm', '2021-10-28T11:00:00.000Z', 'Imported some Na\'vi definitions')

	if date > '2022-02':
		break

	data = entry['data']

	user = entry['user']
	print('\033[95mEdit ' + str(i) + ': \033[1m' + date + ' by ' + user + '\033[0m')

	if date == '2021-11-18T23:21:04.553Z':
		print('    apparently didn\'t go through; ignored')
		continue

	if 'old' not in entry:
		key = get_key(data)
		if target != None and key != target: continue

		print('    added ' + key)
		if key not in history:
			history[key] = []
		if key in words:
			print('Adding already existing word ' + key)
			sys.exit(1)
		history[key].append(
			{
				'user': user,
				'date': date,
				'type': 'added',
				'data': data
			}
		)
		words[key] = data

	else:
		old = entry['old']
		key_old = get_key(old)
		key = get_key(data)
		if target != None and key != target: continue

		print('    edited ' + (key_old + ' -> ' + key if key_old != key else key))

		if date < '2021-11-18T23:32:00.000Z' and date != '2021-11-15T23:25:28.513Z' and data['na\'vi'] != data['na\'vi'].lower():
		#if date < '2021-11-18T23:25:30.000Z' and date != '2021-11-15T23:25:28.513Z' and data['na\'vi'] != data['na\'vi'].lower():
			# There used to be a bug in Reykunyu that caused edits not to go through if the lemma had uppercase.
			# However, the edit would still be stored in history.json. Solved in commit eaee18a.
			print('    edit didn\'t go through because of capitalization bug; ignored')
			continue

		if key not in history:
			history[key] = []

		#if key_old in words and json_equals(words[key_old], data):
		# No actual change was made; ignore.
		#	continue

		#if key_old not in words:
		#	print('Editing non-existing word ' + key_old)
		#	sys.exit(1)
		if key_old in words and not json_equals(words[key_old], old):
			print('Editing word, but the “old” value doesn\'t correspond to what we had before')
			print('    * existing value:')
			print(json.dumps(words[key_old], indent=4))
			print('    * “old” value:')
			print(json.dumps(old, indent=4))
			print('    * new value:')
			print(json.dumps(data, indent=4))
			#break
			sys.exit(1)
		history[key].append(
			{
				'user': user,
				'date': date,
				'type': 'edited',
				'data': data
			}
		)
		words[key] = data

	# TODO continue here! :D


# Output the results

with open('history-new.json', 'w') as history_file:
	json.dump(history, history_file, indent=4)
