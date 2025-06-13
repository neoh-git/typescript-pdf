// Assuming these types are defined and exported from their respective files:
import { PdfDataType } from './base';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';

/**
 * Represents a PDF Name object.
 * A name object is an atomic symbol uniquely defined by a sequence of characters.
 * Names are introduced by a solidus (/) and have no prefix or suffix.
 * Certain characters must be escaped using a hash symbol (#) followed by two hexadecimal digits.
 */
export class PdfName extends PdfDataType {
    /**
     * The string value of the PDF Name, including the leading '/'.
     * Example: '/Type', '/Parent', '/Kids'.
     */
    public readonly value: string;

    /**
     * Creates a PdfName instance.
     * @param value The string value of the name. It should ideally start with '/'.
     *              The constructor will automatically handle escaping rules during output.
     */
    constructor(value: string) {
        super();
        // In Dart, `assert` is for debug mode checks. In TS, we can keep it as a runtime check
        // or omit if it's purely for development assertions. A defensive check is good.
        if (value[0] !== '/') {
            // Depending on strictness, could throw or automatically prefix.
            // Original Dart `assert` suggests it's a programmer error if not prefixed.
            throw new Error('PdfName value must start with a "/" character.');
        }
        this.value = value;
    }

    /**
     * Outputs the PDF Name representation to a stream, handling character escaping as per PDF specification.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level (not typically used for names, but part of the interface).
     */
    public output(o: PdfObjectBase, s: PdfStream, indent?: number): void {
        const bytes: number[] = [];

        // Iterate over each character code in the value string
        for (let i = 0; i < this.value.length; i++) {
            const charCode = this.value.charCodeAt(i);

            // Assertions from Dart, ensure char codes are within expected range
            if (!(charCode > 0x00 && charCode < 0xff)) {
                throw new Error(`PdfName character 0x${charCode.toString(16)} is out of valid range (0x01-0xFE).`);
            }

            // Check if the character needs to be escaped.
            // PDF Spec (1.5, p. 55-56) defines characters that must be escaped in names:
            // - Any character outside the range 0x21 (!) to 0x7E (~)
            // - White-space characters (not relevant here as names don't contain unescaped whitespace)
            // - Delimiter characters: (, ), <, >, [, ], {, }, /, %, #
            // Dart's logic:
            //   - `c < 0x21 || c > 0x7E`: Characters outside printable ASCII range
            //   - `c == 0x23`: '#' itself must be escaped
            //   - `(c == 0x2f && bytes.isNotEmpty)`: '/' must be escaped if not the *first* character
            //     (since the first '/' is the name prefix)
            //   - `c == 0x5b || c == 0x5d`: '[' or ']'
            //   - `c == 0x28`: '('
            //   - `c == 0x3c || c == 0x3e`: '<' or '>'
            if (
                charCode < 0x21 || // Control characters or below '!'
                charCode > 0x7E || // Above '~' (e.g., Unicode, extended ASCII)
                charCode === 0x23 || // '#' character
                (charCode === 0x2f && bytes.length > 0) || // '/' but not if it's the very first char
                charCode === 0x5b || charCode === 0x5d || // '[' or ']'
                charCode === 0x28 || // '('
                charCode === 0x3c || charCode === 0x3e // '<' or '>'
            ) {
                bytes.push(0x23); // '#'
                // Convert charCode to 2-digit hexadecimal string, then to byte codes
                const hex = charCode.toString(16).padStart(2, '0').toUpperCase(); // Ensure two digits, uppercase
                bytes.push(...hex.split('').map(char => char.charCodeAt(0)));
            } else {
                bytes.push(charCode); // Add character directly if no escaping needed
            }
        }
        s.putBytes(bytes);
    }

    /**
     * Compares this PdfName instance with another object for value equality.
     * Names are considered equal if their string values are identical.
     * @param other The object to compare with.
     * @returns True if the other object is a PdfName with the same string `value`, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfName)) return false; // Not a PdfName instance

        return this.value === other.value;
    }

    // In TypeScript, there is no direct equivalent to Dart's `hashCode` operator
    // for custom object hashing in built-in collections.
    // JavaScript's `Map` and `Set` use reference equality for objects by default.
    // For string values, JavaScript's string itself can be used as a key in Map/Set.
    // The `hashCode` is not implemented as it's not directly applicable to TS's native collections.
}