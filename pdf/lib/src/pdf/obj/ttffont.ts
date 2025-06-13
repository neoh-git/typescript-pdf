// Assuming these are defined in their respective .ts files:
// For `TtfParser` and `TtfWriter`, you'd need TypeScript definitions for these classes,
// assuming they're part of a custom font parsing/writing utility.
// import { TtfParser } from '../font/ttf_parser';
// import { TtfWriter } from '../font/ttf_writer';
// import { PdfFontMetrics } from '../font/font_metrics';
// import { arabic } from '../font/arabic'; // Assuming 'arabic' namespace
// import { bidi } from '../font/bidi_utils'; // Assuming 'bidi' namespace
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNum } from '../format/num';
// import { PdfStream } from '../format/stream';
// import { PdfString } from '../format/string';
// import { latin1 } from '../options'; // Assuming latin1 encoder is here or a utility
// import { PdfFont } from './font';
// import { PdfFontDescriptor } from './font_descriptor';
// import { PdfObject } from './object';
// import { PdfObjectStream } from './object_stream';
// import { PdfUnicodeCmap } from './unicode_cmap';

import { PdfDocument } from '../document';
import { arabic } from '../font/arabic';
import { bidi } from '../font/bidi_utils';
import { PdfFontMetrics } from '../font/font_metrics';
import { TtfParser } from '../font/ttf_parser';
import { TtfWriter } from '../font/ttf_writer';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfStream } from '../format/stream';
import { PdfString } from '../format/string';
import { latin1 } from '../options'; // Or wherever latin1 is defined
import { PdfFont } from './font';
import { PdfFontDescriptor } from './font_descriptor';
import { PdfObject } from './object';
import { PdfObjectStream } from './object_stream';
import { PdfUnicodeCmap } from './unicode_cmap';

/**
 * Represents a TrueType Font object in PDF.
 */
export class PdfTtfFont extends PdfFont {
    // Dart's `late` fields become instance properties initialized in the constructor.
    // Dart's `final` fields become `public readonly`.
    public readonly font: TtfParser;
    public unicodeCMap: PdfUnicodeCmap; // Not readonly as its `cmap` can be modified
    public descriptor: PdfFontDescriptor;
    public file: PdfObjectStream;
    public widthsObject: PdfObject<PdfArray>;

    /**
     * Constructs a [PdfTtfFont].
     * @param pdfDocument The PDF document.
     * @param bytes The font file bytes as `ArrayBuffer`.
     * @param options.protect If true, the font will be protected. Defaults to false.
     */
    constructor(
        pdfDocument: PdfDocument,
        bytes: ArrayBuffer, // Dart's `ByteData` typically maps to `ArrayBuffer` for raw byte data.
        options?: { protect?: boolean },
    ) {
        // Call PdfFont's "create" constructor, which is its primary constructor in TS.
        // Dart's `super.create(pdfDocument, subtype: '/TrueType')`
        super(pdfDocument, '/TrueType');

        this.font = new TtfParser(new Uint8Array(bytes)); // TtfParser likely expects Uint8Array

        // Initialize `late` fields here.
        this.file = new PdfObjectStream(pdfDocument, { isBinary: true });
        this.unicodeCMap = new PdfUnicodeCmap(pdfDocument, options?.protect ?? false);
        this.descriptor = new PdfFontDescriptor(this, this.file);
        // Assuming PdfObject<PdfArray> constructor takes PdfDocument and an initial PdfArray for `params`.
        this.widthsObject = new PdfObject<PdfArray>(pdfDocument, { params: new PdfArray() });
    }

