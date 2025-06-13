// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfIndirect } from '../format/indirect';
// import { PdfName } from '../format/name';
// import { PdfNum } from '../format/num';
// import { PdfGraphics } from '../graphics'; // Or wherever PdfGraphics is defined
// import { PdfPageFormat } from '../page_format'; // Or wherever PdfPageFormat is defined
// import { PdfAnnot } from './annotation'; // Or wherever PdfAnnot is defined
// import { PdfGraphicStreamMixin } from './graphic_stream'; // The mixin we defined earlier
// import { PdfObject } from './object';
// import { PdfObjectStream } from './object_stream';

import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfIndirect } from '../format/indirect';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfGraphics } from '../graphics';
import { PdfPageFormat } from '../page_format';
import { PdfAnnot } from './annotation';
import { PdfGraphicStreamMixin } from './graphic_stream';
import { PdfObject } from './object';
import { PdfObjectStream } from './object_stream';

/**
 * Page rotation
 */
export enum PdfPageRotation {
    /** No rotation */
    none, // Value 0

    /** Rotated 90 degree clockwise */
    rotate90, // Value 1

    /** Rotated 180 degree clockwise */
    rotate180, // Value 2

    /** Rotated 270 degree clockwise */
    rotate270, // Value 3
}

/**
 * Page object, which will hold any contents for this page.
 * It mixes in `PdfGraphicStreamMixin` to manage resources.
 */
// Apply the mixin to PdfObject<PdfDict>
export class PdfPage extends PdfGraphicStreamMixin(PdfObject)<PdfDict> {
    /**
     * This is this page format, i.e., the size of the page, margins, and rotation.
     */
    public pageFormat: PdfPageFormat;

    /**
     * The page rotation angle.
     */
    public rotate: PdfPageRotation;

    /**
     * This holds the contents stream objects of the page.
     */
    public readonly contents: PdfObject[] = [];

    /**
     * This holds any Annotations contained within this page.
     */
    public readonly annotations: PdfAnnot[] = [];

    // Internal map to track PdfGraphics objects associated with their streams.
    private readonly _contentGraphics = new Map<PdfObject, PdfGraphics>();

    /**
     * This constructs a Page object, which will hold any contents for this page.
     * @param pdfDocument The PDF document.
     * @param options.pageFormat The format of the page. Defaults to `PdfPageFormat.standard`.
     * @param options.rotate The rotation of the page. Defaults to `PdfPageRotation.none`.
     * @param options.index Optional index to insert the page into the document's page list.
     * @param options.objser Optional object serial number.
     * @param options.objgen Optional object generation number. Defaults to 0.
     */
    constructor(
        pdfDocument: PdfDocument,
        options?: {
            pageFormat?: PdfPageFormat;
            rotate?: PdfPageRotation;
            index?: number;
            objser?: number;
            objgen?: number;
        },
    ) {
        // Call the super constructor (which is the mixed-in `PdfObject` constructor).
        // Dart's `params: PdfDict.values({...})` becomes an object literal for `params`.
        super(pdfDocument, {
            params: new PdfDict({
                '/Type': new PdfName('/Page'),
            }),
            objser: options?.objser,
            objgen: options?.objgen ?? 0,
        });

        // Assign properties from options or defaults.
        this.pageFormat = options?.pageFormat ?? PdfPageFormat.standard;
        this.rotate = options?.rotate ?? PdfPageRotation.none;

        // Add this page to the document's page list.
        if (options?.index != null) {
            pdfDocument.pdfPageList.pages.splice(options.index, 0, this); // Dart's `insert`
        } else {
            pdfDocument.pdfPageList.pages.push(this); // Dart's `add`
        }
    }

