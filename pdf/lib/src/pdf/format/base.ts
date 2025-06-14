// Assuming these types are defined and exported from their respective files:
import { PdfObjectBase, PdfSettings } from './object_base';
import { PdfStream } from './stream';

// Dart's 'dart:typed_data' Uint8List maps to JavaScript's Uint8Array
// import { Uint8Array } from 'typed_data'; // Not explicitly imported in TS, it's a global type

// The kIndentSize constant
export const kIndentSize = 2;


/**
 * Abstract base class for all PDF data types.
 * Provides methods for outputting to a PDF stream and converting to string/byte array.
 */
export abstract class PdfDataType {
    // No explicit constructor needed if it's just `const PdfDataType()` in Dart.
    // TypeScript implicitly provides one.

    /**
     * Abstract method to output the PDF data type's representation to a stream.
     * Implementations of this method will define how each PDF data type is written.
     * @param o The PdfObjectBase associated with this output operation (context).
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level for pretty-printing.
     */
    public abstract output(o: PdfObjectBase<PdfDataType>, s: PdfStream, indent?: number): void;

    /**
     * Converts the PDF data type to a PdfStream. This is a private helper.
     * @param indent Optional indentation level for pretty-printing.
     * @returns A PdfStream containing the rendered output.
     */
    private _toStream(indent?: number): PdfStream {
        const s = new PdfStream();
        // The PdfObjectBase is created here as a dummy context for outputting.
        // Assumes PdfObjectBase constructor can take an object with 'objser', 'params', 'settings'.
        s.putBytes([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]); // Add "%PDF-1.4\n" header.
        this.output(
            new PdfObjectBase({
                objser: 0,
                params: this,
                settings: new PdfSettings(), // Assumes PdfSettings can be instantiated without args
            }),
            s,
            indent,
        );
        return s;
    }

    /**
     * Converts the PDF data type's output to a string.
     * @param indent Optional indentation level for pretty-printing.
     * @returns The string representation of the PDF data type.
     */
    public toString(indent?: number): string {
        const stream = this._toStream(indent);
        const bytes = stream.output(); // Assuming stream.output() returns Uint8Array
        // Use TextDecoder to convert Uint8Array to string.
        // Default 'utf-8' encoding is often suitable for PDF internal strings.
        return new TextDecoder('utf-8').decode(bytes);
    }

    /**
     * Converts the PDF data type's output to a Uint8Array (byte list).
     * This method is visible for testing purposes.
     * @returns A Uint8Array containing the raw byte representation of the PDF data type.
     */
    public toList(): Uint8Array {
        return this._toStream().output();
    }
}