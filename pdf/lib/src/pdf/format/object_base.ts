// Assuming these types are defined and exported from their respective files:
// import { Uint8Array } from 'typed_data'; // Uint8Array is a global type in TS environments
import { PdfDataType } from './base';
import { PdfDiagnostic } from './diagnostic';
import { PdfIndirect } from './indirect';
import { PdfStream } from './stream';

// --- Type Definitions for Callbacks (from typedefs) ---

/**
 * Callback used to compress the data.
 * Corresponds to Dart's `typedef DeflateCallback = List<int> Function(List<int> data);`
 */
export type DeflateCallback = (data: Uint8Array) => Uint8Array;

/**
 * Callback used to encrypt the value of a PdfDictStream or a PdfEncStream.
 * Corresponds to Dart's `typedef PdfEncryptCallback = Uint8List Function(Uint8List input, PdfObjectBase object);`
 */
export type PdfEncryptCallback = (
    input: Uint8Array,
    object: PdfObjectBase<PdfDataType>
) => Uint8Array;

// --- Enum for PDF Version ---

/**
 * PDF version to generate.
 * Corresponds to Dart's `enum PdfVersion`.
 */
export enum PdfVersion {
    /** PDF 1.4 */
    pdf_1_4,
    /** PDF 1.5 to 1.7 */
    pdf_1_5,
}

// --- PdfSettings Class ---

/**
 * Configuration settings for PDF generation.
 */
export class PdfSettings {
    /**
     * Callback to compress the streams in the PDF file.
     * Use `deflate: zlib.encode` if using a zlib library.
     * No compression by default.
     */
    public readonly deflate?: DeflateCallback;

    /**
     * Callback used to encrypt the value of a [PdfDictStream] or a [PdfEncStream].
     */
    public readonly encryptCallback?: PdfEncryptCallback;

    /**
     * If true, output a PDF document with comments and formatted data (verbose mode).
     */
    public readonly verbose: boolean;

    /**
     * The PDF version to generate.
     */
    public readonly version: PdfVersion;

    /**
     * Creates a PdfSettings instance.
     * @param params.deflate Optional callback for stream compression.
     * @param params.encryptCallback Optional callback for stream encryption.
     * @param params.verbose If true, enables verbose output for debugging. Defaults to false.
     * @param params.version The PDF version to output. Defaults to PdfVersion.pdf_1_5.
     */
    constructor(params: {
        deflate?: DeflateCallback;
        encryptCallback?: PdfEncryptCallback;
        verbose?: boolean;
        version?: PdfVersion;
    } = {}) {
        this.deflate = params.deflate;
        this.encryptCallback = params.encryptCallback;
        this.verbose = params.verbose ?? false;
        this.version = params.version ?? PdfVersion.pdf_1_5;
    }

    /**
     * Indicates whether stream compression is enabled (based on the presence of a `deflate` callback).
     */
    public get compress(): boolean {
        return this.deflate != null;
    }
}



// --- PdfObjectBase Class ---

/**
 * Base class for all PDF objects that can be written to a PDF file.
 * Each object has a unique serial number and a generation number.
 */
export class PdfObjectBase<T extends PdfDataType> extends PdfDiagnostic {
    /**
     * The unique serial number for this object.
     */
    public readonly objser: number;

    /**
     * The generation number for this object.
     */
    public readonly objgen: number;

    /**
     * The parameters or data content of this PDF object.
     */
    public readonly params: T;

    /**
     * The PDF generation settings associated with this object.
     */
    public readonly settings: PdfSettings;

    /**
     * Creates a PdfObjectBase instance.
     * @param params.objser The unique serial number for this object.
     * @param params.params The parameters or data content of this PDF object.
     * @param params.settings The PDF generation settings.
     * @param params.objgen The generation number for this object. Defaults to 0.
     */
    constructor(params: {
        objser: number;
        params: T;
        settings: PdfSettings;
        objgen?: number;
    }) {
        super(); // Call the base class constructor for diagnostics
        this.objser = params.objser;
        this.objgen = params.objgen ?? 0;
        this.params = params.params;
        this.settings = params.settings;
    }

    /**
     * Returns an indirect reference object (`PdfIndirect`) for this PDF object.
     * @returns A PdfIndirect instance referring to this object.
     */
    public ref(): PdfIndirect {
        return new PdfIndirect(this.objser, this.objgen);
    }

    /**
     * Outputs the PDF object's full representation (object header, content, and trailer) to a stream.
     * Includes diagnostic information if verbose mode is enabled in settings.
     * @param s The PdfStream to write to.
     * @returns The offset in the stream where this object starts.
     */
    public output(s: PdfStream): number {
        // Dart's `assert` blocks are executed only in debug mode.
        // In TypeScript, we can use an if condition based on `settings.verbose`
        // or a build-time flag. For direct translation, we use `if (this.settings.verbose)`.
        if (this.settings.verbose) {
            // Assume these diagnostic functions are available globally or imported.
            this.setInsertion(s, 160); // What `160` refers to might need context.
            this.startStopwatch();
        }

        const offset = s.offset; // Get current stream offset
        s.putString(`${this.objser} ${this.objgen} obj\n`); // Write object header
        this.writeContent(s); // Write object's content (dictionary, stream data, etc.)
        s.putString('endobj\n'); // Write object trailer

        if (this.settings.verbose) {
            this.stopStopwatch();
            // Dart's `Duration.microsecondsPerSecond` is 1,000,000
            this.debugFill(`Creation time: ${this.elapsedStopwatch / 1000000} seconds`);
            this.writeDebug(s);
        }
        return offset;
    }

    /**
     * Writes the content of the PDF object (typically its `params` object) to the stream.
     * @param s The PdfStream to write to.
     */
    public writeContent(s: PdfStream): void {
        // Pass `this` (the PdfObjectBase instance) as context to the `params.output` method.
        // The `indent` is `0` if verbose, otherwise `undefined` (no indentation).
        this.params.output(this, s, this.settings.verbose ? 0 : undefined);
        s.putByte(0x0a); // Newline after content
    }
}