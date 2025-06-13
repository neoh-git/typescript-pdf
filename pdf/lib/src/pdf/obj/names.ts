// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDataType } from '../format/base'; // This is likely an interface or type alias for various PDF data types
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNull } from '../format/null_value';
// import { PdfNum } from '../format/num';
// import { PdfString } from '../format/string';
// import { PdfObject } from './object';
// import { PdfPage } from './page';

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDataType } from '../format/base'; // Assume this type is available
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNull } from '../format/null_value';
import { PdfNum } from '../format/num';
import { PdfString } from '../format/string';
import { PdfObject } from './object';
import { PdfPage } from './page';

/**
 * Pdf Name object for named destinations.
 */
export class PdfNames extends PdfObject<PdfDict> {
    // Dart's `final Map<String, PdfDataType> _dests = <String, PdfDataType>{};`
    // becomes `private readonly _dests: Map<string, PdfDataType> = new Map();`
    private readonly _dests: Map<string, PdfDataType> = new Map<string, PdfDataType>();

    /**
     * Constructs a Pdf Name object.
     * @param pdfDocument The PDF document.
     */
    constructor(pdfDocument: PdfDocument) {
        // In Dart, `params: PdfDict()` is a named parameter in the initializer list.
        // In TypeScript, this is passed as part of an options object to the super constructor.
        super(pdfDocument, { params: new PdfDict() });
    }

    /**
     * Add a named destination.
     * @param name The name of the destination.
     * @param page The PDF page to which the destination points.
     * @param options.posX Optional X coordinate for the destination.
     * @param options.posY Optional Y coordinate for the destination.
     * @param options.posZ Optional Z coordinate for the destination (for zoom level).
     */
    addDest(
        name: string,
        page: PdfPage,
        options?: {
            posX?: number;
            posY?: number;
            posZ?: number;
        },
    ): void {
        // Dart's `assert(page.pdfDocument == pdfDocument);` for debug checks.
        // In TypeScript, this can be a runtime check or a debug-only assert.
        if (this.isDebug) { // Assuming `isDebug` is a property from `PdfObject` or a global debug flag
            console.assert(
                page.pdfDocument === this.pdfDocument,
                'PdfPage must belong to the same PdfDocument as PdfNames.',
            );
        }

        // Prepare the array elements for the '/D' entry.
        const dArrayElements: PdfDataType[] = [
            page.ref(), // Reference to the page object
            new PdfName('/XYZ'), // Destination type (XYZ for specified coordinates)
            // Conditional inclusion of PdfNull or PdfNum for posX, posY, posZ
            options?.posX == null ? new PdfNull() : new PdfNum(options.posX),
            options?.posY == null ? new PdfNull() : new PdfNum(options.posY),
            options?.posZ == null ? new PdfNull() : new PdfNum(options.posZ),
        ];

        // Dart's `_dests[name] = PdfDict.values({...});`
        // In TypeScript: `this._dests.set(name, new PdfDict({...}));`
        this._dests.set(
            name,
            new PdfDict({
                '/D': new PdfArray(dArrayElements),
            }),
        );
    }

    /**
     * Prepares the PdfNames object by constructing the '/Dests' dictionary.
     */
    override prepare(): void {
        super.prepare(); // Call the base class's prepare method.

        const dests = new PdfArray();

        // Get keys, convert to array, and sort. Dart's `..sort()` is a cascade.
        const keys = Array.from(this._dests.keys()).sort();

        // Iterate over sorted keys and add name-value pairs to the `dests` array.
        for (const name of keys) {
            dests.add(PdfString.fromString(name));
            // Dart's `_dests[name]!` (non-null assertion) becomes `this._dests.get(name)!`
            dests.add(this._dests.get(name)!);
        }

        const dict = new PdfDict();
        // Dart's `dests.values.isNotEmpty` (check if the array has elements)
        // Assuming PdfArray has an internal `length` or `isEmpty()` method.
        // If PdfArray directly represents an array, `dests.values` might not be needed.
        // Let's assume `dests.isEmpty()` or check the length of its internal array.
        // A simpler check might be `keys.length > 0` since `dests` is populated from `keys`.
        if (keys.length > 0) { // If there are any destinations
            dict.set('/Names', dests); // Set the '/Names' entry with the array of name-value pairs

            // Set the '/Limits' entry for efficiency (min and max names).
            dict.set(
                '/Limits',
                new PdfArray([
                    PdfString.fromString(keys[0]), // Dart's `keys.first`
                    PdfString.fromString(keys[keys.length - 1]), // Dart's `keys.last`
                ]),
            );
        }

        // Set the '/Dests' entry in the PdfNames object's parameters.
        // Dart's `params['/Dests'] = dict;` becomes `this.params.set('/Dests', dict);`
        this.params.set('/Dests', dict);
    }
}