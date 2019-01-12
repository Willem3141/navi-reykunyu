/**
 * JavaScript functions to conjugate Na'vi nouns.
 */

function endsInVowel(noun) {
    var c = noun.slice(-1)
    return c === "a" || c === "ä" || c === "e" || c === "é" || c === "i" || c === "ì" || c === "o" || c === "u"
}

function endsInConsonant(noun) {
    var c = noun.slice(-2)
    return !endsInVowel(noun) && c !== "aw" && c !== "ay" && c !== "ew" && c !== "ey"
}

function subjective(noun) {
    return noun
}

function agentive(noun) {
    if (endsInVowel(noun)) {
        return noun + "<span class='suffix'>-l</span>"
    } else {
        return noun + "<span class='suffix'>-ìl</span>"
    }
}

function patientive(noun) {
    if (endsInVowel(noun)) {
        return noun + "<span class='suffix'>-t(i)</span>"
    } else {
        if (endsInConsonant(noun)) {
            return noun + "<span class='suffix'>-it/-ti</span>"
        } else {
            if (noun.slice(-1) === "y") {
                if (noun.slice(-2) === "ey") {
                    return noun + "<span class='suffix'>-t(i)</span>"
                } else {
                    return noun + "<span class='suffix'>-it/-t(i)</span>"
                }
            } else {
                return noun + "<span class='suffix'>-it/-ti</span>"
            }
        }
    }
}

function dative(noun) {
    if (endsInVowel(noun)) {
        return noun + "<span class='suffix'>-r(u)</span>"
    } else {
        if (endsInConsonant(noun)) {
            return noun + "<span class='suffix'>-ur</span>"
        } else {
            if (noun.slice(-1) === "w") {
                if (noun.slice(-2) === "ew") {
                    return noun + "<span class='suffix'>-r(u)</span>"
                } else {
                    return noun + "<span class='suffix'>-ur/-r(u)</span>"
                }
            } else {
                return noun + "<span class='suffix'>-ru/-ur</span>"
            }
        }
    }
}

function genitive(noun) {
    if (endsInVowel(noun)) {
        if (noun.slice(-1) === "o" || noun.slice(-1) === "u") {
            return noun + "<span class='suffix'>-ä</span>"
        } else {
            if (noun.slice(-2) === "ia") {
                return noun.slice(0, -1) + "<span class='suffix'>-ä</span>"
            } else {
                if (noun.toLowerCase().slice(-9) === "omatikaya") {
                    return noun + "<span class='suffix'>-ä</span>"
                } else {
                    return noun + "<span class='suffix'>-yä</span>"
                }
            }
        }
    } else {
        return noun + "<span class='suffix'>-ä</span>"
    }
}

function topical(noun) {
    if (endsInVowel(noun)) {
        return noun + "<span class='suffix'>-ri</span>"
    } else {
        if (endsInConsonant(noun)) {
            return noun + "<span class='suffix'>-ìri</span>"
        } else {
            return noun + "<span class='suffix'>-ri</span>"
        }
    }
}

// Numbers

function dual(noun) {
    var stem = lenite(noun)
    if (stem.charAt(0).toLowerCase() === "e") {
        return "<span class='prefix'>m-</span>" + stem
    } else {
        return "<span class='prefix'>me-</span>" + stem
    }
}

function trial(noun) {
    var stem = lenite(noun)
    if (stem.charAt(0).toLowerCase() === "e") {
        return "<span class='prefix'>px-</span>" + stem
    } else {
        return "<span class='prefix'>pxe-</span>" + stem
    }
}

function plural(noun) {
    // is short plural allowed?
    if (lenitable(noun) && noun !== "'u") { // 'u doesn't have short plural
        return "<span class='prefix'>(ay-)</span>" + lenite(noun)
    } else {
        return "<span class='prefix'>ay-</span>" + lenite(noun)
    }
}

function lenite(word) {
    
    // 'rr and 'll are not lenited, since rr and ll cannot start a syllable
    if (word.toLowerCase().substring(0, 3) === "'ll" || word.toLowerCase().substring(0, 3) === "'rr") {
        return word
    }
    
    word = lreplace(word, "ts", "<span class='lenition'>s</span>")
    word = lreplace(word, "kx", "<span class='lenition'>k</span>")
    word = lreplace(word, "px", "<span class='lenition'>p</span>")
    word = lreplace(word, "tx", "<span class='lenition'>t</span>")
    word = lreplace(word, "'", "")
    word = lreplace(word, "k", "<span class='lenition'>h</span>")
    word = lreplace(word, "p", "<span class='lenition'>f</span>")
    word = lreplace(word, "t", "<span class='lenition'>s</span>")
    
    return word
}

function lreplace(word, find, replace) {
    if (word.substring(0, find.length) === find) {
        return replace + word.slice(find.length)
    } else {
        return word
    }
}

function lenitable(word) {
    return lenite(word) !== word
}
