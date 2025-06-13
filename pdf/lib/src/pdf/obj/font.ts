// Assuming these are defined in their respective .ts files:
import { PdfDocument } from '../document';
import { PdfFontMetrics } from '../font/font_metrics';
import {
    helveticaWidths, helveticaBoldWidths, helveticaBoldObliqueWidths,
    helveticaObliqueWidths, timesWidths, timesBoldWidths, timesBoldItalicWidths,
    timesItalicWidths, symbolWidths, zapfDingbatsWidths
} from '../font/type1_fonts';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfStream } from '../format/stream';
import { PdfString, PdfStringFormat } from '../format/string';
import { PdfPoint } from '../point';
import { PdfObject } from './object';
import { PdfType1Font } from './type1_font';

// Assume latin1 is imported or globally available, e.g., from a utility module
// import { latin1 } from '../utils/encoding';
interface Latin1Encoder {
    encode(input: string): Uint8Array;
}
declare const latin1: Latin1Encoder; // Declare it to satisfy type checker, assuming it's available.

/**
 * Pdf font object
 */
export abstract class PdfFont extends PdfObject<PdfDict> {
    // In Dart, `PdfFont.create` is a named constructor. In TypeScript,
    // we translate it to the primary constructor. It's `protected` because
    // `PdfFont` is abstract and intended to be subclassed, not directly instantiated.
    protected constructor(pdfDocument: PdfDocument, subtype: string) {
        // Dart's `params: PdfDict.values(...)` becomes an object literal for the `params` argument
        // in the super constructor in TypeScript.
        super(
            pdfDocument,
            {
                params: new PdfDict({
                    '/Type': new PdfName('/Font'),
                }),
            }
        );
        // In Dart, `required this.subtype` in the constructor declaration directly initializes
        // the `subtype` field. In TypeScript, we explicitly assign it in the constructor body.
        this.subtype = subtype;
        pdfDocument.fonts.add(this);
    }

    // Dart's `final String subtype` becomes `public readonly subtype: string;`
    public readonly subtype: string;

    // Dart's `factory` constructors translate to `static` methods in TypeScript.

