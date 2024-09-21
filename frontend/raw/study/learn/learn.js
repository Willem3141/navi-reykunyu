"use strict";
var LearnPage = /** @class */ (function () {
    function LearnPage() {
        var _this = this;
        this.items = [];
        this.currentItemIndex = 0;
        this.currentItem = null;
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
        $.getJSON('/api/srs/learnable', { 'courseId': this.courseId, 'lessonId': this.lessonId }).done(function (data) {
            _this.items = data;
            _this.fetchAndSetUp();
        });
        $('#next-button').on('click', function () {
            $.post('/api/srs/mark-correct', { 'vocab': _this.items[_this.currentItemIndex] });
            _this.addToLearnedList();
            _this.currentItemIndex++;
            _this.updateScore();
            if (_this.currentItemIndex >= _this.items.length) {
                _this.showResults();
            }
            else {
                _this.fetchAndSetUp();
            }
        });
        $('#known-button').on('click', function () {
            $.post('/api/srs/mark-known', { 'vocab': _this.items[_this.currentItemIndex] });
            _this.addToLearnedList();
            _this.currentItemIndex++;
            _this.updateScore();
            if (_this.currentItemIndex >= _this.items.length) {
                _this.showResults();
            }
            else {
                _this.fetchAndSetUp();
            }
        });
        $('#exit-button').on('click', function () {
            _this.showResults();
        });
    }
    LearnPage.prototype.fetchAndSetUp = function () {
        var _this = this;
        var itemID = this.items[this.currentItemIndex];
        $.getJSON('/api/word', { 'id': itemID }).done(function (wordData) {
            _this.currentItem = wordData;
            _this.setUpQuestion();
        });
    };
    LearnPage.prototype.setUpQuestion = function () {
        var word = this.currentItem;
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
        var $navi = $('#navi');
        $navi.empty();
        $navi.append($('<span/>').addClass('word').html(navi));
        $navi.append(' ');
        $navi.append($('<span/>').addClass('type').text('(' + this.toReadableType(word['type']) + ')'));
        var $english = $('#english');
        $english.empty();
        $english.append($('<span/>').addClass('meaning').html(english));
        if (word.hasOwnProperty('meaning_note')) {
            $('#meaning-note-card').show();
            var $meaningNote = $('#meaning-note');
            $meaningNote.empty();
            this.appendLinkString(word['meaning_note'], $meaningNote);
        }
        else {
            $('#meaning-note-card').hide();
        }
        if (word.hasOwnProperty('etymology')) {
            $('#etymology-card').show();
            var $etymology = $('#etymology');
            $etymology.empty();
            this.appendLinkString(word['etymology'], $etymology);
        }
        else {
            $('#etymology-card').hide();
        }
        var $image = $('#word-image');
        if (word.hasOwnProperty('image')) {
            $image.show();
            $image.attr('src', '/ayrel/' + word['image']);
        }
        else {
            $image.hide();
        }
    };
    LearnPage.prototype.toReadableType = function (type) {
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
    LearnPage.prototype.updateScore = function () {
        var $progressBar = $('.progress-bar .filled-part');
        $progressBar
            .css('width', (100.0 * this.currentItemIndex / this.items.length) + '%');
    };
    LearnPage.prototype.appendLinkString = function (linkString, $div) {
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
    LearnPage.prototype.getShortTranslation = function (result) {
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
    LearnPage.prototype.showResults = function () {
        $('#done-dialog-item-count').text(this.currentItemIndex);
        $('#dialog-layer').show();
        $('#to-review-button').attr('href', '/study/review/?course=' + this.courseId + '&lesson=' + this.lessonId);
    };
    LearnPage.prototype.addToLearnedList = function () {
        var $word = $('<div/>').addClass('learned-word');
        $('<span/>')
            .addClass('navi')
            .html($('#navi').html())
            .appendTo($word);
        $('<span/>')
            .addClass('english')
            .html($('#english').html())
            .appendTo($word);
        $('#learned-words').append($word);
    };
    return LearnPage;
}());
new LearnPage();
//# sourceMappingURL=learn.js.map