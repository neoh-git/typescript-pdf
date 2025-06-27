// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfFontMetrics } from '../font/font_metrics';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNum } from '../format/num';
// import { PdfFont } from './font';
// import { PdfObject } from './object';
// import { PdfVersion } from '../../priv'; // Assuming priv.ts holds PdfVersion enum

import { PdfDocument } from '../document';
import { PdfFontMetrics } from '../font/font_metrics';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfFont } from './font';
import { PdfObject } from './object';
import { PdfDataType } from '../format/base';
import { PdfVersion } from '../format/object_base';

/**
 * Type 1 font object.
 * This font is a default PDF font available in all PDF readers,
 * but it's only compatible with Western Latin languages.
 *
 * To use other languages, use a [PdfTtfFont] that contains the
 * glyph for the language you will use.
 *
 * See https://github.com/DavBfr/dart_pdf/wiki/Fonts-Management
 */
export class PdfType1Font extends PdfFont {
    public readonly fontName: string;
    public readonly ascent: number;
    public readonly descent: number;
    public readonly missingWidth: number;
    public readonly widths: number[];

    /**
     * Constructs a [PdfType1Font].
     * @param pdfDocument The PDF document.
     * @param options.fontName The name of the font (e.g., 'Helvetica').
     * @param options.ascent The ascent of the font (typographic metric).
     * @param options.descent The descent of the font (typographic metric).
     * @param options.fontBBox The font bounding box `[xMin, yMin, xMax, yMax]`.
     * @param options.italicAngle The italic angle. Defaults to 0.
     * @param options.capHeight The height of capital letters.
     * @param options.stdHW The standard stem width in the horizontal direction.
     * @param options.stdVW The standard stem width in the vertical direction.
     * @param options.isFixedPitch If true, all glyphs have the same width. Defaults to false.
     * @param options.missingWidth The default width for characters not in `widths`. Defaults to 0.600.
     * @param options.widths An array of widths for each character (0-255). Defaults to an empty array.
     */
    static create( // Dart's named constructor `PdfType1Font.create` becomes a static method.
        pdfDocument: PdfDocument,
        options: {
            fontName: string;
            ascent: number;
            descent: number;
            fontBBox: number[];
            italicAngle?: number;
            capHeight: number;
            stdHW: number;
            stdVW: number;
            isFixedPitch?: boolean;
            missingWidth?: number;
            widths?: number[]; // Dart's `const <double>[]`
        },
    ): PdfType1Font {
        return new PdfType1Font(pdfDocument, options);
    }

    // Private constructor to be called by the `static create` method.
    private constructor(
        pdfDocument: PdfDocument,
        options: {
            fontName: string;
            ascent: number;
            descent: number;
            fontBBox: number[];
            italicAngle?: number;
            capHeight: number;
            stdHW: number;
            stdVW: number;
            isFixedPitch?: boolean;
            missingWidth?: number;
            widths?: number[];
        },
    ) {
        // Call the super constructor (PdfFont's primary constructor in TS, which was `PdfFont.create` in Dart).
        super(pdfDocument, '/Type1'); // subtype is '/Type1'

        // Assign required properties from options.
        this.fontName = options.fontName;
        this.ascent = options.ascent;
        this.descent = options.descent;
        this.widths = options.widths ?? []; // Default to empty array if not provided.
        this.missingWidth = options.missingWidth ?? 0.600;
        // Default optional properties.
        const italicAngle = options.italicAngle ?? 0;
        const isFixedPitch = options.isFixedPitch ?? false;

        // Set BaseFont parameter.
        this.params.set('/BaseFont', new PdfName(`/${this.fontName}`));

        // Only add FontDescriptor for PDF 1.5+
        // Assuming `pdfDocument.settings.version` is a `PdfVersion` enum.
        if (pdfDocument.settings.version.valueOf() >= PdfVersion.pdf_1_5.valueOf()) {
            this.params.set('/FirstChar', new PdfNum(0));
            this.params.set('/LastChar', new PdfNum(255));

            let fontWidthsArray: number[];
            if (this.widths.length > 0) { // Dart's `isNotEmpty`
                // Dart's `map((e) => (e * unitsPerEm).toInt())`
                fontWidthsArray = this.widths.map((e) => Math.trunc(e * this.unitsPerEm));
            } else {
                // Dart's `List<int>.filled(256, value)`
                fontWidthsArray = Array(256).fill(Math.trunc(this.missingWidth * this.unitsPerEm));
            }
            // Assuming `PdfArray.fromNumbers` instead of `PdfArray.fromNum`.
            this.params.set('/Widths', PdfArray.fromNumbers(fontWidthsArray));

            // Create FontDescriptor object.
            const fontDescriptor = new PdfObject<PdfDict<PdfDataType>>(
                pdfDocument,
                {
                    // Dart's `PdfDict.values({...})`
                    params: new PdfDict({
                        '/Type': new PdfName('/FontDescriptor'), // Dart's `const PdfName`
                        '/FontName': new PdfName(`/${this.fontName}`),
                        // Flags: 32 (non-symbolic) + (1 if fixed pitch)
                        '/Flags': new PdfNum(32 + (isFixedPitch ? 1 : 0)),
                        // FontBBox is passed directly.
                        '/FontBBox': PdfArray.fromNumbers(options.fontBBox),
                        '/Ascent': new PdfNum(Math.trunc(this.ascent * this.unitsPerEm)),
                        '/Descent': new PdfNum(Math.trunc(this.descent * this.unitsPerEm)),
                        '/ItalicAngle': new PdfNum(italicAngle),
                        '/CapHeight': new PdfNum(options.capHeight),
                        '/StemV': new PdfNum(options.stdVW),
                        '/StemH': new PdfNum(options.stdHW),
                        '/MissingWidth': new PdfNum(Math.trunc(this.missingWidth * this.unitsPerEm)),
                    }),
                }
            );
            this.params.set('/FontDescriptor', fontDescriptor.ref());
        }
    }

    override get unitsPerEm(): number {
        return 1000;
    }

    override glyphMetrics(charCode: number): PdfFontMetrics {
        if (!this.isRuneSupported(charCode)) {
            // Dart's `toRadixString(16)` becomes `toString(16)`.
            throw new Error(
                `Unable to display U+${charCode.toString(16)} with ${this.fontName}`,
            );
        }

        const charWidth = charCode < this.widths.length ? this.widths[charCode] : this.missingWidth;

        return new PdfFontMetrics({
            left: 0,
            top: this.descent, // Note: Dart's PdfFontMetrics `top` is `descent`
            right: charWidth,
            bottom: this.ascent, // Note: Dart's PdfFontMetrics `bottom` is `ascent`
        });
    }

    override isRuneSupported(charCode: number): boolean {
        // Type 1 fonts generally support Latin-1 (0x00 to 0xFF).
        return charCode >= 0x00 && charCode <= 0xff;
    }
}