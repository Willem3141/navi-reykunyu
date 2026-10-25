import csv
import json

languages = ['en', 'de', 'nl', 'fr', 'da', 'hu', 'x-navi', 'et', 'pl', 'ru', 'sv', 'it', 'cz', 'sk', 'es']

with open('src/translations.json') as translationsFile:
	translations = json.load(translationsFile)

with open('src/translations.csv', 'w') as outputFile:
	writer = csv.writer(outputFile)
	for key in translations['en'].keys():
		row = [key]
		for lang in languages:
			if key in translations[lang]:
				row.append(translations[lang][key])
			else:
				row.append('')
		writer.writerow(row)
