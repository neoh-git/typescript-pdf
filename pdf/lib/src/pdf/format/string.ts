// Assuming these types are defined and exported from their respective files:
// import { Uint8Array } from 'typed_data'; // Uint8Array is a global type in TS environments
import { PdfDataType } from './base';
import { PdfObjectBase } from './object_base'; // Assumes PdfObjectBase.settings has encryptCallback
import { PdfStream } from './stream';

// --- Encoding Helpers (replacing Dart's `dart:convert`) ---

/**
 * Encodes a string to a Uint8Array using Latin-1 (ISO-8859-1) encoding.
 * This is a common encoding for PDF strings when they are not UTF-16BE.
 * In a real environment, you'd use a robust encoding library (e.g., `TextEncoder`).
 * This simple implementation assumes characters are within Latin-1 range.
 */
function latin1Encode(str: string): Uint8Array {
    const encoder = new TextEncoder('iso-8859-1'); // Use 'iso-8859-1' for Latin-1
    return encoder.encode(str);
}

/**
 * Encodes a string to a Uint8Array using UTF-16BE (Big Endian) encoding.
 * This function manually implements the logic from Dart's `_encodeUtf16be`.
 * This is used for PDF strings that contain non-Latin1 characters.
 */
function utf16beEncode(str: string): Uint8Array {
    const unicodeReplacementCharacterCodePoint = 0xfffd; // �
    const unicodeByteZeroMask = 0xff;
    const unicodeByteOneMask = 0xff00;
    const unicodeValidRangeMax = 0x10ffff;
    const unicodePlaneOneMax = 0xffff; // U+FFFF is the highest char in BMP (Basic Multilingual Plane)
    const unicodeUtf16ReservedLo = 0xd800; // Start of surrogate range
    const unicodeUtf16ReservedHi = 0xdfff; // End of surrogate range
    const unicodeUtf16Offset = 0x10000;
    const unicodeUtf16SurrogateUnit0Base = 0xd800; // High-surrogate base
    const unicodeUtf16SurrogateUnit1Base = 0xdc00; // Low-surrogate base
    const unicodeUtf16HiMask = 0xffc00; // Mask for high 10 bits of supplemental plane char
    const unicodeUtf16LoMask = 0x3ff;   // Mask for low 10 bits of supplemental plane char

    const encoding: number[] = [];

    // Helper to add a 16-bit unit (2 bytes) in Big Endian order
    function addUnit(unit: number) {
        encoding.push((unit & unicodeByteOneMask) >> 8); // High byte
        encoding.push(unit & unicodeByteZeroMask);    // Low byte
    }

    // Iterate over Unicode code points using `codePointAt` for full Unicode support.
    // Dart's `codeUnits` can yield surrogate pairs which need to be handled,
    // but iterating by `codePointAt` simplifies this by giving full code points.
    for (let i = 0; i < str.length; i++) {
        const codePoint = str.codePointAt(i)!; // Get full Unicode code point

        if (codePoint > unicodePlaneOneMax && codePoint <= unicodeValidRangeMax) {
            // Supplemental Plane characters (U+10000 to U+10FFFF) need surrogate pairs.
            const base = codePoint - unicodeUtf16Offset;
            addUnit(unicodeUtf16SurrogateUnit0Base + ((base & unicodeUtf16HiMask) >> 10)); // High surrogate
            addUnit(unicodeUtf16SurrogateUnit1Base + (base & unicodeUtf16LoMask));   // Low surrogate
            // Advance `i` by 1 because codePointAt processes surrogate pairs as one unit but `length` counts two.
            if (codePoint >= 0x10000) { // If it was a 2-unit surrogate pair
                i++;
            }
        } else if (
            (codePoint >= 0 && codePoint < unicodeUtf16ReservedLo) ||
            (codePoint > unicodeUtf16ReservedHi && codePoint <= unicodePlaneOneMax)
        ) {
            // Basic Multilingual Plane (BMP) characters, excluding surrogate range.
            addUnit(codePoint);
        } else {
            // Invalid code points or lone surrogates. Replace with replacement character.
            addUnit(unicodeReplacementCharacterCodePoint);
        }
    }
    return new Uint8Array(encoding);
}

