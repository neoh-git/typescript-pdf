// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfStream } from '../format/stream';
// import { PdfObject } from './object';

import { PdfDocument } from '../document';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfStream } from '../format/stream';
import { PdfObject } from './object';

/**
 * Object with a PdfDict used in the PDF file
 * @deprecated Use PdfObject<PdfDict> instead
 */
export class PdfObjectDict extends PdfObject<PdfDict> {
    /**
     * This is usually called by extensors to this class, and sets the
     * Pdf Object Type.
     * @param pdfDocument The PDF document.
     * @param options.type Optional type string for the PDF object (e.g., '/Page', '/Font').
     * @param options.objgen Optional object generation number. Defaults to 0.
     * @param options.objser Optional object serial number.
     */
    constructor(
        pdfDocument: PdfDocument,
        options?: {
            type?: string;
            objgen?: number;
            objser?: number;
        },
    ) {
        // In Dart, `super(pdfDocument, params: PdfDict(), objgen: objgen, objser: objser)`
        // uses named parameters directly in the initializer list.
        // In TypeScript, this is translated to an options object passed to the super constructor.
        super(
            pdfDocument,
            {
                params: new PdfDict(), // Initialize params with a new PdfDict
                objgen: options?.objgen ?? 0, // Dart's default value `objgen = 0`
                objser: options?.objser, // Optional `int? objser`
            }
        );

        // Dart's `if (type != null) { params['/Type'] = PdfName(type); }`
        if (options?.type != null) {
            // Assuming `params` is a PdfDict instance and `set` is the method to add key-value pairs.
            this.params.set('/Type', new PdfName(options.type));
        }
    }

    /**
     * Writes the content of this PdfObjectDict to the provided PdfStream.
     * This typically involves writing the dictionary itself.
     * @param s The PdfStream to write the content to.
     */
    override writeContent(s: PdfStream): void {
        // Dart's `params.isNotEmpty` translates to `this.params.size > 0` for a Map-like object.
        // Assuming PdfDict has a `size` property or similar way to check if it's empty.
        if (this.params.size > 0) {
            // Assuming `params.output` exists and functions similarly.
            // Dart's `settings.verbose ? 0 : null` implies a boolean `settings.verbose`
            // and conditional passing of 0 or null. In TS, this is similar.
            this.params.output(this, s, this.settings.verbose ? 0 : undefined); // `null` becomes `undefined` typically

            // Dart's `s.putByte(0x0a)` (newline character)
            s.putByte(0x0a);
        }
    }
}