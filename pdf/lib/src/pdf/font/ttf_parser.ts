// Assuming these types are defined and exported from their respective files:
// import { Uint8Array, TextDecoder } from 'typed_data'; // Uint8Array and TextDecoder are global types
// import { Buffer } from 'buffer'; // If running in Node.js, for Buffer.from, though TextDecoder is preferred.
import { PdfFontMetrics } from './font_metrics'; // Assumes PdfFontMetrics is defined as translated before
import { basicToIsolatedMappings } from './bidi_utils'; // Assuming bidi_utils exports this map

// Enum for TrueType Font Name IDs (from the 'name' table)
export enum TtfParserName {
    copyright,
    fontFamily,
    fontSubfamily,
    uniqueID,
    fullName,
    version,
    postScriptName,
    trademark,
    manufacturer,
    designer,
    description,
    manufacturerURL,
    designerURL,
    license,
    licenseURL,
    reserved,
    preferredFamily,
    preferredSubfamily,
    compatibleFullName,
    sampleText,
    postScriptFindFontName,
    wwsFamily,
    wwsSubfamily,
}

/**
 * Represents information about a TrueType glyph.
 * @immutable is a Dart annotation, property immutability enforced by `readonly`.
 */
export class TtfGlyphInfo {
    public readonly index: number;
    public readonly data: Uint8Array;
    public readonly compounds: number[];

    constructor(index: number, data: Uint8Array, compounds: number[]) {
        this.index = index;
        this.data = data;
        this.compounds = compounds;
    }

    /**
     * Creates a deep copy of this TtfGlyphInfo instance.
     * @returns A new TtfGlyphInfo instance with copied data.
     */
    public copy(): TtfGlyphInfo {
        return new TtfGlyphInfo(
            this.index,
            new Uint8Array(this.data), // Deep copy Uint8Array
            Array.from(this.compounds), // Deep copy number array
        );
    }

    public toString(): string {
        return `Glyph ${this.index} ${this.compounds}`;
    }
}

/**
 * Represents information about a TrueType bitmap glyph.
 */
export class TtfBitmapInfo {
    public readonly data: Uint8Array;
    public readonly height: number;
    public readonly width: number;
    public readonly horiBearingX: number;
    public readonly horiBearingY: number;
    public readonly horiAdvance: number;
    public readonly vertBearingX: number;
    public readonly vertBearingY: number;
    public readonly vertAdvance: number;
    public readonly ascent: number;
    public readonly descent: number;

    constructor(
        data: Uint8Array,
        height: number,
        width: number,
        horiBearingX: number,
        horiBearingY: number,
        horiAdvance: number,
        vertBearingX: number,
        vertBearingY: number,
        vertAdvance: number,
        ascent: number,
        descent: number,
    ) {
        this.data = data;
        this.height = height;
        this.width = width;
        this.horiBearingX = horiBearingX;
        this.horiBearingY = horiBearingY;
        this.horiAdvance = horiAdvance;
        this.vertBearingX = vertBearingX;
        this.vertBearingY = vertBearingY;
        this.vertAdvance = vertAdvance;
        this.ascent = ascent;
        this.descent = descent;
    }

    /**
     * Calculates and returns the font metrics for this bitmap glyph.
     * Metrics are scaled relative to the glyph's height.
     */
    public get metrics(): PdfFontMetrics {
        const coef = 1.0 / this.height; // Scaling coefficient
        return new PdfFontMetrics({
            bottom: this.horiBearingY * coef,
            left: this.horiBearingX * coef,
            top: this.horiBearingY * coef - this.height * coef,
            right: this.horiAdvance * coef,
            ascent: this.ascent * coef,
            descent: this.horiBearingY * coef, // Often the same as horiBearingY for bitmaps
            advanceWidth: this.horiAdvance * coef,
            leftBearing: this.horiBearingX * coef,
        });
    }

    public toString(): string {
        return `Bitmap Glyph ${this.width}x${this.height} horiBearingX:${this.horiBearingX} horiBearingY:${this.horiBearingY} horiAdvance:${this.horiAdvance} ascender:${this.ascent} descender:${this.descent}`;
    }
}

/**
 * A parser for TrueType Font (TTF) files.
 * It extracts font metadata, glyph outlines, and character-to-glyph mappings.
 */
export class TtfParser {
    // --- TTF Table Names ---
    public static readonly head_table: string = 'head';
    public static readonly name_table: string = 'name';
    public static readonly hmtx_table: string = 'hmtx';
    public static readonly hhea_table: string = 'hhea';
    public static readonly cmap_table: string = 'cmap';
    public static readonly maxp_table: string = 'maxp';
    public static readonly loca_table: string = 'loca';
    public static readonly glyf_table: string = 'glyf';
    public static readonly cblc_table: string = 'CBLC'; // Color Bitmap Location Table
    public static readonly cbdt_table: string = 'CBDT'; // Color Bitmap Data Table
    public static readonly post_table: string = 'post';
    public static readonly os_2_table: string = 'OS/2';

