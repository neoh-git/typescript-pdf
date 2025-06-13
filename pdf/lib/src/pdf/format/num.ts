// Assuming these types are defined and exported from their respective files:
import { PdfDataType } from './base';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';

/**
 * Represents a PDF Number object (integer or floating-point).
 */
export class PdfNum extends PdfDataType {
    /**
     * The fixed precision for floating-point number output.
     */
    public static readonly precision: number = 5;

    /**
     * The numeric value. Can be an integer or a floating-point number.
     */
    public readonly value: number; // Dart's `num` maps to TypeScript's `number`

    /**
     * Creates a PdfNum instance.
     * @param value The number value.
     * @throws {Error} If the value is `Infinity` or `-Infinity`.
     */
    constructor(value: number) {
        super();
        // Dart's asserts become runtime checks in TypeScript for robustness.
        if (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
            throw new Error('PdfNum value cannot be infinity.');
        }
        this.value = value;
    }

    /**
     * Outputs the PDF Number representation to a stream.
     * Handles both integer and floating-point formatting.
     * Floating-point numbers are formatted with a fixed precision and trailing zeros removed.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level (not applicable for numbers, but part of the interface).
     */
    public output(o: PdfObjectBase, s: PdfStream, indent?: number): void {
        // Dart's asserts become runtime checks in TypeScript.
        if (Number.isNaN(this.value)) {
            throw new Error('PdfNum value cannot be NaN.');
        }
        if (!Number.isFinite(this.value)) {
            throw new Error('PdfNum value cannot be infinite.');
        }

        if (Number.isInteger(this.value)) {
            // If it's an integer, convert to string directly.
            s.putString(this.value.toString());
        } else {
            // For floating-point numbers, format with fixed precision and remove trailing zeros.
            let formattedValue = this.value.toFixed(PdfNum.precision);

            // Remove trailing zeros and trailing decimal point if it becomes integer-like
            if (formattedValue.includes('.')) {
                let n = formattedValue.length - 1;
                while (n >= 0 && formattedValue[n] === '0') {
                    n--;
                }
                if (n >= 0 && formattedValue[n] === '.') {
                    n--; // Remove trailing decimal point if it's the last char
                }
                formattedValue = formattedValue.substring(0, n + 1);
            }
            s.putString(formattedValue);
        }
    }

    /**
     * Compares this PdfNum instance with another object for value equality.
     * @param other The object to compare with.
     * @returns True if the other object is a PdfNum with the same numeric `value`, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfNum)) return false; // Not a PdfNum instance

        return this.value === other.value;
    }

    /**
     * Performs a bitwise OR operation with another PdfNum.
     * Values are first truncated to integers before the operation.
     * This method directly translates Dart's `operator |`.
     * @param other The other PdfNum to perform the bitwise OR with.
     * @returns A new PdfNum instance containing the result of the bitwise OR.
     */
    public bitwiseOr(other: PdfNum): PdfNum {
        // Use Math.trunc() to get the integer part before the bitwise operation.
        return new PdfNum(Math.trunc(this.value) | Math.trunc(other.value));
    }

    // No direct translation for Dart's `hashCode` operator in TypeScript for custom objects.
    // For primitive `number` values, JavaScript's built-in `Map` and `Set` handle hashing natively.
}

/**
 * Represents a list of PDF Numbers.
 */
export class PdfNumList extends PdfDataType {
    /**
     * The list of numeric values.
     */
    public readonly values: number[]; // Dart's `List<num>` maps to TypeScript's `number[]`

    /**
     * Creates a PdfNumList instance.
     * @param values An array of numbers.
     */
    constructor(values: number[]) {
        super();
        this.values = values;
    }

    /**
     * Outputs the PDF Number list representation to a stream.
     * Numbers are space-separated.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level (not applicable for number lists, but part of the interface).
     */
    public output(o: PdfObjectBase, s: PdfStream, indent?: number): void {
        for (let n = 0; n < this.values.length; n++) {
            if (n > 0) {
                s.putByte(0x20); // Add space between numbers
            }
            // Create a temporary PdfNum instance for each value and output it.
            new PdfNum(this.values[n]).output(o, s, indent);
        }
    }

    /**
     * Compares this PdfNumList instance with another object for value equality.
     * This performs a deep comparison of the contained numeric values.
     * @param other The object to compare with.
     * @returns True if the other object is a PdfNumList with the same numbers in the same order, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfNumList)) return false; // Not a PdfNumList instance

        // Compare array lengths first
        if (this.values.length !== other.values.length) {
            return false;
        }

        // Compare each numeric value
        for (let i = 0; i < this.values.length; i++) {
            if (this.values[i] !== other.values[i]) {
                return false;
            }
        }
        return true; // All values are equal
    }

    // No direct translation for Dart's `hashCode` operator for List deep hashing.
    // As explained before, JavaScript's built-in collections use reference equality for objects.
}