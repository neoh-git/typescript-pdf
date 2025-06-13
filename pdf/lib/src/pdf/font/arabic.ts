// No external imports needed as per request, just assuming global types like `Map`, `List` (arrays)

/// Arabic shape substitutions: char code => (isolated, final, initial, medial).
/// Arabic Substitution A
const _arabicSubstitutionA: Record<number, number[] | number> = {
    0x0640: [0x0640, 0x0640, 0x0640, 0x0640], // ARABIC TATWEEL

    0x0621: [1569], // ARABIC LETTER HAMZA
    0x0622: [1570, 0xFE82], // ARABIC LETTER ALEF WITH MADDA ABOVE
    0x0623: [1571, 0xFE84], // ARABIC LETTER ALEF WITH HAMZA ABOVE
    0x0624: [1572, 0xFE86], // ARABIC LETTER WAW WITH HAMZA ABOVE
    0x0625: [1573, 0xFE88], // ARABIC LETTER ALEF WITH HAMZA BELOW
    0x0626: [
        1574,
        0xFE8A,
        0xFE8B,
        0xFE8C
    ], // ARABIC LETTER YEH WITH HAMZA ABOVE
    0x0627: [1575, 0xFE8E], // ARABIC LETTER ALEF
    0x0628: [1576, 0xFE90, 0xFE91, 0xFE92], // ARABIC LETTER BEH
    0x0629: [1577, 0xFE94], // ARABIC LETTER TEH MARBUTA
    0x062A: [1578, 0xFE96, 0xFE97, 0xFE98], // ARABIC LETTER TEH
    0x062B: [1579, 0xFE9A, 0xFE9B, 0xFE9C], // ARABIC LETTER THEH
    0x062C: [1580, 0xFE9E, 0xFE9F, 0xFEA0], // ARABIC LETTER JEEM
    0x062D: [1581, 0xFEA2, 0xFEA3, 0xFEA4], // ARABIC LETTER HAH
    0x062E: [1582, 0xFEA6, 0xFEA7, 0FEA8], // ARABIC LETTER KHAH
    0x062F: [1583, 0xFEAA], // ARABIC LETTER DAL
    0x0630: [1584, 0xFEAC], // ARABIC LETTER THAL
    0x0631: [1585, 0xFEAE], // ARABIC LETTER REH
    0x0632: [1586, 0xFEB0], // ARABIC LETTER ZAIN
    0x0633: [1587, 0xFEB2, 0xFEB3, 0xFEB4], // ARABIC LETTER SEEN
    0x0634: [1588, 0xFEB6, 0xFEB7, 0xFEB8], // ARABIC LETTER SHEEN
    0x0635: [1589, 0xFEBA, 0xFEBB, 0xFEBC], // ARABIC LETTER SAD
    0x0636: [1590, 0xFEBE, 0xFEBF, 0xFEC0], // ARABIC LETTER DAD
    0x0637: [1591, 0xFEC2, 0xFEC3, 0xFEC4], // ARABIC LETTER TAH
    0x0638: [1592, 0xFEC6, 0xFEC7, 0xFEC8], // ARABIC LETTER ZAH
    0x0639: [1593, 0xFECA, 0xFECB, 0xFECC], // ARABIC LETTER AIN
    0x063A: [1594, 0xFECE, 0xFECF, 0xFED0], // ARABIC LETTER GHAIN
    0x0641: [1601, 0xFED2, 0xFED3, 0xFED4], // ARABIC LETTER FEH
    0x0642: [1602, 0xFED6, 0xFED7, 0xFED8], // ARABIC LETTER QAF
    0x0643: [1603, 0xFEDA, 0xFEDB, 0xFEDC], // ARABIC LETTER KAF
    0x0644: [1604, 0xFEDE, 0xFEDF, 0xFEE0], // ARABIC LETTER LAM
    0x0645: [1605, 0xFEE2, 0xFEE3, 0xFEE4], // ARABIC LETTER MEEM
    0x0646: [1606, 0xFEE6, 0xFEE7, 0xFEE8], // ARABIC LETTER NOON
    0x0647: [1607, 0xFEEA, 0xFEEB, 0xFEEC], // ARABIC LETTER HEH
    0x0648: [1608, 0xFEEE], // ARABIC LETTER WAW
    0x0649: [1609, 0xFEF0, 64488, 64489], // ARABIC LETTER ALEF MAKSURA
    0x064A: [1610, 0xFEF2, 0xFEF3, 0xFEF4], // ARABIC LETTER YEH
    0x0671: [0xFB50, 0xFB51], // ARABIC LETTER ALEF WASLA
    0x0677: [0xFBDD], // ARABIC LETTER U WITH HAMZA ABOVE
    0x0679: [0xFB66, 0xFB67, 0xFB68, 0xFB69], // ARABIC LETTER TTEH
    0x067A: [0xFB5E, 0xFB5F, 0xFB60, 0xFB61], // ARABIC LETTER TTEHEH
    0x067B: [0xFB52, 0xFB53, 0xFB54, 0xFB55], // ARABIC LETTER BEEH
    0x067E: [0xFB56, 0xFB57, 0xFB58, 0xFB59], // ARABIC LETTER PEH
    0x067F: [0xFB62, 0xFB63, 0xFB64, 0xFB65], // ARABIC LETTER TEHEH
    0x0680: [0xFB5A, 0xFB5B, 0xFB5C, 0xFB5D], // ARABIC LETTER BEHEH
    0x0683: [0xFB76, 0xFB77, 0xFB78, 0xFB79], // ARABIC LETTER NYEH
    0x0684: [0xFB72, 0xFB73, 0xFB74, 0xFB75], // ARABIC LETTER DYEH
    0x0686: [0xFB7A, 0xFB7B, 0xFB7C, 0xFB7D], // ARABIC LETTER TCHEH
    0x0687: [0xFB7E, 0xFB7F, 0xFB80, 0xFB81], // ARABIC LETTER TCHEHEH
    0x0688: [0xFB88, 0xFB89], // ARABIC LETTER DDAL
    0x068C: [0xFB84, 0xFB85], // ARABIC LETTER DAHAL
    0x068D: [0xFB82, 0xFB83], // ARABIC LETTER DDAHAL
    0x068E: [0xFB86, 0xFB87], // ARABIC LETTER DUL
    0x0691: [0xFB8C, 0xFB8D], // ARABIC LETTER RREH
    0x0698: [0xFB8A, 0xFB8B], // ARABIC LETTER JEH
    0x06A4: [0xFB6A, 0xFB6B, 0xFB6C, 0xFB6D], // ARABIC LETTER VEH
    0x06A6: [0xFB6E, 0xFB6F, 0xFB70, 0xFB71], // ARABIC LETTER PEHEH
    0x06A9: [0xFB8E, 0xFB8F, 0xFB90, 0xFB91], // ARABIC LETTER KEHEH
    0x06AD: [0xFBD3, 0xFBD4, 0xFBD5, 0xFBD6], // ARABIC LETTER NG
    0x06AF: [0xFB92, 0xFB93, 0xFB94, 0xFB95], // ARABIC LETTER GAF
    0x06B1: [0xFB9A, 0xFB9B, 0xFB9C, 0xFB9D], // ARABIC LETTER NGOEH
    0x06B3: [0xFB96, 0xFB97, 0xFB98, 0xFB99], // ARABIC LETTER GUEH
    0x06BA: [0xFB9E, 0xFB9F], // ARABIC LETTER NOON GHUNNA
    0x06BB: [0xFBA0, 0xFBA1, 0xFBA2, 0xFBA3], // ARABIC LETTER RNOON
    0x06BE: [
        0xFBAA,
        0xFBAB,
        0xFBAC,
        0xFBAD
    ], // ARABIC LETTER HEH DOACHASHMEE
    0x06C0: [0xFBA4, 0xFBA5], // ARABIC LETTER HEH WITH YEH ABOVE
    0x06C1: [0xFBA6, 0xFBA7, 0xFBA8, 0xFBA9], // ARABIC LETTER HEH GOAL
    0x06C5: [0xFBE0, 0xFBE1], // ARABIC LETTER KIRGHIZ OE
    0x06C6: [0xFBD9, 0xFBDA], // ARABIC LETTER OE
    0x06C7: [0xFBD7, 0xFBD8], // ARABIC LETTER U
    0x06C8: [0xFBDB, 0xFBDC], // ARABIC LETTER YU
    0x06C9: [0xFBE2, 0xFBE3], // ARABIC LETTER KIRGHIZ YU
    0x06CB: [0xFBDE, 0xFBDF], // ARABIC LETTER VE
    0x06CC: [0xFBFC, 0xFBFD, 0xFBFE, 0xFBFF], // ARABIC LETTER FARSI YEH
    0x06D0: [0xFBE4, 0xFBE5, 0xFBE6, 0xFBE7], //ARABIC LETTER E
    0x06D2: [0xFBAE, 0xFBAF], // ARABIC LETTER YEH BARREE
    0x06D3: [0xFBB0, 0xFBB1], // ARABIC LETTER YEH BARREE WITH HAMZA ABOVE
};

