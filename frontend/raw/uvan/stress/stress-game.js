"use strict";
var StressGame = /** @class */ (function () {
    function StressGame() {
        this.correctCount = 0;
        this.totalCount = 0;
        this.fetchAndSetUp();
        $('html').on('keydown', function (e) {
            var number = parseFloat(e.key);
            if (isNaN(number)) {
                return;
            }
            var $syllables = $('#syllables').children('.syllable');
            if (number - 1 < 0 || number - 1 > $syllables.length) {
                return;
            }
            $($syllables[number - 1]).trigger('click');
        });
        $('.score').on('click', function () {
            var popout = $('.score-popout');
            if (popout.is(':visible')) {
                $('#overlay').removeClass('visible');
                $('.score-popout').slideUp();
            }
            else {
                $('#overlay').addClass('visible');
                $('.score-popout').slideDown();
            }
        });
    }
    StressGame.prototype.fetchAndSetUp = function () {
        var self = this;
        $.getJSON('/api/random', { 'holpxay': 1 }).done(function (data) {
            if (!data[0].hasOwnProperty('pronunciation') ||
                data[0]['pronunciation'].length !== 1 ||
                !(data[0]['pronunciation'][0]['syllables'].includes('-')) ||
                data[0]['pronunciation'][0]['stressed'] === null ||
                data[0]['type'] === 'n:si') {
                self.fetchAndSetUp();
                return;
            }
            self.currentQuestion = data[0];
            self.setUpQuestion();
        });
    };
    StressGame.prototype.setUpQuestion = function () {
        var $definition = $('#definition');
        $definition.empty();
        $definition.append($('<span/>').addClass('lemma').text(this.currentQuestion["na'vi"]));
        $definition.append(' ');
        $definition.append($('<span/>').addClass('type').text('(' + this.toReadableType(this.currentQuestion['type']) + ')'));
        $definition.append(' ');
        $definition.append($('<span/>').addClass('meaning').text(this.currentQuestion['translations'][0]['en']));
        var $syllables = $('#syllables');
        $syllables.empty();
        // TODO take into account words with multiple pronunciations
        // instead of just taking pronunciation[0]
        var syllables = this.currentQuestion.pronunciation[0]['syllables'].split('-');
        for (var i = 0; i < syllables.length; i++) {
            if (i > 0) {
                $syllables.append(this.createSeparator());
            }
            var syllable = syllables[i];
            $syllables.append(this.createSyllableBlock(syllable, i + 1, this.currentQuestion.pronunciation[0]['stressed']));
        }
    };
    StressGame.prototype.createSyllableBlock = function (syllable, i, correct) {
        var $syllable = $('<div/>').addClass('syllable');
        if (i === correct) {
            $syllable.addClass('correct');
        }
        else {
            $syllable.addClass('incorrect');
        }
        $('<div/>')
            .addClass('navi')
            .text(syllable)
            .appendTo($syllable);
        $('<div/>')
            .addClass('index')
            .text('' + i)
            .appendTo($syllable);
        var self = this;
        $syllable.on('click', function () {
            var $syllables = $('#syllables');
            $syllables.children('.syllable').children('.index').html('&nbsp;');
            var $correctSyllable = $($syllables.children('.syllable')[correct - 1]);
            $correctSyllable.children('.index').text('✓');
            $syllable.addClass('chosen');
            var timeout = 300;
            if (i === correct) {
                self.correctCount++;
            }
            else {
                $syllable.children('.index').text('✗');
                $correctSyllable.addClass('correction');
                timeout = 2000;
                // add to mistakes list
                var $mistake = $('<span/>').addClass('mistake');
                var syllables = self.currentQuestion['pronunciation'][0]['syllables'].split('-');
                for (var j = 0; j < syllables.length; j++) {
                    if (j > 0) {
                        $mistake.append('-');
                    }
                    if ((j + 1) === self.currentQuestion['pronunciation'][0]['stressed']) {
                        $mistake.append($('<span/>').addClass('mistake-correct').html(syllables[j]));
                    }
                    else if ((j + 1) === i) {
                        $mistake.append($('<span/>').addClass('mistake-wrong').html(syllables[j]));
                    }
                    else {
                        $mistake.append(syllables[j]);
                    }
                }
                var $mistakesList = $('#mistakes-list');
                if ($mistakesList.html() === '(none yet!)') {
                    $mistakesList.empty();
                }
                $mistakesList.append($mistake);
            }
            self.totalCount++;
            self.updateScore();
            setTimeout(function () {
                self.fetchAndSetUp();
            }, timeout);
        });
        return $syllable;
    };
    StressGame.prototype.createSeparator = function () {
        return $('<div/>').addClass('separator').text('-');
    };
    StressGame.prototype.toReadableType = function (type) {
        var mapping = {
            "n": "n.",
            "n:unc": "n.",
            "n:si": "v.",
            "n:pr": "prop. n.",
            "pn": "pn.",
            "adj": "adj.",
            "num": "num.",
            "adv": "adv.",
            "adp": "adp.",
            "adp:len": "adp+",
            "intj": "intj.",
            "part": "part.",
            "conj": "conj.",
            "ctr": "sbd.",
            "v:?": "v.",
            "v:in": "vin.",
            "v:tr": "vtr.",
            "v:m": "vm.",
            "v:si": "v.",
            "v:cp": "vcp.",
            "phr": "phr.",
            "inter": "inter.",
            "aff:pre": "pref.",
            "aff:pre:len": "pref.",
            "aff:in": "inf.",
            "aff:suf": "suf.",
            "nv:si": "vin."
        };
        return mapping[type];
    };
    StressGame.prototype.updateScore = function () {
        var scoreString = this.correctCount + '/' + this.totalCount;
        var $scoreField = $('#score-field');
        $scoreField
            .addClass('just-changed')
            .text(scoreString);
        setTimeout(function () {
            $scoreField.removeClass('just-changed');
            $scoreField.addClass('in-transition');
        });
        setTimeout(function () {
            $scoreField.removeClass('in-transition');
        }, 250);
    };
    return StressGame;
}());
new StressGame();
//# sourceMappingURL=stress-game.js.map