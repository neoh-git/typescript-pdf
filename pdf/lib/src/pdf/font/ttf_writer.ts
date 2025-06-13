// Assuming these types are defined and exported from their respective files:
// import { Uint8Array, DataView } from 'typed_data'; // Uint8Array, DataView are global types
import { TtfGlyphInfo, TtfParser } from './ttf_parser'; // Assumes TtfParser is defined as translated before

/**
 * A utility class to build byte arrays by appending chunks.
 * Mimics Dart's `BytesBuilder`.
 */
class BytesBuilder {
    private _chunks: Uint8Array[] = [];
    private _length: number = 0;

    /**
     * Adds a Uint8Array chunk to the builder.
     * @param chunk The Uint8Array to add.
     */
    public add(chunk: Uint8Array): void {
        this._chunks.push(chunk);
        this._length += chunk.byteLength;
    }

    /**
     * Returns a single Uint8Array containing all concatenated chunks.
     * This method copies data into a new buffer.
     * @returns A new Uint8Array.
     */
    public toBytes(): Uint8Array {
        const result = new Uint8Array(this._length);
        let offset = 0;
        for (const chunk of this._chunks) {
            result.set(chunk, offset);
            offset += chunk.byteLength;
        }
        return result;
    }

    /**
     * Resets the builder, clearing all chunks and length.
     */
    public clear(): void {
        this._chunks = [];
        this._length = 0;
    }

    /**
     * Gets the total length of the bytes currently in the builder.
     */
    public get length(): number {
        return this._length;
    }
}


/**
 * Generates a TrueType Font (TTF) subset, containing only the necessary glyphs
 * to embed into a PDF document, minimizing file size.
 *
 * @remarks Based on OpenType specification and font subsetting principles.
 * @see https://opentype.js.org/
 * @see https://github.com/HinTak/Font-Validator
 */
export class TtfWriter {
    /**
     * The original TrueType font parser.
     */
    public readonly ttf: TtfParser;

    /**
     * Creates a TrueType Writer object.
     * @param ttf An initialized TtfParser instance.
     */
    constructor(ttf: TtfParser) {
        this.ttf = ttf;
    }

    /**
     * Calculates the checksum for a given font table.
     * @param table The DataView representing the table's bytes.
     * @returns The 32-bit checksum.
     */
    private _calcTableChecksum(table: DataView): number {
        // Assert: table length must be a multiple of 4 bytes
        if (table.byteLength % 4 !== 0) {
            throw new Error(`Table checksum calculation: Table length ${table.byteLength} is not a multiple of 4.`);
        }

        let sum = 0;
        // Iterate through the table 4 bytes at a time (Uint32)
        // Ensure not to go out of bounds: `i < table.byteLength - 3`
        for (let i = 0; i < table.byteLength; i += 4) {
            // Get Uint32 and add to sum. Use `>>> 0` to ensure unsigned 32-bit arithmetic.
            sum = (sum + table.getUint32(i, false)) >>> 0; // false for big-endian, which TTF is
        }
        return sum;
    }