const _diacriticLigatures: Record<number, Record<number, number> | number> = {
    0x0651: { // Shadda
        0x064C: 0xFC5E, // Shadda + Dammatan
        0x064D: 0xFC5F, // Shadda + Kasratan
        0x064E: 0xFC60, // Shadda + Fatha
        0x064F: 0xFC61, // Shadda + Damma
        0x0650: 0xFC62, // Shadda + Kasra
        0x0670: 0xFC63, // Shadda + Dagger alif
    },
};

const _ligatures: Record<number, Record<number, number> | Record<number, Record<number, number>> | number> = {
    0xFEDF: { // LAM ISOLATED FORM
        0xFE82: 0xFEF5, // ARABIC LIGATURE LAM WITH ALEF WITH MADDA ABOVE ISOLATED FORM
        0xFE84: 0xFEF7, // ARABIC LIGATURE LAM WITH ALEF WITH HAMZA ABOVE ISOLATED FORM
        0xFE88: 0xFEF9, // ARABIC LIGATURE LAM WITH ALEF WITH HAMZA BELOW ISOLATED FORM
        0xFE8E: 0xFEFB // ARABIC LIGATURE LAM WITH ALEF ISOLATED FORM
    },
    0xFEE0: { // LAM FINAL FORM
        0xFE82: 0xFEF6, // ARABIC LIGATURE LAM WITH ALEF WITH MADDA ABOVE FINAL FORM
        0xFE84: 0xFEF8, // ARABIC LIGATURE LAM WITH ALEF WITH HAMZA ABOVE FINAL FORM
        0xFE88: 0xFEFA, // ARABIC LIGATURE LAM WITH ALEF WITH HAMZA BELOW FINAL FORM
        0xFE8E: 0xFEFC // ARABIC LIGATURE LAM WITH ALEF FINAL FORM
    },
    0xFE8D: { // ALEF
        0xFEDF: { // LAM ISOLATED
            0xFEE0: { // LAM FINAL
                0xFEEA: 0xFDF2 // ALLAH LIGATURE (LAM-LAM-HEH with Tashkeel?)
            }
        }
    },
};