// Helper to compare Uint8Arrays by content
function areUint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// --- Enum for PdfStringFormat ---

/**
 * Defines the format for a PDF string when it's outputted.
 */
export enum PdfStringFormat {
    /** String is represented as a sequence of hexadecimal digits, enclosed in `<` and `>`. */
    binary,
    /** String is represented as a literal string, enclosed in `(` and `)`. */
    literal,
}

// --- PdfString Class ---

/**
 * Represents a PDF String object.
 * PDF strings can be literal (enclosed in parentheses) or hexadecimal (enclosed in angle brackets).
 */
export class PdfString extends PdfDataType {
    /**
     * The raw byte value of the string.
     */
    public readonly value: Uint8Array;

    /**
     * The format of the string (literal or binary).
     */
    public readonly format: PdfStringFormat;

    /**
     * Indicates whether the string should be encrypted when written to the PDF file.
     */
    public readonly encrypted: boolean;

    /**
     * Private constructor used by static factory methods.
     * @param value The byte value of the string.
     * @param format The format of the string.
     * @param encrypted Whether the string should be encrypted.
     */
    constructor(
        value: Uint8Array,
        params: {
            format?: PdfStringFormat;
            encrypted?: boolean;
        } = {}
    ) {
        super();
        this.value = value;
        this.format = params.format ?? PdfStringFormat.literal;
        this.encrypted = params.encrypted ?? true;
    }

    /**
     * Creates a PdfString from a JavaScript string.
     * It attempts to encode using Latin-1. If characters are outside Latin-1,
     * it falls back to UTF-16BE with a BOM.
     * @param value The input string.
     * @param encrypted Whether the string should be encrypted. Defaults to true.
     * @returns A new PdfString instance.
     */
    public static fromString(
        value: string,
        params: { encrypted?: boolean } = {}
    ): PdfString {
        let bytes: Uint8Array;
        try {
            bytes = latin1Encode(value);
        } catch (e) {
            // If Latin-1 encoding fails (e.g., non-Latin1 chars), fallback to UTF-16BE with BOM.
            // Dart uses 0xFE 0xFF as BOM for UTF-16BE.
            bytes = new Uint8Array([0xfe, 0xff, ...Array.from(utf16beEncode(value))]);
        }
        return new PdfString(bytes, { format: PdfStringFormat.literal, encrypted: params.encrypted });
    }

    /**
     * Creates a PdfString from the output of a PdfStream.
     * @param stream The PdfStream whose content will be the string's value.
     * @param format The format of the string. Defaults to literal.
     * @param encrypted Whether the string should be encrypted. Defaults to true.
     * @returns A new PdfString instance.
     */
    public static fromStream(
        stream: PdfStream,
        params: {
            format?: PdfStringFormat;
            encrypted?: boolean;
        } = {}
    ): PdfString {
        return new PdfString(stream.output(), params);
    }

    /**
     * Creates a PdfString from a JavaScript Date object, formatted as a PDF date string.
     * Format: `D:YYYYMMDDHHmmSSZ` for UTC.
     * @param date The Date object.
     * @param encrypted Whether the string should be encrypted. Defaults to true.
     * @returns A new PdfString instance.
     */
    public static fromDate(
        date: Date,
        params: { encrypted?: boolean } = {}
    ): PdfString {
        const utcDate = date.toUTCString(); // "Wed, 21 Oct 2015 18:27:50 GMT"
        const d = new Date(utcDate); // Create a new Date object from UTC string to extract UTC components

        const year = d.getUTCFullYear().toString().padStart(4, '0');
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        const day = d.getUTCDate().toString().padStart(2, '0');
        const hour = d.getUTCHours().toString().padStart(2, '0');
        const minute = d.getUTCMinutes().toString().padStart(2, '0');
        const second = d.getUTCSeconds().toString().padStart(2, '0');

        const pdfDateString = `D:${year}${month}${day}${hour}${minute}${second}Z`;
        return PdfString.fromString(pdfDateString, { encrypted: params.encrypted });
    }

