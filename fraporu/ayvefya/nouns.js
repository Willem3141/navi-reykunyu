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
    return noun + "-"
}

function agentive(noun) {
    if (endsInVowel(noun)) {
        return noun + "-l"
    } else {
        return noun + "-ìl"
    }
}

function patientive(noun) {
    if (endsInVowel(noun)) {
        return noun + "-t(i)"
    } else {
        if (endsInConsonant(noun)) {
            return noun + "-it/ti"
        } else {
            if (noun.slice(-1) === "y") {
                if (noun.slice(-2) === "ey") {
                    return noun + "-t(i)"
                } else {
                    return noun + "-it/t(i)"
                }
            } else {
                return noun + "-it/ti"
            }
        }
    }
}

function dative(noun) {
    if (endsInVowel(noun)) {
        return noun + "-r(u)"
    } else {
        if (endsInConsonant(noun)) {
            if (noun.slice(-1) === "'") {
                return noun + "-ur/ru";
            }
            return noun + "-ur"
        } else {
            if (noun.slice(-1) === "w") {
                if (noun.slice(-2) === "ew") {
                    return noun + "-r(u)"
                } else {
                    return noun + "-ur/r(u)"
                }
            } else {
                return noun + "-ru/ur"
            }
        }
    }
}

function genitive(noun) {
    if (endsInVowel(noun)) {
        if (noun.slice(-1) === "o" || noun.slice(-1) === "u") {
            return noun + "-ä"
        } else {
            if (noun.slice(-2) === "ia") {
                return noun.slice(0, -1) + "-ä"
            } else {
                if (noun.toLowerCase().slice(-9) === "omatikaya") {
                    return noun + "-ä"
                } else {
                    return noun + "-yä"
                }
            }
        }
    } else {
        return noun + "-ä"
    }
}

function topical(noun) {
    if (endsInVowel(noun)) {
        return noun + "-ri"
    } else {
        if (endsInConsonant(noun)) {
            return noun + "-ìri"
        } else {
            return noun + "-ri"
        }
    }
}

// Numbers

function singular(noun) {
    return "-" + noun
}

function dual(noun) {
    var stem = lenite(noun)
    if (stem.charAt(0).toLowerCase() === "e") {
        return "m-" + stem
    } else {
        return "me-" + stem
    }
}

function trial(noun) {
    var stem = lenite(noun)
    if (stem.charAt(0).toLowerCase() === "e") {
        return "px-" + stem
    } else {
        return "pxe-" + stem
    }
}

function plural(noun) {
    // is short plural allowed?
    if (lenitable(noun) && noun !== "'u") { // 'u doesn't have short plural
        return "(ay-)" + lenite(noun)
    } else {
        return "ay-" + lenite(noun)
    }
}

function lenite(word) {
    
    // 'rr and 'll are not lenited, since rr and ll cannot start a syllable
    if (word.toLowerCase().substring(0, 3) === "'ll" || word.toLowerCase().substring(0, 3) === "'rr") {
        return word
    }
    
    word = lreplace(word, "ts", "{s}")
    word = lreplace(word, "kx", "{k}")
    word = lreplace(word, "px", "{p}")
    word = lreplace(word, "tx", "{t}")
    word = lreplace(word, "'", "")
    word = lreplace(word, "k", "{h}")
    word = lreplace(word, "p", "{f}")
    word = lreplace(word, "t", "{s}")
    
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
