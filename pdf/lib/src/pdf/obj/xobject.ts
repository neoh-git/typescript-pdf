// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfName } from '../format/name';
// import { PdfObjectStream } from './object_stream';

import { PdfDocument } from '../document';
import { PdfName } from '../format/name';
import { PdfObjectStream } from './object_stream';

/**
 * XObject (External Object) in a PDF document.
 * These are stream objects that contain self-contained descriptions
 * of graphical elements, images, or other content.
 */
export class PdfXObject extends PdfObjectStream {
    /**
     * Constructs a PdfXObject.
     * @param pdfDocument The PDF document.
     * @param subtype Optional subtype of the XObject (e.g., '/Form', '/Image').
     * @param options.isBinary Whether the stream content is binary. Defaults to false.
     */
    constructor(
        pdfDocument: PdfDocument,
        subtype?: string, // Dart's `String? subtype` (optional positional parameter)
        options?: { isBinary?: boolean }, // Dart's `bool isBinary = false` (optional named parameter)
    ) {
        // Call the super constructor (PdfObjectStream).
        // Dart's `super(pdfDocument, type: '/XObject', isBinary: isBinary)`
        // is translated to passing an options object to the super constructor.
        super(
            pdfDocument,
            {
                type: '/XObject', // All XObjects have /Type /XObject
                isBinary: options?.isBinary ?? false, // Apply default value if not provided
            }
        );

        // If a subtype is provided, set it in the parameters dictionary.
        // Dart's `params['/Subtype'] = PdfName(subtype);`
        if (subtype != null) {
            // Assuming `params` is a PdfDict instance and `set` is the method to add key-value pairs.
            this.params.set('/Subtype', new PdfName(subtype));
        }
    }

    /**
     * Gets the name of this XObject, typically used for referencing it in content streams.
     * @returns The name string (e.g., 'X1', 'X2').
     */
    get name(): string {
        // Dart's `X$objser` string interpolation.
        // `objser` is a property inherited from PdfObject.
        return `X${this.objser}`;
    }
}