    public readonly bytes: DataView; // The TTF font file bytes wrapped in a DataView
    public readonly tableOffsets: { [key: string]: number } = {}; // Map of table names to their offsets
    public readonly tableSize: { [key: string]: number } = {}; // Map of table names to their sizes

    public readonly charToGlyphIndexMap: { [key: number]: number } = {}; // Char code to glyph index mapping
    public readonly glyphOffsets: number[] = []; // Offsets of glyph data in the 'glyf' table
    public readonly glyphSizes: number[] = []; // Sizes of glyph data in the 'glyf' table
    public readonly glyphInfoMap: { [key: number]: PdfFontMetrics } = {}; // Glyph index to PdfFontMetrics mapping
    public readonly bitmapOffsets: { [key: number]: TtfBitmapInfo } = {}; // Glyph index to TtfBitmapInfo mapping

    // Flag indicating whether to use bidi (bidirectional) text processing rules.
    // This isn't part of the original Dart class, but implied by `useBidi` in cmap parsing.
    // Assuming `useBidi` is a global config option or passed to the constructor.
    private readonly useBidi: boolean = true; // Default to true if not externally configured

    /**
     * Creates a TtfParser instance and parses the basic structure of the font.
     * @param bytes The raw font file data as a DataView.
     */
    constructor(bytes: DataView) {
        this.bytes = bytes;

        // Parse the SFNT header to find table offsets and sizes
        const numTables = bytes.getUint16(4); // numTables at offset 4

        for (let i = 0; i < numTables; i++) {
            // Each table entry is 16 bytes: tag (4), checksum (4), offset (4), length (4)
            const tagOffset = i * 16 + 12; // Start of first table entry in SFNT header
            // Read table tag (e.g., 'head', 'cmap')
            const nameBytes = new Uint8Array(bytes.buffer, bytes.byteOffset + tagOffset, 4);
            const name = new TextDecoder('utf-8').decode(nameBytes); // Decode 4-byte tag to string
            const offset = bytes.getUint32(tagOffset + 8); // Offset of the table
            const size = bytes.getUint32(tagOffset + 12); // Size of the table

            this.tableOffsets[name] = offset;
            this.tableSize[name] = size;
        }

        // Assertions: ensure critical tables are present
        const requiredTables = [
            TtfParser.head_table, TtfParser.name_table, TtfParser.hmtx_table,
            TtfParser.hhea_table, TtfParser.cmap_table, TtfParser.maxp_table
        ];
        for (const tableName of requiredTables) {
            if (!(tableName in this.tableOffsets)) {
                throw new Error(`Unable to find the \`${tableName}\` table. This file is not a supported TTF font.`);
            }
        }

        // Parse tables
        this._parseCMap(); // Character to glyph mapping
        if (TtfParser.loca_table in this.tableOffsets && TtfParser.glyf_table in this.tableOffsets) {
            this._parseIndexes(); // Glyph location indexes
            this._parseGlyphs(); // Glyph outline data
        }
        if (TtfParser.cblc_table in this.tableOffsets && TtfParser.cbdt_table in this.tableOffsets) {
            this._parseBitmaps(); // Color bitmap data (if present, for EBLC/EBDT tables)
        }
    }

    // --- Getter Properties for Font Metadata ---

    /**
     * The number of font design units per EM (em square).
     */
    public get unitsPerEm(): number {
        // head table: offset 18, Uint16
        return this.bytes.getUint16(this.tableOffsets[TtfParser.head_table]! + 18);
    }

    /**
     * Minimum X coordinate across all glyph bounding boxes.
     */
    public get xMin(): number {
        // head table: offset 36, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.head_table]! + 36);
    }

    /**
     * Minimum Y coordinate across all glyph bounding boxes.
     */
    public get yMin(): number {
        // head table: offset 38, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.head_table]! + 38);
    }

    /**
     * Maximum X coordinate across all glyph bounding boxes.
     */
    public get xMax(): number {
        // head table: offset 40, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.head_table]! + 40);
    }

    /**
     * Maximum Y coordinate across all glyph bounding boxes.
     */
    public get yMax(): number {
        // head table: offset 42, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.head_table]! + 42);
    }

    /**
     * Format of the 'loca' table (0 for short offsets, 1 for long offsets).
     */
    public get indexToLocFormat(): number {
        // head table: offset 50, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.head_table]! + 50);
    }

    /**
     * Typographic ascender from the 'hhea' table.
     */
    public get ascent(): number {
        // hhea table: offset 4, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.hhea_table]! + 4);
    }

    /**
     * Typographic descender from the 'hhea' table.
     */
    public get descent(): number {
        // hhea table: offset 6, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.hhea_table]! + 6);
    }

    /**
     * Typographic line gap from the 'hhea' table.
     */
    public get lineGap(): number {
        // hhea table: offset 8, Int16
        return this.bytes.getInt16(this.tableOffsets[TtfParser.hhea_table]! + 8);
    }

