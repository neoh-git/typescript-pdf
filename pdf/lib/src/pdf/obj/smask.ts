// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfBool } from '../format/bool';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfGraphics } from '../graphics'; // Assuming PdfGraphics is defined
// import { PdfRect } from '../rect'; // Assuming PdfRect is defined and has x, y, width, height
// import { PdfBaseFunction, PdfFunction } from './function'; // Assuming PdfFunction extends PdfBaseFunction
// import { PdfGraphicXObject } from './graphic_stream'; // Assuming PdfGraphicXObject is defined

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfBool } from '../format/bool';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfGraphics } from '../graphics';
import { PdfRect } from '../rect';
import { PdfBaseFunction, PdfFunction } from './function';
import { PdfGraphicXObject } from './graphic_stream';

/**
 * Represents a soft mask (transparency group) for PDF objects.
 */
export class PdfSoftMask {
    public readonly document: PdfDocument;

    // Dart's `late` keyword indicates it will be initialized before use.
    // In TS, we declare it and initialize in the constructor.
    private _mask: PdfGraphicXObject;

    private _graphics?: PdfGraphics; // Nullable if not initialized immediately or if cleared.

    private _tr?: PdfBaseFunction; // Optional transfer function.

    /**
     * Constructs a PdfSoftMask.
     * @param document The PDF document.
     * @param options.boundingBox The bounding box for the transparency group.
     * @param options.isolated If true, objects within the group are composited against a fully transparent backdrop. Defaults to false.
     * @param options.knockout If true, later objects in the group overwrite earlier ones. Defaults to false.
     * @param options.invert If true, the mask values are inverted. Defaults to false.
     */
    constructor(
        document: PdfDocument,
        options: {
            boundingBox: PdfRect;
            isolated?: boolean;
            knockout?: boolean;
            invert?: boolean;
        },
    ) {
        this.document = document;

        const { boundingBox, isolated = false, knockout = false, invert = false } = options;

        // Initialize _mask (equivalent to Dart's late initialization in constructor)
        this._mask = new PdfGraphicXObject(document, '/Form');

        // Set bounding box parameters. Assumed PdfArray.fromNumbers instead of fromNum.
        this._mask.params.set(
            '/BBox',
            PdfArray.fromNumbers([
                boundingBox.x,
                boundingBox.y,
                boundingBox.width,
                boundingBox.height,
            ]),
        );

        // Set isolated and knockout flags if true. `const PdfBool(true)` becomes `new PdfBool(true)`.
        if (isolated) {
            this._mask.params.set('/I', new PdfBool(true));
        }
        if (knockout) {
            this._mask.params.set('/K', new PdfBool(true));
        }

        // Initialize _graphics.
        // Assumed PdfGraphicXObject has a `buf` property (likely a PdfStream)
        // and PdfGraphics can be created with a PdfObject and a PdfStream.
        this._graphics = new PdfGraphics(this._mask, this._mask.buf);

        if (invert) {
            this._tr = new PdfFunction(
                document,
                {
                    data: [255, 0], // Data for the transfer function (maps 0->255, 255->0 effectively)
                }
            );
        }
    }

    /**
     * Returns the PdfGraphics object associated with this soft mask,
     * allowing drawing operations to define the mask's shape and transparency.
     * @returns The PdfGraphics object or undefined if not initialized.
     */
    getGraphics(): PdfGraphics | undefined {
        return this._graphics;
    }

    /**
     * Returns a string representation of the PdfSoftMask.
     * @returns The string representation.
     */
    // @override in Dart, implicit for toString in TS if method name matches built-in
    toString(): string {
        return this.constructor.name; // Dart's `runtimeType`
    }

    /**
     * Generates the PDF dictionary representation of this soft mask.
     * This dictionary is typically referenced from an extended graphics state.
     * @returns A PdfDict representing the soft mask.
     */
    output(): PdfDict {
        // Dart's `PdfDict.values({...})` becomes `new PdfDict({...})`.
        const params = new PdfDict({
            '/S': new PdfName('/Luminosity'), // Soft mask subtype: Luminosity or Alpha
            '/G': this._mask.ref(), // Reference to the transparency group XObject (Form XObject)
        });

        if (this._tr != null) {
            params.set('/TR', this._tr.ref()); // Reference to the transfer function if present
        }

        return params;
    }
}