    // Override getter for `subtype`
    override get subtype(): string {
        // Dart's `super.subtype` is accessed via `Object.getPrototypeOf(PdfTtfFont.prototype).subtype.get.call(this)`
        // or if `PdfFont` has a direct property, just `this.subtype` (if it was an abstract property defined in PdfFont).
        // A common pattern is to call the super method explicitly if it's a method, but for getters it's more complex.
        // Given it's a simple getter for a static string or a base property, we might need a different approach
        // if `super.subtype` does not exist as a direct property or getter in the TS inheritance chain.
        // Assuming `PdfFont` has a `_subtype` property or similar that `super.subtype` refers to.
        // Or, if `subtype` is an abstract property, then it's directly implemented here.
        // Let's assume `PdfFont` has a `protected _subtype` property or similar set in its constructor.
        // This example implies `PdfFont` sets its own subtype, and PdfTtfFont conditionally overrides it.
        // If PdfFont's constructor already sets `this.subtype`, we can't overwrite it here via `super`.
        // The dart code has `super.create(pdfDocument, subtype: '/TrueType')` which would set `this.subtype`.
        // So this getter *overrides* that initial value if `font.unicode` is true.
        return this.font.unicode ? '/Type0' : super.subtype;
    }

    override get fontName(): string {
        return this.font.fontName;
    }

    override get ascent(): number {
        // Dart's `toDouble()` is implicit for division if numbers are involved.
        return this.font.ascent / this.font.unitsPerEm;
    }

    override get descent(): number {
        return this.font.descent / this.font.unitsPerEm;
    }

    override get unitsPerEm(): number {
        return this.font.unitsPerEm;
    }

    override glyphMetrics(charCode: number): PdfFontMetrics {
        // Dart's Map access `map[key]` is `map.get(key)` in TS.
        const g = this.font.charToGlyphIndexMap.get(charCode);

        if (g == null) {
            return PdfFontMetrics.zero;
        }

        // Assuming `useBidi` and `useArabic` are boolean properties on this class or `pdfDocument.settings`.
        // Assuming `bidi.isArabicDiacriticValue` and `arabic.isArabicDiacriticValue` are static functions.
        // Assuming `font.glyphInfoMap` is a Map.
        // Assuming `PdfFontMetrics.copyWith` exists and takes an object.
        if (this.pdfDocument.settings.useBidi && bidi.isArabicDiacriticValue(charCode)) { // Added `pdfDocument.settings.`
            const metric = this.font.glyphInfoMap.get(g) ?? PdfFontMetrics.zero;
            return metric.copyWith({ advanceWidth: 0 });
        }

        if (this.pdfDocument.settings.useArabic && arabic.isArabicDiacriticValue(charCode)) { // Added `pdfDocument.settings.`
            const metric = this.font.glyphInfoMap.get(g) ?? PdfFontMetrics.zero;
            return metric.copyWith({ advanceWidth: 0 });
        }

        return this.font.glyphInfoMap.get(g) ?? PdfFontMetrics.zero;
    }

    /**
     * Builds parameters for a standard TrueType font (non-Unicode).
     */
    private _buildTrueType(params: PdfDict): void {
        const charMin = 32;
        const charMax = 255;

        // Dart's `font.bytes.buffer.asUint8List()` gets the underlying Uint8List.
        // In TS, if `font.bytes` is a `Uint8Array`, `font.bytes` itself is what's needed.
        this.file.buf.putBytes(this.font.bytes);
        this.file.params.set('/Length1', new PdfNum(this.font.bytes.byteLength)); // Dart's `lengthInBytes`

        params.set('/BaseFont', new PdfName(`/${this.fontName}`));
        params.set('/FontDescriptor', this.descriptor.ref());

        for (let i = charMin; i <= charMax; i++) {
            // Dart's `toInt()` for numbers is `Math.trunc()` in TS.
            this.widthsObject.params.add(
                new PdfNum(Math.trunc(this.glyphMetrics(i).advanceWidth * 1000.0)),
            );
        }
        params.set('/FirstChar', new PdfNum(charMin));
        params.set('/LastChar', new PdfNum(charMax));
        params.set('/Widths', this.widthsObject.ref());
    }

