// Assuming these types are defined and exported from their respective files:
// import * as math from 'dart:math'; // Math is globally available in JS/TS
import { PdfArray } from './array';
import { PdfDataType } from './base'; // Assumes PdfDataType has an 'output' method and an 'equals' method for comparison
import { PdfBool } from './bool';
import { PdfIndirect } from './indirect';
import { PdfNull } from './null_value';
import { PdfNum } from './num';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';

// kIndentSize must be imported or defined.
// Assuming it is exported from a common utility or base file, e.g., 'base.ts'.
import { kIndentSize } from './base'; // Or define it locally if not shared: const kIndentSize = 2;


/**
 * Represents a PDF dictionary object.
 * A dictionary is a collection of key-value pairs, similar to a hash map.
 * Keys are strings (typically PDF Names, but represented as strings here for convenience),
 * and values are other PDF data types.
 */
export class PdfDict<T extends PdfDataType> extends PdfDataType {
    /**
     * The internal object storing the dictionary's key-value pairs.
     * Keys are strings, and values are of type T (which extends PdfDataType).
     */
    public readonly values: Map<string, T>;

    /**
     * Creates a PdfDict instance.
     * @param initialValues An optional object containing initial key-value pairs.
     *                      If not provided, an empty dictionary is created.
     */
    constructor(initialValues?: Map<string, T> | { [key: string]: T }) {
        super();
        this.values = new Map<string, T>(initialValues instanceof Map ? initialValues : Object.entries(initialValues || {}));
    }

    /**
     * Creates a PdfDict instance using a map of initial values.
     * This is a static factory method mirroring Dart's named constructor `PdfDict.values`.
     * @param initialValues An optional object containing initial key-value pairs.
     */
    static values<T extends PdfDataType>(initialValues?: Map<string, T> | { [key: string]: T }): PdfDict<T> {
        return new PdfDict(initialValues);
    }

    /**
     * Creates a PdfDict where the values are indirect references to PdfObjectBase instances.
     * This is useful for building dictionaries that refer to other PDF objects.
     * @param objects A plain object mapping string keys to PdfObjectBase instances.
     * @returns A new PdfDict where the values are PdfIndirect references.
     */
    static fromObjectMap(objects: { [key: string]: PdfObjectBase<PdfDataType> }): PdfDict<PdfIndirect> {
        const mappedValues: { [key: string]: PdfIndirect } = {};
        for (const key in objects) {
            // Ensure the property belongs to the object itself, not its prototype chain
            if (Object.prototype.hasOwnProperty.call(objects, key)) {
                mappedValues[key] = objects[key].ref(); // Assumes PdfObjectBase has a .ref() method
            }
        }
        return new PdfDict(mappedValues);
    }

    /**
     * Checks if the dictionary contains any key-value pairs.
     * @returns `true` if the dictionary is not empty, `false` otherwise.
     */
    public get isNotEmpty(): boolean {
        return Object.keys(this.values).length > 0;
    }

    /**
     * Checks if the dictionary contains no key-value pairs.
     * @returns `true` if the dictionary is empty, `false` otherwise.
     */
    public get isEmpty(): boolean {
        return Object.keys(this.values).length === 0;
    }

    /**
     * Sets a value in the dictionary.
     * This method provides an explicit setter function, replacing Dart's `operator []=`.
     * @param key The key (string) for the value.
     * @param value The value to associate with the key.
     */
    public set(key: string, value: T): void {
        this.values.set(key, value);
    }

    /**
     * Retrieves a value from the dictionary.
     * This method provides an explicit getter function, replacing Dart's `operator []`.
     * @param key The key (string) of the value to retrieve.
     * @returns The value associated with the key, or `undefined` if the key is not found.
     */
    public get(key: string): T | undefined {
        return this.values.get(key);
    }

    /**
     * Outputs the PDF dictionary's representation to a stream.
     * Dictionaries are enclosed in `<<` and `>>`.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level for pretty-printing the output.
     */
    public output(o: PdfObjectBase<PdfDataType>, s: PdfStream, indent?: number): void {
        let currentIndent = indent; // Use a local variable for mutable indentation

        if (currentIndent != null) {
            // Add initial indentation spaces if pretty-printing
            s.putBytes(Array(currentIndent).fill(0x20));
        }

        s.putBytes([0x3c, 0x3c]); // Output ASCII for '<<'

        let longestKeyLength = 0; // For aligning values in pretty-print mode
        if (currentIndent != null) {
            s.putByte(0x0a); // Newline after '<<' for pretty-printing
            currentIndent += kIndentSize; // Increase indentation for dictionary entries

            // Calculate the length of the longest key for column alignment
            longestKeyLength = Object.keys(this.values).reduce((maxLen, key) => Math.max(maxLen, key.length), 0);
        }

        // Iterate over each key-value pair in the dictionary
        Object.entries(this.values).forEach(([key, value]) => {
            let spacingBetweenKeyAndValue = 1; // Default single space for compact mode

            if (currentIndent != null) {
                // Add indentation for the current key-value pair line
                s.putBytes(Array(currentIndent).fill(0x20));
                // Calculate spaces needed to align value based on longest key
                spacingBetweenKeyAndValue = longestKeyLength - key.length + 1;
            }

            s.putString(key); // Output the key (e.g., "/Type")

            if (currentIndent != null) {
                // In pretty-print mode:
                // If value is a nested dictionary or array, put it on a new line.
                // Otherwise, add calculated spaces for alignment.
                if (value instanceof PdfDict || value instanceof PdfArray) {
                    s.putByte(0x0a);
                } else {
                    s.putBytes(Array(spacingBetweenKeyAndValue).fill(0x20));
                }
            } else {
                // In compact mode:
                // Add a single space after certain value types to separate from the next.
                // (PdfName and PdfString handle their own internal spacing or are quoted).
                if (value instanceof PdfNum || value instanceof PdfBool || value instanceof PdfNull || value instanceof PdfIndirect) {
                    s.putByte(0x20); // Add a space
                }
            }

            value.output(o, s, currentIndent); // Recursively output the value

            if (currentIndent != null) {
                s.putByte(0x0a); // Newline after each value in pretty-print mode
            }
        });

        if (currentIndent != null) {
            currentIndent -= kIndentSize; // Decrease indentation back for the closing '>>'
            s.putBytes(Array(currentIndent).fill(0x20)); // Add indentation for closing '>>'
        }
        s.putBytes([0x3e, 0x3e]); // Output ASCII for '>>'
    }

