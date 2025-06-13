// Assuming these are defined in their respective .ts files:
// For example:
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNum } from '../format/num';
// import { PdfObject } from './object';
// import { PdfObjectStream } from './object_stream';
// import { PdfTtfFont } from './ttffont';

import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfObject } from './object';
import { PdfObjectStream } from './object_stream';
import { PdfTtfFont } from './ttffont';

/**
 * Font descriptor object
 */
export class PdfFontDescriptor extends PdfObject<PdfDict> {
    /**
     * File data
     */
    public readonly file: PdfObjectStream;

    /**
     * TrueType font
     */
    public readonly ttfFont: PdfTtfFont;

    /**
     * Create a Font descriptor object
     * @param ttfFont The TrueType font associated with this descriptor.
     * @param file The file data stream for the font.
     */
    constructor(ttfFont: PdfTtfFont, file: PdfObjectStream) {
        // In Dart, `this.ttfFont` and `this.file` in the constructor parameters automatically
        // assign them to class fields. In TypeScript, we explicitly declare them as `public readonly`
        // parameters to achieve the same shorthand.
        // Also, Dart's named `params` argument to super is represented as an object literal in TS.
        super(
            ttfFont.pdfDocument,
            {
                params: new PdfDict({ // Assuming PdfDict constructor can take an initial object
                    '/Type': new PdfName('/FontDescriptor'),
                }),
            }
        );

        this.ttfFont = ttfFont;
        this.file = file;
    }

    /**
     * Prepares the font descriptor object with necessary parameters.
     */
    override prepare(): void {
        super.prepare();

        // In Dart, Map access `params['key'] = value` is equivalent to `this.params.set('key', value)`
        // if params is an object representing a map/dictionary (like PdfDict).
        this.params.set('/FontName', new PdfName(`/${this.ttfFont.fontName}`));
        this.params.set('/FontFile2', this.file.ref());
        this.params.set('/Flags', new PdfNum(this.ttfFont.font.unicode ? 4 : 32));

        // Dart's `toInt()` method on numbers can be translated to `Math.trunc()` in TypeScript
        // for truncating decimal parts and converting to an integer.
        // Assuming PdfArray has a static method `fromNumbers` that accepts an array of numbers
        // and internally converts them to PdfNum objects, similar to Dart's `fromNum`.
        this.params.set('/FontBBox', PdfArray.fromNumbers([
            Math.trunc(this.ttfFont.font.xMin / this.ttfFont.font.unitsPerEm * 1000),
            Math.trunc(this.ttfFont.font.yMin / this.ttfFont.font.unitsPerEm * 1000),
            Math.trunc(this.ttfFont.font.xMax / this.ttfFont.font.unitsPerEm * 1000),
            Math.trunc(this.ttfFont.font.yMax / this.ttfFont.font.unitsPerEm * 1000)
        ]));

        this.params.set('/Ascent', new PdfNum(Math.trunc(this.ttfFont.ascent * 1000)));
        this.params.set('/Descent', new PdfNum(Math.trunc(this.ttfFont.descent * 1000)));
        this.params.set('/ItalicAngle', new PdfNum(0)); // 'const' in Dart is for compile-time constants, just `new` in TS
        this.params.set('/CapHeight', new PdfNum(10));
        this.params.set('/StemV', new PdfNum(79));
    }
}