    /**
     * Number of long horizontal metrics from the 'hhea' table.
     */
    public get numOfLongHorMetrics(): number {
        // hhea table: offset 34, Uint16
        return this.bytes.getUint16(this.tableOffsets[TtfParser.hhea_table]! + 34);
    }

    /**
     * Total number of glyphs in the font from the 'maxp' table.
     */
    public get numGlyphs(): number {
        // maxp table: offset 4, Uint16
        return this.bytes.getUint16(this.tableOffsets[TtfParser.maxp_table]! + 4);
    }

    /**
     * The PostScript font name from the 'name' table.
     * Fallbacks to hash code if not found.
     */
    public get fontName(): string {
        return this.getNameID(TtfParserName.postScriptName) ?? this.hashCode.toString();
    }

    /**
     * Indicates if the font is a Unicode font (based on version 1.0 for 'cmap' table).
     * This is a rough check.
     */
    public get unicode(): boolean {
        // Version 1.0 of the TTF header has 0x10000 at offset 0
        return this.bytes.getUint32(0) === 0x10000;
    }

    /**
     * Indicates if the font contains only bitmap glyphs and no outline glyphs.
     */
    public get isBitmap(): boolean {
        return Object.keys(this.bitmapOffsets).length > 0 && this.glyphOffsets.length === 0;
    }

    /**
     * Retrieves a font name string from the 'name' table based on its Name ID.
     * @param fontNameID The TtfParserName enum value representing the desired name ID.
     * @returns The decoded string, or null if not found or decoding fails.
     */
    public getNameID(fontNameID: TtfParserName): string | null {
        const basePosition = this.tableOffsets[TtfParser.name_table];
        if (basePosition == null) {
            return null;
        }

        // final format = bytes.getUint16(basePosition); // Not used in Dart code
        const count = this.bytes.getUint16(basePosition + 2); // Number of name records
        const stringOffset = this.bytes.getUint16(basePosition + 4); // Offset to string storage
        let pos = basePosition + 6; // Start of first name record

        let _fontName: string | null = null; // To store potential ASCII/Latin1 font name

        for (let i = 0; i < count; i++) {
            const platformID = this.bytes.getUint16(pos);
            // const encodingID = this.bytes.getUint16(pos + 2); // Not used in Dart code
            // const languageID = this.bytes.getUint16(pos + 4); // Not used in Dart code
            const nameID = this.bytes.getUint16(pos + 6);
            const length = this.bytes.getUint16(pos + 8);
            const offset = this.bytes.getUint16(pos + 10);
            pos += 12; // Move to the next name record

            // Platform ID 1: Macintosh platform (usually Latin-1 / ASCII)
            if (platformID === 1 && nameID === fontNameID) { // Dart's enum.index maps to TS numeric enum value
                try {
                    const nameBytes = new Uint8Array(this.bytes.buffer, basePosition + stringOffset + offset, length);
                    _fontName = new TextDecoder('latin1').decode(nameBytes); // Mac Roman or Latin-1
                } catch (a) {
                    console.error(`Error decoding nameID ${nameID} (Platform 1):`, a);
                }
            }

            // Platform ID 3: Microsoft platform (usually UTF-16BE)
            if (platformID === 3 && nameID === fontNameID) {
                try {
                    const nameBytes = new Uint8Array(this.bytes.buffer, basePosition + stringOffset + offset, length);
                    return this._decodeUtf16(nameBytes); // Return immediately if found
                } catch (a) {
                    console.error(`Error decoding nameID ${nameID} (Platform 3):`, a);
                }
            }
        }
        return _fontName; // Return the Mac name if Microsoft not found
    }

    /**
     * Parses the 'cmap' table to build the character-to-glyph index map.
     * This table contains sub-tables for different encoding formats.
     */
    private _parseCMap(): void {
        const basePosition = this.tableOffsets[TtfParser.cmap_table]!;
        // const version = this.bytes.getUint16(basePosition); // Not used in Dart code
        const numSubTables = this.bytes.getUint16(basePosition + 2); // Number of encoding sub-tables

        for (let i = 0; i < numSubTables; i++) {
            // EncodingRecord: platformID (2), encodingID (2), offset (4)
            const subTableOffset = this.bytes.getUint32(basePosition + i * 8 + 8); // Offset to actual subtable
            const format = this.bytes.getUint16(basePosition + subTableOffset); // Format of the subtable

            switch (format) {
                case 0:
                    this._parseCMapFormat0(basePosition + subTableOffset + 2); // +2 to skip format field itself
                    break;
                case 4:
                    this._parseCMapFormat4(basePosition + subTableOffset + 2);
                    break;
                case 6:
                    this._parseCMapFormat6(basePosition + subTableOffset + 2);
                    break;
                case 12:
                    this._parseCMapFormat12(basePosition + subTableOffset + 2);
                    break;
                // Other formats (e.g., 2, 8, 10, 13, 14) are not handled by this parser
            }
        }
    }

