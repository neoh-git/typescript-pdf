// Assuming these types are defined and exported from their respective files:
import { PdfDataType } from './base';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';

/**
 * Represents the PDF Null object.
 * This is a singleton class, meaning there's only one instance of PdfNull.
 */
export class PdfNull extends PdfDataType {
    // Private static instance to implement the singleton pattern.
    private static _instance: PdfNull;

    /**
     * Private constructor to prevent direct instantiation from outside the class,
     * ensuring that only one instance of PdfNull exists (singleton).
     */
    private constructor() {
        super();
    }

    /**
     * Provides the single, globally accessible instance of PdfNull.
     * @returns The singleton PdfNull instance.
     */
    public static get instance(): PdfNull {
        if (!PdfNull._instance) {
            PdfNull._instance = new PdfNull();
        }
        return PdfNull._instance;
    }

    /**
     * Outputs the PDF Null representation ('null') to a stream.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level (not applicable for null, but part of the interface).
     */
    public output(o: PdfObjectBase, s: PdfStream, indent?: number): void {
        s.putString('null');
    }

    /**
     * Compares this PdfNull instance with another object for equality.
     * Since PdfNull is a singleton, two PdfNull instances are always considered equal.
     * @param other The object to compare with.
     * @returns True if the other object is also a PdfNull instance, false otherwise.
     */
    public equals(other: any): boolean {
        // If it's the same instance or another instance of PdfNull, it's considered equal.
        // Given it's a singleton, `this === other` is the primary check.
        return this === other || other instanceof PdfNull;
    }

    // In TypeScript/JavaScript, primitive 'null' does not have a hashCode property.
    // For a singleton class, the concept of a unique hash code is less relevant
    // as equality is simply based on being the single instance.
    // Therefore, no `hashCode` getter is translated.
}

// To use it:
// const pdfNull = PdfNull.instance;