const _alfletter: number[] = [1570, 1571, 1573, 1575];

const _arabicDiacritics: Record<number, number> = {
    0x064B: 0x064B, // Fathatan
    0x064C: 0x064C, // Dammatan
    0x064D: 0x064D, // Kasratan
    0x064E: 0x064E, // Fatha
    0x064F: 0x064F, // Damma
    0x0650: 0x0650, // Kasra
    0x0651: 0x0651, // Shadda
    0x0652: 0x0652, // Sukun

    0x0670: 0x0670, // Dagger alif

    0xFC5E: 0xFC5E, // Shadda + Dammatan
    0xFC5F: 0xFC5F, // Shadda + Kasratan
    0xFC60: 0xFC60, // Shadda + +Fatha
    0xFC61: 0xFC61, // Shadda + Damma
    0xFC62: 0xFC62, // Shadda + Kasra
    0xFC63: 0xFC63, // Shadda + Dagger alif
};

const _noChangeInForm = -1;
const _isolatedForm = 0;
const _finalForm = 1;
const _initialForm = 2;
const _medialForm = 3;

function _isInArabicSubstitutionA(letter: number): boolean {
    return _arabicSubstitutionA.hasOwnProperty(letter);
}

function _isArabicLetter(letter: number): boolean {
    return (letter >= 0x0600 && letter <= 0x06FF) ||
        (letter >= 0x0750 && letter <= 0x077F) ||
        (letter >= 0x0870 && letter <= 0x089F) ||
        (letter >= 0x08A0 && letter <= 0x08FF) ||
        (letter >= 0xFB50 && letter <= 0xFDFF) ||
        (letter >= 0xFE70 && letter <= 0xFEFF) ||
        (letter >= 0x10E60 && letter <= 0x10E7F) ||
        (letter >= 0x1EC70 && letter <= 0x1ECBF) ||
        (letter >= 0x1ED00 && letter <= 0x1ED4F) ||
        (letter >= 0x1EE00 && letter <= 0x1EEFF);
}

function _isArabicEndLetter(letter: number): boolean {
    const substEntry = _arabicSubstitutionA[letter];
    return _isArabicLetter(letter) &&
        _isInArabicSubstitutionA(letter) &&
        (Array.isArray(substEntry) ? substEntry.length <= 2 : false);
}

function _isArabicAlfLetter(letter: number): boolean {
    return _isArabicLetter(letter) && _alfletter.includes(letter);
}

