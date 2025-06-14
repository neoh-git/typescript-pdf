// Assuming these types are defined and exported from their respective files:
import { PdfColor, PdfColorCmyk } from '../color';
import { PdfDataType } from './base';
import { PdfDict } from './dict';
import { PdfIndirect } from './indirect';
import { PdfName } from './name';
import { PdfNum } from './num';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';
import { PdfString } from './string';

// A constant representing the indentation size, if not imported from elsewhere.
const kIndentSize = 2; // Common PDF indentation size

/**
 * Represents a PDF array object, holding a list of PDF data types.
 * @remarks In Dart, this class was marked as @Deprecated('Use PdfObject<PdfArray> instead'),
 * but the class itself is translated as per the request.
 */
export class PdfArray<T extends PdfDataType> extends PdfDataType {
    /**
     * The list of values contained within this array.
     */
    public readonly values: T[];

    /**
     * Creates an array object.
     * @param values An optional iterable of initial values for the array.
     */
    constructor(values?: Iterable<T>) {
        super();
        this.values = values ? Array.from(values) : [];
    }

    /**
     * Creates a PdfArray containing indirect references to PDF objects.
     * @param objects An iterable of PdfObjectBase instances.
     * @returns A new PdfArray of PdfIndirect references.
     */
    static fromObjects(objects: Iterable<PdfObjectBase<PdfDataType>>): PdfArray<PdfIndirect> {
        // Map PdfObjectBase instances to their indirect references
        return new PdfArray(Array.from(objects).map(e => e.ref()));
    }

    /**
     * Creates a PdfArray containing numeric values.
     * @param list An iterable of numbers.
     * @returns A new PdfArray of PdfNum instances.
     */
    static fromNumbers(list: Iterable<number>): PdfArray<PdfNum> {
        // Map numbers to PdfNum instances
        return new PdfArray(Array.from(list).map(e => new PdfNum(e)));
    }

    /**
     * Creates a PdfArray representing a color.
     * This method handles both RGB and CMYK color types.
     * @param color The PdfColor or PdfColorCmyk instance.
     * @returns A new PdfArray of PdfNum instances representing the color components.
     */
    static fromColor(color: PdfColor | PdfColorCmyk): PdfArray<PdfNum> {
        if (color instanceof PdfColorCmyk) {
            return PdfArray.fromNumbers([
                color.cyan,
                color.magenta,
                color.yellow,
                color.black,
            ]);
        } else {
            return PdfArray.fromNumbers([
                color.red,
                color.green,
                color.blue,
            ]);
        }
    }

    /**
     * Adds a value to the end of the array.
     * @param v The value to add.
     */
    public add(v: T): void {
        this.values.push(v);
    }

    /**
     * Outputs the PDF array representation to a stream.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level for pretty-printing.
     */
    public output(o: PdfObjectBase<PdfDataType>, s: PdfStream, indent?: number): void {
        let currentIndent = indent;

        if (currentIndent != null) {
            s.putBytes(Array(currentIndent).fill(0x20)); // Add spaces for indentation
            currentIndent += kIndentSize;
        }

        s.putString('['); // Start of array

        if (this.values.length > 0) {
            for (let n = 0; n < this.values.length; n++) {
                const val = this.values[n];
                if (currentIndent != null) {
                    s.putByte(0x0a); // Newline
                    // Special handling for Dicts and Arrays for compact output on new line
                    if (!(val instanceof PdfDict) && !(val instanceof PdfArray)) {
                        s.putBytes(Array(currentIndent).fill(0x20)); // Indent item
                    }
                } else {
                    // In compact mode, add space between items if needed
                    if (n > 0 &&
                        !(val instanceof PdfName ||
                            val instanceof PdfString ||
                            val instanceof PdfArray ||
                            val instanceof PdfDict)) {
                        s.putByte(0x20); // Space
                    }
                }
                val.output(o, s, currentIndent); // Output the item
            }
            if (currentIndent != null) {
                s.putByte(0x0a); // Newline after last item
            }
        }

        if (currentIndent != null) {
            currentIndent -= kIndentSize; // Revert indentation
            s.putBytes(Array(currentIndent).fill(0x20)); // Indent closing bracket
        }
        s.putString(']'); // End of array
    }

    /**
     * Removes duplicate values from the array, preserving the first occurrence's order.
     * Note: For object values (type `T`), this method relies on JavaScript's `Map` behavior,
     * which uses strict equality (`===`) for object keys by default. If deep value uniqueness
     * for objects is required, a custom comparison or serialization would be needed.
     */
    public uniq(): void {
        if (this.values.length <= 1) {
            return;
        }

        // Use Map to preserve insertion order and track uniqueness based on strict equality (===)
        const uniques = new Map<T, boolean>();
        for (const s of this.values) {
            if (!uniques.has(s)) { // Check if this specific instance is already present
                uniques.set(s, true);
            }
        }
        // Clear current values and add unique ones back in their preserved order
        this.values.length = 0; // Efficient way to clear array
        this.values.push(...Array.from(uniques.keys()));
    }

    /**
     * Compares this PdfArray with another object for value equality.
     * It performs a deep comparison of the contained values.
     * Assumes that the generic type `T` (which extends `PdfDataType`) has an `equals` method
     * for its own value comparison. If `T` does not have an `equals` method, strict equality (`===`) is used.
     * @param other The object to compare with.
     * @returns True if the arrays are equal in content and order, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfArray)) return false; // Not a PdfArray

        // Check if array lengths are different
        if (this.values.length !== other.values.length) {
            return false;
        }

        // Iterate and compare each element
        for (let i = 0; i < this.values.length; i++) {
            const val1 = this.values[i];
            const val2 = other.values[i];

            // If an element has an 'equals' method, use it for deep comparison.
            // Otherwise, fall back to strict equality (===).
            if (typeof (val1 as any).equals === 'function') {
                if (!(val1 as any).equals(val2)) {
                    return false;
                }
            } else {
                if (val1 !== val2) {
                    return false;
                }
            }
        }
        return true; // All elements are equal
    }

    /**
     * Checks if the array is empty.
     */
    public get isEmpty(): boolean {
        return this.values.length === 0;
    }

    /**
     * Checks if the array is not empty.
     */
    public get isNotEmpty(): boolean {
        return this.values.length > 0;
    }

    // Note: Dart's `hashCode` operator is not directly translatable to a language feature
    // in TypeScript/JavaScript for object hashing or custom equality in built-in Maps/Sets.
    // Its functionality (for hash-based collections) is handled differently in TS,
    // usually by reference equality or by requiring custom Map/Set implementations if deep
    // value-based hashing is critical.
}