    /**
     * Parses 'cmap' subtable format 0 (Byte encoding table).
     * This format maps 256 character codes to glyph indices.
     * @param basePosition The starting offset of the format 0 subtable data.
     */
    private _parseCMapFormat0(basePosition: number): void {
        const length = this.bytes.getUint16(basePosition); // Length of subtable (should be 262)
        if (length !== 262) { // Assert for correctness as in Dart
            console.warn(`CMap Format 0 length mismatch: expected 262, got ${length}`);
        }
        // const language = this.bytes.getUint16(basePosition + 2); // Not used in Dart

        for (let i = 0; i < 256; i++) {
            const charCode = i;
            const glyphIndex = this.bytes.getUint8(basePosition + i + 2); // +2 to skip length and language
            if (glyphIndex > 0) { // Only map if glyphIndex is not 0 (undefined glyph)
                this.charToGlyphIndexMap[charCode] = glyphIndex;
            }
        }
    }

    /**
     * Parses 'cmap' subtable format 4 (Segment mapping to delta values).
     * This is a common format for Unicode fonts.
     * @param basePosition The starting offset of the format 4 subtable data.
     */
    private _parseCMapFormat4(basePosition: number): void {
        // const length = this.bytes.getUint16(basePosition); // Not used in Dart
        // const language = this.bytes.getUint16(basePosition + 2); // Not used in Dart
        const segCountX2 = this.bytes.getUint16(basePosition + 4);
        const segCount = Math.trunc(segCountX2 / 2); // Number of segments

        const endCodes: number[] = [];
        for (let i = 0; i < segCount; i++) {
            endCodes.push(this.bytes.getUint16(basePosition + i * 2 + 12));
        }

        // const reservedPad = this.bytes.getUint16(basePosition + segCount * 2 + 12); // Not used in Dart
        const startCodes: number[] = [];
        for (let i = 0; i < segCount; i++) {
            startCodes.push(this.bytes.getUint16(basePosition + (segCount + i) * 2 + 14));
        }

        const idDeltas: number[] = [];
        for (let i = 0; i < segCount; i++) {
            // Note: Dart's (segCount * 2 + i) * 2 + 14 is `segCountX2 + i*2 + 14`
            idDeltas.push(this.bytes.getUint16(basePosition + segCountX2 + i * 2 + 14));
        }

        const idRangeOffsetBasePos = basePosition + segCountX2 + segCount * 2 + 14; // Corrected base for idRangeOffsets
        const idRangeOffsets: number[] = [];
        for (let i = 0; i < segCount; i++) {
            idRangeOffsets.push(this.bytes.getUint16(idRangeOffsetBasePos + i * 2));
        }

        for (let s = 0; s < segCount - 1; s++) { // Loop up to segCount - 1 (the last segment is the "filler" segment)
            const startCode = startCodes[s];
            const endCode = endCodes[s];
            const idDelta = idDeltas[s];
            const idRangeOffset = idRangeOffsets[s];
            const idRangeOffsetAddress = idRangeOffsetBasePos + s * 2; // Address of this segment's idRangeOffset in the table

            for (let c = startCode; c <= endCode; c++) {
                let glyphIndex: number;
                if (idRangeOffset === 0) {
                    // Direct mapping: glyphIndex = (charCode + idDelta) % 65536
                    glyphIndex = (idDelta + c) % 65536; // Modulo 65536 to handle overflow for Uint16
                } else {
                    // Indirect mapping: glyphIndex is found via idRangeOffset and its own index
                    const glyphIndexAddress = idRangeOffset + 2 * (c - startCode) + idRangeOffsetAddress;
                    glyphIndex = this.bytes.getUint16(glyphIndexAddress);
                }
                this.charToGlyphIndexMap[c] = glyphIndex;

                // Conditional logic for Arabic bidi mapping
                if (this.useBidi && basicToIsolatedMappings.hasOwnProperty(c)) {
                    // Map the isolated form of the Arabic character to the same glyph index.
                    this.charToGlyphIndexMap[basicToIsolatedMappings[c]!] = glyphIndex;
                }
            }
        }
    }

    /**
     * Parses 'cmap' subtable format 6 (Trimmed table mapping).
     * @param basePosition The starting offset of the format 6 subtable data.
     */
    private _parseCMapFormat6(basePosition: number): void {
        // const length = this.bytes.getUint16(basePosition); // Not used in Dart
        // const language = this.bytes.getUint16(basePosition + 2); // Not used in Dart
        const firstCode = this.bytes.getUint16(basePosition + 4);
        const entryCount = this.bytes.getUint16(basePosition + 6); // Number of glyphs in array

        for (let i = 0; i < entryCount; i++) {
            const charCode = firstCode + i;
            const glyphIndex = this.bytes.getUint16(basePosition + i * 2 + 8); // +8 to skip header fields
            if (glyphIndex > 0) {
                this.charToGlyphIndexMap[charCode] = glyphIndex;
            }
        }
    }