function _arabicLetterHasFinalForm(letter: number): boolean {
    const substEntry = _arabicSubstitutionA[letter];
    return _isArabicLetter(letter) &&
        _isInArabicSubstitutionA(letter) &&
        (Array.isArray(substEntry) ? substEntry.length >= 2 : false);
}

function _arabicLetterHasMedialForm(letter: number): boolean {
    const substEntry = _arabicSubstitutionA[letter];
    return _isArabicLetter(letter) &&
        _isInArabicSubstitutionA(letter) &&
        (Array.isArray(substEntry) ? substEntry.length === 4 : false);
}

function _isArabicDiacritic(letter: number): boolean {
    return _arabicDiacritics.hasOwnProperty(letter);
}

function isArabicDiacriticValue(letter: number): boolean {
    // In Dart, containsValue checks if any value in the map matches.
    // For a simple object like _arabicDiacritics where keys are equal to values,
    // checking hasOwnProperty is equivalent. If values could be different,
    // one would iterate Object.values(_arabicDiacritics).some(val => val === letter).
    return _arabicDiacritics.hasOwnProperty(letter);
}

function _resolveLigatures(lettersq: number[]): number[] {
    const result: number[] = [];
    let tmpLigatures: any = _ligatures; // Use `any` due to nested dynamic structure
    let tmpDiacritic: any = _diacriticLigatures; // Use `any` due to nested dynamic structure
    const letters = lettersq.slice().reverse(); // .slice() to create a copy before reversing

    const effectedLetters: number[] = [];
    const effectedDiacritics: number[] = [];
    const finalDiacritics: number[] = [];

    for (let i = 0; i < letters.length; i++) {
        const currentLetter = letters[i];

        if (isArabicDiacriticValue(currentLetter)) {
            effectedDiacritics.unshift(currentLetter);
            if (tmpDiacritic.hasOwnProperty(currentLetter)) {
                tmpDiacritic = tmpDiacritic[currentLetter];

                if (typeof tmpDiacritic === 'number') { // If it resolved to a final ligature
                    finalDiacritics.unshift(tmpDiacritic);
                    tmpDiacritic = _diacriticLigatures; // Reset for next sequence
                    effectedDiacritics.length = 0; // Clear
                }
            } else {
                tmpDiacritic = _diacriticLigatures; // Reset
                // add all Diacritics if there is no letter Ligatures.
                if (effectedLetters.length === 0) {
                    result.unshift(...finalDiacritics);
                    result.unshift(...effectedDiacritics);
                    finalDiacritics.length = 0;
                    effectedDiacritics.length = 0;
                }
            }
        } else if (tmpLigatures.hasOwnProperty(currentLetter)) {
            effectedLetters.unshift(currentLetter);
            tmpLigatures = tmpLigatures[currentLetter];

            if (typeof tmpLigatures === 'number') { // If it resolved to a final ligature
                result.unshift(tmpLigatures);
                tmpLigatures = _ligatures; // Reset for next sequence
                effectedLetters.length = 0; // Clear
            }
        } else {
            tmpLigatures = _ligatures; // Reset

            // add effected letters if they aren't ligature.
            if (effectedLetters.length > 0) {
                result.unshift(...effectedLetters);
                effectedLetters.length = 0;
            }

            // add Diacritics after or before letter ligature.
            if (effectedLetters.length === 0 && effectedDiacritics.length > 0) {
                result.unshift(...effectedDiacritics);
                effectedDiacritics.length = 0;
            }

            result.unshift(currentLetter);
        }

        // add Diacritic ligatures.
        if (effectedLetters.length === 0 && finalDiacritics.length > 0) {
            result.unshift(...finalDiacritics);
            finalDiacritics.length = 0;
        }
    }

    return result;
}

function _getCorrectForm(currentChar: number, beforeChar: number, nextChar: number): number {
    if (!_isInArabicSubstitutionA(currentChar)) {
        return _noChangeInForm;
    }
    const hasFinal = _arabicLetterHasFinalForm(currentChar);
    const isArabicBefore = _isArabicLetter(beforeChar);
    const isArabicNext = _isArabicLetter(nextChar);
    const isEndLetterBefore = _isArabicEndLetter(beforeChar);
    const isAlfLetterBefore = _isArabicAlfLetter(beforeChar);
    const isEndLetterCurrent = _isArabicEndLetter(currentChar);

    if (
        !hasFinal ||
        (!isArabicBefore && !isArabicNext) || // isolated (no prev/next Arabic letter)
        (!isArabicNext && isEndLetterBefore) || // final (no next Arabic, and previous is an end-letter)
        (isEndLetterCurrent && !isArabicBefore) || // isolated (current is end-letter, no prev Arabic)
        (isEndLetterCurrent && isAlfLetterBefore) || // isolated (current is end-letter, prev is Alf)
        (isEndLetterCurrent && isEndLetterBefore)    // isolated (current is end-letter, prev is end-letter)
    ) {
        return _isolatedForm;
    }

    if (
        _arabicLetterHasMedialForm(currentChar) &&
        isArabicBefore &&
        !isEndLetterBefore &&
        isArabicNext &&
        _arabicLetterHasFinalForm(nextChar)
    ) {
        return _medialForm;
    }

    if (isEndLetterCurrent || !isArabicNext) {
        return _finalForm;
    }
    return _initialForm;
}

