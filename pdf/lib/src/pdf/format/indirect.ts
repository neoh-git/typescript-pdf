// Assuming these types are defined and exported from their respective files:
import { PdfDataType } from './base';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';

/**
 * Represents an indirect reference to a PDF object.
 * An indirect reference consists of an object number (ser) and a generation number (gen),
 * followed by the character 'R'.
 */
export class PdfIndirect extends PdfDataType {
    /**
     * The object number (serial number) of the referenced PDF object.
     */
    public readonly ser: number;

    /**
     * The generation number of the referenced PDF object.
     */
    public readonly gen: number;

    /**
     * Creates a PdfIndirect instance.
     * @param ser The object number.
     * @param gen The generation number.
     */
    constructor(ser: number, gen: number) {
        super();
        this.ser = ser;
        this.gen = gen;
    }

    /**
     * Outputs the PDF indirect reference representation to a stream.
     * Format: "obj_number gen_number R" (e.g., "12 0 R").
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level (not typically used for indirect refs, but part of the interface).
     */
    public output(o: PdfObjectBase, s: PdfStream, indent?: number): void {
        s.putString(`${this.ser} ${this.gen} R`);
    }

    /**
     * Compares this PdfIndirect instance with another object for value equality.
     * An indirect reference is considered equal if both its object number and generation number match.
     * @param other The object to compare with.
     * @returns True if the other object is a PdfIndirect with the same `ser` and `gen`, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfIndirect)) return false; // Not a PdfIndirect instance

        return this.ser === other.ser && this.gen === other.gen;
    }

    // In TypeScript, there is no direct equivalent to Dart's `hashCode` operator
    // for custom object hashing in built-in collections (like Map or Set).
    // JavaScript's `Map` and `Set` use reference equality for objects by default.
    // If you need value-based hashing for PdfIndirect instances in a collection,
    // you would typically need to implement a custom Map/Set or serialize the object
    // to a string key.
}