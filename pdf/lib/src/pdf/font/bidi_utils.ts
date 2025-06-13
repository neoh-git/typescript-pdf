// Assuming the 'bidi' module is available and correctly typed (e.g., via a `bidi.d.ts` file)
import * as bidi from 'bidi';

// --- Local Constants ---
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
    0xFC60: 0xFC60, // Shadda + Fatha
    0xFC61: 0xFC61, // Shadda + Damma
    0xFC62: 0xFC62, // Shadda + Kasra
    0xFC63: 0xFC63, // Shadda + Dagger alif
    // 1548: 1548,
};

/**
 * Checks if a given Unicode `letter` (code point) is an Arabic diacritic.
 * @param letter The Unicode code point to check.
 * @returns True if the letter is an Arabic diacritic, false otherwise.
 */
export function isArabicDiacriticValue(letter: number): boolean {
    // In Dart, containsValue checks if any value in the map matches.
    // For a simple object like _arabicDiacritics where keys are equal to values,
    // checking hasOwnProperty is equivalent. If values could be different,
    // one would iterate Object.values(_arabicDiacritics).some(val => val === letter).
    return _arabicDiacritics.hasOwnProperty(letter);
}

/// Arabic characters that have different unicode values
/// but should point to the same glyph.
export const basicToIsolatedMappings: Record<number, number> = {
    0x0627: 0xFE8D, // ا
    0x0628: 0xFE8F, // ب
    0x062A: 0xFE95, // ت
    0x062B: 0xFE99, // ث
    0x062C: 0xFE9D, // ج
    0x062D: 0xFEA1, // ح
    0x062E: 0xFEA5, // خ
    0x062F: 0xFEA9, // د
    0x0630: 0xFEAB, // ذ
    0x0631: 0xFEAD, // ر
    0x0632: 0xFEAF, // ز
    0x0633: 0xFEB1, // س
    0x0634: 0xFEB5, // ش
    0x0635: 0xFEB9, // ص
    0x0636: 0xFEBD, // ض
    0x0637: 0xFEC1, // ط
    0x0638: 0xFEC5, // ظ
    0x0639: 0xFEC9, // ع
    0x063A: 0xFECD, // غ
    0x0641: 0xFED1, // ف
    0x0642: 0xFED5, // ق
    0x0643: 0xFED9, // ك
    0x0644: 0xFEDD, // ل
    0x0645: 0xFEE1, // م
    0x0646: 0xFEE5, // ن
    0x0647: 0xFEE9, // ه
    0x0648: 0xFEED, // و
    0x064A: 0xFEEF, // ي
    0x0621: 0xFE80, // ء
    0x0622: 0xFE81, // آ
    0x0623: 0xFE83, // أ
    0x0624: 0xFE85, // ؤ
    0x0625: 0xFE87, // إ
    0x0626: 0xFE89, // ئ
    0x0629: 0xFE93, // ة
};

// --- Mimicking Dart's StringBuffer ---
class StringBuffer {
    private _buffer: string[] = [];

    /**
     * Appends a string to the buffer.
     * @param text The string to append.
     */
    public write(text: string): void {
        this._buffer.push(text);
    }

    /**
     * Appends a string and a newline character to the buffer.
     * @param text Optional string to append before the newline.
     */
    public writeln(text: string = ''): void {
        this._buffer.push(text, '\n');
    }

    /**
     * Returns the accumulated string content of the buffer.
     * @returns The string content.
     */
    public toString(): string {
        return this._buffer.join('');
    }

    /**
     * Clears the buffer.
     */
    public clear(): void {
        this._buffer = [];
    }
}

/**
 * Applies THE BIDIRECTIONAL ALGORITHM to reorder text from logical to visual order.
 * This function uses an external `bidi` library (assumed to be `bidi.js` or similar)
 * to handle the complex bidirectional algorithm rules.
 *
 * @param input The logical order string (e.g., as typed).
 * @returns The visual order string suitable for display, with words reordered for RTL segments.
 */
export function logicalToVisual(input: string): string {
    const buffer = new StringBuffer();
    // Assuming BidiString.fromLogical(input) returns an object with a `paragraphs` array,
    // where each paragraph has `bidiText` (an array of character codes in visual order)
    // and a `separator` (e.g., 10 for newline).
    const paragraphs = bidi.BidiString.fromLogical(input).paragraphs;

    for (const paragraph of paragraphs) {
        // Check if the paragraph originally ended with a newline (ASCII LF)
        const endsWithNewLine = paragraph.separator === 10;
        // The bidiText might include the separator at the end, so adjust endIndex if it does.
        const endIndex = paragraph.bidiText.length - (endsWithNewLine ? 1 : 0);

        // Convert the bidiText (array of character codes) to a string.
        // Using `String.fromCodePoint` is safer for full Unicode support than `String.fromCharCode`.
        const visualChars = Array.from(paragraph.bidiText).slice(0, endIndex);
        const visual = String.fromCodePoint(...visualChars);

        // Split the visual string by spaces, reverse the word order, and rejoin.
        // This is a common step for displaying Arabic text correctly, as words
        // themselves are RTL, but their order within a line is also affected by bidi rules.
        buffer.write(visual.split(' ').reverse().join(' '));

        // If the original paragraph ended with a newline, append one to the buffer.
        if (endsWithNewLine) {
            buffer.writeln();
        }
    }
    return buffer.toString();
}