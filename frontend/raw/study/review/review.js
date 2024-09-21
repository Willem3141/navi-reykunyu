"use strict";
var ReviewPage = /** @class */ (function () {
    function ReviewPage() {
        var _this = this;
        this.items = [];
        this.currentItemIndex = 0;
        this.currentItem = null;
        this.correctAnswer = '';
        this.correctStress = null;
        this.correctCount = 0;
        var url = new URL(window.location.href);
        if (!url.searchParams.has('course')) {
            throw Error('course parameter not set');
        }
        this.courseId = parseInt(url.searchParams.get('course'), 10);
        if (isNaN(this.courseId)) {
            throw Error('course parameter is not an integer');
        }
        if (!url.searchParams.has('lesson')) {
            throw Error('lesson parameter not set');
        }
        this.lessonId = parseInt(url.searchParams.get('lesson'), 10);
        if (isNaN(this.lessonId)) {
            throw Error('lesson parameter is not an integer');
        }
        $.getJSON('/api/srs/reviewable', { 'courseId': this.courseId, 'lessonId': this.lessonId }).done(function (data) {
            _this.items = data;
            _this.fetchAndSetUp();
        });
        $('#navi-card').on('keypress', function (e) {
            if (e.key === 'Enter') {
                _this.checkAnswer();
            }
        });
        $('#check-button').on('click', function () {
            _this.checkAnswer();
        });
        $('#exit-button').on('click', function () {
            _this.showResults();
        });
    }
    ReviewPage.prototype.fetchAndSetUp = function () {
        var _this = this;
        var itemID = this.items[this.currentItemIndex];
        $.getJSON('/api/word', { 'id': itemID }).done(function (wordData) {
            _this.currentItem = wordData;
            _this.setUpQuestion();
        });
    };
    ReviewPage.prototype.setUpQuestion = function () {
        var word = this.currentItem;
        var navi = word["na'vi"];
        if (word['type'] == 'n:si') {
            navi += ' si';
        }
        this.correctAnswer = navi;
        if (word.hasOwnProperty('pronunciation') && word['pronunciation'].length === 1
            && word['pronunciation'][0]['syllables'].indexOf('-') !== -1) {
            this.correctStress = word['pronunciation'][0]['stressed'];
        }
        else {
            this.correctStress = null;
        }
        var english = '';
        if (word['translations'].length > 1) {
            for (var i = 0; i < word['translations'].length; i++) {
                if (i > 0) {
                    english += '<br>';
                }
                english += '<b>' + (i + 1) + '.</b> ' + word['translations'][i]['en'];
            }
        }
        else {
            english = word['translations'][0]['en'];
        }
        var $english = $('#english');
        $english.empty();
        $english.append($('<span/>').addClass('type').text('(' + this.toReadableType(word['type']) + ')'));
        $english.append(' ');
        $english.append($('<span/>').addClass('meaning').html(english));
        var $navi = $('#navi-card');
        $navi.val('');
        $('#navi-card').removeClass('incorrect correct')
            .prop('disabled', false)
            .trigger('focus');
        $('#check-button').prop('disabled', false);
        $('#correction-card').hide();
        $('#stress-card').hide();
    };
    ReviewPage.prototype.toReadableType = function (type) {
        var mapping = {
            "n": "n.",
            "n:unc": "n.",
            "n:si": "vin.",
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
    ReviewPage.prototype.correctAnswerDisplay = function (word) {
        var navi = word["na'vi"];
        var pronunciation = '';
        if (word.hasOwnProperty('pronunciation')) {
            for (var i = 0; i < word['pronunciation'].length; i++) {
                if (i > 0) {
                    pronunciation += ' or ';
                }
                var syllables = word['pronunciation'][i]['syllables'].split('-');
                for (var j = 0; j < syllables.length; j++) {
                    if (syllables.length > 1 && j + 1 == word['pronunciation'][i]['stressed']) {
                        pronunciation += '<u>' + syllables[j] + '</u>';
                    }
                    else {
                        pronunciation += syllables[j];
                    }
                }
            }
        }
        if (word['type'] == 'n:si') {
            navi += ' si';
            pronunciation += ' si';
        }
        if (word.hasOwnProperty('pronunciation')) {
            if (word['pronunciation'].length === 1 &&
                word['pronunciation'][0]['syllables'].split('-').join('') === word["na'vi"]) {
                navi = pronunciation;
            }
            else {
                navi = navi + ' <span class="type">(pronounced ' + pronunciation + ')</span>';
            }
        }
        return navi;
    };
    ReviewPage.prototype.checkAnswer = function () {
        var _this = this;
        var givenAnswer = ('' + $('#navi-card').val()).trim().toLowerCase();
        var lastCharacter = parseInt(givenAnswer.charAt(givenAnswer.length - 1), 10);
        var givenStress = null;
        if (!isNaN(lastCharacter)) {
            givenAnswer = givenAnswer.substring(0, givenAnswer.length - 1).trim();
            givenStress = lastCharacter;
        }
        $('#navi-card').val(givenAnswer);
        if (givenAnswer !== this.correctAnswer.toLowerCase()) {
            $('#navi-card').addClass('incorrect')
                .prop('disabled', true);
            $('#check-button').prop('disabled', true);
            $('#correction-card').slideDown();
            $('#correction').html(this.correctAnswerDisplay(this.currentItem));
            $.post('/api/srs/mark-incorrect', { 'vocab': this.items[this.currentItemIndex] });
            this.addToLearnedList(false);
            setTimeout(function () {
                _this.nextOrResults();
            }, ReviewPage.INCORRECT_WAITING_TIME);
            return;
        }
        $('#navi-card').addClass('correct')
            .prop('disabled', true);
        $('#check-button').prop('disabled', true);
        if (this.correctStress !== null) {
            // ask for stress
            $('#stress-card').show();
            var $syllables = $('#syllables');
            $syllables.empty();
            var syllables = this.currentItem['pronunciation'][0]['syllables'].split('-');
            for (var i = 0; i < syllables.length; i++) {
                if (i > 0) {
                    $syllables.append(this.createSeparator());
                }
                var syllable = syllables[i];
                $syllables.append(this.createSyllableBlock(syllable, i + 1, this.correctStress));
            }
            if (givenStress !== null) {
                // if stress was already provided by the user in the input
                // field, apply it now by immediately clicking the corresponding
                // stress button
                var $syllables_1 = $('#syllables .syllable');
                if (givenStress >= 1 && givenStress <= $syllables_1.length) {
                    $($syllables_1[givenStress - 1]).trigger('click');
                }
            }
        }
        else {
            // don't need to ask for stress
            $('#navi-card').addClass('correct')
                .prop('disabled', true);
            $('#check-button').prop('disabled', true);
            $.post('/api/srs/mark-correct', { 'vocab': this.items[this.currentItemIndex] });
            this.addToLearnedList(true);
            this.correctCount++;
            setTimeout(function () {
                _this.nextOrResults();
            }, ReviewPage.CORRECT_WAITING_TIME);
        }
    };
    ReviewPage.prototype.nextOrResults = function () {
        this.currentItemIndex++;
        this.updateScore();
        if (this.currentItemIndex >= this.items.length) {
            this.showResults();
        }
        else {
            this.fetchAndSetUp();
        }
    };
    ReviewPage.prototype.createSyllableBlock = function (syllable, i, correct) {
        var _this = this;
        var $syllable = $('<div/>').addClass('syllable');
        $('<div/>')
            .addClass('navi')
            .text(syllable)
            .appendTo($syllable);
        $('<div/>')
            .addClass('index')
            .text('' + i)
            .appendTo($syllable);
        $syllable.on('click', function () {
            var $syllables = $('#syllables');
            if (i === correct) {
                $syllable.addClass('correct');
                $.post('/api/srs/mark-correct', { 'vocab': _this.items[_this.currentItemIndex] });
                _this.addToLearnedList(true);
                _this.correctCount++;
                setTimeout(function () {
                    _this.nextOrResults();
                }, ReviewPage.CORRECT_WAITING_TIME);
            }
            else {
                $syllable.addClass('incorrect');
                var $correctSyllable = $($syllables.children('.syllable')[correct - 1]);
                $correctSyllable.addClass('correct');
                $.post('/api/srs/mark-incorrect', { 'vocab': _this.items[_this.currentItemIndex] });
                _this.addToLearnedList(false);
                setTimeout(function () {
                    _this.nextOrResults();
                }, ReviewPage.INCORRECT_WAITING_TIME);
            }
        });
        return $syllable;
    };
    ReviewPage.prototype.createSeparator = function () {
        return $('<div/>').addClass('separator').text('-');
    };
    ReviewPage.prototype.updateScore = function () {
        var $progressBar = $('.progress-bar .filled-part');
        $progressBar
            .css('width', (100.0 * this.currentItemIndex / this.items.length) + '%');
    };
    ReviewPage.prototype.appendLinkString = function (linkString, $div) {
        for (var _i = 0, linkString_1 = linkString; _i < linkString_1.length; _i++) {
            var piece = linkString_1[_i];
            if (typeof piece === 'string') {
                $div.append(piece);
            }
            else {
                $div.append($('<span/>')
                    .addClass('word-reference')
                    .html('<b>' + piece["na'vi"] + '</b> <i>' + this.getShortTranslation(piece) + '</i>'));
            }
        }
    };
    ReviewPage.prototype.getShortTranslation = function (result) {
        if (result["short_translation"]) {
            return result["short_translation"];
        }
        var translation = result["translations"][0]['en'];
        translation = translation.split(',')[0];
        translation = translation.split(';')[0];
        translation = translation.split(' | ')[0];
        translation = translation.split(' (')[0];
        if (result["type"][0] === "v"
            && translation.indexOf("to ") === 0) {
            translation = translation.substr(3);
        }
        return translation;
    };
    ReviewPage.prototype.showResults = function () {
        $('#done-dialog-item-count').text(this.currentItemIndex);
        $('#dialog-layer').show();
        $('#back-button').attr('href', '/study/course?course=' + this.courseId);
    };
    ReviewPage.prototype.addToLearnedList = function (correct) {
        var $word = $('<div/>')
            .addClass('learned-word')
            .addClass(correct ? 'correct' : 'incorrect');
        $('<span/>')
            .addClass('navi')
            .html(this.correctAnswerDisplay(this.currentItem))
            .appendTo($word);
        $('<span/>')
            .addClass('english')
            .html($('#english').html())
            .appendTo($word);
        $('#learned-words').append($word);
        $('.progress-bar .filled-part')
            .toggleClass('incorrect', !correct);
    };
    ReviewPage.CORRECT_WAITING_TIME = 0;
    ReviewPage.INCORRECT_WAITING_TIME = 4000;
    return ReviewPage;
}());
new ReviewPage();
//# sourceMappingURL=review.js.map