    /**
     * Parses 'cmap' subtable format 12 (Segmented coverage).
     * This format supports Unicode supplementary planes (code points > 0xFFFF).
     * @param basePosition The starting offset of the format 12 subtable data.
     */
    private _parseCMapFormat12(basePosition: number): void {
        // const reserved = this.bytes.getUint16(basePosition); // Not used in Dart
        const length = this.bytes.getUint32(basePosition + 2); // Total length of the subtable
        // const language = this.bytes.getUint32(basePosition + 6); // Not used in Dart
        const numGroups = this.bytes.getUint32(basePosition + 10); // Number of sequential map groups

        if (length !== 12 * numGroups + 16) { // Assert for correctness as in Dart
            throw new Error(`CMap Format 12 length mismatch: expected ${12 * numGroups + 16}, got ${length}`);
        }

        for (let i = 0; i < numGroups; i++) {
            const groupOffset = basePosition + i * 12 + 14; // Each group is 12 bytes: start (4), end (4), startGlyphID (4)
            const startCharCode = this.bytes.getUint32(groupOffset);
            const endCharCode = this.bytes.getUint32(groupOffset + 4);
            const startGlyphID = this.bytes.getUint32(groupOffset + 8);

            for (let j = startCharCode; j <= endCharCode; j++) {
                const calculatedGlyphIndex = startGlyphID + (j - startCharCode);
                // Assert if an existing mapping conflicts (Dart's assert behavior)
                if (this.charToGlyphIndexMap.hasOwnProperty(j) && this.charToGlyphIndexMap[j] !== calculatedGlyphIndex) {
                    console.warn(`CMap Format 12: Conflicting glyph index for charCode ${j}. Existing: ${this.charToGlyphIndexMap[j]}, New: ${calculatedGlyphIndex}`);
                }
                this.charToGlyphIndexMap[j] = calculatedGlyphIndex;
            }
        }
    }

    /**
     * Parses the 'loca' table (Index to Location table) to get glyph offsets and sizes.
     * This table points to the location of glyph data within the 'glyf' table.
     */
    private _parseIndexes(): void {
        const basePosition = this.tableOffsets[TtfParser.loca_table]!;

        if (this.indexToLocFormat === 0) { // Short offsets (multiplied by 2)
            let prevOffset = this.bytes.getUint16(basePosition) * 2; // Offset in bytes
            for (let i = 1; i < this.numGlyphs + 1; i++) { // Loop for numGlyphs + 1 entries
                const offset = this.bytes.getUint16(basePosition + i * 2) * 2;
                this.glyphOffsets.push(prevOffset);
                this.glyphSizes.push(offset - prevOffset);
                prevOffset = offset;
            }
        } else { // Long offsets
            let prevOffset = this.bytes.getUint32(basePosition); // Offset in bytes
            for (let i = 1; i < this.numGlyphs + 1; i++) { // Loop for numGlyphs + 1 entries
                const offset = this.bytes.getUint32(basePosition + i * 4);
                this.glyphOffsets.push(prevOffset);
                this.glyphSizes.push(offset - prevOffset);
                prevOffset = offset;
            }
        }
    }

    /**
     * Parses the 'glyf' table (Glyph Data) to extract glyph metrics.
     * This method populates `glyphInfoMap` with `PdfFontMetrics` for each glyph.
     * @see https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6glyf.html
     */
    private _parseGlyphs(): void {
        const baseOffset = this.tableOffsets[TtfParser.glyf_table]!;
        const hmtxOffset = this.tableOffsets[TtfParser.hmtx_table]!;
        const unitsPerEm = this.unitsPerEm;
        const numOfLongHorMetrics = this.numOfLongHorMetrics;

        // Default advance width from the last entry in `hmtx`'s long metrics section.
        // It's used for glyphs whose index is greater than `numOfLongHorMetrics - 1`.
        const defaultAdvanceWidth = this.bytes.getUint16(hmtxOffset + (numOfLongHorMetrics - 1) * 4);

        for (let glyphIndex = 0; glyphIndex < this.numGlyphs; glyphIndex++) {
            let advanceWidth: number;
            let leftBearing: number;

            // Get advanceWidth and leftBearing from `hmtx` table
            if (glyphIndex < numOfLongHorMetrics) {
                // For glyphs within the long horizontal metrics section (lhmtx)
                advanceWidth = this.bytes.getUint16(hmtxOffset + glyphIndex * 4);
                leftBearing = this.bytes.getInt16(hmtxOffset + glyphIndex * 4 + 2);
            } else {
                // For glyphs beyond lhmtx, use the defaultAdvanceWidth and find their leftBearing
                // in the short horizontal metrics (shmtx) section.
                advanceWidth = defaultAdvanceWidth;
                leftBearing = this.bytes.getInt16(
                    hmtxOffset + numOfLongHorMetrics * 4 + (glyphIndex - numOfLongHorMetrics) * 2
                );
            }

            // If glyph size is 0, it means it's an empty glyph (e.g., space or non-rendering control char)
            if (this.glyphSizes[glyphIndex] === 0) {
                this.glyphInfoMap[glyphIndex] = new PdfFontMetrics({
                    left: 0, top: 0, right: 0, bottom: 0, ascent: 0, descent: 0,
                    advanceWidth: advanceWidth / unitsPerEm,
                    leftBearing: leftBearing / unitsPerEm,
                });
                continue; // Move to next glyph
            }

            // For non-empty glyphs, read bounding box from 'glyf' table header
            const offset = this.glyphOffsets[glyphIndex];
            const xMin = this.bytes.getInt16(baseOffset + offset + 2);
            const yMin = this.bytes.getInt16(baseOffset + offset + 4);
            const xMax = this.bytes.getInt16(baseOffset + offset + 6);
            const yMax = this.bytes.getInt16(baseOffset + offset + 8);

            this.glyphInfoMap[glyphIndex] = new PdfFontMetrics({
                left: xMin / unitsPerEm,
                top: yMin / unitsPerEm,
                right: xMax / unitsPerEm,
                bottom: yMax / unitsPerEm,
                ascent: this.ascent / unitsPerEm, // Font-wide ascent
                descent: this.descent / unitsPerEm, // Font-wide descent
                advanceWidth: advanceWidth / unitsPerEm,
                leftBearing: leftBearing / unitsPerEm,
            });
        }
    }