    /**
     * Escapes special characters within a literal PDF string.
     * Backslash (`\`) is used to escape: `\n`, `\r`, `\t`, `\b`, `\f`, `\(`, `\)`, `\\`.
     * @param s The PdfStream to write to.
     * @param bytes The Uint8Array containing the bytes of the string to escape.
     */
    private _putTextBytes(s: PdfStream, bytes: Uint8Array): void {
        for (const byte of bytes) {
            switch (byte) {
                case 0x0a: // Line feed (LF)
                    s.putByte(0x5c); // \
                    s.putByte(0x6e); // n
                    break;
                case 0x0d: // Carriage return (CR)
                    s.putByte(0x5c); // \
                    s.putByte(0x72); // r
                    break;
                case 0x09: // Horizontal tab (HT)
                    s.putByte(0x5c); // \
                    s.putByte(0x74); // t
                    break;
                case 0x08: // Backspace (BS)
                    s.putByte(0x5c); // \
                    s.putByte(0x62); // b
                    break;
                case 0x0c: // Form feed (FF)
                    s.putByte(0x5c); // \
                    s.putByte(0x66); // f
                    break;
                case 0x28: // Left parenthesis '('
                    s.putByte(0x5c); // \
                    s.putByte(0x28); // (
                    break;
                case 0x29: // Right parenthesis ')'
                    s.putByte(0x5c); // \
                    s.putByte(0x29); // )
                    break;
                case 0x5c: // Backslash '\'
                    s.putByte(0x5c); // \
                    s.putByte(0x5c); // \
                    break;
                default:
                    s.putByte(byte); // All other characters are written directly
            }
        }
    }

    /**
     * Converts a digit (0-15) into its corresponding ASCII hexadecimal character code.
     * Used for binary string formatting.
     * @param digit The digit (0-15).
     * @returns The ASCII character code for the hexadecimal digit ('0'-'9', 'a'-'f').
     */
    private _codeUnitForDigit(digit: number): number {
        // 0-9 -> 0x30-0x39 ('0'-'9')
        // 10-15 -> 0x61-0x66 ('a'-'f')
        return digit < 10 ? digit + 0x30 : digit + 0x61 - 10;
    }

    /**
     * Internal helper to output the string based on its format (binary or literal),
     * without considering encryption.
     * @param s The PdfStream to write to.
     * @param value The Uint8Array bytes of the string.
     */
    private _outputInternal(s: PdfStream, value: Uint8Array): void {
        switch (this.format) {
            case PdfStringFormat.binary:
                s.putByte(0x3c); // '<'
                for (const byte of value) {
                    s.putByte(this._codeUnitForDigit((byte & 0xF0) >> 4)); // High nibble
                    s.putByte(this._codeUnitForDigit(byte & 0x0F));     // Low nibble
                }
                s.putByte(0x3e); // '>'
                break;
            case PdfStringFormat.literal:
                s.putByte(0x28); // '('
                this._putTextBytes(s, value);
                s.putByte(0x29); // ')'
                break;
        }
    }

    /**
     * Outputs the PDF String representation to a stream.
     * Handles encryption if applicable before calling the internal output method.
     * @param o The PdfObjectBase associated with this output operation (context),
     *          providing access to encryption callbacks.
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level (not typically used for strings).
     */
    public output(o: PdfObjectBase<any>, s: PdfStream, indent?: number): void {
        // If not encrypted or no encryption callback is provided, output the original value.
        if (!this.encrypted || o.settings.encryptCallback == null) {
            return this._outputInternal(s, this.value);
        }

        // Otherwise, encrypt the value using the callback and then output the encrypted bytes.
        const encryptedValue = o.settings.encryptCallback(this.value, o);
        this._outputInternal(s, encryptedValue);
    }

    /**
     * Compares this PdfString instance with another object for value equality.
     * Two PdfString instances are considered equal if their underlying `value` Uint8Arrays are content-equal.
     * @param other The object to compare with.
     * @returns True if the other object is a PdfString with the same byte content, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfString)) return false; // Not a PdfString instance

        // Compare the Uint8Array values by content.
        return areUint8ArraysEqual(this.value, other.value);
    }

    // No direct translation for Dart's `hashCode` operator for Uint8List deep hashing.
    // As explained before, JavaScript's built-in collections use reference equality for objects.
}