    /**
     * Updates the glyph indices within a compound glyph's data.
     * @param glyph The TtfGlyphInfo of the compound glyph to update.
     * @param compoundMap A map from original glyph index to new, remapped glyph index.
     */
    private _updateCompoundGlyph(glyph: TtfGlyphInfo, compoundMap: Map<number, number>): void {
        const arg1And2AreWords = 1;
        const moreComponents = 32; // Corresponds to 0x0020

        // Create a DataView over the glyph's byte data to modify it in place
        // Dart's `asByteData` refers to a view.
        const bytes = new DataView(glyph.data.buffer, glyph.data.byteOffset, glyph.data.byteLength);

        let offset = 10; // Start offset after bounding box in glyph header
        let flags: number;

        // Loop as long as the 'moreComponents' flag is set (implicit on first entry into loop)
        // Dart's loop `while (flags & moreComponents != 0)` assumes `flags` is initialized to non-zero.
        // We'll use a do-while loop to enter at least once.
        do {
            flags = bytes.getUint16(offset, false); // Read flags for the current component
            const glyphIndex = bytes.getUint16(offset + 2, false); // Read component's glyph index

            // Get the new remapped glyph index from the map.
            // Dart's `compoundMap[glyphIndex]!` implies it must exist.
            const newGlyphIndex = compoundMap.get(glyphIndex);
            if (newGlyphIndex === undefined) {
                console.warn(`Compound glyph ${glyph.index} refers to unmapped component ${glyphIndex}`);
                // Depending on requirements, could throw or skip. For now, use 0 (undefined glyph).
                bytes.setUint16(offset + 2, 0, false);
            } else {
                bytes.setUint16(offset + 2, newGlyphIndex, false); // Write the remapped glyph index
            }

            // Advance offset based on component arguments and transforms
            // arg1And2AreWords determines if args are 2 bytes (short) or 4 bytes (word)
            offset += (flags & arg1And2AreWords) !== 0 ? 8 : 6; // +2 for glyphIndex, then +4 or +2 for args, then potentially more for transforms
            // The Dart code's offset calculation seems simplified.
            // The standard offsets from TTF spec for compound glyphs are complex.
            // Assuming `TtfParser`'s `_readCompoundGlyph` determined the correct `offset` for `glyph.data`.
            // This _updateCompoundGlyph modifies that existing data.
        } while ((flags & moreComponents) !== 0); // Loop condition
    }

    /**
     * Aligns an offset to the nearest multiple of `align`.
     * @param offset The current byte offset.
     * @param align The alignment boundary (e.g., 4 for word alignment).
     * @returns The aligned offset.
     */
    private _wordAlign(offset: number, align: number = 4): number {
        return offset + ((align - (offset % align)) % align);
    }

