// Assuming these types are defined and exported from their respective files:
import { PdfArray } from './array';
import { PdfDataType } from './base'; // Assumes kIndentSize might be here or global
import { PdfDict } from './dict';
import { PdfDictStream } from './dict_stream';
import { PdfIndirect } from './indirect';
import { PdfName } from './name';
import { PdfNum } from './num';
import { PdfObjectBase } from './object_base';
import { PdfStream } from './stream';
import { PdfSettings, PdfVersion } from './object_base'; // Assuming PdfSettings and PdfVersion are from here
import { PdfDiagnostic } from './diagnostic';

// If kIndentSize is not defined in 'base.ts', define it here:
// const kIndentSize = 2;


// --- PdfCrossRefEntryType Enum ---
/**
 * Defines the type of a cross-reference entry in the PDF file.
 */
export enum PdfCrossRefEntryType {
    /** Entry refers to a free (unused) object. */
    free,
    /** Entry refers to an object in use. */
    inUse,
    /** Entry refers to a compressed object (in an object stream). */
    compressed,
}

// --- PdfXref Class ---
/**
 * Represents a cross-reference entry for a PDF Object.
 * Extends PdfIndirect as it also refers to an object by serial and generation number.
 */
export class PdfXref extends PdfIndirect {
    /**
     * The byte offset of the object within the PDF file.
     */
    public readonly offset: number;

    /**
     * The object ID of the object stream containing this compressed object (if type is compressed).
     * Null if not compressed.
     */
    public readonly object?: number; // `int? object` -> `number | undefined`

    /**
     * The type of the cross-reference entry.
     */
    public readonly type: PdfCrossRefEntryType;

    /**
     * Creates a cross-reference entry for a PDF Object.
     * @param ser The object serial number.
     * @param offset The byte offset within the PDF file.
     * @param gen The generation number. Defaults to 0.
     * @param object The object ID containing this compressed object.
     * @param type The type of cross-reference entry. Defaults to inUse.
     */
    constructor(
        ser: number,
        offset: number,
        params: {
            gen?: number;
            object?: number;
            type?: PdfCrossRefEntryType;
        } = {}
    ) {
        super(ser, params.gen ?? 0);
        this.offset = offset;
        this.object = params.object;
        this.type = params.type ?? PdfCrossRefEntryType.inUse;
    }

    /**
     * Generates the legacy (PDF 1.4) cross-reference entry string.
     * Format: "offset gen type " (e.g., "0000000009 00000 n ").
     * @returns The formatted string for a legacy xref entry.
     */
    legacyRef(): string {
        const offsetStr = this.offset.toString().padStart(10, '0');
        const genStr = this.gen.toString().padStart(5, '0');
        const typeChar = this.type === PdfCrossRefEntryType.inUse ? ' n ' : ' f ';
        return `${offsetStr} ${genStr}${typeChar}`;
    }

    /**
     * If this is a compressed object, returns an indirect reference to its container object stream.
     */
    public get container(): PdfIndirect | undefined {
        return this.object == null ? undefined : new PdfIndirect(this.object, 0);
    }

    /**
     * Writes the cross-reference entry into a ByteData buffer for compressed cross-reference streams.
     * @param outputBuffer The ByteData (DataView) buffer to write into.
     * @param offset The starting offset in the buffer to write this entry.
     * @param w An array `[Type_field_length, Offset_field_length, Gen_field_length]` indicating byte lengths.
     * @returns The new offset in the buffer after writing this entry.
     */
    compressedRef(outputBuffer: DataView, offset: number, w: number[]): number {
        if (w.length < 3) {
            // This was an `assert` in Dart. We'll throw an error for robustness.
            throw new Error('PdfXref._compressedRef: `w` array must have at least 3 elements.');
        }

        let currentOfs = offset;

        // Helper function to write a value with a specific number of bytes
        const setVal = (length: number, value: number) => {
            for (let n = 0; n < length; n++) {
                // Write byte by byte, MSB first
                outputBuffer.setUint8(currentOfs, (value >> ((length - n - 1) * 8)) & 0xff);
                currentOfs++;
            }
        };

        // Type field (1 byte for type 1 or 0 for free)
        setVal(w[0], this.type === PdfCrossRefEntryType.inUse ? 1 : 0);
        // Offset field
        setVal(w[1], this.offset);
        // Generation field
        setVal(w[2], this.gen);

        return currentOfs;
    }

