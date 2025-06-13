// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfObjectStream } from './object_stream';

import { PdfDocument } from '../document';
import { PdfObjectStream } from './object_stream';

/**
 * Unicode character map object (CMap).
 * This object maps character codes to glyph IDs.
 */
export class PdfUnicodeCmap extends PdfObjectStream {
    /**
     * List of characters (mapping PDF character codes to Unicode code points).
     * The first entry `[0]` implies the default glyph (e.g., .notdef).
     * Subsequent entries are populated as new characters are encountered.
     */
    public readonly cmap: number[] = [0];

    /**
     * Protects the text from being "seen" by the PDF reader.
     * If true, all characters except the first one will map to 0x20 (space),
     * making the text invisible or unselectable in some viewers.
     */
    public readonly protect: boolean;

    /**
     * Create a Unicode character map object.
     * @param pdfDocument The PDF document.
     * @param protect If true, characters beyond the first will be "protected" (mapped to space).
     */
    constructor(pdfDocument: PdfDocument, protect: boolean) {
        super(pdfDocument); // Call the constructor of PdfObjectStream.
        this.protect = protect;
    }

    /**
     * Prepares the Unicode character map by generating its content stream.
     * This involves writing the CMap definition, including character code ranges
     * and the actual character-to-glyph mappings.
     */
    override prepare(): void {
        // If `protect` is true, fill the cmap with space character (0x20) from the second element.
        // Dart's `cmap.fillRange(1, cmap.length, 0x20)`
        // In TypeScript, `fill` method can be used, or a loop.
        if (this.protect) {
            // Ensure existing elements are filled from index 1.
            for (let i = 1; i < this.cmap.length; i++) {
                this.cmap[i] = 0x20; // Unicode space character
            }
            // If cmap were empty except for [0], and then expanded, new elements would also be 0x20.
            // This might not be strictly necessary if cmap is always built sequentially.
        }

        // Write the fixed header part of the CMap stream.
        this.buf.putString(
            '/CIDInit/ProcSet\nfindresource begin\n' +
            '12 dict begin\n' +
            'begincmap\n' +
            '/CIDSystemInfo<<\n' +
            '/Registry (Adobe)\n' +
            '/Ordering (UCS)\n' +
            '/Supplement 0\n' +
            '>> def\n' +
            '/CMapName/Adobe-Identity-UCS def\n' +
            '/CMapType 2 def\n' +
            '1 begincodespacerange\n' +
            '<0000> <FFFF>\n' +
            'endcodespacerange\n' +
            `${this.cmap.length} beginbfchar\n`,
        );

        // Write the character mappings.
        for (let key = 0; key < this.cmap.length; key++) {
            const value = this.cmap[key];
            // Convert key and value to uppercase hexadecimal strings, padded to 4 digits.
            // Dart's `toRadixString(16).toUpperCase().padLeft(4, '0')`
            const hexKey = key.toString(16).toUpperCase().padStart(4, '0');
            const hexValue = value.toString(16).toUpperCase().padStart(4, '0');
            this.buf.putString(`<${hexKey}> <${hexValue}>\n`);
        }

        // Write the fixed footer part of the CMap stream.
        this.buf.putString(
            'endbfchar\n' +
            'endcmap\n' +
            'CMapName currentdict /CMap defineresource pop\n' +
            'end\n' +
            'end',
        );

        // Call the super class's prepare method to finalize the stream object.
        super.prepare();
    }
}