    /**
     * Reads the raw data for a specific glyph, including compound glyph components.
     * @param index The glyph index.
     * @returns A TtfGlyphInfo object containing the glyph's raw data and components.
     */
    public readGlyph(index: number): TtfGlyphInfo {
        if (index >= this.glyphOffsets.length) { // Assert as in Dart
            throw new Error(`Glyph index ${index} out of bounds: max ${this.glyphOffsets.length - 1}`);
        }

        const start = this.tableOffsets[TtfParser.glyf_table]! + this.glyphOffsets[index];

        // Check for invalid glyph offset (e.g., if it points outside the glyf table or to 0 offset)
        if (start >= this.tableSize[TtfParser.glyf_table]! + this.tableOffsets[TtfParser.glyf_table]! || start === 0) {
            return new TtfGlyphInfo(index, new Uint8Array(0), []); // Return empty glyph info
        }

        const numberOfContours = this.bytes.getInt16(start); // Number of contours (-1 for compound glyph)

        if (numberOfContours === -1) {
            return this._readCompoundGlyph(index, start, start + 10); // +10 skips bounding box fields
        } else {
            return this._readSimpleGlyph(index, start, start + 10, numberOfContours);
        }
    }

    /**
     * Reads a simple glyph's data.
     * @param glyph The glyph index.
     * @param start The starting offset of the glyph in the 'glyf' table.
     * @param offset The current read offset within the glyph data.
     * @param numberOfContours The number of contours for this simple glyph.
     * @returns A TtfGlyphInfo object with the simple glyph's data.
     */
    private _readSimpleGlyph(
        glyph: number,
        start: number,
        offset: number,
        numberOfContours: number,
    ): TtfGlyphInfo {
        const xIsByte = 2; // Flag bit for x-coordinate is 1-byte
        const yIsByte = 4; // Flag bit for y-coordinate is 1-byte
        const repeat = 8; // Flag bit for repeating flags
        const xDelta = 16; // Flag bit for x-coordinate is signed 2-byte (delta)
        const yDelta = 32; // Flag bit for y-coordinate is signed 2-byte (delta)

        let numPoints = 1; // Minimum 1 point even if no contours

        // Read end-points of contours to find total number of points
        for (let i = 0; i < numberOfContours; i++) {
            numPoints = Math.max(numPoints, this.bytes.getUint16(offset) + 1);
            offset += 2;
        }

        // Skip over instructions section (if present)
        // instructionsLength (Uint16) + instruction data
        offset += this.bytes.getUint16(offset) + 2;

        if (numberOfContours === 0) {
            // Special case: glyph has no contours (e.g., space character)
            return new TtfGlyphInfo(
                glyph,
                new Uint8Array(this.bytes.buffer, this.bytes.byteOffset + start, offset - start),
                [], // No components for simple glyph
            );
        }

        const flags: number[] = [];

        // Read flags for each point
        for (let i = 0; i < numPoints; i++) {
            const flag = this.bytes.getUint8(offset++);
            flags.push(flag);

            if ((flag & repeat) !== 0) { // If repeat bit is set
                let repeatCount = this.bytes.getUint8(offset++);
                i += repeatCount; // Advance loop counter by repeat count
                while (repeatCount-- > 0) {
                    flags.push(flag); // Add flag repeatedly
                }
            }
        }

        // Skip over x and y coordinates based on flags
        let byteFlag = xIsByte;
        let deltaFlag = xDelta;
        for (let a = 0; a < 2; a++) { // Loop once for X coordinates, once for Y
            for (let i = 0; i < numPoints; i++) {
                const flag = flags[i];
                if ((flag & byteFlag) !== 0) { // If byte flag set, 1 byte
                    offset++;
                } else if ((~flag & deltaFlag) !== 0) { // If delta flag NOT set, 2 bytes
                    offset += 2;
                }
                // If neither is set, 0 bytes (coordinate is 0)
            }
            byteFlag = yIsByte; // Switch to Y flags
            deltaFlag = yDelta;
        }

        return new TtfGlyphInfo(
            glyph,
            new Uint8Array(this.bytes.buffer, this.bytes.byteOffset + start, offset - start),
            [], // No components for simple glyph
        );
    }