function* _parse(text: string): Generator<string> {
    const words = text.split(' ');
    const notArabicWords: number[][] = [];
    let first = true;

    for (const word of words) {
        const newWord: number[] = [];
        let isNewWordArabic = false;
        let prevLetter = 0;

        for (let j = 0; j < word.length; j += 1) {
            const currentLetter = word.charCodeAt(j); // Use charCodeAt for UTF-16 code units

            if (_isArabicDiacritic(currentLetter)) {
                // Ensure the value exists and is a number for direct assignment
                const diacriticValue = _arabicDiacritics[currentLetter];
                if (diacriticValue !== undefined) {
                    newWord.unshift(diacriticValue);
                } else {
                    // Handle case where diacritic is in map but value is not defined for some reason
                    newWord.unshift(currentLetter); // Fallback to original
                }
                continue;
            }

            // Find the next non-diacritic letter
            let nextLetter = 0;
            for (let k = j + 1; k < word.length; k++) {
                const nextCodeUnit = word.charCodeAt(k);
                if (!_isArabicDiacritic(nextCodeUnit)) {
                    nextLetter = nextCodeUnit;
                    break;
                }
            }

            if (_isArabicLetter(currentLetter)) {
                isNewWordArabic = true;

                const position = _getCorrectForm(currentLetter, prevLetter, nextLetter);
                prevLetter = currentLetter; // Update prevLetter for next iteration

                const substitutionEntry = _arabicSubstitutionA[currentLetter];
                if (position !== _noChangeInForm && Array.isArray(substitutionEntry)) {
                    newWord.unshift(substitutionEntry[position]);
                } else {
                    newWord.unshift(currentLetter); // Add original if no substitution or position is -1
                }
            } else {
                prevLetter = 0; // Reset prevLetter if not an Arabic letter
                if (isNewWordArabic && currentLetter > 32) {
                    newWord.unshift(currentLetter); // Add non-Arabic characters at the beginning
                } else {
                    newWord.push(currentLetter); // Add non-Arabic characters at the end
                }
            }
        }

        if (!first && isNewWordArabic) {
            yield ' ';
        }
        first = false;

        if (isNewWordArabic) {
            isNewWordArabic = false; // Reset for next word
            for (const notArabicNewWord of notArabicWords) {
                yield String.fromCodePoint(...notArabicNewWord); // Use fromCodePoint for robustness
                yield ' ';
            }
            notArabicWords.length = 0; // Clear the array
            yield String.fromCodePoint(..._resolveLigatures(newWord));
        } else {
            notArabicWords.unshift(newWord); // Add non-Arabic word to the front of the list
        }
    }
    // If notArabicWords.length != 0, that means the entire sentence doesn't contain Arabic.
    // Or, it contains only non-Arabic words at the end.
    for (let i = notArabicWords.length - 1; i >= 0; i--) { // Iterate in original order
        if (!first) {
            yield ' ';
        }
        yield String.fromCodePoint(...notArabicWords[i]);
        first = false; // Mark that something has been yielded
    }
}

/**
 * Applies Arabic shape substitutions and ligatures to an input string.
 * This function processes the text word by word and line by line to correctly
 * render Arabic characters in their contextual forms.
 * @param input The input string containing Arabic text.
 * @returns The shaped Arabic string.
 */
export function convert(input: string): string {
    const lines = input.split('\n');
    const parsedParts: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) { // Using length instead of isEmpty
            parsedParts.push('\n'); // Preserve empty lines as newlines in output
            continue;
        }
        // Collect results from generator
        const lineParts = Array.from(_parse(lines[i]));
        parsedParts.push(...lineParts);

        if (i !== lines.length - 1) {
            parsedParts.push('\n'); // Add newline if not the last line
        }
    }
    return parsedParts.join(''); // Join all parts back into a single string
}