    /**
     * This returns a [PdfGraphics] object, which can then be used to render
     * on to this page. If a previous [PdfGraphics] object was used, this object
     * is appended to the page, and will be drawn over the top of any previous
     * objects.
     * @returns A new PdfGraphics object for drawing on this page.
     */
    getGraphics(): PdfGraphics {
        const stream = new PdfObjectStream(this.pdfDocument); // Create a new content stream object
        const graphics = new PdfGraphics(this, stream.buf); // Create graphics context for that stream
        this._contentGraphics.set(stream, graphics); // Map stream to its graphics context
        this.contents.push(stream); // Add the stream to the page's contents list
        return graphics;
    }

    /**
     * This adds an Annotation to the page.
     * @param annot The PdfAnnot object to add.
     */
    addAnnotation(annot: PdfAnnot): void {
        this.annotations.push(annot);
    }

    /**
     * Prepares the PDF page object by setting its parent, rotation, media box,
     * content streams, and annotations.
     */
    override prepare(): void {
        super.prepare(); // Call the PdfGraphicStreamMixin's prepare, which calls PdfObject's prepare.

        // Set the /Parent (pages object) reference
        this.params.set('/Parent', this.pdfDocument.pdfPageList.ref());

        // Set page rotation if not none
        if (this.rotate !== PdfPageRotation.none) {
            // Dart enum's `index` property holds its numeric value in TS.
            this.params.set('/Rotate', new PdfNum(this.rotate * 90));
        }

        // Set the /MediaBox for the page size
        // Assuming `PdfArray.fromNumbers` instead of `PdfArray.fromNum` for TypeScript.
        this.params.set(
            '/MediaBox',
            PdfArray.fromNumbers([0, 0, this.pageFormat.width, this.pageFormat.height]),
        );

        // Filter out content graphics that were not "altered" (i.e., nothing was drawn to them).
        // If not altered, set `inUse = false` so they are not included in the final PDF.
        for (const [contentStream, graphics] of this._contentGraphics.entries()) {
            if (!graphics.altered) {
                contentStream.inUse = false;
            }
        }

        // Collect content streams that are actually "in use"
        // Dart's `where((e) => e.inUse).toList()` becomes `filter((e) => e.inUse)`
        const activeContents = this.contents.filter((e) => e.inUse);
        const contentList = PdfArray.fromObjects(activeContents);

        // Handle existing /Contents entry, merging with new content streams
        if (this.params.has('/Contents')) {
            const prevContent = this.params.get('/Contents'); // Get existing content value
            // Dart's `is PdfArray` and `is PdfIndirect` type checks
            if (prevContent instanceof PdfArray) {
                // `values` property of PdfArray assumed to be the actual array of PdfDataType.
                // `whereType<PdfIndirect>()` in Dart filters by type. In TS, filter manually.
                const prevIndirects = prevContent.values.filter((item): item is PdfIndirect => item instanceof PdfIndirect);
                // Dart's `insertAll(0, ...)` becomes `splice(0, 0, ...)`
                contentList.values.splice(0, 0, ...prevIndirects);
            } else if (prevContent instanceof PdfIndirect) {
                contentList.values.splice(0, 0, prevContent);
            }
        }

        // Remove duplicates from the content list, assuming `PdfArray` has a `uniq()` method.
        contentList.uniq();

        // Set the /Contents parameter based on the number of content streams.
        if (contentList.values.length === 1) {
            // If only one content stream, set it directly as an indirect object.
            contentList.values[0] && this.params.set('/Contents', contentList.values[0]);
        } else if (contentList.values.length > 0) { // Dart's `isNotEmpty`
            // If multiple, set the array of indirect objects.
            this.params.set('/Contents', contentList);
        }

        // Handle /Annots (Annotations)
        if (this.annotations.length > 0) { // Dart's `isNotEmpty`
            if (this.params.has('/Annots')) {
                const existingAnnots = this.params.get('/Annots');
                if (existingAnnots instanceof PdfArray) {
                    // Merge new annotations with existing ones
                    existingAnnots.values.push(...PdfArray.fromObjects(this.annotations).values);
                }
            } else {
                // If no existing annotations, set the new array.
                this.params.set('/Annots', PdfArray.fromObjects(this.annotations));
            }
        }
    }
}