    /// Monospaced slab serif typeface.
    static courier(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Courier',
                ascent: 0.910,
                descent: -0.220,
                fontBBox: [-23, -250, 715, 805],
                capHeight: 562,
                stdHW: 84,
                stdVW: 106,
                isFixedPitch: true,
            }
        );
    }

    /// Bold monospaced slab serif typeface.
    static courierBold(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Courier-Bold',
                ascent: 0.910,
                descent: -0.220,
                fontBBox: [-113, -250, 749, 801],
                capHeight: 562,
                stdHW: 51,
                stdVW: 51,
                isFixedPitch: true,
            }
        );
    }

    /// Bold and Italic monospaced slab serif typeface.
    static courierBoldOblique(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Courier-BoldOblique',
                ascent: 0.910,
                descent: -0.220,
                fontBBox: [-57, -250, 869, 801],
                capHeight: 562,
                italicAngle: -12,
                isFixedPitch: true,
                stdHW: 84,
                stdVW: 106,
            }
        );
    }

    /// Italic monospaced slab serif typeface.
    static courierOblique(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Courier-Oblique',
                ascent: 0.910,
                descent: -0.220,
                fontBBox: [-27, -250, 849, 805],
                capHeight: 562,
                isFixedPitch: true,
                italicAngle: -12,
                stdHW: 51,
                stdVW: 51,
            }
        );
    }

    /// Neo-grotesque design sans-serif typeface
    static helvetica(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Helvetica',
                ascent: 0.931,
                descent: -0.225,
                widths: helveticaWidths,
                fontBBox: [-166, -225, 1000, 931],
                capHeight: 718,
                stdHW: 76,
                stdVW: 88,
            }
        );
    }

    /// Bold Neo-grotesque design sans-serif typeface
    static helveticaBold(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Helvetica-Bold',
                ascent: 0.962,
                descent: -0.228,
                widths: helveticaBoldWidths,
                fontBBox: [-170, -228, 1003, 962],
                capHeight: 718,
                stdHW: 118,
                stdVW: 140,
            }
        );
    }

    /// Bold and Italic Neo-grotesque design sans-serif typeface
    static helveticaBoldOblique(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Helvetica-BoldOblique',
                ascent: 0.962,
                descent: -0.228,
                widths: helveticaBoldObliqueWidths,
                italicAngle: -12,
                fontBBox: [-170, -228, 1114, 962],
                capHeight: 718,
                stdHW: 118,
                stdVW: 140,
            }
        );
    }

    /// Italic Neo-grotesque design sans-serif typeface
    static helveticaOblique(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Helvetica-Oblique',
                ascent: 0.931,
                descent: -0.225,
                widths: helveticaObliqueWidths,
                italicAngle: -12,
                fontBBox: [-170, -225, 1116, 931],
                capHeight: 718,
                stdHW: 76,
                stdVW: 88,
            }
        );
    }

    /// Serif typeface commissioned by the British newspaper The Times
    static times(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Times-Roman',
                ascent: 0.898,
                descent: -0.218,
                widths: timesWidths,
                fontBBox: [-168, -218, 1000, 898],
                capHeight: 662,
                stdHW: 28,
                stdVW: 84,
            }
        );
    }

    /// Bold serif typeface commissioned by the British newspaper The Times
    static timesBold(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Times-Bold',
                ascent: 0.935,
                descent: -0.218,
                widths: timesBoldWidths,
                fontBBox: [-168, -218, 1000, 935],
                capHeight: 676,
                stdHW: 44,
                stdVW: 139,
            }
        );
    }

    /// Bold and Italic serif typeface commissioned by the British newspaper The Times
    static timesBoldItalic(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Times-BoldItalic',
                ascent: 0.921,
                descent: -0.218,
                widths: timesBoldItalicWidths,
                italicAngle: -15,
                fontBBox: [-200, -218, 996, 921],
                capHeight: 669,
                stdHW: 42,
                stdVW: 121,
            }
        );
    }

    /// Italic serif typeface commissioned by the British newspaper The Times
    static timesItalic(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Times-Italic',
                ascent: 0.883,
                descent: -0.217,
                widths: timesItalicWidths,
                italicAngle: -15.5,
                fontBBox: [-169, -217, 1010, 883],
                capHeight: 653,
                stdHW: 32,
                stdVW: 76,
            }
        );
    }

    /// Complete unaccented serif Greek alphabet (upper and lower case) and a
    /// selection of commonly used mathematical symbols.
    static symbol(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'Symbol',
                ascent: 1.010,
                descent: -0.293,
                widths: symbolWidths,
                fontBBox: [-180, -293, 1090, 1010],
                capHeight: 653,
                stdHW: 92,
                stdVW: 85,
            }
        );
    }

    /// Hermann Zapf ornament glyphs or spacers, often employed to create box frames
    static zapfDingbats(pdfDocument: PdfDocument): PdfType1Font {
        return PdfType1Font.create(
            pdfDocument,
            {
                fontName: 'ZapfDingbats',
                ascent: 0.820,
                descent: -0.143,
                widths: zapfDingbatsWidths,
                fontBBox: [-1, -143, 981, 820],
                capHeight: 653,
                stdHW: 28,
                stdVW: 90,
            }
        );
    }

    private static readonly _cannotDecodeMessage =
        `---------------------------------------------
Cannot decode the string to Latin1.
This font does not support Unicode characters.
If you want to use strings other than Latin strings, use a TrueType (TTF) font instead.
See https://github.com/DavBfr/dart_pdf/wiki/Fonts-Management
---------------------------------------------`;

    /// Internal name
    get name(): string {
        return `/F${this.objser}`;
    }

    /// The font's real name
    abstract get fontName(): string;

    /// Spans the distance between the baseline and the top of the glyph that
    /// reaches farthest from the baseline
    abstract get ascent(): number;

    /// Spans the distance between the baseline and the lowest descending glyph
    abstract get descent(): number;

    /// Height of an empty line
    get emptyLineHeight(): number {
        return this.ascent + (-this.descent);
    }

    /// Internal units per
    abstract get unitsPerEm(): number;

    override prepare(): void {
        super.prepare();

        // Dart's map-like access `params['key'] = value` translates to `this.params.set('key', value)`
        this.params.set('/Subtype', new PdfName(this.subtype));
        this.params.set('/Name', new PdfName(this.name));
        // Dart's `const PdfName(...)` implies a compile-time constant, in TS it's just `new PdfName(...)`
        this.params.set('/Encoding', new PdfName('/WinAnsiEncoding'));
    }

    /// Calculate the [PdfFontMetrics] for this glyph
    abstract glyphMetrics(charCode: number): PdfFontMetrics;

    /// is this Rune supported by this font
    abstract isRuneSupported(charCode: number): boolean;

    /**
     * Calculate the [PdfFontMetrics] for this string
     * @param s The string to measure.
     * @param options.letterSpacing Optional letter spacing to apply. Defaults to 0.
     * @returns The font metrics for the string.
     */
    stringMetrics(s: string, options?: { letterSpacing?: number }): PdfFontMetrics {
        const letterSpacing = options?.letterSpacing ?? 0;

        if (s.length === 0) { // Dart's `s.isEmpty` becomes `s.length === 0`
            return PdfFontMetrics.zero;
        }

        try {
            // Assuming `latin1.encode` correctly returns Uint8Array (equivalent of Dart's Uint8List)
            const chars = latin1.encode(s);
            // Ensure `this` context is preserved for `glyphMetrics` if it relies on `this`.
            // Using an arrow function in `map` automatically binds `this`.
            const metrics = chars.map((charCode) => this.glyphMetrics(charCode));
            return PdfFontMetrics.append(metrics, { letterSpacing: letterSpacing });
        } catch (e) {
            // Dart's `assert(() { print(...); return true; }());` is a debug-only mechanism.
            // In TypeScript, a `console.warn` or `console.error` is a common equivalent
            // for messages that should appear in development but might be omitted in production.
            console.warn(PdfFont._cannotDecodeMessage);
            throw e; // Dart's `rethrow` becomes `throw e;`
        }
    }

    /**
     * Calculate the unit size of this string
     * @deprecated Use `stringMetrics(s).size` instead.
     * @param s The string to measure.
     * @returns The size of the string as a PdfPoint.
     */
    stringSize(s: string): PdfPoint {
        return this.stringMetrics(s).size;
    }

    override toString(): string {
        return `Font(${this.fontName})`; // Dart's string interpolation `$var` becomes `${this.var}`
    }

    /**
     * Draw some text
     * @param stream The PDF stream to write to.
     * @param text The text to put.
     */
    putText(stream: PdfStream, text: string): void {
        try {
            // Assuming PdfString constructor takes an object for named parameters
            new PdfString(latin1.encode(text), {
                format: PdfStringFormat.literal,
                encrypted: false,
            }).output(this, stream);
        } catch (e) {
            console.warn(PdfFont._cannotDecodeMessage);
            throw e;
        }
    }
}