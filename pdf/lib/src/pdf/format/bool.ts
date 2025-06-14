// Assuming these types are defined and exported from their respective files:
import { PdfDataType } from './base';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';

/**
 * Represents a PDF boolean value (true or false).
 */
export class PdfBool extends PdfDataType {
    /**
     * The boolean value.
     */
    public readonly value: boolean;

    /**
     * Creates a PdfBool instance with the given boolean value.
     * @param value The boolean value.
     */
    constructor(value: boolean) {
        super();
        this.value = value;
    }

    /**
     * Outputs the PDF boolean representation ('true' or 'false') to a stream.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level (not typically used for booleans, but part of the interface).
     */
    public output(o: PdfObjectBase<PdfDataType>, s: PdfStream, indent?: number): void {
        s.putString(this.value ? 'true' : 'false');
    }

    /**
     * Compares this PdfBool instance with another object for value equality.
     * @param other The object to compare with.
     * @returns True if the other object is a PdfBool with the same boolean value, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfBool)) return false; // Not a PdfBool
        return this.value === other.value; // Compare internal boolean value
    }

    // In TypeScript, there's no direct equivalent to Dart's `hashCode` operator
    // for custom object hashing in built-in collections.
    // For primitive values like boolean, JavaScript handles equality natively.
}