    /**
     * Reads a compound glyph's data.
     * Compound glyphs are composed of other glyphs.
     * @param glyph The glyph index.
     * @param start The starting offset of the glyph in the 'glyf' table.
     * @param offset The current read offset within the glyph data (after the header).
     * @returns A TtfGlyphInfo object with the compound glyph's data and component glyph indices.
     */
    private _readCompoundGlyph(glyph: number, start: number, offset: number): TtfGlyphInfo {
        const arg1And2AreWords = 0x0001;
        // const argsAreXYValues = 0x0002; // Not used in Dart code
        // const roundXYToGrid = 0x0004; // Not used in Dart code
        const hasScale = 0x0008;
        // const moreComponents = 0x0020; // Used as loop condition
        const hasXYScale = 0x0040;
        const hasTransformationMatrix = 0x0080;
        const weHaveInstructions = 0x0100;

        const components: number[] = [];
        let hasInstructions = false;
        let flags: number;

        // Loop as long as the 'moreComponents' flag is set (implicitly 0x0020)
        // Dart: `while (flags & moreComponents != 0)`
        // The first `flags` is implicitly initialized as if it had `moreComponents` set
        // to enter the loop at least once.
        do {
            flags = this.bytes.getUint16(offset);
            const componentGlyphIndex = this.bytes.getUint16(offset + 2);
            offset += 4; // Advance past flags and glyphIndex

            // Argument 1 and 2 (offsets or anchor points)
            offset += (flags & arg1And2AreWords) !== 0 ? 4 : 2; // Add 4 bytes if words, 2 bytes if bytes

            // Transformation matrix: scale, xy-scale, or 2x2 matrix
            if ((flags & hasScale) !== 0) {
                offset += 2; // For 16.16 fixed-point single value
            } else if ((flags & hasXYScale) !== 0) {
                offset += 4; // For two 16.16 fixed-point values (x-scale, y-scale)
            } else if ((flags & hasTransformationMatrix) !== 0) {
                offset += 8; // For four 16.16 fixed-point values (2x2 matrix)
            }

            components.push(componentGlyphIndex);

            if ((flags & weHaveInstructions) !== 0) {
                if (hasInstructions) { // Assert in Dart: `assert(!hasInstructions)`
                    console.warn(`Compound glyph ${glyph} has 'WE_HAVE_INSTRUCTIONS' set multiple times.`);
                }
                hasInstructions = true;
            }
        } while ((flags & 0x0020) !== 0); // Loop condition: MORE_COMPONENTS = 0x0020

        // If 'WE_HAVE_INSTRUCTIONS' was set, skip over the instruction data
        if (hasInstructions) {
            offset += this.bytes.getUint16(offset) + 2; // instructionsLength (Uint16) + instruction data
        }

        return new TtfGlyphInfo(
            glyph,
            new Uint8Array(this.bytes.buffer, this.bytes.byteOffset + start, offset - start),
            components,
        );
    }

    /**
     * Decodes a Uint8Array containing UTF-16BE bytes into a JavaScript string.
     * @param bytes The Uint8Array to decode.
     * @returns The decoded string.
     */
    private _decodeUtf16(bytes: Uint8Array): string {
        const charCodes: number[] = [];
        for (let i = 0; i < bytes.length; i += 2) {
            // Combine two bytes into a 16-bit Unicode code unit (big-endian)
            charCodes.push((bytes[i] << 8) | bytes[i + 1]);
        }
        // Use `String.fromCodePoint` for robustness with surrogate pairs if they exist,
        // otherwise `String.fromCharCode` works for BMP characters.
        return String.fromCodePoint(...charCodes);
    }

