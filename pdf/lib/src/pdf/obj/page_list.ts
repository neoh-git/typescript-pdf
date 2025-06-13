// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNum } from '../format/num';
// import { PdfObject } from './object';
// import { PdfPage } from './page';

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfObject } from './object';
import { PdfPage } from './page';

/**
 * PdfPageList object.
 * This object represents the collection of pages in the PDF document.
 */
export class PdfPageList extends PdfObject<PdfDict> {
    /**
     * This holds the pages.
     * Dart's `final pages = <PdfPage>[];` translates to `public readonly pages: PdfPage[] = [];`
     */
    public readonly pages: PdfPage[] = [];

    /**
     * Constructs a [PdfPageList] object.
     * @param pdfDocument The PDF document to which this page list belongs.
     * @param options.objgen Optional object generation number. Defaults to 0.
     * @param options.objser Optional object serial number.
     */
    constructor(
        pdfDocument: PdfDocument,
        options?: {
            objgen?: number;
            objser?: number;
        },
    ) {
        // In Dart, `super(...)` with named parameters in the initializer list.
        // In TypeScript, this is translated to an options object passed to the super constructor.
        super(
            pdfDocument,
            {
                params: new PdfDict({
                    // Dart's `const PdfName('/Pages')` is `new PdfName('/Pages')` in TS.
                    '/Type': new PdfName('/Pages'),
                }),
                objgen: options?.objgen ?? 0, // Dart's `objgen = 0` default
                objser: options?.objser, // Optional nullable `objser`
            }
        );
    }

    /**
     * Prepares the PdfPageList object by setting its '/Kids' (children pages)
     * and '/Count' (number of pages) parameters.
     */
    override prepare(): void {
        super.prepare(); // Call the base class's prepare method.

        // Dart's `params['/Kids'] = PdfArray.fromObjects(pages);`
        // Assuming `PdfArray.fromObjects` static method exists and takes an array of PdfObject instances.
        this.params.set('/Kids', PdfArray.fromObjects(this.pages));

        // Dart's `params['/Count'] = PdfNum(pages.length);`
        this.params.set('/Count', new PdfNum(this.pages.length));
    }
}