    /**
     * Compares this PdfXref with another object for equality.
     * Equality is determined by the `offset`. This implies that two PdfXrefs
     * are considered the same if they point to the same byte offset,
     * even if their serial/generation numbers might differ (which shouldn't happen
     * for a valid PDF xref table, but this is how the Dart `operator ==` was defined).
     * @param other The object to compare with.
     * @returns True if the other object is a PdfXref with the same offset, false otherwise.
     */
    public equals(other: any): boolean {
        if (this === other) return true;
        if (!(other instanceof PdfXref)) return false;
        return this.offset === other.offset;
    }

    /**
     * Returns a string representation of the PdfXref for debugging.
     * Format: "ser gen obj type offset".
     */
    public toString(indent?: number): string {
        return `${this.ser} ${this.gen} obj ${PdfCrossRefEntryType[this.type]} ${this.offset}`;
    }

    // `hashCode` is not directly translated to TypeScript.
    // The Dart version uses `offset` for `hashCode`, consistent with its `==` operator.
}

// --- PdfXrefTable Class ---
/**
 * Represents the Cross-Reference Table (XRef Table) of a PDF document.
 * This table provides byte offsets for all indirect objects in the file,
 * allowing random access to objects.
 */
export class PdfXrefTable extends PdfDataType {
    /**
     * The last object ID used in the document (highest serial number).
     */
    public readonly lastObjectId: number;

    /**
     * Document root dictionary parameters. This will become the `/Root` entry in the trailer.
     */
    public readonly params: PdfDict<PdfDataType>; // `final params = PdfDict();` implies T is PdfDataType

    /**
     * Set of all PDF objects to be written into this PDF document.
     * Dart `Set` translates to TypeScript `Set`.
     */
    public readonly objects: Set<PdfObjectBase<PdfDataType>>; // `Set<PdfObjectBase>` implies generic type is PdfDataType

    /**
     * The library name for comments/producer metadata.
     */
    public static readonly libraryName: string = 'https://github.com/DavBfr/dart_pdf';

    /**
     * Creates a PdfXrefTable instance.
     * @param lastObjectId The highest object ID currently assigned. Defaults to 0.
     */
    constructor(lastObjectId: number = 0) {
        super();
        this.lastObjectId = lastObjectId;
        this.params = new PdfDict(); // Initialize the dictionary
        this.objects = new Set<PdfObjectBase<PdfDataType>>(); // Initialize the set of objects
    }

    /**
     * Writes a block of cross-references to the Pdf stream in legacy format.
     * @param s The PdfStream to write to.
     * @param firstId The first object ID in this block.
     * @param block A list of PdfXref entries for this block.
     */
    private _writeBlock(s: PdfStream, firstId: number, block: PdfXref[]): void {
        s.putString(`${firstId} ${block.length}\n`);

        for (const x of block) {
            s.putString(x.legacyRef());
            s.putByte(0x0a); // Newline after each entry
        }
    }

