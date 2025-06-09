import csv
import json

languages = ['en', 'de', 'nl', 'fr', 'da', 'hu', 'x-navi', 'et', 'pl', 'ru', 'sv']

translations = {}
for lang in languages:
	translations[lang] = {}

with open('src/translations.csv') as inputFile:
	reader = csv.reader(inputFile)
	next(reader)  # skip header
	for row in reader:
		key = row[0]
		for i in range(1, len(row)):
			if len(row[i]) > 0:
				translations[languages[i - 1]][key] = row[i]

with open('src/translations.json', 'w', encoding='utf8') as translationsFile:
	json.dump(translations, translationsFile, ensure_ascii=False, indent='\t')