    /**
     * Parses the 'CBLC' (Color Bitmap Location) and 'CBDT' (Color Bitmap Data) tables
     * to extract embedded bitmap glyphs.
     * @see https://docs.microsoft.com/en-us/typography/opentype/spec/ebdt
     */
    private _parseBitmaps(): void {
        const baseOffset = this.tableOffsets[TtfParser.cblc_table]!;
        const imageDataBaseOffset = this.tableOffsets[TtfParser.cbdt_table]!;

        // CBLC Header: version (4), numSizes (4)
        const numSizes = this.bytes.getUint32(baseOffset + 4);
        let bitmapSizeOffset = baseOffset + 8; // Start of first BitmapSize record

        for (let bitmapSizeIndex = 0; bitmapSizeIndex < numSizes; bitmapSizeIndex++) {
            // BitmapSize Record (12 bytes) + 4 bytes padding + 12*2 bytes for hori/vert etc...
            // Dart: 16 (for startGlyphIndex...flags) + 12*2 + 8 for next record
            const indexSubTableArrayOffset = baseOffset + this.bytes.getUint32(bitmapSizeOffset);
            // const indexTablesSize = this.bytes.getUint32(bitmapSizeOffset + 4); // Not used in Dart code
            const numberOfIndexSubTables = this.bytes.getUint32(bitmapSizeOffset + 8);

            const ascender = this.bytes.getInt8(bitmapSizeOffset + 12);
            const descender = this.bytes.getInt8(bitmapSizeOffset + 13);

            // Other fields in BitmapSize Record (not used in Dart's logic for parsing bitmaps, only ascender/descender)
            // ppemX, ppemY, bitDepth, flags are at bitmapSizeOffset + 16 (for 1.0 format) or + 12 (for 2.0/2.1)
            // The Dart code explicitly used `bitmapSize + 16 + 12 * 2` which seems inconsistent with standard spec offsets.
            // Following the Dart code's logic here:
            // const startGlyphIndex = this.bytes.getUint16(bitmapSizeOffset + 16 + 12 * 2);
            // const endGlyphIndex = this.bytes.getUint16(bitmapSizeOffset + 16 + 12 * 2 + 2);
            // const ppemX = this.bytes.getUint8(bitmapSizeOffset + 16 + 12 * 2 + 4);
            // const ppemY = this.bytes.getUint8(bitmapSizeOffset + 16 + 12 * 2 + 5);
            // const bitDepth = this.bytes.getUint8(bitmapSizeOffset + 16 + 12 * 2 + 6);
            // const flags = this.bytes.getUint8(bitmapSizeOffset + 16 + 12 * 2 + 7);

            let subTableArrayStart = indexSubTableArrayOffset;
            for (let indexSubTable = 0; indexSubTable < numberOfIndexSubTables; indexSubTable++) {
                // IndexSubTableArray (8 bytes per entry)
                const firstGlyphIndex = this.bytes.getUint16(subTableArrayStart);
                const lastGlyphIndex = this.bytes.getUint16(subTableArrayStart + 2);
                const additionalOffsetToIndexSubtable = indexSubTableArrayOffset + this.bytes.getUint32(subTableArrayStart + 4);

                // IndexSubHeader (offset into this for image data location)
                const indexFormat = this.bytes.getUint16(additionalOffsetToIndexSubtable);
                const imageFormat = this.bytes.getUint16(additionalOffsetToIndexSubtable + 2);
                const imageDataOffset = imageDataBaseOffset + this.bytes.getUint32(additionalOffsetToIndexSubtable + 4);

                if (indexFormat === 1) {
                    // IndexSubTable1: simple array of offsets to SBIT data
                    // SBIT stands for small bitmap.
                    for (let glyph = firstGlyphIndex; glyph <= lastGlyphIndex; glyph++) {
                        // Offset to the SBIT (bitmap) data for this glyph
                        const sbitOffset = imageDataOffset +
                            this.bytes.getUint32(additionalOffsetToIndexSubtable +
                                (glyph - firstGlyphIndex + 2) * 4); // +2 to skip header fields

                        if (imageFormat === 17) { // Image format 17 is PNG (embedded)
                            const height = this.bytes.getUint8(sbitOffset);
                            const width = this.bytes.getUint8(sbitOffset + 1);
                            const bearingX = this.bytes.getInt8(sbitOffset + 2);
                            const bearingY = this.bytes.getInt8(sbitOffset + 3);
                            const advance = this.bytes.getUint8(sbitOffset + 4);
                            const dataLen = this.bytes.getUint32(sbitOffset + 5);

                            this.bitmapOffsets[glyph] = new TtfBitmapInfo(
                                new Uint8Array(this.bytes.buffer, this.bytes.byteOffset + sbitOffset + 9, dataLen),
                                height,
                                width,
                                bearingX,
                                bearingY,
                                advance,
                                0, // vertBearingX
                                0, // vertBearingY
                                0, // vertAdvance
                                ascender,
                                descender,
                            );
                        }
                    }
                }

                subTableArrayStart += 8; // Move to the next IndexSubTableArray entry
            }
            // Move to the next BitmapSize record
            // Dart's `bitmapSize += 16 + 12 * 2 + 8;` implies a specific structure.
            // This needs to be carefully aligned with the exact format of CBLC.
            // A typical BitmapSize record is 32 bytes for version 2.0 (metrics, ppem, etc.).
            // The Dart code's 16 + 12 * 2 + 8 (total 48) is likely including some other fixed size data after the 16 bytes base.
            bitmapSizeOffset += 48; // Assuming this offset jump is correct as per Dart's logic
        }
    }

    /**
     * Retrieves the TtfBitmapInfo for a given character code.
     * It uses the `charToGlyphIndexMap` to find the corresponding glyph.
     * @param charCode The character code to look up.
     * @returns The TtfBitmapInfo object, or undefined if no bitmap is found for the character.
     */
    public getBitmap(charCode: number): TtfBitmapInfo | undefined {
        const glyphIndex = this.charToGlyphIndexMap[charCode];
        if (glyphIndex === undefined) {
            return undefined;
        }
        return this.bitmapOffsets[glyphIndex];
    }
}