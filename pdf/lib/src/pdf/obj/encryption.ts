// Assuming these are defined in their respective .ts files:
// For example:
// import { PdfDocument } from '../document';
// import { PdfDict } from '../format/dict';
// import { PdfObjectBase } from '../format/object_base';
// import { PdfObject } from './object';

// In TypeScript, Uint8Array is a built-in type, so no specific import is needed for it.

import { PdfDocument } from '../document';
import { PdfDict } from '../format/dict';
import { PdfObjectBase } from '../format/object_base';
import { PdfObject } from './object';

/**
 * Encryption object
 */
export abstract class PdfEncryption extends PdfObject<PdfDict> {
    /**
     * Creates an encryption object
     * @param pdfDocument The PDF document associated with this encryption object.
     */
    constructor(pdfDocument: PdfDocument) {
        // In Dart, `params: PdfDict()` is a named parameter passed to the super constructor.
        // In TypeScript, this is typically represented by an object literal.
        super(pdfDocument, { params: new PdfDict() });
    }

    /**
     * Encrypt some data
     * @param input The data to encrypt as a Uint8Array.
     * @param object The PDF object base associated with the data.
     * @returns The encrypted data as a Uint8Array.
     */
    abstract encrypt(input: Uint8Array, object: PdfObjectBase): Uint8Array;
}