    /**
     * Checks if the dictionary contains a specific key.
     * @param key The key (string) to check for existence.
     * @returns `true` if the key exists in the dictionary, `false` otherwise.
     */
    public containsKey(key: string): boolean {
        return key in this.values; // Efficient check for plain objects
    }

    /**
     * Merges another PdfDict's contents into this dictionary.
     * - If a key from `other` does not exist in `this`, it's added.
     * - If a key exists in both and values are `PdfArray`s, their contents are combined and made unique.
     * - If a key exists in both and values are `PdfDict`s, they are recursively merged.
     * - For any other type, if a key exists in both, the value from `other` overwrites the value in `this`.
     * @param other The PdfDict instance to merge from.
     */
    public merge(other: PdfDict<T>): void {
        for (const key of other.values.keys()) {
            const incomingValue = other.values.get(key);
            if (incomingValue === undefined) continue; // Should not happen with Object.keys iteration

            const currentValue = this.values.get(key);

            if (currentValue === undefined) {
                // Key does not exist in the current dictionary, just add it.
                this.set(key, incomingValue);
            } else if (incomingValue instanceof PdfArray && currentValue instanceof PdfArray) {
                // Both are PdfArrays, merge their contents
                currentValue.values.push(...incomingValue.values); // Assumes PdfArray.values is a public array
                currentValue.uniq(); // Assumes PdfArray has a uniq method
            } else if (incomingValue instanceof PdfDict && currentValue instanceof PdfDict) {
                // Both are PdfDicts, recursively merge them
                currentValue.merge(incomingValue);
            } else {
                // Otherwise, overwrite the existing value with the new one.
                this.set(key, incomingValue);
            }
        }
    }

    /**
     * Adds all key-value pairs from another PdfDict to this one.
     * If keys already exist, their values will be overwritten.
     * @param other The PdfDict instance whose values are to be added.
     */
    public addAll(other: PdfDict<T>): void {
        // Object.assign performs a shallow copy of enumerable properties from source to target.
        // This effectively adds/overwrites properties in `this.values`.
        for (const [key, value] of other.values.entries()) {
            this.values.set(key, value);
        }
    }

    /**
     * Compares this PdfDict instance with another object for value equality.
     * This method performs a deep comparison of the dictionary's contents:
     * - Checks if the other object is also a `PdfDict`.
     * - Compares the number of keys.
     * - Iterates through all keys and compares corresponding values using their `equals` method
     *   (if available) or strict equality (`===`) as a fallback.
     * @param other The object to compare with.
     * @returns `true` if the dictionaries have the same keys and all corresponding values are equal,
     *          `false` otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true; // Same instance
        if (!(other instanceof PdfDict)) return false; // Not a PdfDict

        const keys1 = Object.keys(this.values);
        const keys2 = Object.keys(other.values);

        if (keys1.length !== keys2.length) {
            return false; // Different number of keys
        }

        // Check if all keys from this dict exist in the other, and their values are equal
        for (const key of keys1) {
            if (!other.containsKey(key)) {
                return false; // Key missing in other dict
            }

            const val1 = this.values.get(key);
            const val2 = other.values.get(key);

            // If the value has an 'equals' method (expected for PdfDataType subclasses), use it.
            // Otherwise, fall back to strict equality (for primitives or objects without custom equality).
            if (typeof (val1 as any)?.equals === 'function') {
                if (!(val1 as any).equals(val2)) {
                    return false;
                }
            } else {
                if (val1 !== val2) {
                    return false;
                }
            }
        }
        return true; // All keys and values are equal
    }

    // Note on `hashCode`: Dart's `hashCode` property is used for hash-based collections
    // (like `Set` and `HashMap`) for efficient lookup. TypeScript/JavaScript's built-in `Map`
    // and `Set` use reference equality for objects by default. There is no direct language feature
    // in TypeScript to implement `hashCode` for custom object hashing in standard collections.
    // If deep value-based hashing is required for `PdfDict` instances in collections,
    // a custom Map/Set implementation or a serialization approach would be needed.
}