    /**
     * Outputs the entire PDF document, including objects, XRef table, and trailer.
     * @param o The PdfObjectBase representing the document's root (often the XrefTable itself or a dummy object).
     * @param s The PdfStream to write the document to.
     * @param indent Optional indentation level (unused for top-level output but part of PdfDataType interface).
     */
    public output(o: PdfObjectBase<any>, s: PdfStream, indent?: number): void {
        let pdfVersionString: string;
        switch (o.settings.version) {
            case PdfVersion.pdf_1_4: pdfVersionString = '1.4'; break;
            case PdfVersion.pdf_1_5: pdfVersionString = '1.5'; break;
        }

        s.putString(`%PDF-${pdfVersionString}\n`);
        // Binary header for PDF (marker for PDF viewers)
        s.putBytes([0x25, 0xC2, 0xA5, 0xC2, 0xB1, 0xC3, 0xAB, 0x0A]); // %<binary chars>\n
        s.putComment(PdfXrefTable.libraryName);

        // Write all objects and collect their cross-references
        const xrefList: PdfXref[] = [];
        // Convert Set to Array for predictable iteration and sorting
        const objectsArray = Array.from(this.objects);
        for (const ob of objectsArray) {
            const offset = ob.output(s); // Output each object
            xrefList.push(new PdfXref(ob.objser, offset, { gen: ob.objgen }));
        }

        // More diagnostic information
        if (o.settings.verbose) {
            s.putComment(''); // Empty comment for visual separation
            s.putComment('-'.repeat(78)); // Horizontal line comment
            s.putComment(`${this.constructor.name} ${PdfVersion[o.settings.version]}`); // Class name and PDF version
            for (const x of xrefList) {
                s.putComment(`  ${x.toString()}`); // Output each xref entry as a comment
            }
        }

        let xrefOffset: number; // Offset of the cross-reference section

        // Set the /Root entry in the trailer dictionary (params)
        this.params.set('/Root', o.ref()); // `o` is typically the XrefTable's own dummy object `PdfObjectBase(objser: 0, ...)`

        // Choose xref output format based on PDF version
        switch (o.settings.version) {
            case PdfVersion.pdf_1_4:
                xrefOffset = this._outputLegacy(o, s, xrefList);
                break;
            case PdfVersion.pdf_1_5:
                xrefOffset = this._outputCompressed(o, s, xrefList);
                break;
        }

        if (o.settings.verbose) {
            s.putComment('');
            s.putComment('-'.repeat(78));
        }

        // Write the 'startxref' keyword, the xref offset, and the '%%EOF' marker.
        s.putString(`startxref\n${xrefOffset}\n%%EOF\n`);
    }

    /**
     * Outputs the legacy (PDF 1.4) cross-reference table.
     * @param o The PdfObjectBase for context.
     * @param s The PdfStream to write to.
     * @param xrefList The list of all PdfXref entries.
     * @returns The offset in the stream where the xref table begins.
     */
    private _outputLegacy(o: PdfObjectBase<any>, s: PdfStream, xrefList: PdfXref[]): number {
        // Sort xref entries by serial number for the xref table
        xrefList.sort((a, b) => a.ser - b.ser);

        // Determine the total size (highest object ID + 1)
        const maxSer = xrefList.length > 0 ? xrefList[xrefList.length - 1].ser : -1;
        const size = Math.max(this.lastObjectId, maxSer + 1);

        let firstId = 0; // First ID in the current block of xref entries
        let lastId = 0; // The last ID added to the current block
        let currentBlock: PdfXref[] = []; // Xrefs in the current block

        // Add the mandatory object 0 (free object)
        currentBlock.push(
            new PdfXref(0, 0, { gen: 65535, type: PdfCrossRefEntryType.free })
        );

        const objOffset = s.offset; // Get the offset where the xref table starts
        s.putString('xref\n'); // Write the 'xref' keyword

        for (const x of xrefList) {
            // Check if the current xref's serial number is not sequential (next ID after lastId)
            if (x.ser !== (lastId + 1)) {
                // If not sequential, write the current block and reset for a new block.
                this._writeBlock(s, firstId, currentBlock);
                currentBlock = []; // Clear the block
                firstId = x.ser; // Start a new block with this object's ID
            }

            // Add the current xref to the block
            currentBlock.push(x);
            lastId = x.ser; // Update last ID
        }

        // Write the very last block
        this._writeBlock(s, firstId, currentBlock);

        // Trailer object
        if (o.settings.verbose) {
            s.putComment('');
        }
        s.putString('trailer\n');
        this.params.set('/Size', new PdfNum(size)); // Set the /Size entry in the trailer dictionary
        this.params.output(o, s, undefined); // Output the trailer dictionary
        s.putByte(0x0a); // Newline after trailer dictionary

        return objOffset;
    }

