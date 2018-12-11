#!/usr/bin/python3

import json

translations = {}

with open('NaviData2_translations.sql') as file:
    for line in file:
        line = line.strip()
        line = line.split('\'')
        word_id = int(line[1])
        translation = line[5]
        translation = translation.split(',')[0]
        translations[word_id] = translation

words = []

with open('NaviData3.sql') as file:
    for line in file:
        line = line.strip()
        line = '[' + line[1:-1] + ']'
        line = line.replace('NULL', 'None')
        thing = eval(line)
        word_id = int(thing[0])
        word = thing[1]
        ipa = thing[2]
        infixes = thing[3]
        type = thing[4]
        try:
            meaning = translations[word_id]
        except KeyError:
            meaning = ''

        #print(word + ' / ' + ipa)
        wordDashed = ''
        stressed = 0
        syllable = 1
        if ' ' in word:
            # we don't handle multi-word expressions
            continue
        if '] or [' in ipa:
            # those have several stress patterns
            continue
        elif word == 'Jakesully':
            # ... seriously?
            continue
        elif word == 'fìtseng':
            # has weird parentheses fitseng(e)
            wordDashed = 'fì-tseng'
            stressed = 2
            syllable = 2
        elif word == 'fìtsenge':
            wordDashed = 'fì-tse-nge'
            stressed = 2
            syllable = 3
        elif word == 'srak':
            wordDashed = 'srak'
            stressed = 1
            syllable = 1
        elif word == 'srake':
            wordDashed = 'sra-ke'
            stressed = 1
            syllable = 2
        elif word == 'talun':
            wordDashed = 'ta-lun'
            stressed = 2
            syllable = 2
        elif word == 'taluna':
            wordDashed = 'ta-lun-a'
            stressed = 2
            syllable = 3
        elif word == 'taweyk':
            wordDashed = 'ta-weyk'
            stressed = 2
            syllable = 2
        elif word == 'taweyka':
            wordDashed = 'ta-wey-ka'
            stressed = 2
            syllable = 3
        elif word == 'tseng':
            wordDashed = 'tseng'
            stressed = 1
            syllable = 1
        elif word == 'tsenge':
            wordDashed = 'tse-nge'
            stressed = 1
            syllable = 2
        elif word == 'stxenutìng':
            # has , as syllable marker :o
            wordDashed = 'stxe-nu-tìng'
            stressed = 1
            syllable = 3
        elif word == 'tompakel':
            wordDashed = 'tom-pa-kel'
            stressed = 1
            syllable = 3
        elif word == 'swaynivi':
            wordDashed = 'sway-ni-vi'
            stressed = 1
            syllable = 3
        elif word == 'ningyen':
            wordDashed = 'ning-yen'
            stressed = 1
            syllable = 2
        elif word == 'tìreyn':
            # has a + in front of the ipa :O
            wordDashed = 'tì-reyn'
            stressed = 2
            syllable = 2
        elif word == 'lì\'uvi':
            # has a spurious ' :O!
            wordDashed = 'lì-\'u-vi'
            stressed = 1
            syllable = 3
        elif word == 'fkxara':
            # has a weird character instead of k' :O!!
            wordDashed = 'fkxa-ra'
            stressed = 1
            syllable = 2
        elif word == 'fkxaranga\'':
            wordDashed = 'fkxa-ra-nga\''
            stressed = 1
            syllable = 3
        elif word == 'txeptun':
            wordDashed = 'txep-tun'
            stressed = 1
            syllable = 2
        elif word == 'tsyänel':
            # no stress marker :O!!!
            wordDashed = 'tsyä-nel'
            stressed = 1
            syllable = 2
        elif word == 'tìtxantslusam':
            # is just plain wrong :O!!!!
            wordDashed = 'tì-txan-tslu-sam'
            stressed = 2
            syllable = 4
        elif word == 'kintrram':
            wordDashed = 'kin-trr-am'
            stressed = 1
            syllable = 3
        elif word == 'kintrray':
            wordDashed = 'kin-trr-ay'
            stressed = 1
            syllable = 3
        else:
            i = 0
            for letter in ipa:
                if letter == 'ˈ':
                    # this is the stressed syllable
                    stressed = syllable
                elif letter == '.':
                    # start of a new syllable
                    syllable += 1
                    wordDashed += '-'
                elif letter in '·\u0361\u031A¦\u02CC':
                    # IPA nonsense, ignore
                    pass
                elif letter == 'ŋ':
                    # can correspond to two letters ('ng') but not in e.g. 'zenke'
                    wordDashed += word[i]
                    i += 1
                    if word[i] == 'g':
                        wordDashed += word[i]
                        i += 1
                else:
                    wordDashed += word[i]
                    i += 1

        # ignore one-syllable words
        if syllable == 1:
            continue

        words.append([wordDashed, stressed, meaning, type])

print(json.dumps(words))