    /**
     * Generates a subset of the TTF font containing only the specified characters.
     * @param chars A list of Unicode character codes to include in the font subset.
     * @returns A Uint8Array containing the subsetted TTF font file.
     */
    public withChars(chars: number[]): Uint8Array {
        const tables: { [key: string]: Uint8Array } = {};
        const tablesLength: { [key: string]: number } = {};

        // --- Step 1: Collect all required glyphs ---
        // This includes direct glyphs for chars and all their compound components.
        const glyphsMap = new Map<number, TtfGlyphInfo>(); // Maps glyphIndex to TtfGlyphInfo (for collected glyphs)
        const charMap = new Map<number, number>(); // Maps charCode to its original glyphIndex
        const overflow = new Set<number>(); // To track compound components that need processing
        const compoundsRemap = new Map<number, number>(); // Original compound glyph index -> new remapped index

        for (const char of chars) {
            // Special handling for space character (glyph 0 usually, but can be a real glyph)
            if (char === 32) {
                const spaceGlyphIndex = this.ttf.charToGlyphIndexMap[char] ?? 0; // Get space glyph index
                // Assuming space glyph has no data or compounds for subsetting purposes in this logic
                const spaceGlyph = new TtfGlyphInfo(spaceGlyphIndex, new Uint8Array(0), []);
                glyphsMap.set(spaceGlyph.index, spaceGlyph);
                charMap.set(char, spaceGlyph.index);
                continue;
            }

            const glyphIndex = this.ttf.charToGlyphIndexMap[char];
            if (glyphIndex === undefined || glyphIndex === 0) { // Glyph 0 is often .notdef
                console.warn(`Character ${char} (0x${char.toString(16)}) not found in font cmap.`);
                continue;
            }
            if (glyphIndex >= this.ttf.glyphOffsets.length) {
                console.warn(`Glyph index ${glyphIndex} for char ${char} not in the font glyph offsets.`);
                continue;
            }

            // Recursive function to add glyph and its compounds
            const addGlyph = (gIndex: number) => {
                // If glyph already processed or not a valid index, return
                if (glyphsMap.has(gIndex) || gIndex >= this.ttf.glyphOffsets.length) {
                    return;
                }
                const glyph = this.ttf.readGlyph(gIndex).copy(); // Read glyph data and copy it
                glyphsMap.set(glyph.index, glyph); // Add to map of collected glyphs

                for (const compoundGIndex of glyph.compounds) {
                    compoundsRemap.set(compoundGIndex, -1); // Mark as a compound component to remap later
                    overflow.add(compoundGIndex); // Add to overflow to ensure it's processed
                    addGlyph(compoundGIndex); // Recursively add components
                }
            };

            charMap.set(char, glyphIndex); // Map char code to its glyph index
            addGlyph(glyphIndex); // Start adding glyphs from the current character
        }

        // Prepare glyphs for remapping by ordering them
        const newGlyphsList: TtfGlyphInfo[] = [];

        // Add glyphs that correspond directly to characters first, maintaining a sort of order
        for (const char of chars) {
            const originalGlyphIndex = charMap.get(char);
            if (originalGlyphIndex !== undefined) {
                const glyphInfo = glyphsMap.get(originalGlyphIndex);
                if (glyphInfo) {
                    newGlyphsList.push(glyphInfo);
                    glyphsMap.delete(originalGlyphIndex); // Remove once added
                }
            }
        }
        // Add any remaining collected glyphs (e.g., compound components that weren't direct char mappings)
        newGlyphsList.push(...Array.from(glyphsMap.values()));


        // Sort the `newGlyphsList` by their original index for predictable behavior,
        // as the original `ttf.glyphOffsets` is sorted. This ensures compound remapping works
        // correctly based on their original relative indices.
        newGlyphsList.sort((a, b) => a.index - b.index);

        // Remap compound glyph indices: original index -> new index (its position in newGlyphsList)
        for (let i = 0; i < newGlyphsList.length; i++) {
            const glyph = newGlyphsList[i];
            if (compoundsRemap.has(glyph.index)) {
                compoundsRemap.set(glyph.index, i); // Map original glyph index to its new sequential index
            }
        }

        // Update compound glyphs' internal references to point to their new indices
        for (const glyph of newGlyphsList) {
            if (glyph.compounds.length > 0) {
                // `_updateCompoundGlyph` modifies `glyph.data` in place
                this._updateCompoundGlyph(glyph, compoundsRemap);
            }
        }

        // --- Step 2: Build 'glyf' and 'loca' tables for the subsetted glyphs ---
        let glyphsTableLength = 0;
        for (const glyph of newGlyphsList) {
            glyphsTableLength = this._wordAlign(glyphsTableLength + glyph.data.byteLength);
        }
        // Ensure glyphsTableLength is word-aligned itself
        const finalGlyphsTableLength = this._wordAlign(glyphsTableLength);
        const glyphsTable = new Uint8Array(finalGlyphsTableLength);
        tables[TtfParser.glyf_table] = glyphsTable;
        tablesLength[TtfParser.glyf_table] = finalGlyphsTableLength;


        const locaLength = (newGlyphsList.length + 1) * (this.ttf.indexToLocFormat === 0 ? 2 : 4);
        const locaTable = new Uint8Array(this._wordAlign(locaLength));
        const locaDataView = new DataView(locaTable.buffer);
        tables[TtfParser.loca_table] = locaTable;
        tablesLength[TtfParser.loca_table] = locaLength;

        let currentGlyphOffsetInTable = 0;
        for (let i = 0; i < newGlyphsList.length; i++) {
            const glyph = newGlyphsList[i];

            // Set offset in 'loca' table
            if (this.ttf.indexToLocFormat === 0) { // Short offsets (divided by 2)
                locaDataView.setUint16(i * 2, Math.trunc(currentGlyphOffsetInTable / 2), false);
            } else { // Long offsets
                locaDataView.setUint32(i * 4, currentGlyphOffsetInTable, false);
            }

            // Copy glyph data into 'glyf' table
            glyphsTable.set(glyph.data, currentGlyphOffsetInTable);
            currentGlyphOffsetInTable = this._wordAlign(currentGlyphOffsetInTable + glyph.data.byteLength);
        }
        // Set the last entry in 'loca' table (end of last glyph)
        if (this.ttf.indexToLocFormat === 0) {
            locaDataView.setUint16(newGlyphsList.length * 2, Math.trunc(currentGlyphOffsetInTable / 2), false);
        } else {
            locaDataView.setUint32(newGlyphsList.length * 4, currentGlyphOffsetInTable, false);
        }

        // --- Step 3: Copy/Modify other necessary tables ---

        const tablesToCopy = new Set([
            TtfParser.head_table,
            TtfParser.maxp_table,
            TtfParser.hhea_table,
            TtfParser.os_2_table, // Optional but good practice
            TtfParser.post_table,
            TtfParser.name_table,
        ]);

        for (const tn of tablesToCopy) {
            const start = this.ttf.tableOffsets[tn];
            if (start === undefined) {
                // If a table is optional (e.g., OS/2) and not present, skip
                // For required tables, this should have been caught by constructor assertions.
                continue;
            }
            const len = this.ttf.tableSize[tn]!;
            // Copy table data, ensuring it's word-aligned
            const originalTableBytes = new Uint8Array(this.ttf.bytes.buffer, this.ttf.bytes.byteOffset + start, len);
            const paddedLength = this._wordAlign(len);
            const data = new Uint8Array(paddedLength);
            data.set(originalTableBytes); // Copy original data
            tables[tn] = data;
            tablesLength[tn] = len; // Store original logical length
        }


        // Modify 'head' table:
        // checksumAdjustment at offset 8 needs to be 0 for initial checksum calculation
        const headTable = new DataView(tables[TtfParser.head_table]!.buffer);
        headTable.setUint32(8, 0, false); // checkSumAdjustment = 0

        // Modify 'maxp' table:
        // numGlyphs at offset 4 needs to reflect the new number of glyphs
        const maxpTable = new DataView(tables[TtfParser.maxp_table]!.buffer);
        maxpTable.setUint16(4, newGlyphsList.length, false); // numGlyphs = count of subsetted glyphs

        // Modify 'hhea' table:
        // numOfLongHorMetrics at offset 34 (numHMetrics) needs to be the new number of glyphs
        const hheaTable = new DataView(tables[TtfParser.hhea_table]!.buffer);
        hheaTable.setUint16(34, newGlyphsList.length, false); // numOfLongHorMetrics = count of subsetted glyphs


        // Modify 'post' table to version 3.0 (no glyph names), as it's typically stripped
        const postTable = new DataView(tables[TtfParser.post_table]!.buffer);
        postTable.setUint32(0, 0x00030000, false); // version 3.0


        // Build 'hmtx' table (Horizontal Metrics) for the subsetted glyphs
        const hmtxLength = 4 * newGlyphsList.length; // Each entry is 4 bytes (advanceWidth, leftSideBearing)
        const hmtxPaddedLength = this._wordAlign(hmtxLength);
        const hmtxTable = new Uint8Array(hmtxPaddedLength);
        const hmtxDataView = new DataView(hmtxTable.buffer);
        tables[TtfParser.hmtx_table] = hmtxTable;
        tablesLength[TtfParser.hmtx_table] = hmtxLength;

        const originalHmtxOffset = this.ttf.tableOffsets[TtfParser.hmtx_table]!;
        const originalNumOfLongHorMetrics = this.ttf.numOfLongHorMetrics;
        const originalDefaultAdvanceWidth = this.ttf.bytes.getUint16(originalHmtxOffset + (originalNumOfLongHorMetrics - 1) * 4, false);

        for (let i = 0; i < newGlyphsList.length; i++) {
            const glyph = newGlyphsList[i];
            let advanceWidth: number;
            let leftBearing: number;

            // Retrieve original metrics based on the glyph's original index
            if (glyph.index < originalNumOfLongHorMetrics) {
                advanceWidth = this.ttf.bytes.getUint16(originalHmtxOffset + glyph.index * 4, false);
                leftBearing = this.ttf.bytes.getInt16(originalHmtxOffset + glyph.index * 4 + 2, false);
            } else {
                advanceWidth = originalDefaultAdvanceWidth;
                leftBearing = this.ttf.bytes.getInt16(
                    originalHmtxOffset + originalNumOfLongHorMetrics * 4 + (glyph.index - originalNumOfLongHorMetrics) * 2, false
                );
            }
            hmtxDataView.setUint16(i * 4, advanceWidth, false);
            hmtxDataView.setInt16(i * 4 + 2, leftBearing, false);
        }

        // Build 'cmap' table for basic mapping (format 4 or 12 are common)
        // This is a minimal 'cmap' for character-to-glyph mapping (Platform 3, Encoding 10/Unicode full range)
        const cmapLength = 40; // Minimal cmap table size for Format 12 with one group
        const cmapPaddedLength = this._wordAlign(cmapLength);
        const cmapTable = new Uint8Array(cmapPaddedLength);
        const cmapDataView = new DataView(cmapTable.buffer);
        tables[TtfParser.cmap_table] = cmapTable;
        tablesLength[TtfParser.cmap_table] = cmapLength;

        // Cmap Header
        cmapDataView.setUint16(0, 0, false); // Table version number (0)
        cmapDataView.setUint16(2, 1, false); // Number of encoding tables (1)
        // Encoding Record 1 (Platform ID 3, Encoding ID 10)
        cmapDataView.setUint16(4, 3, false); // Platform ID (Microsoft)
        cmapDataView.setUint16(6, 10, false); // Platform-specific encoding ID (Unicode BMP & Supplementary Planes)
        cmapDataView.setUint32(8, 12, false); // Offset to subtable from beginning of cmap (12 bytes for header+record)

        // Cmap Subtable Format 12 (group table for Unicode)
        cmapDataView.setUint16(12, 12, false); // Format (12)
        cmapDataView.setUint16(14, 0, false); // Reserved
        cmapDataView.setUint32(16, 28, false); // Table length (12 for format header + 16 for group data)
        cmapDataView.setUint32(20, 1, false); // Table language (0 for default, 1 for language-specific)
        cmapDataView.setUint32(24, 1, false); // numGroups (1 group for continuous range)

        // Group 1: Maps characters from 0x20 (space) to max char in `chars` list
        // This is a simplification; a full subsetter would map only the *actual* chars.
        // It maps space (0x20) to its glyph index and then subsequent characters sequentially.
        const minCharCode = 0x20; // Start with space
        const maxCharCode = Math.max(...chars, minCharCode); // Find highest char requested
        const maxGlyphId = newGlyphsList.length - 1; // Highest new glyph ID (index based)

        cmapDataView.setUint32(28, minCharCode, false); // startCharCode (first character to map)
        cmapDataView.setUint32(32, maxCharCode, false); // endCharCode (last character to map)
        // startGlyphID should be the index of glyph corresponding to `minCharCode`.
        // A direct sequential map is hard without knowing original glyph order.
        // The Dart code sets it to 0, implying newGlyphsList[0] is `minCharCode`'s glyph.
        // This is *highly* specific to `charMap[char] = glyphIndex; addGlyph(glyphIndex);` and `glyphsInfo` sorting logic.
        // To be safe, find the actual remapped index of the minCharCode.
        const minCharOriginalGlyphIndex = charMap.get(minCharCode);
        const startGlyphRemappedIndex = minCharOriginalGlyphIndex !== undefined
            ? newGlyphsList.findIndex(g => g.index === minCharOriginalGlyphIndex)
            : 0; // Default to 0 if minChar is not found or mapped

        cmapDataView.setUint32(36, startGlyphRemappedIndex, false); // startGlyphID (first glyph index in the range)


        // Name table: simplified to version 0 with 0 names
        const nameLength = 18; // Minimal name table size
        const namePaddedLength = this._wordAlign(nameLength);
        const nameTable = new Uint8Array(namePaddedLength);
        const nameDataView = new DataView(nameTable.buffer);
        tables[TtfParser.name_table] = nameTable;
        tablesLength[TtfParser.name_table] = nameLength;

        nameDataView.setUint16(0, 0, false); // Format selector (0)
        nameDataView.setUint16(2, 0, false); // Number of Name Records (0)
        nameDataView.setUint16(4, 6, false); // Offset to String Storage (6 bytes after format, count, offset fields)


        // --- Step 4: Assemble the new font file ---
        const bytesBuilder = new BytesBuilder();

        const numTables = Object.keys(tables).length;

        // Calculate `selector` and `rangeShift` for SFNT header (based on `numTables`)
        // `searchRange = (2^floor(log2(numTables))) * 16`
        // `entrySelector = floor(log2(numTables))`
        // `rangeShift = numTables * 16 - searchRange`
        let powerOf2 = 1;
        while (powerOf2 * 2 <= numTables) {
            powerOf2 *= 2;
        }
        const searchRange = powerOf2 * 16;
        const entrySelector = Math.log2(powerOf2);
        const rangeShift = numTables * 16 - searchRange;

        // SFNT Header (Offset Subtable) - 12 bytes
        const sfntHeader = new DataView(new ArrayBuffer(12 + numTables * 16)); // Space for header + directory
        sfntHeader.setUint32(0, 0x00010000, false); // sfntVersion (0x00010000 for TrueType)
        sfntHeader.setUint16(4, numTables, false); // numTables
        sfntHeader.setUint16(6, searchRange, false); // searchRange
        sfntHeader.setUint16(8, entrySelector, false); // entrySelector
        sfntHeader.setUint16(10, rangeShift, false); // rangeShift

        // Table Directory entries - 16 bytes per table
        let currentOffsetInFile = 12 + numTables * 16; // Start of first table data in the file
        let headTableOffsetInFile = 0; // To store the final offset of the 'head' table for checksum adjustment

        // Order of tables matters for some PDF viewers / tools (alphabetical is common)
        const sortedTableNames = Object.keys(tables).sort();

        let tableIndex = 0;
        for (const name of sortedTableNames) {
            const data = tables[name]!;
            const tableDataLength = tablesLength[name]!; // Logical length

            // Write tag (4 bytes)
            for (let i = 0; i < 4; i++) {
                sfntHeader.setUint8(12 + tableIndex * 16 + i, name.charCodeAt(i));
            }

            // Write checksum (4 bytes) - calculated over logical length
            sfntHeader.setUint32(12 + tableIndex * 16 + 4, this._calcTableChecksum(new DataView(data.buffer, data.byteOffset, tableDataLength)), false);
            sfntHeader.setUint32(12 + tableIndex * 16 + 8, currentOffsetInFile, false); // offset
            sfntHeader.setUint32(12 + tableIndex * 16 + 12, tableDataLength, false); // length

            if (name === TtfParser.head_table) {
                headTableOffsetInFile = currentOffsetInFile;
            }
            currentOffsetInFile += data.byteLength; // Advance by padded length for file offset
            tableIndex++;
        }
        bytesBuilder.add(new Uint8Array(sfntHeader.buffer)); // Add SFNT header + directory

        // Add actual table data to the BytesBuilder in the same order as directory
        for (const name of sortedTableNames) {
            const data = tables[name]!;
            bytesBuilder.add(data);
        }

        const outputBytes = bytesBuilder.toBytes(); // Get final concatenated byte array

        // --- Step 5: Calculate and set the final checksumAdjustment in 'head' table ---
        // TTF checksum for entire file: sum of all Uint32s, then subtract from 0xB1B0AFBA
        // The checkSumAdjustment field in 'head' table compensates for this.
        const fileChecksum = this._calcTableChecksum(new DataView(outputBytes.buffer));
        const checksumAdjustment = (0xB1B0AFBA - fileChecksum) >>> 0; // >>> 0 ensures unsigned 32-bit

        // Set the calculated checksumAdjustment in the 'head' table in the final output bytes
        const headTableDataView = new DataView(outputBytes.buffer, headTableOffsetInFile);
        headTableDataView.setUint32(8, checksumAdjustment, false); // Set at offset 8 within the head table data itself

        return outputBytes;
    }
}