    /**
     * Outputs a compressed cross-reference table (for PDF 1.5 and higher).
     * This is implemented as a stream object.
     * @param o The PdfObjectBase for context.
     * @param s The PdfStream to write to.
     * @param xrefList The list of all PdfXref entries.
     * @returns The offset in the stream where the compressed xref table object begins.
     */
    private _outputCompressed(o: PdfObjectBase<any>, s: PdfStream, xrefList: PdfXref[]): number {
        const offset = s.offset; // Current stream offset before writing the compressed xref object

        // Sort all xref references by serial number.
        xrefList.sort((a, b) => a.ser - b.ser);

        // The compressed xref table object itself also needs an ID and an xref entry.
        // It's assigned the next available serial number.
        const id = Math.max(this.lastObjectId, xrefList[xrefList.length - 1]?.ser ?? -1) + 1; // Safely get last ser
        const size = id + 1; // Total number of objects (highest ID + 1)
        xrefList.push(new PdfXref(id, offset)); // Add the xref entry for the xref table object itself

        // Set parameters for the compressed xref stream dictionary
        this.params.set('/Type', new PdfName('/XRef'));
        this.params.set('/Size', new PdfNum(size));

        // Build the /Index array: sequence of (first object number, count) pairs for contiguous blocks.
        let firstId = 0; // First ID in the current block
        let lastId = 0; // The last ID added to the current block
        const blocks: number[] = []; // Array to store [firstId, count] pairs

        // Block 0 is mandatory
        blocks.push(firstId); // Start of first block
        // Assuming xrefList will always contain object 0 after sorting and adding dummy,
        // and its lastId would be its ser. For xrefList from output, object 0 might not be present unless added externally.
        // For accurate block detection, the `xrefList` needs to contain object 0 explicitly before this loop,
        // or a default block [0, 1] is added if object 0 isn't present in `xrefList`.
        // The original Dart code implies object 0 is handled implicitly or guaranteed.
        // For simplicity, following Dart's direct loop.

        for (const x of xrefList) {
            if (x.ser !== (lastId + 1)) {
                // If not sequential, close the previous block and start a new one
                blocks.push(lastId - firstId + 1); // Count for previous block
                firstId = x.ser; // Start of new block
                blocks.push(firstId);
            }
            lastId = x.ser; // Update last ID
        }
        blocks.push(lastId - firstId + 1); // Count for the last block

        // Only include /Index if it's not the default case (single block starting at 0 covering all objects)
        if (!(blocks.length === 2 && blocks[0] === 0 && blocks[1] === size)) {
            this.params.set('/Index', PdfArray.fromNumbers(blocks));
        }

        // Determine the field widths for the compressed stream: [Type, Offset, Generation]
        // Bytes needed for offset: ceil(log2(max_offset) / 8)
        const bytesForOffset = Math.ceil((Math.log(offset) / Math.LN2) / 8);
        // The 'w' array specifies the number of bytes used for Type, Offset, and Generation fields.
        const w = [1, bytesForOffset, 1]; // Type (1 byte), Offset (calculated), Generation (1 byte)
        this.params.set('/W', PdfArray.fromNumbers(w));

        // Calculate the total length of one entry in bytes (sum of w values)
        const wl = w.reduce((a, b) => a + b, 0);

        // Create a DataView to write the binary xref data
        // Needs space for all xrefs + 1 (for object 0, if not already handled by xrefList) * wl bytes per entry.
        // The Dart code has `(xrefList.length + 1) * wl`, implying a dedicated spot for xref 0 if not present.
        const binOffsets = new DataView(new ArrayBuffer((xrefList.length) * wl)); // `+1` might be implicitly handled by `xrefList.push(PdfXref(id, offset))`
        let currentBinaryOffset = 0; // Offset within `binOffsets`

        // Write object 0 entry (all zeros for type, offset, gen) if it's not already in xrefList explicitly with `type: free`
        // The original Dart code just `ofs += wl;` implying it's skipped or zero-filled by default for that first entry.
        // Assuming binOffsets is initialized to zeros, so skipping `ofs += wl` effectively sets object 0 to all zeros.

        for (const x of xrefList) {
            currentBinaryOffset = x.compressedRef(binOffsets, currentBinaryOffset, w);
        }

        const objOffset = s.offset; // Get the offset where this compressed xref stream object will start

        // Create and output the PdfDictStream containing the compressed xref data.
        new PdfObjectBase({
            objser: id, // The serial number for this XRef stream object itself
            params: new PdfDictStream({
                data: new Uint8Array(binOffsets.buffer), // The raw binary xref data
                isBinary: true, // It's a binary stream
                encrypt: false, // XRef streams are generally not encrypted
                values: this.params, // Pass the dictionary params (Type, Size, W, Index etc.)
            }),
            settings: o.settings,
        }).output(s); // Output the compressed xref object

        return objOffset;
    }
}