    /**
     * Builds parameters for a Type0 (CID-keyed font) with Unicode support.
     */
    private _buildType0(params: PdfDict): void {
        const ttfWriter = new TtfWriter(this.font);
        const data = ttfWriter.withChars(this.unicodeCMap.cmap);
        this.file.buf.putBytes(data);
        this.file.params.set('/Length1', new PdfNum(data.byteLength));

        // Dart's `PdfDict.values({...})` is `new PdfDict({...})`.
        const descendantFont = new PdfDict({
            '/Type': new PdfName('/Font'),
            '/BaseFont': new PdfName(`/${this.fontName}`),
            '/FontFile2': this.file.ref(),
            '/FontDescriptor': this.descriptor.ref(),
            // PdfArray takes an array of PdfDataType instances.
            '/W': new PdfArray([
                new PdfNum(0),
                this.widthsObject.ref(),
            ]),
            '/CIDToGIDMap': new PdfName('/Identity'),
            '/DW': new PdfNum(1000),
            '/Subtype': new PdfName('/CIDFontType2'),
            '/CIDSystemInfo': new PdfDict({
                '/Supplement': new PdfNum(0),
                '/Registry': PdfString.fromString('Adobe'),
                '/Ordering': PdfString.fromString('Identity-H'),
            }),
        });

        params.set('/BaseFont', new PdfName(`/${this.fontName}`));
        params.set('/Encoding', new PdfName('/Identity-H'));
        params.set('/DescendantFonts', new PdfArray([descendantFont])); // PdfArray from single object
        params.set('/ToUnicode', this.unicodeCMap.ref());

        const charMin = 0;
        const charMax = this.unicodeCMap.cmap.length - 1;
        for (let i = charMin; i <= charMax; i++) {
            this.widthsObject.params.add(
                new PdfNum(
                    Math.trunc(
                        this.glyphMetrics(this.unicodeCMap.cmap[i]).advanceWidth * 1000.0,
                    ),
                ),
            );
        }
    }

    override prepare(): void {
        super.prepare();

        if (this.font.unicode) {
            this._buildType0(this.params);
        } else {
            this._buildTrueType(this.params);
        }
    }

    override putText(stream: PdfStream, text: string): void {
        if (!this.font.unicode) {
            super.putText(stream, text); // Call base class method
            return; // Exit early if not Unicode
        }

        // Dart's `text.runes` is an `Iterable<int>`. In JS/TS, iterate `text`
        // and use `codePointAt` for Unicode characters.
        const runes = Array.from(text).map((char) => char.codePointAt(0)!);

        stream.putByte(0x3c); // Start of hex string

        for (const rune of runes) {
            let charIdx = this.unicodeCMap.cmap.indexOf(rune);
            if (charIdx === -1) {
                charIdx = this.unicodeCMap.cmap.length; // New index
                this.unicodeCMap.cmap.push(rune); // Add new character to cmap
            }

            // Convert charIdx to hex string, padLeft with '0' to 4 digits.
            // Dart's `latin1.encode` assumes bytes for PDF hex string.
            const hexString = charIdx.toString(16).padStart(4, '0');
            stream.putBytes(latin1.encode(hexString));
        }
        stream.putByte(0x3e); // End of hex string
    }

    override stringMetrics(s: string, options?: { letterSpacing?: number }): PdfFontMetrics {
        const letterSpacing = options?.letterSpacing ?? 0;

        // Dart's `s.isEmpty` is `s.length === 0`.
        if (s.length === 0 || !this.font.unicode) {
            return super.stringMetrics(s, { letterSpacing: letterSpacing });
        }

        // Dart's `runes.forEach(bytes.add)` for collecting codepoints.
        const runes = Array.from(s).map((char) => char.codePointAt(0)!);

        // Map glyph metrics over codepoints.
        const metrics = runes.map((rune) => this.glyphMetrics(rune));
        return PdfFontMetrics.append(metrics, { letterSpacing: letterSpacing });
    }

    override isRuneSupported(charCode: number): boolean {
        return this.font.charToGlyphIndexMap.has(charCode); // Dart's `containsKey` is `has`
    }
}